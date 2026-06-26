"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Calendar, Zap, FileText, Copy, ExternalLink,
  ShieldCheck, Flame, ChevronDown, Loader2, LogOut,
} from "lucide-react";
import BrandOnboarding from "./components/BrandOnboarding";
import AgentWorkflowStrip, { type PipelineState } from "./components/AgentWorkflowStrip";
import BrandContextPanel from "./components/BrandContextPanel";
import MetricsBar from "./components/MetricsBar";
import CompetitorWatchlist from "./components/CompetitorWatchlist";
import CompetitorDeepDive from "./components/CompetitorDeepDive";
import EventFeed from "./components/EventFeed";
import PublishedActions from "./components/PublishedActions";
import CitedViewer from "./components/CitedViewer";

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

interface TenantSummary {
  id: string;
  display_name: string;
  logo_url: string;
  domain?: string;
}

function mediaUrl(url: string) {
  if (!url) return "";
  return `/api/dashboard/media?url=${encodeURIComponent(url)}`;
}

export default function Dashboard() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>("idle");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeBrief, setActiveBrief] = useState<ActiveBrief | null>(null);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const runAgentSync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/dashboard/sync", { method: "POST" });
      setRefreshTrigger((p) => p + 1);
    } catch (e) {
      console.error("Agent sync failed:", e);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const wasOnboarded = localStorage.getItem("brandcompete_onboarded") === "true";
    setOnboarded(wasOnboarded);
    if (wasOnboarded) {
      loadTenant();
      runAgentSync();
    }
  }, [runAgentSync]);

  const loadTenant = async () => {
    const res = await fetch("/api/dashboard/tenant");
    if (res.ok) setTenant(await res.json());
  };

  const handleOnboardingComplete = async () => {
    setOnboarded(true);
    await loadTenant();
    await runAgentSync();
  };

  const handleLogout = async () => {
    await fetch("/api/dashboard/logout", { method: "POST" });
    localStorage.removeItem("brandcompete_onboarded");
    localStorage.removeItem("brandcompete_tenant");
    setShowTenantMenu(false);
    setOnboarded(false);
    setTenant(null);
    setActiveBrief(null);
    setPipelineState("idle");
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTriggerAnalysis = async (eventId: string) => {
    if (pipelineState !== "idle") return;
    try {
      setPipelineState("ingesting");
      await new Promise((r) => setTimeout(r, 600));
      setPipelineState("reasoning");

      const res = await fetch("/api/dashboard/trigger-strike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("Strike failed");

      setPipelineState("publishing");
      const data = await res.json();
      setPipelineState("completed");
      showToast("Campaign published to Notion!", "success");
      setRefreshTrigger((p) => p + 1);

      if (data.plan && data.publish) {
        setActiveBrief({
          id: data.publish.action_id || data.publish.id || `act_${Date.now()}`,
          title: data.plan.trigger_title,
          competitor: data.plan.competitor,
          strategy_angle: data.plan.strategy_angle,
          content_draft: data.plan.content_draft,
          published_url: data.publish.published_url,
          rules_applied: data.plan.rules_applied,
          brand_facts_used: data.plan.brand_facts_used,
        });
      }
      setTimeout(() => setPipelineState("idle"), 3000);
    } catch {
      setPipelineState("idle");
      showToast("Strike execution failed", "error");
    }
  };

  const parseDraft = (draft: string) => {
    if (!draft) return null;
    let name = "Counter-Campaign";
    const nameMatch = draft.match(/###\s*(?:Tactical Counter-Strike Campaign:\s*)?["']?([^"\n\r]+)["']?/i);
    if (nameMatch) name = nameMatch[1].trim();
    const stanceMatch = draft.match(/####\s*Strategic Brand Stance:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    const copyMatch = draft.match(/####\s*Counter-Content Copy Draft:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    const channelMatch = draft.match(/####\s*Distribution Channel:?\s*\n+([\s\S]*?)(?=\n+####|$)/i);
    return {
      name,
      stance: stanceMatch?.[1].trim() ?? "",
      copy: copyMatch?.[1].replace(/^["']|["']$/g, "").trim() ?? "",
      channel: channelMatch?.[1].trim() ?? "",
    };
  };

  const parsedBrief = activeBrief ? parseDraft(activeBrief.content_draft) : null;
  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  if (onboarded === null) return null;
  if (!onboarded) return <BrandOnboarding onComplete={handleOnboardingComplete} />;

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border animate-fade-in ${
          notification.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          <Zap className="w-4 h-4" />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              BrandCompete
            </h1>
            <p className="text-xs text-slate-500">Autonomous competitive intelligence & counter-campaigns</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              {tenant?.logo_url && (
                <img src={mediaUrl(tenant.logo_url)} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="text-sm font-semibold text-slate-700">{tenant?.display_name ?? "Loading..."}</span>
              {syncing && <Loader2 className="w-3 h-3 text-teal-600 animate-spin" />}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {showTenantMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bc-panel-elevated rounded-xl py-1 z-40">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Active brand</p>
                  <p className="text-sm font-semibold text-slate-800">{tenant?.display_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Switch brand
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            {todayStr}
          </div>
        </div>
      </header>

      {/* Row 1: Agent Workflow | Brand Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <AgentWorkflowStrip pipelineState={pipelineState} refreshTrigger={refreshTrigger} />
        <BrandContextPanel refreshTrigger={refreshTrigger} syncing={syncing} onResync={runAgentSync} />
      </div>

      {/* Row 2: Intelligence | Published | Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-[380px]">
          <EventFeed
            refreshTrigger={refreshTrigger}
            onTriggerAnalysis={handleTriggerAnalysis}
            pipelineBusy={pipelineState !== "idle"}
          />
        </div>
        <div className="h-[380px]">
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
        <div className="h-[380px]">
          <div className="bc-panel rounded-2xl p-5 h-full">
            <CompetitorWatchlist
              refreshTrigger={refreshTrigger}
              onSelectCompetitor={setSelectedCompetitor}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Campaign Output */}
      <div className="bc-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
              Campaign Output
            </h2>
            <p className="text-xs text-slate-500">Generated counter-campaign brief from your agents</p>
          </div>
          {activeBrief && (
            <button onClick={() => setActiveBrief(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100">
              Clear
            </button>
          )}
        </div>

        {activeBrief && parsedBrief ? (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">Generated Brief</span>
              <span className="text-[10px] text-emerald-600 font-medium">Synced with Notion</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{parsedBrief.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Strategic Stance
                </span>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">{parsedBrief.stance}</p>
              </div>
              <div className="bg-white border border-emerald-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Copy Draft
                </span>
                <p className="text-sm text-slate-700 italic leading-relaxed mt-2 pl-3 border-l-2 border-emerald-400">
                  &ldquo;{parsedBrief.copy}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">{parsedBrief.channel}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(parsedBrief.copy); showToast("Copy saved!"); }}
                    className="text-[10px] font-bold text-teal-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200">
              <div className="flex flex-wrap gap-1.5">
                {activeBrief.rules_applied?.map((rule, i) => (
                  <span key={i} className="text-[9px] font-mono bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-md">
                    {rule.split(":")[0]}
                  </span>
                ))}
              </div>
              <a href={activeBrief.published_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Notion Page
              </a>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center text-center px-6">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No campaign selected</p>
            <p className="text-xs text-slate-400 mt-1">Run Strike on a threat or select a published campaign above.</p>
          </div>
        )}
      </div>

      {/* Row 4: Metrics + Audit */}
      <section className="space-y-5">
        <MetricsBar refreshTrigger={refreshTrigger} />
        <CitedViewer refreshTrigger={refreshTrigger} />
      </section>

      <CompetitorDeepDive competitorName={selectedCompetitor} onClose={() => setSelectedCompetitor(null)} />
    </main>
  );
}
