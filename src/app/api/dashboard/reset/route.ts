import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";

export async function POST() {
  try {
    console.log("[Reset Endpoint] Wiping fallback database and ClickHouse records...");
    
    // Wipe records completely to start with a fresh slate
    clickhouse.clearAll();

    // Reinitialize tables
    await clickhouse.setupTables();

    console.log("[Reset Endpoint] Clean state reset completed successfully.");
    
    // Create logout response to clear tenant cookies and start onboarding fresh
    const response = NextResponse.json({ success: true, message: "Clean state reset complete." });
    response.cookies.set("bc_tenant", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("[Reset Endpoint] Error resetting database:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
