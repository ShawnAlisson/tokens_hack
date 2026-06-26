// scripts/run-tests.ts
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getActiveTenantConfig } from "../src/lib/tenant";
import { clickhouse } from "../src/lib/integrations/clickhouse";
import { runTenantSweep } from "../src/lib/integrations/tavily";
import { classifyEvent } from "../src/lib/integrations/gemini";
import { senso } from "../src/lib/integrations/senso";
import { prometheux } from "../src/lib/integrations/prometheux";
import { notion } from "../src/lib/integrations/notion";
import { executeSentinelSweep } from "../src/lib/agents/sentinel";
import { executeStrategistAnalysis } from "../src/lib/agents/strategist";
import { executeActorPublish } from "../src/lib/agents/actor";

console.log("\n====================================================");
console.log("🚀 STARTING AUTOMATED PLATFORM TEST SUITE 🚀");
console.log("====================================================\n");

const TEST_TENANT_ID = "gymshark";

// Assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  const testStep = async (name: string, fn: () => Promise<void>) => {
    totalCount++;
    console.log(`\n👉 Running Check #${totalCount}: ${name}...`);
    try {
      await fn();
      passedCount++;
    } catch (err: any) {
      console.error(`💥 Error during Check #${totalCount}:`, err.message || err);
      process.exit(1);
    }
  };

  // --- CHECK 1: Tenant Config Loader ---
  await testStep("Tenant Configuration Loader Engine", async () => {
    const config = getActiveTenantConfig();
    assert(config.id === TEST_TENANT_ID, `Tenant ID must be "${TEST_TENANT_ID}", got "${config.id}"`);
    assert(config.display_name === "Gymshark", "Tenant display name must be 'Gymshark'");
    assert(config.competitors.length > 0, "Tenant must have competitors configured");
    assert(config.tavily_search_profiles.length > 0, "Tenant must have Tavily search profiles configured");
  });

  // --- CHECK 2: ClickHouse Fallback DB Operations ---
  await testStep("ClickHouse Local File-backed DB Fallback Driver", async () => {
    // Keep a backup of current fallback file to restore later
    const originalDbBackupPath = path.join(process.cwd(), "data", "db_fallback_backup.json");
    const dbPath = path.join(process.cwd(), "data", "db_fallback.json");
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, originalDbBackupPath);
    }

    try {
      // Clear for clean test environment
      clickhouse.clearAll();
      await clickhouse.setupTables();
      assert(clickhouse.isUsingFallback() === true, "Should be operating in fallback mode in test env without host credentials");

      const testEventId = `evt_test_${Math.random().toString(36).substring(2, 8)}`;
      const testUrl = `https://www.lululemon.co.uk/test-url-${testEventId}`;
      const urlHash = crypto.createHash("md5").update(testUrl).digest("hex");

      // Test event insertion
      await clickhouse.insertCompetitorEvent({
        id: testEventId,
        tenant_id: TEST_TENANT_ID,
        competitor: "Lululemon",
        source_type: "pricing",
        severity: "high",
        url: testUrl,
        url_hash: urlHash,
        title: "Test Competitor Slashing Prices",
        snippet: "Lululemon is trying to test our automated intelligence database fallbacks.",
        inserted_at: new Date().toISOString(),
        processed: false,
      });

      // Test retrieval list
      const events = await clickhouse.getCompetitorEvents(TEST_TENANT_ID);
      assert(events.length === 1, `Expected exactly 1 event, got ${events.length}`);
      assert(events[0].id === testEventId, "Event ID mismatch");

      // Test retrieval by ID
      const retrieved = await clickhouse.getCompetitorEventById(TEST_TENANT_ID, testEventId);
      assert(retrieved !== null, "Could not fetch event by ID");
      assert(retrieved?.url_hash === urlHash, "URL hash mismatch on retrieved item");

      // Test competitor stats
      const stats = await clickhouse.getCompetitorStats(TEST_TENANT_ID, "Lululemon");
      assert(stats.events.length === 1, "Expected 1 competitor event in stats");
      assert(stats.trend.length === 14, "Expected a 14-day trend array");

      // Test action insertion
      const testActionId = `act_test_${Math.random().toString(36).substring(2, 8)}`;
      await clickhouse.insertCounterAction({
        id: testActionId,
        event_id: testEventId,
        tenant_id: TEST_TENANT_ID,
        competitor: "Lululemon",
        trigger_title: "Test Competitor Slashing Prices",
        strategy_angle: "Assert Strategic Domination",
        content_draft: "Let us mock a beautiful counter copy.",
        published_url: "https://notion.so/gymshark/test-brief",
        notion_page_id: "notion_test_page_123",
        latency_ms: 320,
        published_at: new Date().toISOString(),
      });

      const actions = await clickhouse.getCounterActions(TEST_TENANT_ID);
      assert(actions.length === 1, "Expected exactly 1 counter-action");
      assert(actions[0].id === testActionId, "Action ID mismatch");

      // Verify the event was marked as processed
      const processedEvent = await clickhouse.getCompetitorEventById(TEST_TENANT_ID, testEventId);
      assert(processedEvent?.processed === true, "Expected trigger event to be marked as processed");

      // Test revenue insertion and statistics
      await clickhouse.insertRevenueEvent({
        id: `rev_test_${Math.random().toString(36).substring(2, 8)}`,
        event_id: testEventId,
        amount_usd: 0.49,
        timestamp: new Date().toISOString(),
      });

      const revStats = await clickhouse.getRevenueStats(TEST_TENANT_ID);
      assert(revStats.count === 1, "Expected 1 revenue record");
      assert(revStats.total === 0.49, `Expected total revenue of $0.49, got $${revStats.total}`);

    } finally {
      // Restore fallback DB file backup
      if (fs.existsSync(originalDbBackupPath)) {
        fs.copyFileSync(originalDbBackupPath, dbPath);
        fs.unlinkSync(originalDbBackupPath);
      }
    }
  });

  // --- CHECK 3: Tavily Snapshots ---
  await testStep("Tavily Ingestion Cache & Offline Snapshot Loader", async () => {
    const config = getActiveTenantConfig();
    const rawEvents = await runTenantSweep(config);
    assert(rawEvents.length > 0, "Tavily search sweep should return cached snapshot items when offline");
    assert(rawEvents.some(r => r.competitor === "Lululemon" || r.competitor === "Nike"), "Tavily snapshot should contain standard seeded competitors");
    assert(rawEvents[0].url !== undefined, "Expected raw events to contain a source URL");
  });

  // --- CHECK 4: Gemini Classifier ---
  await testStep("Gemini Classifier & Local Rules Fallback Engine", async () => {
    const classification = await classifyEvent(
      "ASOS launches competitor activewear at £15 with massive discount coupon code",
      "ASOS has unleashed a deep-discount coupon on their private label seamless legging duplicates to undercut competitors."
    );
    assert(classification.severity === "high" || classification.severity === "medium" || classification.severity === "low", "Expected valid severity rating");
    assert(classification.summary.length > 0, "Expected generated summary text");
  });

  // --- CHECK 5: Senso Brand Facts KB ---
  await testStep("Senso.ai Semantic Brand Knowledge Base Fallback", async () => {
    const queryResult = await senso.queryKnowledgeBase(TEST_TENANT_ID, "Lululemon luxury leggings", 2);
    assert(queryResult.length > 0, "Expected retrieved positioning facts");
    assert(queryResult.some(f => f.category === "usp" || f.category === "positioning"), "Expected USP or positioning facts");
  });

  // --- CHECK 6: Prometheux Vadalog Reasoning ---
  await testStep("Prometheux Vadalog Strategic Reasoning Module", async () => {
    const analysis = await prometheux.evaluateVadalogReasoning(
      "Nike",
      "pricing",
      "high",
      "Nike UK launches 48h 40% flash sale across all lifting gears"
    );
    assert(analysis.counter_strategy_angle.length > 0, "Expected derived strategy angle");
    assert(analysis.rules_applied.length > 0, "Expected list of applied logical rules");
    assert(analysis.lineage.length > 0, "Expected explanation lineages");
  });

  // --- CHECK 7: Notion Publisher Simulation ---
  await testStep("Notion Campaign Brief Publisher Driver", async () => {
    const mockPlan = {
      event_id: "evt_mock_999",
      tenant_id: TEST_TENANT_ID,
      competitor: "Lululemon",
      trigger_title: "Lululemon slashes UK Align prices",
      strategy_angle: "Bundle pricing counter-strike",
      content_draft: "### Campaign Brief\n\nContent details here.",
      lineage: ["test lineage"],
      rules_applied: ["Rule test"],
      brand_facts_used: ["USP Multi-buy"],
    };

    const pubResult = await notion.publishCampaignBrief(mockPlan);
    assert(pubResult.published_url.includes("notion.so"), "Expected published URL on Notion domain");
    assert(pubResult.notion_page_id.length > 0, "Expected Notion page ID");
  });

  // --- CHECK 8: Sentinel Agent Sweep Orchestration ---
  await testStep("Sentinel Agent End-to-End Sweep Orchestrator", async () => {
    // Keep a backup of DB
    const originalDbBackupPath = path.join(process.cwd(), "data", "db_fallback_backup.json");
    const dbPath = path.join(process.cwd(), "data", "db_fallback.json");
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, originalDbBackupPath);
    }

    try {
      clickhouse.clearAll();
      const sweep = await executeSentinelSweep();
      assert(sweep.tenant_id === TEST_TENANT_ID, "Sweep tenant ID mismatch");
      assert(sweep.total_ingested > 0, "Sweep should ingest elements");
      assert(sweep.new_stored > 0, "Sweep should store new unique events in the database");
      
      const storedEvents = await clickhouse.getCompetitorEvents(TEST_TENANT_ID);
      assert(storedEvents.length === sweep.new_stored, "Stored events tally mismatch with sweep summary");
    } finally {
      if (fs.existsSync(originalDbBackupPath)) {
        fs.copyFileSync(originalDbBackupPath, dbPath);
        fs.unlinkSync(originalDbBackupPath);
      }
    }
  });

  // --- CHECK 9: Strategist Agent Strategic Planner ---
  await testStep("Strategist Agent Multi-Agent Planner", async () => {
    const originalDbBackupPath = path.join(process.cwd(), "data", "db_fallback_backup.json");
    const dbPath = path.join(process.cwd(), "data", "db_fallback.json");
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, originalDbBackupPath);
    }

    try {
      clickhouse.clearAll();
      const testEventId = "evt_test_strategist_123";
      await clickhouse.insertCompetitorEvent({
        id: testEventId,
        tenant_id: TEST_TENANT_ID,
        competitor: "Nike",
        source_type: "pricing",
        severity: "high",
        url: "https://www.nike.com/uk/lifting-sale",
        url_hash: "nike_lifting_md5_hash_123",
        title: "Nike UK slashes training gears",
        snippet: "Nike UK is discounting Metcon lifting shoes and shirts to compete heavily.",
        inserted_at: new Date().toISOString(),
        processed: false,
      });

      const plan = await executeStrategistAnalysis(testEventId);
      assert(plan.event_id === testEventId, "Plan event ID mismatch");
      assert(plan.tenant_id === TEST_TENANT_ID, "Plan tenant ID mismatch");
      assert(plan.competitor === "Nike", "Plan competitor mismatch");
      assert(plan.content_draft.includes("### Tactical Counter-Strike Campaign"), "Expected formatted campaign copy in content draft");
    } finally {
      if (fs.existsSync(originalDbBackupPath)) {
        fs.copyFileSync(originalDbBackupPath, dbPath);
        fs.unlinkSync(originalDbBackupPath);
      }
    }
  });

  // --- CHECK 10: Actor Agent Strategic Publisher & Citations Tracker ---
  await testStep("Actor Agent Publisher, Latency Telemetry & Citations Tracer", async () => {
    const originalDbBackupPath = path.join(process.cwd(), "data", "db_fallback_backup.json");
    const dbPath = path.join(process.cwd(), "data", "db_fallback.json");
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, originalDbBackupPath);
    }
    
    // Backup cited.md
    const originalCitedPath = path.join(process.cwd(), "cited.md");
    const backupCitedPath = path.join(process.cwd(), "cited_backup.md");
    if (fs.existsSync(originalCitedPath)) {
      fs.copyFileSync(originalCitedPath, backupCitedPath);
      fs.unlinkSync(originalCitedPath);
    }

    try {
      clickhouse.clearAll();
      const testEventId = "evt_test_actor_456";
      const testEvent = {
        id: testEventId,
        tenant_id: TEST_TENANT_ID,
        competitor: "Lululemon",
        source_type: "launch" as const,
        severity: "medium" as const,
        url: "https://www.lululemon.co.uk/green-fabrics",
        url_hash: "lulu_green_md5_hash_123",
        title: "Lululemon organic fabrics range",
        snippet: "Lululemon releases premium plant fabrics range.",
        inserted_at: new Date().toISOString(),
        processed: false,
      };

      await clickhouse.insertCompetitorEvent(testEvent);

      const mockPlan = {
        event_id: testEventId,
        tenant_id: TEST_TENANT_ID,
        competitor: "Lululemon",
        trigger_title: "Lululemon organic fabrics range",
        strategy_angle: "Sustainable Highlight Campaign",
        content_draft: "### Tactical Counter-Strike Campaign: Eco-Gym\n\nContent details here.",
        lineage: ["test lineage"],
        rules_applied: ["Rule Eco-Campaign"],
        brand_facts_used: ["Adapt & Seamless Ranges"],
      };

      const summary = await executeActorPublish(mockPlan);
      assert(summary.action_id.startsWith("act_"), "Expected valid counter-action ID format");
      assert(summary.published_url.includes("notion.so"), "Expected mock Notion URL");
      assert(summary.latency_ms >= 0, "Expected a non-negative execution latency");

      // Verify cited.md contains the trace
      assert(fs.existsSync(originalCitedPath), "Expected root cited.md file to be created/appended to");
      const citedContent = fs.readFileSync(originalCitedPath, "utf8");
      assert(citedContent.includes("Lululemon organic fabrics range"), "Citations trace missing original event title");
      assert(citedContent.includes("Sustainable Highlight Campaign"), "Citations trace missing derived strategy angle");
      assert(citedContent.includes("Notion Campaign Page"), "Citations trace missing published brief link");

    } finally {
      // Restore ClickHouse file
      if (fs.existsSync(originalDbBackupPath)) {
        fs.copyFileSync(originalDbBackupPath, dbPath);
        fs.unlinkSync(originalDbBackupPath);
      }
      
      // Restore cited.md
      if (fs.existsSync(originalCitedPath)) {
        fs.unlinkSync(originalCitedPath);
      }
      if (fs.existsSync(backupCitedPath)) {
        fs.copyFileSync(backupCitedPath, originalCitedPath);
        fs.unlinkSync(backupCitedPath);
      }
    }
  });

  console.log("\n====================================================");
  console.log(`🎉 ALL ${passedCount}/${totalCount} PLATFORM CHECKS COMPLETED SUCCESSFULLY! 🎉`);
  console.log("====================================================\n");
}

runTests().catch(err => {
  console.error("\n❌ TEST SUITE RUN ENCOUNTERED CRITICAL ERROR:", err);
  process.exit(1);
});
