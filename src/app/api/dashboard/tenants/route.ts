import { NextResponse } from "next/server";
import { listAvailableTenants } from "@/lib/tenant";

export async function GET() {
  try {
    const tenants = listAvailableTenants();
    return NextResponse.json({ tenants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
