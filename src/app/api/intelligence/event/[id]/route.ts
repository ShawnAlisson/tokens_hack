import { NextResponse } from "next/server";
import { gateWithX402 } from "@/lib/integrations/x402";
import { clickhouse } from "@/lib/integrations/clickhouse";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.ACTIVE_TENANT || "gymshark";

    if (!id) {
      return NextResponse.json({ error: "Missing event ID parameter" }, { status: 400 });
    }

    // Gate query using x402 payment protocol
    return await gateWithX402(request, id, async () => {
      const event = await clickhouse.getCompetitorEventById(tenantId, id);
      if (!event) {
        return NextResponse.json({ error: `Event not found: ${id}` }, { status: 404 });
      }

      return NextResponse.json({
        premium_access: "granted",
        event,
      }, { status: 200 });
    });
  } catch (error: any) {
    console.error("[Intelligence Event API] Gated dynamic lookup failed:", error);
    return NextResponse.json({ error: "Gated lookup failed", details: error.message }, { status: 500 });
  }
}
