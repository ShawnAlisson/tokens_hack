// scripts/test-tenant-loader.ts
import { getActiveTenantConfig } from "../src/lib/tenant";

console.log("=== Testing Tenant Config Loader ===");

try {
  // Set default env variables for the test
  process.env.ACTIVE_TENANT = "gymshark";
  process.env.NOTION_DATABASE_ID = "test-notion-db-id-12345";

  console.log(`ACTIVE_TENANT is set to: "${process.env.ACTIVE_TENANT}"`);
  
  const tenantConfig = getActiveTenantConfig();
  
  console.log("\n[SUCCESS] Tenant configuration loaded successfully!");
  console.log("-------------------------------------------------");
  console.log(`ID:           ${tenantConfig.id}`);
  console.log(`Display Name: ${tenantConfig.display_name}`);
  console.log(`Domain:       ${tenantConfig.domain}`);
  console.log(`Logo URL:     ${tenantConfig.logo_url}`);
  console.log(`Market:       ${tenantConfig.market}`);
  console.log(`Competitors:  ${tenantConfig.competitors.map(c => c.name).join(", ")}`);
  console.log(`Notion DB:    ${tenantConfig.owned_publish_channel.database_id}`);
  console.log(`Search Profs: ${tenantConfig.tavily_search_profiles.join(", ")}`);
  console.log("-------------------------------------------------");
} catch (error) {
  console.error("\n[ERROR] Failed to load tenant configuration:", error);
  process.exit(1);
}
