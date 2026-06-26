import { NextResponse } from "next/server";
import { getActiveTenantConfig } from "@/lib/tenant";
import { getBrandContext } from "@/lib/agents/brand-context";

export async function GET(request: Request) {
  try {
    const tenant = getActiveTenantConfig(request);
    const context = getBrandContext(tenant.id);

    return NextResponse.json({
      id: tenant.id,
      display_name: tenant.display_name,
      domain: tenant.domain,
      logo_url: context.logo_url,
      market: tenant.market,
      competitors: tenant.competitors,
      owned_publish_channel: {
        type: tenant.owned_publish_channel.type,
        workspace_url: tenant.owned_publish_channel.workspace_url,
      },
    });
  } catch (error: any) {
    console.error("[Tenant API] Error loading configuration:", error);
    return NextResponse.json(
      { error: "Failed to load tenant configuration", details: error.message },
      { status: 500 }
    );
  }
}
