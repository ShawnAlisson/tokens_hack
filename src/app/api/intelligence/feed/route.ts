import { NextResponse } from "next/server";
import { gateWithX402 } from "@/lib/integrations/x402";
import { clickhouse } from "@/lib/integrations/clickhouse";

export async function GET(request: Request) {
  try {
    const tenantId = process.env.ACTIVE_TENANT || "gymshark";
    
    // We gate this premium feed by simulating a batch payment check or general fee
    return await gateWithX402(request, "premium_feed_query", async () => {
      const events = await clickhouse.getCompetitorEvents(tenantId, 50);
      return NextResponse.json({
        tenant_id: tenantId,
        premium_access: "granted",
        event_count: events.length,
        events,
      }, { status: 200 });
    });
  } catch (error: any) {
    console.error("[Intelligence Feed API] Gated query failed:", error);
    return NextResponse.json({ error: "Gated query failed", details: error.message }, { status: 500 });
  }
}
