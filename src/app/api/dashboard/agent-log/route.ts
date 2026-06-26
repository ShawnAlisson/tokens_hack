import { NextResponse } from "next/server";
import { getAgentActivity, getAgentHealth, subscribeAgentActivity } from "@/lib/agent-activity";
import { resolveTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = resolveTenantId(request);
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") === "true";

  if (stream) {
    const encoder = new TextEncoder();
    let closed = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let unsubscribe: (() => void) | null = null;

    const streamBody = new ReadableStream({
      start(controller) {
        const cleanup = () => {
          if (closed) return;
          closed = true;
          if (heartbeat) clearInterval(heartbeat);
          if (unsubscribe) unsubscribe();
          try {
            controller.close();
          } catch {
            // already closed
          }
        };

        const safeSend = (data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            cleanup();
          }
        };

        safeSend({ type: "init", entries: getAgentActivity(tenantId, 30), health: getAgentHealth(tenantId) });

        unsubscribe = subscribeAgentActivity((entry) => {
          if (entry.tenant_id === tenantId) {
            safeSend({ type: "entry", entry, health: getAgentHealth(tenantId) });
          }
        });

        heartbeat = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            cleanup();
          }
        }, 15000);

        request.signal.addEventListener("abort", cleanup);
      },
      cancel() {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
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
