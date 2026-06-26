import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenant = getActiveTenantConfig(request);
  const tenantId = tenant.id;
  const seenIds = new Set<string>();

  try {
    const initialEvents = await clickhouse.getCompetitorEvents(tenantId, 50);
    initialEvents.forEach((e) => seenIds.add(e.id));
  } catch (err) {
    console.error("[SSE Stream] Failed to fetch initial events:", err);
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (pollInterval) clearInterval(pollInterval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const safeSend = (eventName: string, data: unknown) => {
        if (closed) return;
        try {
          const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          cleanup();
        }
      };

      heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 15000);

      pollInterval = setInterval(async () => {
        if (closed) return;
        try {
          const latestEvents = await clickhouse.getCompetitorEvents(tenantId, 15);
          const newEvents = latestEvents.filter((e) => !seenIds.has(e.id));

          for (let i = newEvents.length - 1; i >= 0; i--) {
            const newEvt = newEvents[i];
            seenIds.add(newEvt.id);
            safeSend("event", {
              id: newEvt.id,
              competitor: newEvt.competitor,
              source_type: newEvt.source_type,
              severity: newEvt.severity,
              url: newEvt.url,
              title: newEvt.title,
              snippet: newEvt.snippet,
              inserted_at: newEvt.inserted_at,
            });
          }
        } catch (err) {
          if (!closed) {
            console.error("[SSE Stream] Polling query error:", err);
          }
        }
      }, 1500);

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (pollInterval) clearInterval(pollInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
