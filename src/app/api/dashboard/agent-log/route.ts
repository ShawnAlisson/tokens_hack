import { NextResponse } from "next/server";
import { getAgentActivity, getAgentHealth, subscribeAgentActivity } from "@/lib/agent-activity";
import { resolveTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = resolveTenantId(request);
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") === "true";

  if (stream) {
    const encoder = new TextEncoder();
    const streamBody = new ReadableStream({
      start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "init", entries: getAgentActivity(tenantId, 30), health: getAgentHealth(tenantId) });

        const unsubscribe = subscribeAgentActivity((entry) => {
          if (entry.tenant_id === tenantId) {
            send({ type: "entry", entry, health: getAgentHealth(tenantId) });
          }
        });

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe();
          controller.close();
        });
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return NextResponse.json({
    entries: getAgentActivity(tenantId, 50),
    health: getAgentHealth(tenantId),
  });
}
