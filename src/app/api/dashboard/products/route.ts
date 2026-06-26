import { NextResponse } from "next/server";
import { getActiveTenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenant = getActiveTenantConfig(request);
    return NextResponse.json({
      products: tenant.products ?? [],
      display_name: tenant.display_name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
