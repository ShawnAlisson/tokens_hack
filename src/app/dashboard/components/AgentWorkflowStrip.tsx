"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Activity, Cpu, Send, CheckCircle2, Terminal, Zap, Settings } from "lucide-react";

export type PipelineState = "idle" | "ingesting" | "reasoning" | "publishing" | "completed";

export interface AgentActivityEntry {
  id: string;
  tenant_id: string;
  agent: string;
  message: string;
  status: string;
  timestamp: string;
  meta?: Record<string, string | number>;
}

interface AgentWorkflowStripProps {
  pipelineState: PipelineState;
  refreshTrigger?: number;
  isSyncing?: boolean;
}

const STEPS = [
  { key: "competitors", label: "Competitors", sub: "Fetching competitors", icon: Search },
  { key: "threats", label: "Trends & Threats", sub: "Getting trends & threats", icon: Activity },
  { key: "strategist", label: "Strategist", sub: "Formulating stance", icon: Cpu },
  { key: "actor", label: "Actor", sub: "Publishing campaign", icon: Send },
];

function getConnectorProgress(fromIdx: number, activeIdx: number): number {
  if (activeIdx > fromIdx) return 100;
  if (activeIdx === fromIdx) return 50;
  return 0;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

const getAgentBadgeStyle = (agent: string) => {
  switch (agent) {
    case "sentinel":
      return {
        bg: "bg-teal-50 text-teal-700 border-teal-200/60",
        label: "Sentinel",
        icon: Search,
      };
    case "strategist":
      return {
        bg: "bg-violet-50 text-violet-700 border-violet-200/60",
        label: "Strategist",
        icon: Cpu,
      };
    case "actor":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        label: "Actor",
        icon: Send,
      };
    case "x402":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200/60",
        label: "x402 Rail",
        icon: Zap,
      };
    default:
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        label: "System",
        icon: Settings,
      };
  }
};

export default function AgentWorkflowStrip({ pipelineState, refreshTrigger, isSyncing = false }: AgentWorkflowStripProps) {
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [entries, setEntries] = useState<AgentActivityEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSyncing) {
      setActiveIdx(0);
    } else if (pipelineState === "idle") {
      setActiveIdx(-1);
    } else if (pipelineState === "ingesting") {
      setActiveIdx(0);
    } else if (pipelineState === "reasoning") {
      setActiveIdx(1);
      // Simulate progress from Trends & Threats into Strategist reasoning
      const timer = setTimeout(() => {
        setActiveIdx(2);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (pipelineState === "publishing") {
      setActiveIdx(3);
    } else if (pipelineState === "completed") {
      setActiveIdx(4); // All done
    }
  }, [pipelineState, isSyncing]);

  useEffect(() => {
    const sse = new EventSource("/api/dashboard/agent-log?stream=true");

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setEntries(data.entries || []);
        } else if (data.type === "entry") {
          setEntries((prev) => {
            if (prev.some((item) => item.id === data.entry.id)) return prev;
            return [data.entry, ...prev].slice(0, 50);
          });
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    sse.onerror = (err) => {
      console.error("SSE stream error:", err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [entries]);

  const isStepActive = (idx: number) => {
    return activeIdx === idx;
  };

  const isStepDone = (idx: number) => {
    if (pipelineState === "completed") return true;
    return activeIdx > idx;
  };

  return (
    <div className="bc-panel-elevated rounded-2xl p-5 space-y-5 h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
            Agent Workflow
          </h2>
          <p className="text-xs text-slate-500">Live multi-agent execution pipeline</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Agents online
        </div>
      </div>

      {/* Pipeline Strip */}
      <div className="flex items-center w-full py-2 shrink-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const active = isStepActive(idx);
          const done = isStepDone(idx);
          const progress = idx < STEPS.length - 1 ? getConnectorProgress(idx, activeIdx) : 0;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-full max-w-[96px] mx-auto group">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative ${
                    active
                      ? "bg-teal-50 border-teal-500 shadow-lg shadow-teal-500/25 scale-105"
                      : done
                      ? "bg-emerald-50 border-emerald-400"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Subtle active state outer glow ring */}
                  {active && (
                    <div className="absolute inset-0 rounded-2xl border border-teal-400 animate-ping opacity-25 pointer-events-none" />
                  )}

                  {done ? (
                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600" />
                  ) : (
                    <Icon className={`w-5.5 h-5.5 ${active ? "text-teal-600 animate-pulse" : "text-slate-400"}`} />
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-[11px] font-bold block ${active ? "text-teal-600" : done ? "text-emerald-700" : "text-slate-700"}`}>
                    {step.label}
                  </span>
                  <span className="text-[9px] text-slate-400 hidden md:block leading-tight font-medium">
                    {active ? "Running..." : done ? "Completed" : step.sub}
                  </span>
                </div>
              </div>

              {/* Progress Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 flex items-center px-1 min-w-[8px]">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        progress === 100 ? "bg-emerald-400" : "bg-teal-500 animate-pulse"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Activity Log Container */}
      <div className="bc-muted rounded-xl border border-slate-200/60 overflow-hidden flex flex-col h-[166px] shrink-0 animate-slide-up">
        <div className="px-3.5 py-2 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: "var(--font-heading)" }}>
              Engine Live Execution Trace
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
            </span>
            <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider">Streaming</span>
          </div>
        </div>

        <div 
          ref={logRef} 
          className="overflow-y-auto divide-y divide-slate-100 h-[128px] shrink-0 bg-white/40"
          style={{ scrollBehavior: "smooth" }}
        >
          {entries.length > 0 ? (
            entries.map((entry, idx) => {
              const badge = getAgentBadgeStyle(entry.agent);
              const AgentIcon = badge.icon;
              return (
                <div 
                  key={entry.id} 
                  className={`px-3.5 py-2 flex items-start gap-2.5 text-xs hover:bg-slate-50/50 transition-colors duration-200 h-[32px] shrink-0 ${
                    idx === 0 ? "animate-fade-in bg-teal-50/10" : ""
                  }`}
                >
                  <span className="text-slate-400 font-mono text-[9px] shrink-0 pt-0.5">
                    {formatTime(entry.timestamp)}
                  </span>
                  <div className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 leading-none ${badge.bg}`}>
                    <AgentIcon className="w-2.5 h-2.5" />
                    {badge.label}
                  </div>
                  <span className="text-slate-600 leading-none truncate font-medium">
                    {entry.message}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4 text-center px-4">
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse mb-1" />
              <p className="text-[11px] font-semibold text-slate-500">Waiting for agent activity...</p>
              <p className="text-[9px] text-slate-400 max-w-[240px] mt-0.5">
                Trigger a strike below to watch the autonomous execution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
