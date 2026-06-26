"use client";

import { useState } from "react";
import { ShieldCheck, Calendar, Activity, Sparkles, ChevronRight, Zap } from "lucide-react";
import MetricsBar from "./components/MetricsBar";
import BrandInsightPanel from "./components/BrandInsightPanel";
import CompetitorWatchlist from "./components/CompetitorWatchlist";
import CompetitorDeepDive from "./components/CompetitorDeepDive";
import EventFeed from "./components/EventFeed";
import PipelineViz, { type PipelineState } from "./components/PipelineViz";
import PublishedActions from "./components/PublishedActions";
import CitedViewer from "./components/CitedViewer";
import DemoTrigger from "./components/DemoTrigger";

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStateChange = (state: "idle" | "sentinel" | "strategist" | "actor" | "complete") => {
    // Map DemoTrigger state to PipelineViz state
    switch (state) {
      case "idle":
        setPipelineState("idle");
        break;
      case "sentinel":
        setPipelineState("ingesting");
        break;
      case "strategist":
        setPipelineState("reasoning");
        break;
      case "actor":
        setPipelineState("publishing");
        break;
      case "complete":
        setPipelineState("completed");
        showToast("Campaign Counter-Strike published to Notion!", "success");
        break;
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Trigger strike for a specific individual event
  const handleTriggerAnalysis = async (eventId: string) => {
    if (pipelineState !== "idle") return;

    try {
      setPipelineState("reasoning");
      showToast("Strategist analyzing competitor threat...", "success");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPipelineState("publishing");
      showToast("Actor compiling brand copy and publishing to Notion...", "success");

      const res = await fetch("/api/dashboard/trigger-strike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        throw new Error("Trigger strike failed");
      }

      const data = await res.json();
      console.log("[Dashboard] Strike complete:", data);

      setPipelineState("completed");
      showToast("Autonomous strike successfully posted to Notion workspace!", "success");
      triggerRefresh();

      setTimeout(() => {
        setPipelineState("idle");
      }, 3000);
    } catch (err) {
      console.error("[Dashboard] Strike execution failed:", err);
      setPipelineState("idle");
      showToast("Strategic counter-strike execution failed", "error");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="min-h-screen relative p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          notification.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
            : "bg-rose-950/90 border-rose-500/30 text-rose-400 shadow-rose-500/10"
        }`}>
          <Zap className="w-5 h-5 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wider">{notification.message}</p>
        </div>
      )}

      {/* Main Top Header Navbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/30 rounded-xl relative">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 pulse-glow-emerald" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ANTIGRAVITY <span className="text-xs font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">v2.5</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              Autonomous Competitive Intelligence & Counter-Campaign Publisher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/40 border border-white/5 px-3.5 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow-emerald" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Notion Pub Channel Online
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950/40 border border-white/5 px-3.5 py-1.5 rounded-xl text-slate-300 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-cyan-500" />
            {todayStr}
          </div>
        </div>
      </header>

      {/* Metrics Bar Area */}
      <section className="w-full">
        <MetricsBar refreshTrigger={refreshTrigger} />
      </section>

      {/* Main Grid Workspace Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Brand Positioning & Watchlist */}
        <div className="space-y-6 flex flex-col">
          <div className="h-[250px]">
            <BrandInsightPanel refreshTrigger={refreshTrigger} />
          </div>
          <div className="flex-1 h-[420px]">
            <CompetitorWatchlist 
              refreshTrigger={refreshTrigger} 
              onSelectCompetitor={setSelectedCompetitor} 
            />
          </div>
        </div>

        {/* Middle Column: Agent Visualizer & Controller */}
        <div className="space-y-6 flex flex-col">
          <div className="h-[250px]">
            <PipelineViz state={pipelineState} />
          </div>
          <div className="h-[200px]">
            <DemoTrigger 
              onSuccess={triggerRefresh} 
              onStateChange={handleStateChange} 
            />
          </div>
          <div className="flex-1 h-[200px]">
            <CitedViewer refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Right Column: Signal Stream & Action Log */}
        <div className="space-y-6 flex flex-col">
          <div className="h-[340px]">
            <EventFeed 
              refreshTrigger={refreshTrigger} 
              onTriggerAnalysis={handleTriggerAnalysis} 
            />
          </div>
          <div className="flex-1 h-[330px]">
            <PublishedActions refreshTrigger={refreshTrigger} />
          </div>
        </div>

      </section>

      {/* Slide-out Drawer: Competitor Analysis Deep-Dive */}
      <CompetitorDeepDive 
        competitorName={selectedCompetitor} 
        onClose={() => setSelectedCompetitor(null)} 
      />

    </main>
  );
}
