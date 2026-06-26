"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

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

  const threatBarColor =
    insights.threat_level === "Critical" ? "bg-rose-500" :
    insights.threat_level === "Elevated" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="bc-muted rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        {insights.logo_url && (
          <img
            src={mediaUrl(insights.logo_url)}
            alt={insights.display_name}
            className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200 p-1"
            onError={(e) => {
              e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${insights.domain}&sz=128`;
            }}
          />
        )}
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {insights.display_name}
            <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Active
            </span>
          </h3>
          <p className="text-xs text-slate-400">{insights.domain} · {insights.market}</p>
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
          <Sparkles className="w-3 h-3 text-violet-500" /> Brand Positioning
        </h4>
        <p className="text-sm leading-relaxed text-slate-600 bg-white border border-slate-200 p-3 rounded-xl">
          {insights.positioning_summary}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Threat Level
          </h4>
          <span className={`text-lg font-bold ${insights.threat_color}`}>
            {insights.threat_level}
          </span>
          <span className="text-xs text-slate-400 ml-1">({insights.threat_score}%)</span>
        </div>
        <div className="w-28">
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${threatBarColor}`} style={{ width: `${insights.threat_score}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
