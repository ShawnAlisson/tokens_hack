"use client";

import { useEffect, useState } from "react";
import { Users, Eye, AlertTriangle } from "lucide-react";

interface CompetitorWatchlistProps {
  onSelectCompetitor: (name: string) => void;
  refreshTrigger: number;
}

interface CompetitorStats {
  name: string;
  domains: string[];
  totalAlerts: number;
  highAlerts: number;
  medAlerts: number;
  lowAlerts: number;
}

export default function CompetitorWatchlist({ onSelectCompetitor, refreshTrigger }: CompetitorWatchlistProps) {
  const [watchlist, setWatchlist] = useState<CompetitorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        setLoading(true);
        // Let's call our tenant route to list competitors, and then aggregate stats
        const tenantRes = await fetch("/api/dashboard/tenant");
        if (tenantRes.ok) {
          const tenant = await tenantRes.json();
          
          // Let's load the recent events to calculate totals on-the-fly for reliability
          const eventsRes = await fetch("/api/dashboard/events?limit=200");
          if (eventsRes.ok) {
            const { events } = await eventsRes.json();
            
            // Map tenant competitors and calculate severity allocations
            const stats: CompetitorStats[] = tenant.competitors.map((comp: any) => {
              const compEvts = events.filter((e: any) => e.competitor.toLowerCase() === comp.name.toLowerCase());
              
              return {
                name: comp.name,
                domains: comp.domains,
                totalAlerts: compEvts.length,
                highAlerts: compEvts.filter((e: any) => e.severity === "high").length,
                medAlerts: compEvts.filter((e: any) => e.severity === "medium").length,
                lowAlerts: compEvts.filter((e: any) => e.severity === "low").length,
              };
            });

            setWatchlist(stats);
          }
        }
      } catch (err) {
        console.error("Failed to load competitor watchlist:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWatchlist();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-center items-center">
        <span className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 mt-2">Loading Intelligence Feeds...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div>
        <h3 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" /> Strategic Watchlist
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Click competitor for deep-dive trends & citations</p>

        <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {watchlist.map((comp) => (
            <button
              key={comp.name}
              onClick={() => onSelectCompetitor(comp.name)}
              className="w-full text-left glass-panel hover:bg-white/5 border border-white/5 hover:border-white/15 p-3.5 rounded-xl transition-all duration-300 flex items-center justify-between group"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  {comp.name}
                  {comp.highAlerts > 0 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10 animate-pulse" />
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                  {comp.domains[0]}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Severity pill indicators */}
                <div className="flex gap-1">
                  {comp.highAlerts > 0 && (
                    <span className="text-[9px] bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold px-1.5 py-0.5 rounded-md">
                      {comp.highAlerts} H
                    </span>
                  )}
                  {comp.medAlerts > 0 && (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-1.5 py-0.5 rounded-md">
                      {comp.medAlerts} M
                    </span>
                  )}
                  {comp.totalAlerts === 0 && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md">
                      Stable
                    </span>
                  )}
                </div>

                <Eye className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow-emerald" />
        <p className="text-[10px] text-slate-500 font-medium">Tracking {watchlist.length} key UK D2C brand networks</p>
      </div>
    </div>
  );
}
