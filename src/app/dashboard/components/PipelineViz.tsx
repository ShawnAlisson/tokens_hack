"use client";

import { Activity, Cpu, Send, CheckCircle2 } from "lucide-react";

export type PipelineState = "idle" | "ingesting" | "reasoning" | "publishing" | "completed";

export default function PipelineViz({ state }: { state: PipelineState }) {
  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div>
        <h3 className="text-md font-bold tracking-tight text-white">Pipeline Execution Visualizer</h3>
        <p className="text-xs text-slate-400 mt-0.5">Real-time status of agentic processing nodes</p>
      </div>

      {/* SVG Pipeline Canvas */}
      <div className="my-6 relative flex items-center justify-between px-4 w-full">
        {/* Connector Line 1 */}
        <div className="absolute top-[28px] left-[15%] right-[55%] h-[2px] bg-slate-800">
          <div 
            className={`h-full bg-cyan-500 transition-all duration-500 ${
              state === "ingesting" ? "w-[50%] animate-pulse" :
              ["reasoning", "publishing", "completed"].includes(state) ? "w-full" : "w-0"
            }`}
          />
        </div>

        {/* Connector Line 2 */}
        <div className="absolute top-[28px] left-[50%] right-[20%] h-[2px] bg-slate-800">
          <div 
            className={`h-full bg-purple-500 transition-all duration-500 ${
              state === "reasoning" ? "w-[50%] animate-pulse" :
              ["publishing", "completed"].includes(state) ? "w-full" : "w-0"
            }`}
          />
        </div>

        {/* Node 1: Sentinel */}
        <div className="flex flex-col items-center gap-2 z-10 w-24">
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
              state === "ingesting" 
                ? "bg-cyan-950/80 border-cyan-400 scale-110 pulse-glow-cyan" 
                : ["reasoning", "publishing", "completed"].includes(state)
                ? "bg-cyan-950/30 border-cyan-800/80 text-cyan-400"
                : "bg-slate-950/20 border-white/5 text-slate-500"
            }`}
          >
            <Activity className={`w-6 h-6 ${state === "ingesting" ? "animate-pulse" : ""}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">1. Sentinel</span>
          <span className="text-[8px] text-slate-500 font-semibold uppercase">Sweep/Classify</span>
        </div>

        {/* Node 2: Strategist */}
        <div className="flex flex-col items-center gap-2 z-10 w-24">
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
              state === "reasoning" 
                ? "bg-purple-950/80 border-purple-400 scale-110 pulse-glow-purple" 
                : ["publishing", "completed"].includes(state)
                ? "bg-purple-950/30 border-purple-800/80 text-purple-400"
                : "bg-slate-950/20 border-white/5 text-slate-500"
            }`}
          >
            <Cpu className={`w-6 h-6 ${state === "reasoning" ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">2. Strategist</span>
          <span className="text-[8px] text-slate-500 font-semibold uppercase">Senso/Vadalog</span>
        </div>

        {/* Node 3: Actor */}
        <div className="flex flex-col items-center gap-2 z-10 w-24">
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
              state === "publishing" 
                ? "bg-emerald-950/80 border-emerald-400 scale-110 pulse-glow-emerald" 
                : state === "completed"
                ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-400"
                : "bg-slate-950/20 border-white/5 text-slate-500"
            }`}
          >
            {state === "completed" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">3. Actor</span>
          <span className="text-[8px] text-slate-500 font-semibold uppercase">cited.md Publish</span>
        </div>
      </div>

      {/* Connection States Messages */}
      <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl text-center">
        {state === "idle" && (
          <p className="text-xs text-slate-400 font-medium">System Idle. Waiting for trigger events...</p>
        )}
        {state === "ingesting" && (
          <p className="text-xs text-cyan-400 font-medium animate-pulse">
            [Sentinel] Running open-web sweep and classifying severity...
          </p>
        )}
        {state === "reasoning" && (
          <p className="text-xs text-purple-400 font-medium animate-pulse">
            [Strategist] Querying brand facts and applying Vadalog rules...
          </p>
        )}
        {state === "publishing" && (
          <p className="text-xs text-emerald-400 font-medium animate-pulse">
            [Actor] Structuring marketing brief and publishing to cited.md...
          </p>
        )}
        {state === "completed" && (
          <p className="text-xs text-emerald-400 font-bold">
            ✔ Counter-strike successfully published on cited.md!
          </p>
        )}
      </div>
    </div>
  );
}
