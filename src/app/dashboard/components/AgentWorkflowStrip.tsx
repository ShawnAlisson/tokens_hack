"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Cpu, Send, CheckCircle2, Zap } from "lucide-react";

export type PipelineState = "idle" | "ingesting" | "reasoning" | "publishing" | "completed";

interface AgentActivityEntry {
  id: string;
  agent: string;
  message: string;
  status: string;
  timestamp: string;
}

interface AgentHealth {
  sentinel: { status: string; lastRun: string | null };
  strategist: { status: string; lastRun: string | null };
  actor: { status: string; lastRun: string | null };
  x402: { status: string; lastRun: string | null };
}

interface AgentWorkflowStripProps {
  pipelineState: PipelineState;
  refreshTrigger?: number;
}

const AGENTS = [
  { key: "sentinel", label: "Sentinel", sub: "Sweep & classify", icon: Activity, stateKey: "ingesting" as const },
  { key: "strategist", label: "Strategist", sub: "Senso + Vadalog", icon: Cpu, stateKey: "reasoning" as const },
  { key: "actor", label: "Actor", sub: "Notion publish", icon: Send, stateKey: "publishing" as const },
  { key: "x402", label: "x402", sub: "Micropayment", icon: Zap, stateKey: null },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AgentWorkflowStrip({ pipelineState, refreshTrigger }: AgentWorkflowStripProps) {
  const [entries, setEntries] = useState<AgentActivityEntry[]>([]);
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sse = new EventSource("/api/dashboard/agent-log?stream=true");

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setEntries(data.entries || []);
          setHealth(data.health);
        } else if (data.type === "entry") {
          setEntries((prev) => [data.entry, ...prev].slice(0, 30));
          setHealth(data.health);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => sse.close();
  }, [refreshTrigger]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [entries]);

  const isAgentActive = (key: string, stateKey: PipelineState | null) => {
    if (stateKey && pipelineState === stateKey) return true;
    if (key === "x402" && pipelineState === "completed") return true;
    return health?.[key as keyof AgentHealth]?.status === "running";
  };

  const isAgentDone = (key: string, idx: number) => {
    const order = ["ingesting", "reasoning", "publishing", "completed"];
    const currentIdx = order.indexOf(pipelineState);
    const agentIdx = idx;
    if (pipelineState === "completed") return true;
    return currentIdx > agentIdx;
  };

  return (
    <div className="bc-panel-elevated rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
            Agent Workflow
          </h2>
          <p className="text-xs text-slate-500">Live pipeline status and activity log</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 bc-pulse" />
          Agents online
        </div>
      </div>

      {/* Pipeline nodes */}
      <div className="relative flex items-start justify-between px-2 sm:px-8">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const active = isAgentActive(agent.key, agent.stateKey);
          const done = isAgentDone(agent.key, idx);
          const agentHealth = health?.[agent.key as keyof AgentHealth];

          return (
            <div key={agent.key} className="flex flex-col items-center gap-1.5 z-10 flex-1">
              {idx < AGENTS.length - 1 && (
                <div className="absolute top-7 hidden sm:block h-0.5 bg-slate-200" style={{
                  left: `${12 + idx * 25}%`,
                  width: "20%",
                }}>
                  <div
                    className={`h-full bg-teal-500 transition-all duration-500 ${
                      done ? "w-full" : active ? "w-1/2 animate-pulse" : "w-0"
                    }`}
                  />
                </div>
              )}

              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                  active
                    ? "bg-teal-50 border-teal-500 scale-105 shadow-lg shadow-teal-500/20"
                    : done
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-white border-slate-200"
                }`}
              >
                {done && pipelineState !== "idle" && !active ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Icon className={`w-6 h-6 ${active ? "text-teal-600 animate-pulse" : done ? "text-emerald-600" : "text-slate-400"}`} />
                )}
              </div>

              <span className="text-[10px] sm:text-xs font-bold text-slate-700">{agent.label}</span>
              <span className="text-[9px] text-slate-400 hidden sm:block">{agent.sub}</span>

              {agentHealth?.lastRun && (
                <span className="text-[8px] text-slate-400 font-mono">
                  {formatTime(agentHealth.lastRun)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Live activity log */}
      <div className="bc-muted rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Activity log</span>
          <span className="text-[10px] text-teal-600 font-medium">Live</span>
        </div>
        <div ref={logRef} className="max-h-[100px] overflow-y-auto divide-y divide-slate-100">
          {entries.length > 0 ? (
            entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="px-3 py-1.5 flex items-start gap-2 text-xs">
                <span className="text-slate-400 font-mono text-[10px] shrink-0 pt-0.5">
                  {formatTime(entry.timestamp)}
                </span>
                <span className={`font-semibold shrink-0 capitalize ${
                  entry.agent === "sentinel" ? "text-teal-600" :
                  entry.agent === "strategist" ? "text-violet-600" :
                  entry.agent === "actor" ? "text-emerald-600" :
                  entry.agent === "x402" ? "text-orange-600" :
                  "text-slate-500"
                }`}>
                  [{entry.agent}]
                </span>
                <span className="text-slate-600 leading-snug">{entry.message}</span>
              </div>
            ))
          ) : (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">
              Waiting for agent activity. Trigger a strike on a threat below to see the pipeline in action.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
