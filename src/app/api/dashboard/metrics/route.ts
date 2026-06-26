import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const tenant = getActiveTenantConfig(request);
    const tenantId = tenant.id;

    // Load events and actions from clickhouse
    const events = await clickhouse.getCompetitorEvents(tenantId, 1000);
    const actions = await clickhouse.getCounterActions(tenantId, 1000);
    const revStats = await clickhouse.getRevenueStats(tenantId);

    // Calc average latency
    let avgLatencyMs = 0;
    if (actions.length > 0) {
      const sum = actions.reduce((acc, act) => acc + act.latency_ms, 0);
      avgLatencyMs = Math.round(sum / actions.length);
    }

    // Determine Tavily Ingestion Mode
    const isLive = !!process.env.TAVILY_API_KEY && process.env.TAVILY_USE_CACHE !== "true";
    const mode = isLive ? "live" : "cached";

    // Read snapshot manifest date if cached
    let snapshotDate: string | undefined = undefined;
    try {
      const manifestPath = path.join(process.cwd(), "data", "snapshots", tenantId, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (manifest.last_updated) {
          snapshotDate = new Date(manifest.last_updated).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      }
    } catch (e) {
      console.error("[Metrics API] Failed to parse manifest:", e);
    }

    return NextResponse.json({
      mode,
      snapshotDate,
      totalEvents: events.length,
      avgLatencyMs,
      x402Count: revStats.count,
      totalRevenueUsd: revStats.total,
    });
  } catch (error: any) {
    console.error("[Metrics API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load metrics", details: error.message },
      { status: 500 }
    );
  }
}
