import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";

export async function GET() {
  try {
    const tenant = getActiveTenantConfig();
    const actions = await clickhouse.getCounterActions(tenant.id, 50);

    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error("[Actions API] Error fetching published counter actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch published actions", details: error.message },
      { status: 500 }
    );
  }
}
