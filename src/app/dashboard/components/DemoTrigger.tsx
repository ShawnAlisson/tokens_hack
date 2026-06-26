import { useState } from "react";
import { Play, Loader2, Sparkles, ShieldAlert, Cpu, Send, Zap } from "lucide-react";

interface DemoTriggerProps {
  onSuccess: () => void;
  onStateChange?: (state: "idle" | "sentinel" | "strategist" | "actor" | "complete") => void;
}

export default function DemoTrigger({ onSuccess, onStateChange }: DemoTriggerProps) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  const runDemoPipeline = async () => {
    if (running) return;

    setRunning(true);
    try {
      // Step 1: Sentinel Ingestion
      setCurrentStep("Sentinel: Detecting Alert...");
      if (onStateChange) onStateChange("sentinel");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Strategist Vadalog reasoning
      setCurrentStep("Strategist: Evaluating Vadalog rules...");
      if (onStateChange) onStateChange("strategist");
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 3: Actor publishing
      setCurrentStep("Actor: Publishing Brief to Notion...");
      if (onStateChange) onStateChange("actor");
      
      const res = await fetch("/api/dashboard/trigger-demo", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Demo trigger endpoint failed");
      }

      const data = await res.json();
      console.log("[DemoTrigger] Received pipeline execution results:", data);

      // Step 4: Finished and pay x402 fee
      setCurrentStep("x402: Processing micro-payment...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (onStateChange) onStateChange("complete");
      onSuccess();
    } catch (err) {
      console.error("Demo pipeline failed:", err);
      setCurrentStep("Pipeline execution error");
    } finally {
      setTimeout(() => {
        setRunning(false);
        setCurrentStep("");
        if (onStateChange) onStateChange("idle");
      }, 1500);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Glow highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-emerald-500/0 group-hover:from-cyan-500/2 group-hover:via-purple-500/2 group-hover:to-emerald-500/2 transition-all duration-700 pointer-events-none" />

      <div>
        <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" /> Autonomous Pipeline Dispatcher
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Trigger a real competitor strike to run Sentinel, Strategist, and Actor models.
        </p>

        {/* Progress Pipeline Logging */}
        {running ? (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-cyan-400 tracking-wide uppercase">
                Pipeline Running
              </span>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-sm font-extrabold text-white">{currentStep}</p>
              
              {/* Dynamic Progress indicator */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep.includes("Sentinel") ? "bg-cyan-500 w-1/4 animate-pulse" :
                    currentStep.includes("Strategist") ? "bg-purple-500 w-2/4 animate-pulse" :
                    currentStep.includes("Actor") ? "bg-emerald-500 w-3/4 animate-pulse" :
                    "bg-emerald-400 w-full"
                  }`}
                />
              </div>
            </div>

            {/* Pipeline small icons map */}
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold pt-1 border-t border-white/5">
              <span className={currentStep.includes("Sentinel") ? "text-cyan-400" : ""}>Sentinel</span>
              <span className="text-slate-700">→</span>
              <span className={currentStep.includes("Strategist") ? "text-purple-400" : ""}>Strategist</span>
              <span className="text-slate-700">→</span>
              <span className={currentStep.includes("Actor") ? "text-emerald-400" : ""}>Actor</span>
              <span className="text-slate-700">→</span>
              <span className={currentStep.includes("x402") ? "text-emerald-400" : ""}>x402</span>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <p className="text-xs font-bold text-white mt-1.5">1. Sentinel</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scans web, filters & classifies</p>
            </div>
            <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
              <Cpu className="w-5 h-5 text-purple-400" />
              <p className="text-xs font-bold text-white mt-1.5">2. Strategist</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Applies Vadalog & Brand USPs</p>
            </div>
            <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
              <Send className="w-5 h-5 text-emerald-400" />
              <p className="text-xs font-bold text-white mt-1.5">3. Actor</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Synchronizes Notion marketing briefs</p>
            </div>
            <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-500" />
              <p className="text-xs font-bold text-white mt-1.5">4. x402 Rail</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Captures micro-payment reward</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <button
          onClick={runDemoPipeline}
          disabled={running}
          className={`w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
            running
              ? "bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 border border-white/10 hover:border-white/20 transform hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing Agent Sequence...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Autonomous Campaign Strike
            </>
          )}
        </button>
      </div>
    </div>
  );
}
