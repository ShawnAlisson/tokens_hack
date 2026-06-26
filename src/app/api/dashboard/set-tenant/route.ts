import { NextResponse } from "next/server";
import { getTenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json();
    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    getTenantConfig(tenantId);

    const response = NextResponse.json({ success: true, tenantId });
    response.cookies.set("bc_tenant", tenantId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
