import fs from "fs";
import path from "path";
import { type CounterPlan } from "./strategist";
import { publishCampaignBrief } from "../integrations/publisher";
import { clickhouse, type CounterAction } from "../integrations/clickhouse";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export interface ActorPublishSummary {
  action_id: string;
  published_url: string;
  latency_ms: number;
}

/**
 * Actor Agent - Executes the strategic publication.
 * 1. Measures and logs execution latency.
 * 2. Publishes campaign brief to cited.md (or Notion for legacy tenants).
 * 3. Saves the counter-action log to ClickHouse.
 * 4. Appends a structured provenance trace to `cited.md`.
 */
export async function executeActorPublish(plan: CounterPlan): Promise<ActorPublishSummary> {
  console.log(`[Actor Agent] Executing publication for Strategy: "${plan.strategy_angle}"`);
  
  const startTime = Date.now();

  // 1. Publish to owned channel (cited.md via Senso by default)
  const publishOutput = await publishCampaignBrief(plan);

  const endTime = Date.now();
  const latencyMs = endTime - startTime;

  // 2. Insert record into ClickHouse
  const actionId = `act_${uuid()}`;
  const counterActionRecord: CounterAction = {
    id: actionId,
    event_id: plan.event_id,
    tenant_id: plan.tenant_id,
    competitor: plan.competitor,
    trigger_title: plan.trigger_title,
    strategy_angle: plan.strategy_angle,
    content_draft: plan.content_draft,
    published_url: publishOutput.published_url,
    notion_page_id: publishOutput.page_id,
    latency_ms: latencyMs,
    published_at: new Date().toISOString(),
  };

  await clickhouse.insertCounterAction(counterActionRecord);

  // 3. Append to cited.md
  await appendToCitedMarkdown(plan, publishOutput.published_url, publishOutput.channel);

  console.log(`[Actor Agent] Publication successful (${publishOutput.channel}): ${publishOutput.published_url} in ${latencyMs}ms.`);

  return {
    action_id: actionId,
    published_url: publishOutput.published_url,
    latency_ms: latencyMs,
  };
}

async function appendToCitedMarkdown(
  plan: CounterPlan,
  publishedUrl: string,
  channel: "citedmd" | "notion" = "citedmd"
) {
  const filePath = path.join(process.cwd(), "cited.md");
  const briefLabel = channel === "citedmd" ? "Cited.md Brief" : "Notion Campaign Page";

  // Ensure cited.md exists and has a header if creating fresh
  if (!fs.existsSync(filePath)) {
    const initialHeader = `# Competitor Counter-Strike Agent — Provenance Citations Log\n\nThis file tracks the autonomous lineage of competitive alerts detected by Sentinel and their published campaign briefs on [cited.md](https://cited.md/).\n\n| Competitor Event | Strategic Counter-Strike | Published Brief | Timestamp |\n|---|---|---|---|\n`;
    fs.writeFileSync(filePath, initialHeader, "utf8");
  }

  // Retrieve original event to get the source Tavily search URL
  const event = await clickhouse.getCompetitorEventById(plan.tenant_id, plan.event_id);
  const sourceUrl = event ? event.url : "#";
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  // GFM Markdown row entry
  const entry = `| [${plan.competitor}: ${plan.trigger_title}](${sourceUrl}) | ${plan.strategy_angle} | [${briefLabel}](${publishedUrl}) | ${timestamp} |\n`;

  try {
    fs.appendFileSync(filePath, entry, "utf8");
    console.log("[Actor Agent] Appended citation trace to cited.md");
  } catch (error) {
    console.error("[Actor Agent] Failed to append citation to cited.md:", error);
  }
}
