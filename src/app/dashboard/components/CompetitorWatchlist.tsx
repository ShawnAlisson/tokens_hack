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
}

export default function CompetitorWatchlist({ onSelectCompetitor, refreshTrigger }: CompetitorWatchlistProps) {
  const [watchlist, setWatchlist] = useState<CompetitorStats[]>([]);
  const [loading, setLoading] = useState(true);

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
          setWatchlist(stats);
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
      <div className="bc-muted rounded-xl p-4 flex justify-center">
        <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-slate-800">Competitor Watchlist</h3>
      </div>

      <div className="space-y-2 overflow-y-auto">
        {watchlist.map((comp) => (
          <button
            key={comp.name}
            onClick={() => onSelectCompetitor(comp.name)}
            className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 transition-all flex items-center justify-between group"
          >
            <div>
              <h4 className="text-sm font-semibold text-slate-700 group-hover:text-orange-600 flex items-center gap-1">
                {comp.name}
                {comp.highAlerts > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
              </h4>
              <p className="text-[10px] text-slate-400">{comp.domains[0]}</p>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
