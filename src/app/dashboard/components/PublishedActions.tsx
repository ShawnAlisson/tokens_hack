"use client";

import { useEffect, useState } from "react";
import { Send, Clock, Link } from "lucide-react";

interface CounterAction {
  id: string;
  competitor: string;
  trigger_title: string;
  strategy_angle: string;
  content_draft: string;
  published_url: string;
  latency_ms: number;
  published_at: string;
}

interface PublishedActionsProps {
  refreshTrigger: number;
  selectedActionId?: string | null;
  onSelectAction?: (action: CounterAction) => void;
}

export default function PublishedActions({ refreshTrigger, selectedActionId, onSelectAction }: PublishedActionsProps) {
  const [actions, setActions] = useState<CounterAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/actions")
      .then((r) => r.ok ? r.json() : { actions: [] })
      .then((data) => setActions(data.actions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bc-panel rounded-2xl h-full flex items-center justify-center">
        <span className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bc-panel rounded-2xl h-full flex flex-col p-5">
      <div className="flex items-center gap-2 mb-1">
        <Send className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">Published Campaigns</h3>
      </div>
      <p className="text-[10px] text-slate-400 mb-3">Click to review a past counter-strike</p>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {actions.length > 0 ? (
          actions.map((act) => {
            const isSelected = selectedActionId === act.id;
            return (
              <div
                key={act.id}
                onClick={() => onSelectAction?.(act)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {isSelected ? "Viewing" : "Published"}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(act.published_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-700 leading-tight">
                  {act.competitor} — {act.trigger_title}
                </h4>
                <p className="text-xs font-semibold text-emerald-700 mt-1">{act.strategy_angle}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {act.latency_ms}ms
                  </span>
                  <a
                    href={act.published_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[9px] text-teal-600 font-bold flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" /> Notion
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            No campaigns yet. Run a strike on a threat to publish.
          </div>
        )}
      </div>
    </div>
  );
}
