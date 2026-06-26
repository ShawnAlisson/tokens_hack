"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Info, Sparkles } from "lucide-react";

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

export default function BrandInsightPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [insights, setInsights] = useState<BrandInsights | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/dashboard/brand-insights");
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        }
      } catch (err) {
        console.error("Failed to fetch brand insights:", err);
      }
    }
    fetchInsights();
  }, [refreshTrigger]);

  if (!insights) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Syncing Brand Brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between relative overflow-hidden">
      {/* Decorative ambient background gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />

      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          {insights.logo_url ? (
            <img 
              src={insights.logo_url} 
              alt={insights.display_name} 
              className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 border border-white/10" 
              onError={(e) => {
                // Remove broken images and fallback to icon
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              {insights.display_name} <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">Active Tenant</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{insights.domain} • {insights.market}</p>
          </div>
        </div>

        <hr className="border-white/5 my-4" />

        {/* Brand Positioning Summary (Senso Fact) */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Grounded Brand Positioning Guidance
          </h4>
          <p className="text-sm leading-relaxed text-slate-300 antialiased bg-slate-950/20 border border-white/5 p-3 rounded-xl">
            {insights.positioning_summary}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        {/* Calculated Threat Level Gauge */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calculated Market Threat Level</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black tracking-tight ${insights.threat_color}`}>
                {insights.threat_level}
              </span>
              <span className="text-xs text-slate-500 font-medium">({insights.threat_score}% Threat Index)</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            {/* Thread Index Progress Bar */}
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  insights.threat_level === "Critical" ? "bg-rose-500" :
                  insights.threat_level === "Elevated" ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${insights.threat_score}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400" /> Unified threat monitor active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
