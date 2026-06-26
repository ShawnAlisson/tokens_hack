// scripts/setup-clickhouse.ts
import { clickhouse } from "../src/lib/integrations/clickhouse";

console.log("=== Initializing ClickHouse Tables ===");

async function main() {
  try {
    await clickhouse.setupTables();
    console.log("[SUCCESS] Database tables verified or initialized successfully!");
    if (clickhouse.isUsingFallback()) {
      console.log("[INFO] Operating in JSON Local Fallback mode.");
    } else {
      console.log("[INFO] Connected to cloud ClickHouse instance.");
    }
  } catch (error) {
    console.error("[ERROR] Failed to set up ClickHouse:", error);
    process.exit(1);
  }
}

main();
