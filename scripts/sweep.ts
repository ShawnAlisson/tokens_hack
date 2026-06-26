// scripts/sweep.ts
import cron from "node-cron";

console.log("=== Competitor Ingestion Daemon (node-cron) ===");
console.log("Registering active sweep scheduler to run every 15 minutes: '*/15 * * * *'");

const TRIGGER_URL = "http://localhost:3000/api/agents/sentinel";

async function triggerSweep() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [Cron Daemon] Triggering Sentinel Ingestion Sweep via API...`);
  
  try {
    const response = await fetch(TRIGGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[${timestamp}] [Cron Daemon] Sweep completed. New events: ${result.new_stored}`);
    } else {
      const errorText = await response.text();
      console.warn(`[${timestamp}] [Cron Daemon] API returned status ${response.status}: ${errorText}`);
    }
  } catch (error: any) {
    console.error(`[${timestamp}] [Cron Daemon] Failed to reach local agent API at ${TRIGGER_URL}:`, error.message);
    console.log(`[${timestamp}] [Cron Daemon] Tip: Make sure 'npm run dev' is running on port 3000!`);
  }
}

// 1. Schedule the cron job for every 15 minutes
cron.schedule("*/15 * * * *", () => {
  triggerSweep();
});

// 2. Trigger one sweep immediately on script launch for testing
triggerSweep();
