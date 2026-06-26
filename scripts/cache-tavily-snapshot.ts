// scripts/cache-tavily-snapshot.ts
import { getActiveTenantConfig } from "../src/lib/tenant";
import { runTenantSweep, saveSnapshot } from "../src/lib/integrations/tavily";

console.log("=== Tavily Snapshot Cache Utility (E) ===");

async function main() {
  const tenant = getActiveTenantConfig();
  console.log(`Target Tenant: ${tenant.display_name} (${tenant.id})`);

  try {
    // Temporarily bypass env TAVILY_USE_CACHE to force live fetch if key is present
    const prevCacheSetting = process.env.TAVILY_USE_CACHE;
    if (process.env.TAVILY_API_KEY) {
      process.env.TAVILY_USE_CACHE = "false";
    }

    const events = await runTenantSweep(tenant);
    
    // Save to snapshots
    saveSnapshot(tenant.id, events);
    
    console.log(`[SUCCESS] Pre-cached snapshot saved. Tenant can now run with TAVILY_USE_CACHE=true`);
    
    // Restore env
    process.env.TAVILY_USE_CACHE = prevCacheSetting;
  } catch (error) {
    console.error("[ERROR] Failed to cache Tavily snapshots:", error);
    process.exit(1);
  }
}

main();
