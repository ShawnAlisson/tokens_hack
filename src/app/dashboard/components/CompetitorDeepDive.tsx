"use client";

import { useEffect, useState } from "react";
import { X, Globe, BarChart2, ListTodo, Award, Link2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CompetitorDeepDiveProps {
  competitorName: string | null;
  onClose: () => void;
}

interface CompetitorDetailData {
  events: {
    id: string;
    title: string;
    snippet: string;
    url: string;
    source_type: string;
    severity: "high" | "medium" | "low";
    inserted_at: string;
  }[];
  trend: {
    date: string;
    count: number;
    high: number;
    medium: number;
    low: number;
  }[];
  top_sources: {
    source: string;
    count: number;
  }[];
}

export default function CompetitorDeepDive({ competitorName, onClose }: CompetitorDeepDiveProps) {
  const [data, setData] = useState<CompetitorDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!competitorName) return;
    const name = competitorName;

    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/competitors/${encodeURIComponent(name)}`);
        if (res.ok) {
          const detailData = await res.json();
          setData(detailData);
        }
      } catch (err) {
        console.error("Failed to load competitor details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [competitorName]);

  if (!competitorName) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-[550px] bg-[#0c0e15] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-500 ease-out flex flex-col justify-between ${competitorName ? "translate-x-0" : "translate-x-full"}`}>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">{competitorName} Deep-Dive</h2>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Drawer Active</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Omnisearch coverage tracking domains & feeds
          </p>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading || !data ? (
          <div className="h-full flex flex-col justify-center items-center gap-3">
            <span className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Scanning Tavily Snapshot Indices...</p>
          </div>
        ) : (
          <>
            {/* 1. 14-day Trend Chart */}
            <div className="glass-panel p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> 14-Day Ingestion Trend & Severity
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => tick.split("-")[2] || tick} 
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0c0e15", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, marginTop: 5 }} />
                    <Bar dataKey="high" name="High" fill="#f43f5e" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="medium" name="Medium" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="low" name="Low" fill="#06b6d4" radius={[2, 2, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Top Sources */}
            <div className="glass-panel p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Award className="w-4 h-4 text-purple-400" /> Primary Signal Domains
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.top_sources.length > 0 ? (
                  data.top_sources.map((src) => (
                    <span 
                      key={src.source} 
                      className="text-xs bg-slate-900 border border-white/5 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> {src.source}
                      <span className="bg-slate-800 text-slate-400 font-bold text-[9px] px-1.5 py-0.5 rounded">
                        {src.count}
                      </span>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No active domains logged.</p>
                )}
              </div>
            </div>

            {/* 3. Chronological Event Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <ListTodo className="w-4 h-4 text-amber-400" /> Chronological Ingest Logs
              </h4>

              <div className="space-y-4 pr-1">
                {data.events.length > 0 ? (
                  data.events.map((evt) => (
                    <div 
                      key={evt.id}
                      className="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          evt.severity === "high" ? "bg-rose-500/10 border border-rose-500/30 text-rose-400" :
                          evt.severity === "medium" ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" :
                          "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                        }`}>
                          {evt.severity} severity
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(evt.inserted_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h5 className="text-sm font-extrabold text-white leading-tight">{evt.title}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">{evt.snippet}</p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 capitalize">Source: {evt.source_type}</span>
                        <a 
                          href={evt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Link2 className="w-3 h-3" /> View Web Citation
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No historical alerts found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-slate-950/40 text-center">
        <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
          CS Agent Security Shield • White-Label Demo Environment
        </p>
      </div>
    </div>
  );
}
