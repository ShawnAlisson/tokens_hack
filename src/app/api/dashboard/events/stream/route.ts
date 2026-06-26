import { NextResponse } from "next/server";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { getActiveTenantConfig } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenant = getActiveTenantConfig(request);
  const tenantId = tenant.id;

  // Track event IDs that are already seen/sent
  const seenIds = new Set<string>();

  // Fetch initial events to populate seenIds list, so we only stream truly new events
  try {
    const initialEvents = await clickhouse.getCompetitorEvents(tenantId, 50);
    initialEvents.forEach(e => seenIds.add(e.id));
  } catch (err) {
    console.error("[SSE Stream] Failed to fetch initial events:", err);
  }

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (eventName: string, data: any) => {
        const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send a heartbeat every 15 seconds to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (err) {
          // Stream might be closed
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Poll database for new events every 1.5 seconds
      const pollInterval = setInterval(async () => {
        try {
          const latestEvents = await clickhouse.getCompetitorEvents(tenantId, 15);
          
          // Filter to find events not yet sent
          const newEvents = latestEvents.filter(e => !seenIds.has(e.id));

          // Send them from oldest to newest
          for (let i = newEvents.length - 1; i >= 0; i--) {
            const newEvt = newEvents[i];
            seenIds.add(newEvt.id);
            sendEvent("event", {
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
          console.error("[SSE Stream] Polling query error:", err);
        }
      }, 1500);

      // Clean up when client disconnects
      // The request will trigger cancellation on the response readable stream
    },
    cancel() {
      // Stream cancelled, clean up intervals
    }
  });

  return new Response(stream, { headers: responseHeaders });
}
