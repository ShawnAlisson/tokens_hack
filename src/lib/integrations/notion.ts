import { Client } from "@notionhq/client";
import { type CounterPlan } from "../agents/strategist";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface NotionPublishOutput {
  notion_page_id: string;
  published_url: string;
}

type NotionProperty = { type: string; [key: string]: unknown };

function pageUrl(pageId: string, url?: string | null): string {
  if (url) return url;
  return `https://www.notion.so/${pageId.replace(/-/g, "")}`;
}

function buildContentBlocks(plan: CounterPlan) {
  return [
    {
      object: "block" as const,
      type: "heading_1" as const,
      heading_1: {
        rich_text: [{ type: "text" as const, text: { content: plan.strategy_angle.slice(0, 2000) } }],
      },
    },
    {
      object: "block" as const,
      type: "heading_2" as const,
      heading_2: {
        rich_text: [{ type: "text" as const, text: { content: "Trigger" } }],
      },
    },
    {
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: {
        rich_text: [{ type: "text" as const, text: { content: plan.trigger_title.slice(0, 2000) } }],
      },
    },
    {
      object: "block" as const,
      type: "heading_2" as const,
      heading_2: {
        rich_text: [{ type: "text" as const, text: { content: "Campaign Brief" } }],
      },
    },
    {
      object: "block" as const,
      type: "quote" as const,
      quote: {
        rich_text: [{ type: "text" as const, text: { content: plan.content_draft.slice(0, 2000) } }],
      },
    },
  ];
}

class NotionClient {
  private client: Client | null = null;
  private isFallback: boolean = true;
  private resolvedDatabaseId: string | null = null;
  private resolvedParentPageId: string | null = null;

  constructor() {
    if (process.env.NOTION_TOKEN) {
      try {
        this.client = new Client({ auth: process.env.NOTION_TOKEN });
        this.isFallback = false;
        console.log("[Notion] Real API client initialized.");
      } catch (e) {
        console.warn("[Notion] Init failed, falling back to simulation.", e);
        this.isFallback = true;
      }
    } else {
      console.log("[Notion] Operating in simulation fallback mode.");
      this.isFallback = true;
    }
  }

  private async resolveParentPageId(): Promise<string | null> {
    if (this.resolvedParentPageId) return this.resolvedParentPageId;
    if (!this.client) return null;

    try {
      const search = await this.client.search({
        filter: { property: "object", value: "page" },
        page_size: 10,
      });

      const page = search.results.find((r) => "id" in r);
      if (page && "id" in page) {
        this.resolvedParentPageId = page.id;
        return page.id;
      }
    } catch (e) {
      console.error("[Notion] Parent page search failed:", e);
    }
    return null;
  }

  private async resolveDatabaseId(): Promise<string | null> {
    if (process.env.NOTION_DATABASE_ID) return process.env.NOTION_DATABASE_ID;
    if (this.resolvedDatabaseId) return this.resolvedDatabaseId;
    if (!this.client) return null;

    try {
      const search = await this.client.search({
        filter: { property: "object", value: "database" },
        page_size: 10,
      });

      const match =
        search.results.find((r) => {
          if (!("title" in r)) return false;
          const title = (r.title as { plain_text?: string }[])?.[0]?.plain_text ?? "";
          return /brandcompete|campaign|counter-strike/i.test(title);
        }) || search.results[0];

      if (match && "id" in match) {
        this.resolvedDatabaseId = match.id;
        console.log(`[Notion] Resolved database: ${match.id}`);
        return match.id;
      }

      const parentPageId = await this.resolveParentPageId();
      if (parentPageId) {
        const db = await this.client.databases.create({
          parent: { type: "page_id", page_id: parentPageId },
          title: [{ type: "text", text: { content: "BrandCompete Campaigns" } }],
          properties: {
            Name: { title: {} },
            Competitor: { rich_text: {} },
            Trigger: { rich_text: {} },
            PublishedAt: { date: {} },
          },
        });
        this.resolvedDatabaseId = db.id;
        console.log(`[Notion] Created BrandCompete database: ${db.id}`);
        return db.id;
      }
    } catch (e) {
      console.error("[Notion] Database resolution failed:", e);
    }

    return null;
  }

  private buildDatabaseProperties(
    schema: Record<string, NotionProperty>,
    plan: CounterPlan,
    timestamp: string
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    const titleKey = Object.entries(schema).find(([, p]) => p.type === "title")?.[0] ?? "Name";

    properties[titleKey] = {
      title: [{ text: { content: `[Counter-Strike] ${plan.strategy_angle}`.slice(0, 200) } }],
    };

    for (const [key, prop] of Object.entries(schema)) {
      if (key === titleKey) continue;
      const lower = key.toLowerCase();
      if (prop.type === "rich_text" && /competitor/i.test(lower)) {
        properties[key] = { rich_text: [{ text: { content: plan.competitor } }] };
      } else if (prop.type === "rich_text" && /trigger/i.test(lower)) {
        properties[key] = { rich_text: [{ text: { content: plan.trigger_title.slice(0, 2000) } }] };
      } else if (prop.type === "date" && /publish|date/i.test(lower)) {
        properties[key] = { date: { start: timestamp.split("T")[0] } };
      } else if (prop.type === "select" && /competitor/i.test(lower)) {
        properties[key] = { select: { name: plan.competitor.slice(0, 100) } };
      }
    }

    return properties;
  }

  async publishCampaignBrief(plan: CounterPlan): Promise<NotionPublishOutput> {
    const timestamp = new Date().toISOString();
    const cleanId = Math.random().toString(36).substring(2, 10);

    if (!this.isFallback && this.client) {
      const databaseId = await this.resolveDatabaseId();

      if (databaseId) {
        try {
          const db = await this.client.databases.retrieve({ database_id: databaseId });
          const properties = this.buildDatabaseProperties(
            db.properties as Record<string, NotionProperty>,
            plan,
            timestamp
          );

          const response = await this.client.pages.create({
            parent: { database_id: databaseId },
            properties: properties as Parameters<Client["pages"]["create"]>[0]["properties"],
            children: buildContentBlocks(plan),
          });

          console.log(`[Notion] Published to database ${databaseId}: ${response.id}`);
          return {
            notion_page_id: response.id,
            published_url: pageUrl(response.id, "url" in response ? (response.url as string) : null),
          };
        } catch (e) {
          console.error("[Notion] Database publish failed:", e);
        }
      }

      try {
        const parentPageId = await this.resolveParentPageId();
        if (parentPageId) {
          const response = await this.client.pages.create({
            parent: { page_id: parentPageId },
            properties: {
              title: {
                title: [{ text: { content: `[BrandCompete] ${plan.strategy_angle}`.slice(0, 200) } }],
              },
            },
            children: buildContentBlocks(plan),
          });

          console.log(`[Notion] Published child page under ${parentPageId}: ${response.id}`);
          return {
            notion_page_id: response.id,
            published_url: pageUrl(response.id, "url" in response ? (response.url as string) : null),
          };
        }
      } catch (e) {
        console.error("[Notion] Child page publish failed:", e);
      }
    }

    console.warn("[Notion] Falling back to mock URL — check NOTION_TOKEN and integration permissions.");
    const slug = plan.strategy_angle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      notion_page_id: `notion_page_${cleanId}`,
      published_url: `https://notion.so/brandcompete/${slug}-${cleanId}`,
    };
  }
}

export const notion = new NotionClient();
