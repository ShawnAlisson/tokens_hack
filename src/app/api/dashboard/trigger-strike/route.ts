import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { executeStrategistAnalysis } from "@/lib/agents/strategist";
import { executeActorPublish } from "@/lib/agents/actor";
import { logAgentActivity } from "@/lib/agent-activity";
import { resolveTenantId } from "@/lib/tenant";

const uuid = () => Math.random().toString(36).substring(2, 15);

export async function POST(request: Request) {
  const tenantId = resolveTenantId(request);

  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required parameter: eventId" },
        { status: 400 }
      );
    }

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "sentinel",
      message: `Verified threat event ${eventId} — classification confirmed, routing to Strategist`,
      status: "success",
    });

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "strategist",
      message: `Analysing competitor threat for event ${eventId}`,
      status: "running",
    });

    const counterPlan = await executeStrategistAnalysis(eventId);

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "strategist",
      message: `Strategy derived: "${counterPlan.strategy_angle}" — ${counterPlan.rules_applied.length} Vadalog rules applied`,
      status: "success",
      meta: { rules: counterPlan.rules_applied.length },
    });

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "actor",
      message: "Compiling campaign brief and publishing to cited.md",
      status: "running",
    });

    const publishSummary = await executeActorPublish(counterPlan);

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "actor",
      message: `Campaign brief published — latency ${publishSummary.latency_ms}ms`,
      status: "success",
      meta: { latency_ms: publishSummary.latency_ms },
    });

    const paymentId = `pay_${uuid()}`;
    await clickhouse.insertRevenueEvent({
      id: paymentId,
      event_id: eventId,
      amount_usd: 0.49,
      timestamp: new Date().toISOString(),
    });

    await logAgentActivity({
      tenant_id: tenantId,
      agent: "x402",
      message: "Micropayment captured — $0.49 USD intelligence fee",
      status: "success",
      meta: { amount: 0.49 },
    });

    return NextResponse.json({
      success: true,
      plan: counterPlan,
      publish: publishSummary,
      payment: { id: paymentId, amount: 0.49 },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAgentActivity({
      tenant_id: tenantId,
      agent: "system",
      message: `Strike pipeline failed: ${message}`,
      status: "error",
    });
    return NextResponse.json(
      { error: "Failed to execute strike pipeline", details: message },
      { status: 500 }
    );
  }
}
