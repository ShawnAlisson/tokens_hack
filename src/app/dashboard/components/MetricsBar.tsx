"use client";

import { useEffect, useState } from "react";
import { Activity, Zap, ShieldAlert, Cpu } from "lucide-react";

interface MetricsData {
  mode: "live" | "cached";
  snapshotDate?: string;
  totalEvents: number;
  avgLatencyMs: number;
  x402Count: number;
  totalRevenueUsd: number;
}

export default function MetricsBar({ refreshTrigger }: { refreshTrigger: number }) {
  const [metrics, setMetrics] = useState<MetricsData>({
    mode: "cached", totalEvents: 0, avgLatencyMs: 0, x402Count: 0, totalRevenueUsd: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setMetrics(data))
      .catch(console.error);
  }, [refreshTrigger]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bc-panel rounded-xl p-4 border-l-4 border-l-teal-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ingestion Mode</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 capitalize">{metrics.mode}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {metrics.snapshotDate ? `Snapshot: ${metrics.snapshotDate}` : "Tavily signal source"}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
        </div>
      </div>

      <div className="bc-panel rounded-xl p-4 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Alerts Ingested</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{metrics.totalEvents}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Open-web signals</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bc-panel rounded-xl p-4 border-l-4 border-l-violet-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg Publish Latency</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">
              {metrics.avgLatencyMs > 0 ? `${metrics.avgLatencyMs.toLocaleString()}ms` : "—"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Detect to cited.md</p>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-50">
            <Cpu className="w-5 h-5 text-violet-600" />
          </div>
        </div>
      </div>

      <div className="bc-panel rounded-xl p-4 border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">x402 Revenue</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${metrics.totalRevenueUsd.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.x402Count} transactions</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
