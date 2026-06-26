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
    mode: "cached",
    totalEvents: 0,
    avgLatencyMs: 0,
    x402Count: 0,
    totalRevenueUsd: 0.0,
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/dashboard/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
    }
    fetchMetrics();
  }, [refreshTrigger]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
      {/* 1. Ingestion Mode Card */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-cyan-500">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tavily Ingestion Mode</p>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-bold tracking-tight text-white capitalize">{metrics.mode}</h3>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${metrics.mode === "live" ? "bg-emerald-500 pulse-glow-emerald" : "bg-cyan-500 pulse-glow-cyan"}`} />
          </div>
          {metrics.snapshotDate && (
            <p className="text-[10px] text-slate-500 mt-1">Snapshot: {metrics.snapshotDate}</p>
          )}
        </div>
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/30 rounded-xl">
          <Activity className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* 2. Events Today Card */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Alerts Ingested</p>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-1">{metrics.totalEvents}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Real open-web signals</p>
        </div>
        <div className="p-3 bg-amber-950/40 border border-amber-800/30 rounded-xl">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* 3. Avg Latency Card */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-purple-500">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mean Publish Latency</p>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
            {metrics.avgLatencyMs > 0 ? `${metrics.avgLatencyMs.toLocaleString()}ms` : "0ms"}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Detect-to-Notion latency</p>
        </div>
        <div className="p-3 bg-purple-950/40 border border-purple-800/30 rounded-xl">
          <Cpu className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* 4. x402 Revenue Card */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">x402 Micropayments</p>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
            ${metrics.totalRevenueUsd.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USD</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            {metrics.x402Count} processed transactions
          </p>
        </div>
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/30 rounded-xl">
          <Zap className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}
