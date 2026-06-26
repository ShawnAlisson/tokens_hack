"use client";

import { useEffect, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface BrandInsights {
  display_name: string;
  domain: string;
  market: string;
  logo_url: string;
  positioning_summary: string;
  threat_level: "Critical" | "Elevated" | "Low";
  threat_color: string;
  threat_score: number;
}

function mediaUrl(url: string) {
  if (!url) return "";
  return `/api/dashboard/media?url=${encodeURIComponent(url)}`;
}

export default function BrandInsightPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [insights, setInsights] = useState<BrandInsights | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/brand-insights")
      .then((r) => r.ok ? r.json() : null)
      .then(setInsights)
      .catch(console.error);
  }, [refreshTrigger]);

  if (!insights) {
    return (
      <div className="bc-muted rounded-xl p-6 flex items-center justify-center">
        <span className="w-6 h-6 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const threatBadgeBg =
    insights.threat_level === "Critical" ? "bg-rose-50 border-rose-200 text-rose-700" :
    insights.threat_level === "Elevated" ? "bg-amber-50 border-amber-200 text-amber-700" :
    "bg-emerald-50 border-emerald-200 text-emerald-700";

  const threatDotColor =
    insights.threat_level === "Critical" ? "bg-rose-500" :
    insights.threat_level === "Elevated" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="bc-muted rounded-xl p-3 space-y-3">
      {/* Brand & Threat Header - Highly Compact */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {insights.logo_url && (
            <img
              src={mediaUrl(insights.logo_url)}
              alt={insights.display_name}
              className="w-9 h-9 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0"
              onError={(e) => {
                e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${insights.domain}&sz=128`;
              }}
            />
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="truncate">{insights.display_name}</span>
              <span className="text-[8px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate">{insights.domain} · {insights.market}</p>
          </div>
        </div>

        {/* Threat Level Badge */}
        <div className="shrink-0 flex flex-col items-end">
          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${threatBadgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${threatDotColor} animate-pulse`} />
            {insights.threat_level}
          </div>
          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">Threat: {insights.threat_score}%</span>
        </div>
      </div>

      {/* Brand Positioning - Compact & Clickable to Expand */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white border border-slate-100 hover:border-slate-200 p-2.5 rounded-xl text-xs text-slate-600 transition-all cursor-pointer select-none group"
      >
        <div className="font-bold text-[9px] uppercase text-slate-400 mb-1 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-500" /> Brand Positioning
          </span>
          <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-0.5 font-normal text-[8px] uppercase">
            {isExpanded ? (
              <>Collapse <ChevronUp className="w-3 h-3 inline" /></>
            ) : (
              <>Expand <ChevronDown className="w-3 h-3 inline" /></>
            )}
          </span>
        </div>
        <p className={`leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
          {insights.positioning_summary}
        </p>
      </div>
    </div>
  );
}
