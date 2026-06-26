import { NextResponse } from "next/server";
import { resolveTenantId } from "@/lib/tenant";
import { getBrandContext } from "@/lib/agents/brand-context";

export async function GET(request: Request) {
  try {
    const tenantId = resolveTenantId(request);
    const context = getBrandContext(tenantId);
    return NextResponse.json({
      products: context.products,
      display_name: context.display_name,
      logo_url: context.logo_url,
      synced_at: context.synced_at,
      source: context.source,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
