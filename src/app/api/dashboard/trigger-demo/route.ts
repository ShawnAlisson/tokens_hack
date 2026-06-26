import { NextResponse } from "next/server";
import crypto from "crypto";
import { clickhouse, type CompetitorEvent } from "@/lib/integrations/clickhouse";
import { executeStrategistAnalysis } from "@/lib/agents/strategist";
import { executeActorPublish } from "@/lib/agents/actor";
import { getActiveTenantConfig } from "@/lib/tenant";

const uuid = () => Math.random().toString(36).substring(2, 15);

// Realistic competitor threat event templates
const DEMO_THREATS = [
  {
    competitor: "Lululemon",
    title: "Lululemon slashes UK Align pants pricing by 22% in mid-season flash sale",
    snippet: "Lululemon Athletica has launched an aggressive 48-hour promotional campaign across the UK, pricing flagship leggings at £58 (down from £78) with prominent Google search ads.",
    source_type: "pricing",
    severity: "high",
    url: "https://www.lululemon.co.uk/en-gb/p/align-high-rise-pant-25/prod10480023.html"
  },
  {
    competitor: "Nike",
    title: "Nike UK launches 'Infinite Sweat' eco-engineered running sets at high premium",
    snippet: "Nike's London outlets are rolling out carbon-neutral functional training shirts using recycled ocean plastics, accompanied by heavy influencer endorsements.",
    source_type: "launch",
    severity: "medium",
    url: "https://www.nike.com/uk/w/mens-sustainable-materials-3ngp4"
  },
  {
    competitor: "ASOS",
    title: "ASOS 4505 launches £16 budget seamless gym legging duplicates on social media",
    snippet: "ASOS is aggressively expanding its activewear private label, releasing squat-proof seamless gym leggings at an entry price of £16, specifically targeting UK Gen-Z consumers on TikTok.",
    source_type: "comparison",
    severity: "high",
    url: "https://www.asos.com/women/activewear/asos-4505-activewear"
  },
  {
    competitor: "Lululemon",
    title: "Lululemon announces UK-wide loyalty program with free next-day shipping",
    snippet: "Lululemon is testing a membership beta in major UK cities, offering free express delivery and priority access to limited edition drops, intensifying conversion competition.",
    source_type: "trend",
    severity: "medium",
    url: "https://www.lululemon.co.uk/en-gb/member/benefits"
  }
];

export async function POST() {
  try {
    const tenant = getActiveTenantConfig();
    const tenantId = tenant.id;

    // Pick a random threat template
    const randomIndex = Math.floor(Math.random() * DEMO_THREATS.length);
    const template = DEMO_THREATS[randomIndex];

    const eventId = `evt_${uuid()}`;
    const urlHash = crypto.createHash("md5").update(template.url + "_" + eventId).digest("hex");

    const newEvent: CompetitorEvent = {
      id: eventId,
      tenant_id: tenantId,
      competitor: template.competitor,
      source_type: template.source_type as any,
      severity: template.severity as any,
      url: template.url,
      url_hash: urlHash,
      title: template.title,
      snippet: template.snippet,
      inserted_at: new Date().toISOString(),
      processed: false,
    };

    console.log(`[Demo Trigger API] Injecting fresh threat event: "${newEvent.title}"`);
    await clickhouse.insertCompetitorEvent(newEvent);

    // Give SSE connection a brief split second to push the event
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[Demo Trigger API] Executing in-memory pipeline for event "${eventId}"...`);
    
    // Run Phase 3: Strategist Agent
    const counterPlan = await executeStrategistAnalysis(eventId);
    console.log(`[Demo Trigger API] Strategic plan generated for angle: "${counterPlan.strategy_angle}"`);

    // Run Phase 4: Actor Agent (Publish to Notion & log to ClickHouse/cited.md)
    const publishSummary = await executeActorPublish(counterPlan);
    console.log(`[Demo Trigger API] Published action successfully. Notion Page: ${publishSummary.published_url}`);

    // Run Phase 5: Gated Payment / x402 revenue logging
    // Let's log a micropayment fee of $0.49 for executing the campaign
    const paymentId = `pay_${uuid()}`;
    await clickhouse.insertRevenueEvent({
      id: paymentId,
      event_id: eventId,
      amount_usd: 0.49,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Demo Trigger API] Recorded $0.49 x402 micro-payment revenue.`);

    return NextResponse.json({
      success: true,
      event: newEvent,
      plan: counterPlan,
      publish: publishSummary,
      payment: { id: paymentId, amount: 0.49 },
    });
  } catch (error: any) {
    console.error("[Demo Trigger API] Error executing pipeline:", error);
    return NextResponse.json(
      { error: "Failed to execute demo trigger pipeline", details: error.message },
      { status: 500 }
    );
  }
}
