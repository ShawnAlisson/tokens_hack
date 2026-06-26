"use client";

import { useEffect, useState } from "react";
import { Send, Clock, BookOpen, Link } from "lucide-react";

interface CounterAction {
  id: string;
  competitor: string;
  trigger_title: string;
  strategy_angle: string;
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
    async function fetchActions() {
      try {
        const res = await fetch("/api/dashboard/actions");
        if (res.ok) {
          const data = await res.json();
          setActions(data.actions || []);
        }
      } catch (err) {
        console.error("Failed to load counter actions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActions();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-full flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between">
      <div>
        <h3 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-500" /> Published Counter-Strikes
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Live briefs synchronized to Notion. Click to review brief.</p>

        <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {actions.length > 0 ? (
            actions.map((act) => {
              const isSelected = selectedActionId === act.id;
              return (
                <div 
                  key={act.id} 
                  onClick={() => onSelectAction && onSelectAction(act)}
                  className={`glass-panel-glow-emerald p-4 rounded-xl border transition-all duration-300 space-y-2 relative ${
                    onSelectAction ? "cursor-pointer" : ""
                  } ${
                    isSelected 
                      ? "border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 scale-[1.01]" 
                      : "border-emerald-500/15 hover:border-emerald-500/40 hover:bg-emerald-950/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] border font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isSelected 
                        ? "bg-emerald-500 text-slate-950 border-emerald-400" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {isSelected ? "Active View" : "Published"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.published_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 leading-tight">
                      Trigger: <span className="text-white font-extrabold">{act.competitor}</span> — {act.trigger_title}
                    </h4>
                    <p className="text-sm font-black text-emerald-400 leading-snug mt-1.5 glow-text-emerald">
                      {act.strategy_angle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="text-[10px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {act.latency_ms}ms
                      </span>
                      <span className="text-[10px] flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Notion DB sync
                      </span>
                    </div>

                    <a 
                      href={act.published_url} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking link
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-extrabold"
                    >
                      <Link className="w-3 h-3" /> View Notion Page
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No actions published yet. Trigger a strike to publish.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow-emerald" />
        <p className="text-[10px] text-slate-500 font-medium">All publishes validated with zero-impersonation safety</p>
      </div>
    </div>
  );
}
