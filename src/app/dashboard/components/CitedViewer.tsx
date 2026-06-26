"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Link, Calendar, ArrowRight } from "lucide-react";

interface CitationRow {
  eventText: string;
  eventUrl: string;
  strategy: string;
  briefUrl: string;
  briefLabel: string;
  timestamp: string;
}

export default function CitedViewer({ refreshTrigger }: { refreshTrigger: number }) {
  const [citations, setCitations] = useState<CitationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/cited")
      .then((r) => r.ok ? r.json() : { markdown: "" })
      .then((data) => {
        const lines = (data.markdown || "").split("\n");
        const parsed: CitationRow[] = [];

        for (const line of lines) {
          if (!line.trim() || line.includes("Competitor Counter-Strike") || line.includes("This file tracks") || line.includes("Competitor Event |") || line.includes("|---|")) continue;
          const cols = line.split("|").map((c: string) => c.trim()).filter((_: string, idx: number, arr: string[]) => idx > 0 && idx < arr.length - 1);
          if (cols.length >= 4) {
            const eventLinkMatch = cols[0].match(/\[(.*?)\]\((.*?)\)/);
            const briefLinkMatch = cols[2].match(/\[(.*?)\]\((.*?)\)/);
            parsed.push({
              eventText: eventLinkMatch?.[1] ?? cols[0],
              eventUrl: eventLinkMatch?.[2] ?? "#",
              strategy: cols[1],
              briefUrl: briefLinkMatch?.[2] ?? "#",
              briefLabel: briefLinkMatch?.[1] ?? "Brief",
              timestamp: cols[3],
            });
          }
        }
        setCitations(parsed.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bc-panel rounded-2xl p-6 flex justify-center">
        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bc-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-5 h-5 text-violet-600" />
        <h3 className="text-sm font-bold text-slate-800">Provenance Ledger</h3>
      </div>
      <p className="text-[10px] text-slate-400 mb-4">Audit trail from web source to published campaign</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-2 pr-4">Source Event</th>
              <th className="pb-2 pr-4">Strategy</th>
              <th className="pb-2 pr-4">Brief</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {citations.length > 0 ? (
              citations.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="text-xs hover:bg-slate-50">
                  <td className="py-2.5 pr-4 max-w-[200px]">
                    <a href={row.eventUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-teal-600 flex items-center gap-1 line-clamp-1">
                      <FileText className="w-3 h-3 shrink-0" /> {row.eventText}
                    </a>
                  </td>
                  <td className="py-2.5 pr-4 text-violet-600 font-medium">{row.strategy}</td>
                  <td className="py-2.5 pr-4">
                    <a href={row.briefUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                      {row.briefLabel.includes("Notion") ? "Notion" : "cited.md"} <Link className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-2.5 text-right text-slate-400">
                    <span className="flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" />
                      {row.timestamp.split(" ")[1] || row.timestamp}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                  No citations yet. Run a strike to generate audit traces.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
        <a href="/api/dashboard/cited" target="_blank" className="text-[10px] text-violet-600 font-semibold flex items-center gap-1">
          View cited.md <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
