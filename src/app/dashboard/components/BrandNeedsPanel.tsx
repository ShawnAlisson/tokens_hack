"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, Lightbulb, Target,
  TrendingUp, Users, Zap, Leaf, Package, BarChart3,
} from "lucide-react";

interface NeedItem {
  id: string;
  title: string;
  detail: string;
  status: "gap" | "need" | "recommendation";
  icon: "target" | "users" | "zap" | "leaf" | "package" | "chart";
}

const GYMSHARK_NEEDS: NeedItem[] = [
  {
    id: "bundle-counter",
    title: "Value bundle counter-strike",
    detail: "Lululemon & Nike pricing moves need multi-buy bundle campaigns (2-for deals on Vital Seamless).",
    status: "recommendation",
    icon: "zap",
  },
  {
    id: "eco-gap",
    title: "Sustainable line visibility",
    detail: "Competitors pushing eco/bio-nylon launches — highlight existing recycled ranges in counter-content.",
    status: "gap",
    icon: "leaf",
  },
  {
    id: "genz-retention",
    title: "Gen-Z price sensitivity",
    detail: "ASOS £18 budget leggings targeting same audience — reinforce community loyalty & free delivery hooks.",
    status: "gap",
    icon: "users",
  },
  {
    id: "product-sync",
    title: "Live product catalog sync",
    detail: "Keep Vital Seamless, Adapt & Crest lines indexed for grounded copywriting briefs.",
    status: "need",
    icon: "package",
  },
  {
    id: "threat-monitor",
    title: "Competitor threat monitoring",
    detail: "5 rivals on watchlist — cap at 10 signals each per sweep to control API spend.",
    status: "need",
    icon: "target",
  },
  {
    id: "performance-metrics",
    title: "Campaign ROI tracking",
    detail: "Track counter-strike latency, x402 revenue, and cited.md publish rate on dashboard.",
    status: "need",
    icon: "chart",
  },
];

const ICON_MAP = {
  target: Target,
  users: Users,
  zap: Zap,
  leaf: Leaf,
  package: Package,
  chart: BarChart3,
};

const STATUS_STYLES = {
  gap: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Gap",
    border: "border-amber-200/80",
    accent: "text-amber-600",
  },
  need: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    label: "Need",
    border: "border-sky-200/80",
    accent: "text-sky-600",
  },
  recommendation: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    label: "Action",
    border: "border-violet-200/80",
    accent: "text-violet-600",
  },
};

export default function BrandNeedsPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [brandName, setBrandName] = useState("Gymshark");

  useEffect(() => {
    fetch("/api/dashboard/tenant")
      .then((r) => r.ok ? r.json() : null)
      .then((t) => { if (t?.display_name) setBrandName(t.display_name); })
      .catch(() => {});
  }, [refreshTrigger]);

  const gaps = GYMSHARK_NEEDS.filter((n) => n.status === "gap").length;
  const needs = GYMSHARK_NEEDS.filter((n) => n.status === "need").length;
  const actions = GYMSHARK_NEEDS.filter((n) => n.status === "recommendation").length;

  return (
    <section className="bc-panel rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <Lightbulb className="w-4 h-4 text-amber-500" />
            What {brandName} Needs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Competitive gaps, requirements & recommended counter-moves
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {gaps} gaps
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {needs} needs
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {actions} actions
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GYMSHARK_NEEDS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const style = STATUS_STYLES[item.status];
          return (
            <div
              key={item.id}
              className={`rounded-xl border ${style.border} bg-white p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`p-2 rounded-lg bg-slate-50 ${style.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badge}`}>
                  {style.label}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
