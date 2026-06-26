import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const tenant = getActiveTenantConfig();

    const events = await clickhouse.getCompetitorEvents(tenant.id, limit);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[Events API] Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    );
  }
}
