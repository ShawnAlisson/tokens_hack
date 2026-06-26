import { getTenantConfig, type TenantConfig } from "../tenant";
import crypto from "crypto";
import { runTenantSweep, type IngestedRawEvent } from "../integrations/tavily";
import { clickhouse, type CompetitorEvent } from "../integrations/clickhouse";
import { classifyEvent } from "../integrations/classifier";
import { logAgentActivity } from "../agent-activity";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export interface SweepSummary {
  tenant_id: string;
  timestamp: string;
  total_ingested: number;
  new_stored: number;
  events: CompetitorEvent[];
}

/**
 * Sentinel Agent - executes a full competitive intelligence sweep cycle.
 * Ingests data, filters duplicates, classifies severity/category, and stores results.
 */
export async function executeSentinelSweep(
  tenantId?: string,
  options?: { forceLive?: boolean }
): Promise<SweepSummary> {
  const tenant = getTenantConfig(tenantId);
  console.log(`[Sentinel Agent] Starting sweep for brand: "${tenant.display_name}" (${tenant.id})`);

  const rawEvents = await runTenantSweep(tenant, { forceLive: options?.forceLive });

  // 2. Fetch existing stored events from ClickHouse to perform deduplication
  const existingEvents = await clickhouse.getCompetitorEvents(tenant.id, 500);
  const existingHashes = new Set(existingEvents.map((e) => e.url_hash));

  const newEventsToStore: CompetitorEvent[] = [];

  // 3. Classify and store new events
  for (const raw of rawEvents) {
    const urlHash = crypto.createHash("md5").update(raw.url).digest("hex");

    // Prevent duplicates by comparing hashes
    if (existingHashes.has(urlHash)) {
      console.log(`[Sentinel Agent] Deduplicated event: "${raw.title}" (URL hash already exists)`);
      continue;
    }

    console.log(`[Sentinel Agent] Processing new event: "${raw.title}"`);

    // Classify: REE (Modal/cached) → Gemini → heuristics
    const classification = await classifyEvent(raw.title, raw.snippet);

    const fullEvent: CompetitorEvent = {
      id: `evt_${uuid()}`,
      tenant_id: tenant.id,
      competitor: raw.competitor,
      source_type: raw.source_type,
      severity: classification.severity,
      url: raw.url,
      url_hash: urlHash,
      title: raw.title,
      snippet: classification.summary || raw.snippet,
      inserted_at: new Date().toISOString(),
      processed: false,
      classification_source: classification.source,
      ree_receipt_hash: classification.ree_receipt_hash,
    };

    // Insert into ClickHouse
    await clickhouse.insertCompetitorEvent(fullEvent);
    newEventsToStore.push(fullEvent);
  }

  console.log(`[Sentinel Agent] Sweep finished. Ingested total: ${rawEvents.length}. New stored: ${newEventsToStore.length}`);

  await logAgentActivity({
    tenant_id: tenant.id,
    agent: "sentinel",
    message: `Sweep complete — ${rawEvents.length} signals scanned, ${newEventsToStore.length} new threats classified`,
    status: "success",
    meta: { scanned: rawEvents.length, new: newEventsToStore.length },
  });

  return {
    tenant_id: tenant.id,
    timestamp: new Date().toISOString(),
    total_ingested: rawEvents.length,
    new_stored: newEventsToStore.length,
    events: newEventsToStore,
  };
}
