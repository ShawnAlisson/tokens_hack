import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { executeStrategistAnalysis } from "@/lib/agents/strategist";
import { executeActorPublish } from "@/lib/agents/actor";

const uuid = () => Math.random().toString(36).substring(2, 15);

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required parameter: eventId" },
        { status: 400 }
      );
    }

    console.log(`[Trigger Strike API] Starting autonomous counter-strike for event: "${eventId}"`);

    // 1. Run Strategist Agent
    const counterPlan = await executeStrategistAnalysis(eventId);
    console.log(`[Trigger Strike API] Created counter plan for strategy: "${counterPlan.strategy_angle}"`);

    // 2. Run Actor Agent
    const publishSummary = await executeActorPublish(counterPlan);
    console.log(`[Trigger Strike API] Brief published successfully to Notion. URL: ${publishSummary.published_url}`);

    // 3. Record Micropayment fee
    const paymentId = `pay_${uuid()}`;
    await clickhouse.insertRevenueEvent({
      id: paymentId,
      event_id: eventId,
      amount_usd: 0.49,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Trigger Strike API] Logged $0.49 micropayment revenue.`);

    return NextResponse.json({
      success: true,
      plan: counterPlan,
      publish: publishSummary,
      payment: { id: paymentId, amount: 0.49 },
    });
  } catch (error: any) {
    console.error("[Trigger Strike API] Error running strike pipeline:", error);
    return NextResponse.json(
      { error: "Failed to execute strike pipeline", details: error.message },
      { status: 500 }
    );
  }
}
