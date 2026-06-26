"use client";

import { useState } from "react";
import { 
  ShieldCheck, Calendar, Activity, Sparkles, Zap, 
  FileText, Copy, ExternalLink, RefreshCw, Send, 
  TrendingUp, Users, Info, Flame 
} from "lucide-react";
import MetricsBar from "./components/MetricsBar";
import BrandInsightPanel from "./components/BrandInsightPanel";
import CompetitorWatchlist from "./components/CompetitorWatchlist";
import CompetitorDeepDive from "./components/CompetitorDeepDive";
import EventFeed from "./components/EventFeed";
import PipelineViz, { type PipelineState } from "./components/PipelineViz";
import PublishedActions from "./components/PublishedActions";
import CitedViewer from "./components/CitedViewer";
import DemoTrigger from "./components/DemoTrigger";

interface ActiveBrief {
  id?: string;
  title: string;
  competitor: string;
  strategy_angle: string;
  content_draft: string;
  published_url: string;
  rules_applied?: string[];
  brand_facts_used?: string[];
}

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeBrief, setActiveBrief] = useState<ActiveBrief | null>(null);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStateChange = (state: "idle" | "sentinel" | "strategist" | "actor" | "complete") => {
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

      if (data.plan && data.publish) {
        setActiveBrief({
          id: data.publish.id || `act_${Math.random().toString(36).substring(2, 10)}`,
          title: data.plan.trigger_title,
          competitor: data.plan.competitor,
          strategy_angle: data.plan.strategy_angle,
          content_draft: data.plan.content_draft,
          published_url: data.publish.published_url,
          rules_applied: data.plan.rules_applied,
          brand_facts_used: data.plan.brand_facts_used
        });
      }

      setTimeout(() => {
        setPipelineState("idle");
      }, 3000);
    } catch (err) {
      console.error("[Dashboard] Strike execution failed:", err);
      setPipelineState("idle");
      showToast("Strategic counter-strike execution failed", "error");
    }
  };

  // Parse markdown content brief safely
  const parseDraft = (draft: string) => {
    if (!draft) return null;
    
    let name = "Tactical Counter-Strike Campaign";
    const nameMatch = draft.match(/###\s*(?:Tactical Counter-Strike Campaign:\s*)?["']?([^"\n\r]+)["']?/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }

    const triggerMatch = draft.match(/####\s*Trigger:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    const stanceMatch = draft.match(/####\s*Strategic Brand Stance:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    const copyMatch = draft.match(/####\s*Counter-Content Copy Draft:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    const channelMatch = draft.match(/####\s*Distribution Channel:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);

    return {
      name,
      trigger: triggerMatch ? triggerMatch[1].trim() : "Detecting competitor move...",
      stance: stanceMatch ? stanceMatch[1].trim() : "Formulating protective stance...",
      copy: copyMatch ? copyMatch[1].replace(/^["']|["']$/g, "").trim() : "Drafting brand copywriting...",
      channel: channelMatch ? channelMatch[1].trim() : "Determining channel sync..."
    };
  };

  const parsedBrief = activeBrief ? parseDraft(activeBrief.content_draft) : null;

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
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          notification.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
            : "bg-rose-950/90 border-rose-500/30 text-rose-400 shadow-rose-500/10"
        }`}>
          <Zap className="w-5 h-5 animate-pulse text-emerald-400" />
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

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns (8/12 = 66% width) - Interactive Workspace */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Zone A: Central Command Center */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" /> Command Console
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Initialize strikes and inspect pipeline node executions</p>
              </div>

              {activeBrief && (
                <button 
                  onClick={() => setActiveBrief(null)}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors bg-slate-900 px-2.5 py-1 rounded-md border border-white/5"
                >
                  Reset Active Brief
                </button>
              )}
            </div>

            {/* Split layout inside command console: visualizer and dispatcher side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <PipelineViz state={pipelineState} />
              <DemoTrigger 
                onSuccess={triggerRefresh} 
                onStateChange={handleStateChange}
                onCampaignGenerated={(campaign) => {
                  setActiveBrief({
                    id: `act_${Math.random().toString(36).substring(2, 10)}`,
                    ...campaign
                  });
                }}
              />
            </div>

            {/* High-Fidelity Signature Element: Campaign Brief Reveal Card */}
            <div className="pt-4">
              {activeBrief && parsedBrief ? (
                <div className="border border-emerald-500/20 bg-emerald-950/5 rounded-2xl p-5 space-y-5 animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                      GENERATED CAMPAIGN BRIEF
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Status: Synchronized with Notion Database
                    </span>
                  </div>

                  {/* Campaign Name */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">CAMPAIGN INITIATIVE</span>
                    <h3 className="text-xl font-black text-white leading-tight">
                      {parsedBrief.name}
                    </h3>
                  </div>

                  {/* Split visual blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strategic Brand Stance */}
                    <div className="bg-slate-950 border border-white/5 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-purple-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> STRATEGIC BRAND STANCE
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {parsedBrief.stance}
                      </p>
                    </div>

                    {/* Social Media Preview Mock */}
                    <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> SOCIAL COPY DRAFT
                        </span>
                        <p className="text-xs text-slate-200 italic font-serif leading-relaxed pl-3 border-l-2 border-emerald-500/50">
                          "{parsedBrief.copy}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                          Channel: {parsedBrief.channel}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(parsedBrief.copy);
                            showToast("Ad copy copied to clipboard!", "success");
                          }}
                          className="p-1 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata and Lineage */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {activeBrief.rules_applied && activeBrief.rules_applied.map((rule, idx) => (
                        <span key={idx} className="text-[9px] font-mono font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/30 px-2.5 py-0.5 rounded-md">
                          Vadalog: {rule.split(":")[0]}
                        </span>
                      ))}
                      {activeBrief.brand_facts_used && activeBrief.brand_facts_used.map((fact, idx) => (
                        <span key={idx} className="text-[9px] font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/30 px-2.5 py-0.5 rounded-md">
                          Grounded: {fact}
                        </span>
                      ))}
                    </div>

                    <a 
                      href={activeBrief.published_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Notion Page
                    </a>
                  </div>

                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center py-16 space-y-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-emerald-500/0 group-hover:from-cyan-500/1 group-hover:via-purple-500/1 group-hover:to-emerald-500/1 transition-all duration-700 pointer-events-none" />
                  
                  <div className="p-4 bg-slate-950/80 border border-white/5 rounded-full text-slate-500 relative">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 pulse-glow-cyan" />
                  </div>

                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-md font-extrabold text-white">Interactive Campaign Viewer</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Initialize a competitor strike above, or select any historical published strike in the ledger below, to inspect the crafted UK-spelled copywriting, strategic brand stance, and rules lineage.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Zone B: Causal Ledger (Input / Output side-by-side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Left Box: Input (Signal Feed) */}
            <div className="h-[460px]">
              <EventFeed 
                refreshTrigger={refreshTrigger} 
                onTriggerAnalysis={handleTriggerAnalysis} 
              />
            </div>

            {/* Right Box: Output (Published Strikes) */}
            <div className="h-[460px]">
              <PublishedActions 
                refreshTrigger={refreshTrigger} 
                selectedActionId={activeBrief?.id || null}
                onSelectAction={(action) => {
                  setActiveBrief({
                    id: action.id,
                    title: action.trigger_title,
                    competitor: action.competitor,
                    strategy_angle: action.strategy_angle,
                    content_draft: action.content_draft,
                    published_url: action.published_url,
                  });
                }}
              />
            </div>

          </div>

        </section>

        {/* Right Sidebar (4/12 = 34% width) - Context Shield & Auditing */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Zone C: Brand Shield & Competitor Watchlist */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Brand Context Shield
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Brand vector facts and active competitor guardrails</p>
            </div>

            <div className="space-y-6">
              <BrandInsightPanel refreshTrigger={refreshTrigger} />
              <CompetitorWatchlist 
                refreshTrigger={refreshTrigger} 
                onSelectCompetitor={setSelectedCompetitor} 
              />
            </div>
          </div>

          {/* Zone D: Provenance Ledger (Audit Cited.md) */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <CitedViewer refreshTrigger={refreshTrigger} />
          </div>

        </aside>

      </div>

      {/* Slide-out Drawer: Competitor Analysis Deep-Dive */}
      <CompetitorDeepDive 
        competitorName={selectedCompetitor} 
        onClose={() => setSelectedCompetitor(null)} 
      />

    </main>
  );
}
