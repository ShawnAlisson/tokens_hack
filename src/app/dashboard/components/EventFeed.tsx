"use client";

import { useEffect, useState, useRef } from "react";
import {
  BellRing, DollarSign, Rocket, Users, LineChart, Scale,
  HelpCircle, Link, Loader2, Zap, ShieldCheck,
} from "lucide-react";

interface CompetitorEvent {
  id: string;
  competitor: string;
  source_type: "pricing" | "launch" | "mention" | "trend" | "comparison";
  severity: "high" | "medium" | "low";
  url: string;
  title: string;
  snippet: string;
  inserted_at: string;
  classification_source?: "ree_live" | "ree_cached" | "gemini" | "heuristic";
  ree_receipt_hash?: string;
}

export default function EventFeed({
  refreshTrigger,
  onTriggerAnalysis,
  pipelineBusy = false,
}: {
  refreshTrigger: number;
  onTriggerAnalysis: (id: string) => void;
  pipelineBusy?: boolean;
}) {
  const [events, setEvents] = useState<CompetitorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/dashboard/events?limit=25");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load feed events:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();

    const sse = new EventSource("/api/dashboard/events/stream");
    sseRef.current = sse;

    sse.onopen = () => setStreamActive(true);

    sse.addEventListener("event", (e: MessageEvent) => {
      try {
        const newEvent = JSON.parse(e.data) as CompetitorEvent;
        setEvents((prev) => {
          if (prev.some((item) => item.id === newEvent.id)) return prev;
          return [newEvent, ...prev].slice(0, 50);
        });
      } catch {
        // ignore
      }
    });

    sse.onerror = () => {
      setStreamActive(false);
      sse.close();
    };

    return () => sse.close();
  }, [refreshTrigger]);

  useEffect(() => {
    if (streamActive) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [streamActive]);

  const getSourceIcon = (type: string) => {
    const cls = "w-4 h-4";
    switch (type) {
      case "pricing": return <DollarSign className={`${cls} text-emerald-600`} />;
      case "launch": return <Rocket className={`${cls} text-violet-600`} />;
      case "mention": return <Users className={`${cls} text-teal-600`} />;
      case "trend": return <LineChart className={`${cls} text-amber-600`} />;
      case "comparison": return <Scale className={`${cls} text-indigo-600`} />;
      default: return <HelpCircle className={`${cls} text-slate-400`} />;
    }
  };

  if (loading) {
    return (
      <div className="bc-panel rounded-2xl h-full flex flex-col justify-center items-center">
        <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-2">Connecting to intelligence stream...</p>
      </div>
    );
  }

  return (
    <div className="bc-panel rounded-2xl h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">Intelligence Stream</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${streamActive ? "bg-emerald-500 bc-pulse" : "bg-amber-500"}`} />
          <span className="text-[9px] font-bold text-slate-400 uppercase">{streamActive ? "Live" : "Polling"}</span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mb-3">Incoming competitor threats classified by Sentinel</p>

      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {events.length > 0 ? (
          events.map((evt) => (
            <div
              key={evt.id}
              className="relative bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all space-y-2"
            >
              <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${
                evt.severity === "high" ? "bg-rose-500" :
                evt.severity === "medium" ? "bg-amber-500" : "bg-teal-500"
              }`} />

              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-slate-50 border border-slate-100 rounded-lg">
                    {getSourceIcon(evt.source_type)}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{evt.competitor}</span>
                  {(evt.classification_source === "ree_live" || evt.classification_source === "ree_cached") && (
                    <a
                      href={evt.ree_receipt_hash ? `/api/dashboard/ree/receipt/${evt.ree_receipt_hash}` : "#"}
                      target="_blank"
                      rel="noreferrer"
                      title="Gensyn REE verifiable classification receipt"
                      className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
                    >
                      <ShieldCheck className="w-2.5 h-2.5" />
                      REE
                    </a>
                  )}
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  evt.severity === "high" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                  evt.severity === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                  "bg-teal-50 text-teal-600 border border-teal-200"
                }`}>
                  {evt.severity}
                </span>
              </div>

              <div className="pl-2">
                <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">{evt.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5 line-clamp-2">{evt.snippet}</p>
              </div>

              <div className="pl-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-slate-400">
                  {new Date(evt.inserted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex items-center gap-2">
                  <a href={evt.url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-slate-600">
                    <Link className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onTriggerAnalysis(evt.id)}
                    disabled={pipelineBusy}
                    className="text-[9px] bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold px-2.5 py-1 rounded-lg transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Run Strike
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">Waiting for competitor signals...</div>
        )}
      </div>
    </div>
  );
}
