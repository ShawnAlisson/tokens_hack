"use client";

import { useEffect, useState } from "react";
import { Users, Eye, AlertTriangle, Search } from "lucide-react";

interface CompetitorWatchlistProps {
  onSelectCompetitor: (name: string) => void;
  refreshTrigger: number;
  pipelineState?: string;
  isSyncing?: boolean;
}

interface CompetitorStats {
  name: string;
  domains: string[];
  totalAlerts: number;
  highAlerts: number;
  medAlerts: number;
}

export default function CompetitorWatchlist({ 
  onSelectCompetitor, 
  refreshTrigger, 
  pipelineState,
  isSyncing = false
}: CompetitorWatchlistProps) {
  const [watchlist, setWatchlist] = useState<CompetitorStats[]>([]);
  const [loading, setLoading] = useState(true);

  const isScanning = pipelineState === "ingesting" || isSyncing;

  useEffect(() => {
    async function load() {
      try {
        const tenantRes = await fetch("/api/dashboard/tenant");
        const eventsRes = await fetch("/api/dashboard/events?limit=200");
        if (tenantRes.ok && eventsRes.ok) {
          const tenant = await tenantRes.json();
          const { events } = await eventsRes.json();
          const stats: CompetitorStats[] = tenant.competitors.map((comp: { name: string; domains: string[] }) => {
            const compEvts = events.filter((e: { competitor: string }) => e.competitor.toLowerCase() === comp.name.toLowerCase());
            return {
              name: comp.name,
              domains: comp.domains,
              totalAlerts: compEvts.length,
              highAlerts: compEvts.filter((e: { severity: string }) => e.severity === "high").length,
              medAlerts: compEvts.filter((e: { severity: string }) => e.severity === "medium").length,
            };
          });
          
          // If there are absolutely no events in the database (e.g., fresh reset),
          // don't show any competitors yet so we can animate their "discovery"!
          const totalGlobalAlerts = stats.reduce((acc, c) => acc + c.totalAlerts, 0);
          if (totalGlobalAlerts === 0) {
            setWatchlist([]);
          } else {
            setWatchlist(stats);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bc-panel rounded-2xl h-full flex flex-col justify-center items-center p-5">
        <span className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-2">Checking competitor watchlist...</p>
      </div>
    );
  }

  return (
    <div className="bc-panel rounded-2xl h-full flex flex-col p-5 min-h-0 relative">
      {/* Self-contained custom CSS for high-fidelity scanning animations */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanner-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.7), rgba(249, 115, 22, 0.1), transparent);
          box-shadow: 0 0 6px rgba(249, 115, 22, 0.5);
          animation: scanline 3s linear infinite;
        }
        @keyframes item-pulse {
          0%, 100% { border-color: rgba(241, 135, 33, 0.12); background-color: rgba(249, 115, 22, 0.01); }
          50% { border-color: rgba(249, 115, 22, 0.45); background-color: rgba(249, 115, 22, 0.04); }
        }
        .animate-scanning-item {
          animation: item-pulse 2s ease-in-out infinite;
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-sweep {
          animation: shimmer-sweep 2s infinite linear;
        }
      `}</style>

      <div className="flex items-center gap-2 mb-3 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className={`w-4 h-4 ${isScanning ? "text-orange-500 animate-pulse" : "text-orange-500"}`} />
          <h3 className="text-sm font-bold text-slate-800">
            {isScanning ? "Scanning Web Ecosystem..." : "Competitor Watchlist"}
          </h3>
        </div>
        {isScanning && (
          <span className="text-[9px] bg-orange-50 text-orange-600 border border-orange-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping shrink-0" />
            Analyzing Competitors
          </span>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 relative pr-1 min-h-0">
        {/* Shimmer/Scanline active over the container during ingestion */}
        {isScanning && <div className="animate-scanner-line pointer-events-none z-10" />}

        {isScanning && watchlist.length === 0 ? (
          <div className="space-y-2">
            {[
              { text: "Mapping sector competitors...", sub: "Analyzing brand context..." },
              { text: "Crawling competitor domains...", sub: "Verifying e-comm endpoints..." },
              { text: "Extracting active product tags...", sub: "Reading pricing catalogs..." },
              { text: "Aligning intelligence agents...", sub: "Establishing sweep routes..." }
            ].map((skele, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 150}ms` }}
                className="w-full p-3 rounded-xl border border-orange-200/50 bg-orange-50/10 flex items-center justify-between relative overflow-hidden animate-scanning-item"
              >
                {/* Sweeping Shimmer light effect */}
                <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full animate-shimmer-sweep" style={{ animationDelay: `${i * 150}ms` }} />

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-orange-700 animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                    {skele.text}
                  </h4>
                  <p className="text-[9px] text-orange-400 font-medium mt-0.5">{skele.sub}</p>
                </div>

                <span className="text-[8px] font-bold text-orange-500 flex items-center gap-1 uppercase bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded shrink-0">
                  <Search className="w-2.5 h-2.5 animate-spin text-orange-500" /> Crawling
                </span>
              </div>
            ))}
          </div>
        ) : watchlist.length > 0 ? (
          watchlist.map((comp, idx) => (
            <button
              key={comp.name}
              onClick={() => onSelectCompetitor(comp.name)}
              style={{ animationDelay: `${idx * 150}ms` }}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group relative overflow-hidden ${
                isScanning
                  ? "border-orange-200 animate-scanning-item"
                  : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
              }`}
            >
              <div className="min-w-0">
                <h4 className={`text-sm font-semibold flex items-center gap-1 truncate ${
                  isScanning ? "text-orange-700 font-bold" : "text-slate-700 group-hover:text-orange-600"
                }`}>
                  {comp.name}
                  {comp.highAlerts > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{comp.domains[0]}</p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {isScanning ? (
                  <span className="text-[8px] font-bold text-orange-500 flex items-center gap-1 uppercase bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
                    <Search className="w-3 h-3 animate-spin text-orange-500" /> Scanning
                  </span>
                ) : (
                  <>
                    {comp.highAlerts > 0 && (
                      <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 font-bold px-1.5 py-0.5 rounded">
                        {comp.highAlerts}H
                      </span>
                    )}
                    {comp.medAlerts > 0 && (
                      <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
                        {comp.medAlerts}M
                      </span>
                    )}
                    {comp.totalAlerts === 0 && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">
                        Stable
                      </span>
                    )}
                    <Eye className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                  </>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">No competitors configured.</div>
        )}
      </div>
    </div>
  );
}
