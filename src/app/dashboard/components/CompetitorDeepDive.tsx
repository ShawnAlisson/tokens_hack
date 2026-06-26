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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{competitorName} Deep-Dive</h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Competitor intelligence breakdown
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading || !data ? (
          <div className="h-full flex flex-col justify-center items-center gap-3">
            <span className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading competitor data...</p>
          </div>
        ) : (
          <>
            <div className="bc-panel rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <BarChart2 className="w-4 h-4 text-teal-600" /> 14-Day Trend
              </h4>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <XAxis dataKey="date" tickFormatter={(tick) => tick.split("-")[2] || tick} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 8 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="high" name="High" fill="#e11d48" stackId="a" />
                    <Bar dataKey="medium" name="Medium" fill="#d97706" stackId="a" />
                    <Bar dataKey="low" name="Low" fill="#0d9488" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bc-panel rounded-xl p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Award className="w-4 h-4 text-violet-600" /> Top Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.top_sources.map((src) => (
                  <span key={src.source} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> {src.source}
                    <span className="bg-white text-slate-500 font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-200">{src.count}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-orange-500" /> Event Timeline
              </h4>
              {data.events.map((evt) => (
                <div key={evt.id} className="bc-panel rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      evt.severity === "high" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                      evt.severity === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                      "bg-teal-50 text-teal-600 border border-teal-200"
                    }`}>{evt.severity}</span>
                    <span className="text-[10px] text-slate-400">{new Date(evt.inserted_at).toLocaleDateString()}</span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-800">{evt.title}</h5>
                  <p className="text-xs text-slate-500">{evt.snippet}</p>
                  <a href={evt.url} target="_blank" rel="noreferrer" className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> View source
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
