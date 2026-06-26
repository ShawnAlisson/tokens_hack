import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const tenant = getActiveTenantConfig();

    const stats = await clickhouse.getCompetitorStats(tenant.id, decodedName);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[Competitor Details API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load competitor stats", details: error.message },
      { status: 500 }
    );
  }
}
