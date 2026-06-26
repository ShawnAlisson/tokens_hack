"use client";

import { useEffect, useState, useRef } from "react";
import { 
  BellRing, DollarSign, Rocket, Users, LineChart, Scale, 
  HelpCircle, ShieldAlert, Link, Loader2 
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
}

export default function EventFeed({ refreshTrigger, onTriggerAnalysis }: { refreshTrigger: number, onTriggerAnalysis: (id: string) => void }) {
  const [events, setEvents] = useState<CompetitorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  // Load initial static events list
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

    // Setup SSE connection
    try {
      console.log("[SSE] Initializing live event stream...");
      const sse = new EventSource("/api/dashboard/events/stream");
      sseRef.current = sse;

      sse.onopen = () => {
        console.log("[SSE] Connection established.");
        setStreamActive(true);
      };

      sse.addEventListener("event", (e: any) => {
        try {
          const newEvent = JSON.parse(e.data) as CompetitorEvent;
          console.log("[SSE] Received new real-time event:", newEvent);
          setEvents((prev) => {
            // Prevent duplicates
            if (prev.some((item) => item.id === newEvent.id)) return prev;
            return [newEvent, ...prev].slice(0, 50); // limit to 50
          });
        } catch (err) {
          console.error("[SSE] Failed to parse event stream data:", err);
        }
      });

      sse.onerror = (err) => {
        console.warn("[SSE] Connection lost, falling back to static polling.", err);
        setStreamActive(false);
        sse.close();
      };
    } catch (err) {
      console.error("[SSE] Init failed:", err);
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [refreshTrigger]);

  // Fallback Polling if SSE goes offline
  useEffect(() => {
    if (streamActive) return;

    const interval = setInterval(() => {
      console.log("[Feed] Polling for new events (SSE offline)...");
      fetchEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [streamActive]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "pricing": return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case "launch": return <Rocket className="w-4 h-4 text-purple-400" />;
      case "mention": return <Users className="w-4 h-4 text-cyan-400" />;
      case "trend": return <LineChart className="w-4 h-4 text-amber-400" />;
      case "comparison": return <Scale className="w-4 h-4 text-indigo-400" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-xs text-slate-400 mt-2">Connecting to Sentinel SSE feed...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-500" />
            <h3 className="text-md font-bold text-white tracking-tight">Intelligence Stream</h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/40 border border-white/5 px-2.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${streamActive ? "bg-emerald-500 pulse-glow-emerald" : "bg-amber-500 animate-pulse"}`} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {streamActive ? "SSE Live" : "Polling Active"}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="mt-4 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
          {events.length > 0 ? (
            events.map((evt) => (
              <div 
                key={evt.id} 
                className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all space-y-2 relative overflow-hidden group"
              >
                {/* Lateral colored border representing severity */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  evt.severity === "high" ? "bg-rose-500" :
                  evt.severity === "medium" ? "bg-amber-500" : "bg-cyan-500"
                }`} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-slate-900 border border-white/5 rounded-lg">
                      {getSourceIcon(evt.source_type)}
                    </span>
                    <span className="text-xs font-bold text-amber-400">{evt.competitor}</span>
                  </div>

                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    evt.severity === "high" ? "bg-rose-500/10 border border-rose-500/30 text-rose-400" :
                    evt.severity === "medium" ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" :
                    "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                  }`}>
                    {evt.severity} threat
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-white leading-snug antialiased line-clamp-1">
                    {evt.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1 line-clamp-2">
                    {evt.snippet}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">
                    {new Date(evt.inserted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    <a 
                      href={evt.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1 hover:bg-slate-900 text-slate-500 hover:text-slate-300 rounded border border-transparent hover:border-white/5 transition-all"
                    >
                      <Link className="w-3 h-3" />
                    </a>
                    
                    <button
                      onClick={() => onTriggerAnalysis(evt.id)}
                      className="text-[9px] bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300 font-bold px-2 py-0.5 rounded-md transition-all uppercase tracking-wider"
                    >
                      Trigger Strike
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Waiting for incoming Open-Web competitor moves...
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-medium">Automatic deduplication layer active</span>
        <button 
          onClick={fetchEvents}
          className="text-[9px] text-slate-400 hover:text-white transition-colors"
        >
          Force Reload
        </button>
      </div>
    </div>
  );
}
