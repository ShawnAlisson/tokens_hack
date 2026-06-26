import { NextResponse } from "next/server";
import { resolveTenantId } from "@/lib/tenant";
import { executeBrandContextSync } from "@/lib/agents/brand-context";
import { executeSentinelSweep } from "@/lib/agents/sentinel";

export async function POST(request: Request) {
  const tenantId = resolveTenantId(request);

  try {
    const brandContext = await executeBrandContextSync(tenantId);
    const sweep = await executeSentinelSweep(tenantId, { forceLive: true });

    return NextResponse.json({
      success: true,
      brandContext,
      sweep: {
        total_ingested: sweep.total_ingested,
        new_stored: sweep.new_stored,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
