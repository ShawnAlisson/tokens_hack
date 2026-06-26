import { type CounterPlan } from "../agents/strategist";
import { getTenantConfig } from "../tenant";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

const SENSO_API_BASE = (process.env.SENSO_API_BASE || "https://apiv2.senso.ai/api/v1").replace(
  /\/$/,
  ""
);
const SENSO_PUBLISH_URL =
  process.env.SENSO_PUBLISH_URL || `${SENSO_API_BASE}/org/content-engine/publish`;
const CITED_MD_PUBLISHER_SLUG = process.env.CITED_MD_PUBLISHER_SLUG || "cited-md";

export interface CitedMdPublishOutput {
  content_id: string;
  published_url: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildPublishMarkdown(plan: CounterPlan): string {
  return plan.content_draft.trim();
}

function buildSeoTitle(plan: CounterPlan): string {
  const tenant = getTenantConfig(plan.tenant_id);

  const blockName = plan.content_draft.match(
    /###\s*Tactical Counter-Strike Campaign:?\s*\n+([^\n#]+)/i
  );
  if (blockName?.[1]?.trim()) {
    const name = blockName[1].trim().replace(/^["']|["']$/g, "");
    if (name.length > 3) return name.slice(0, 120);
  }

  const inlineName = plan.content_draft.match(
    /###\s*Tactical Counter-Strike Campaign:\s*([^\n]+)/i
  );
  if (inlineName?.[1]?.trim()) {
    return inlineName[1].trim().replace(/^["']|["']$/g, "").slice(0, 120);
  }

  return `${tenant.display_name} responds to ${plan.competitor}: ${plan.trigger_title}`.slice(0, 120);
}

function buildSummary(plan: CounterPlan): string {
  const tenant = getTenantConfig(plan.tenant_id);
  const trigger = plan.trigger_title.replace(/\s+/g, " ").trim();
  return `${tenant.display_name} campaign brief on ${plan.competitor}'s latest move in ${tenant.market}: ${trigger}`.slice(
    0,
    300
  );
}

function isTestPlan(plan: CounterPlan): boolean {
  const haystack = [
    plan.event_id,
    plan.trigger_title,
    plan.content_draft.slice(0, 500),
  ]
    .join(" ")
    .toLowerCase();

  return (
    /\bevt[_-]?test\b/.test(haystack) ||
    /\btest competitor\b/.test(haystack) ||
    /\btest publish\b/.test(haystack) ||
    /\bsmoke[- ]test\b/.test(haystack)
  );
}

function assertProductionPublish(plan: CounterPlan): void {
  if (isTestPlan(plan) && process.env.ALLOW_TEST_CITEDMD_PUBLISH !== "1") {
    throw new Error(
      "[Cited.md] Refusing to publish synthetic/test data to live cited.md. Trigger a real strike from the dashboard instead."
    );
  }
}

function mockPublish(plan: CounterPlan): CitedMdPublishOutput {
  const cleanId = Math.random().toString(36).substring(2, 10);
  const slug = slugify(`${plan.competitor}-${plan.strategy_angle}`);
  const industry = process.env.CITED_MD_INDUSTRY_SLUG || "retail-e-commerce";
  const base = (process.env.CITED_MD_BASE_URL || "https://cited.md").replace(/\/$/, "");

  return {
    content_id: `cited_${cleanId}`,
    published_url: `${base}/${industry}/${slug}-${cleanId}`,
  };
}

function citedMdBaseUrl(): string {
  return (process.env.CITED_MD_BASE_URL || "https://cited.md").replace(/\/$/, "");
}

function citedMdIndustrySlug(): string {
  return process.env.CITED_MD_INDUSTRY_SLUG || "retail-e-commerce";
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${citedMdBaseUrl()}${url}`;
  return `${citedMdBaseUrl()}/${url}`;
}

function resolvePublishedUrl(data: Record<string, unknown>, fallbackSlug: string): string | null {
  const destinations = data.publish_destinations;
  if (Array.isArray(destinations)) {
    for (const entry of destinations) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const displayUrl = record.display_url;
      if (typeof displayUrl === "string" && displayUrl.length > 0) {
        return normalizeUrl(displayUrl);
      }
    }
  }

  const nested = data.result as Record<string, unknown> | undefined;
  const fields = { ...data, ...(nested ?? {}) };

  const direct =
    (fields.url as string) ||
    (fields.published_url as string) ||
    (fields.public_url as string) ||
    (fields.cited_url as string) ||
    (fields.canonical_url as string);

  if (direct) return normalizeUrl(direct);

  const contentId = fields.content_id as string | undefined;
  if (contentId) {
    return `${citedMdBaseUrl()}/article/${contentId}`;
  }

  const slug = (fields.url_slug as string) || (fields.slug as string) || fallbackSlug;
  if (!slug) return null;

  return `${citedMdBaseUrl()}/${citedMdIndustrySlug()}/${slug}`;
}

async function sensoRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SENSO_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SENSO_API_KEY!,
      ...(init.headers ?? {}),
    },
  });
}

function extractPromptId(entry: Record<string, unknown>): string | null {
  const id = entry.prompt_id ?? entry.id ?? entry.geo_question_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function extractPromptList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  for (const key of ["prompts", "items", "results", "data"]) {
    const value = record[key];
    if (Array.isArray(value)) return value as Record<string, unknown>[];
  }

  return [];
}

function extractDestinationList(data: unknown): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const destinations = record.destinations;
  return Array.isArray(destinations) ? (destinations as Record<string, unknown>[]) : [];
}

function extractPublisherId(entry: Record<string, unknown>): string | null {
  const id = entry.publisher_id ?? entry.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

let cachedGeoQuestionId: string | null = null;
let cachedPublisherId: string | null = null;
let destinationEnsured = false;

async function resolveGeoQuestionId(plan: CounterPlan): Promise<string> {
  if (process.env.CITED_MD_GEO_QUESTION_ID) {
    return process.env.CITED_MD_GEO_QUESTION_ID;
  }

  const tenant = getTenantConfig(plan.tenant_id);
  const tenantPromptId = tenant.owned_publish_channel.geo_question_id;
  if (tenantPromptId) {
    return tenantPromptId;
  }

  if (cachedGeoQuestionId) {
    return cachedGeoQuestionId;
  }

  const listResponse = await sensoRequest("/org/prompts");
  if (listResponse.ok) {
    const listData = await listResponse.json();
    const prompts = extractPromptList(listData);
    const existingId = prompts.map(extractPromptId).find((id): id is string => Boolean(id));
    if (existingId) {
      cachedGeoQuestionId = existingId;
      console.log(`[Cited.md] Using existing Senso GEO prompt: ${existingId}`);
      return existingId;
    }
  } else {
    const errText = await listResponse.text().catch(() => "");
    console.warn(`[Cited.md] Failed to list Senso prompts (${listResponse.status}):`, errText);
  }

  const createResponse = await sensoRequest("/org/prompts", {
    method: "POST",
    body: JSON.stringify({
      question_text: `How should ${tenant.display_name} respond to competitor moves in ${tenant.market}?`,
      type: "evaluation",
    }),
  });

  if (createResponse.ok) {
    const created = (await createResponse.json()) as Record<string, unknown>;
    const createdId = extractPromptId(created);
    if (createdId) {
      cachedGeoQuestionId = createdId;
      console.log(`[Cited.md] Created default Senso GEO prompt: ${createdId}`);
      return createdId;
    }
  } else {
    const errText = await createResponse.text().catch(() => "");
    console.error(`[Cited.md] Failed to create Senso GEO prompt (${createResponse.status}):`, errText);
  }

  throw new Error(
    "Could not resolve geo_question_id for cited.md publish. Set CITED_MD_GEO_QUESTION_ID in .env or create a prompt in Senso."
  );
}

async function resolveCitedMdPublisherId(): Promise<string> {
  if (process.env.CITED_MD_PUBLISHER_ID) {
    return process.env.CITED_MD_PUBLISHER_ID;
  }

  if (cachedPublisherId) {
    return cachedPublisherId;
  }

  const response = await sensoRequest("/org/destinations");
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`[Cited.md] Failed to list Senso destinations (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const destinations = extractDestinationList(data);
  const citedMdDestination = destinations.find((destination) => {
    const slug = destination.slug;
    const displayUrl = destination.display_url;
    return slug === CITED_MD_PUBLISHER_SLUG || displayUrl === "cited.md";
  });

  const publisherId = citedMdDestination ? extractPublisherId(citedMdDestination) : null;
  if (!publisherId) {
    throw new Error(
      `[Cited.md] Could not find cited.md publisher in Senso destinations (slug: ${CITED_MD_PUBLISHER_SLUG}).`
    );
  }

  cachedPublisherId = publisherId;
  return publisherId;
}

async function ensureCitedMdDestinationActive(publisherId: string): Promise<void> {
  if (destinationEnsured) return;

  const settingsResponse = await sensoRequest("/org/content-generation");
  if (!settingsResponse.ok) {
    const errText = await settingsResponse.text().catch(() => "");
    throw new Error(
      `[Cited.md] Failed to read Senso generation settings (${settingsResponse.status}): ${errText}`
    );
  }

  const settings = (await settingsResponse.json()) as Record<string, unknown>;
  const publishers = Array.isArray(settings.publishers) ? settings.publishers : [];
  const alreadyActive = publishers.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const record = entry as Record<string, unknown>;
    return record.publisher_id === publisherId && record.active !== false;
  });

  if (alreadyActive) {
    destinationEnsured = true;
    return;
  }

  const patchResponse = await sensoRequest("/org/content-generation", {
    method: "PATCH",
    body: JSON.stringify({
      enable_content_generation: true,
      publishers: [publisherId],
    }),
  });

  if (!patchResponse.ok) {
    const errText = await patchResponse.text().catch(() => "");
    throw new Error(
      `[Cited.md] Failed to enable cited.md destination (${patchResponse.status}): ${errText}`
    );
  }

  destinationEnsured = true;
  console.log("[Cited.md] Enabled cited.md as active Senso publish destination.");
}

class CitedMdClient {
  private hasApiKey(): boolean {
    return Boolean(process.env.SENSO_API_KEY);
  }

  constructor() {
    if (!this.hasApiKey()) {
      console.log("[Cited.md] Operating in simulation fallback mode.");
    } else {
      console.log("[Cited.md] Senso content-engine publisher initialized.");
    }
  }

  async publishCampaignBrief(plan: CounterPlan): Promise<CitedMdPublishOutput> {
    const fallbackSlug = slugify(`${plan.competitor}-${plan.strategy_angle}`);

    if (!this.hasApiKey()) {
      const mock = mockPublish(plan);
      console.warn("[Cited.md] Mock publish — set SENSO_API_KEY to publish to https://cited.md/");
      return mock;
    }

    assertProductionPublish(plan);

    const [geoQuestionId, publisherId] = await Promise.all([
      resolveGeoQuestionId(plan),
      resolveCitedMdPublisherId(),
    ]);
    await ensureCitedMdDestinationActive(publisherId);

    const payload: Record<string, unknown> = {
      geo_question_id: geoQuestionId,
      raw_markdown: buildPublishMarkdown(plan),
      seo_title: buildSeoTitle(plan),
      summary: buildSummary(plan),
      publisher_ids: [publisherId],
    };

    const contentTypeId = process.env.CITED_MD_CONTENT_TYPE_ID;
    if (contentTypeId) {
      payload.content_type_id = contentTypeId;
    }

    const response = await sensoRequest("/org/content-engine/publish", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`[Cited.md] Senso publish failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const publishedUrl = resolvePublishedUrl(data, fallbackSlug);
    const nested = data.result as Record<string, unknown> | undefined;
    const contentId =
      (data.content_id as string) ||
      (data.id as string) ||
      (data.version_id as string) ||
      (nested?.content_id as string) ||
      (nested?.version_id as string);

    if (!publishedUrl) {
      throw new Error(
        `[Cited.md] Senso publish succeeded but no public URL was returned: ${JSON.stringify(data)}`
      );
    }

    console.log(`[Cited.md] Published citeable: ${publishedUrl}`);
    return {
      content_id: contentId || `cited_${Math.random().toString(36).substring(2, 10)}`,
      published_url: publishedUrl,
    };
  }
}

export const citedmd = new CitedMdClient();
