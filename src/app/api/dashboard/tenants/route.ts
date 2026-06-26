import { NextResponse } from "next/server";
import { listAvailableTenants } from "@/lib/tenant";
import { loadBrandContextCache } from "@/lib/agents/brand-context";

export async function GET() {
  try {
    const tenants = listAvailableTenants().map((t) => {
      const cached = loadBrandContextCache(t.id);
      return {
        ...t,
        logo_url: cached?.logo_url || t.logo_url || `https://www.google.com/s2/favicons?domain=${t.domain}&sz=128`,
      };
    });
    return NextResponse.json({ tenants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
