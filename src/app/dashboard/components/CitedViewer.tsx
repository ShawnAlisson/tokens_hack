"use client";

import { useEffect, useState } from "react";
import { ListTodo, FileText, Link, Calendar, ArrowRight, BookOpen } from "lucide-react";

interface CitationRow {
  eventText: string;
  eventUrl: string;
  strategy: string;
  notionUrl: string;
  timestamp: string;
}

export default function CitedViewer({ refreshTrigger }: { refreshTrigger: number }) {
  const [citations, setCitations] = useState<CitationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCitations() {
      try {
        const res = await fetch("/api/dashboard/cited");
        if (res.ok) {
          const data = await res.json();
          const markdown = data.markdown || "";
          
          // Custom fast, lightweight Markdown table parser
          const lines = markdown.split("\n");
          const parsedRows: CitationRow[] = [];

          for (const line of lines) {
            // Filter out headers, dividers and empty lines
            if (!line.trim() || line.includes("Competitor Counter-Strike") || line.includes("This file tracks") || line.includes("Competitor Event |") || line.includes("|---|")) {
              continue;
            }

            // Split table row columns
            const cols = line.split("|").map((c: string) => c.trim()).filter((_: string, idx: number, arr: string[]) => idx > 0 && idx < arr.length - 1);
            if (cols.length >= 4) {
              const eventCol = cols[0];
              const strategyCol = cols[1];
              const notionCol = cols[2];
              const timestampCol = cols[3];

              // Parse event Markdown link: [Text](URL)
              let eventText = eventCol;
              let eventUrl = "#";
              const eventLinkMatch = eventCol.match(/\[(.*?)\]\((.*?)\)/);
              if (eventLinkMatch) {
                eventText = eventLinkMatch[1];
                eventUrl = eventLinkMatch[2];
              }

              // Parse notion Markdown link: [Text](URL)
              let notionUrl = "#";
              const notionLinkMatch = notionCol.match(/\[(.*?)\]\((.*?)\)/);
              if (notionLinkMatch) {
                notionUrl = notionLinkMatch[2];
              }

              parsedRows.push({
                eventText,
                eventUrl,
                strategy: strategyCol,
                notionUrl,
                timestamp: timestampCol
              });
            }
          }

          // Sort citations in reverse chronological order
          setCitations(parsedRows.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch citations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCitations();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-[280px] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <h3 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500" /> Grounding Provenance Traces
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable ledger mapping web-alert sources directly to published counter briefs.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="pb-2">Trigger Event Source</th>
                <th className="pb-2">Strategic Stance</th>
                <th className="pb-2">Target Brief</th>
                <th className="pb-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {citations.length > 0 ? (
                citations.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="text-xs hover:bg-white/[1%] transition-colors group">
                    <td className="py-3 pr-4 max-w-[220px]">
                      <a 
                        href={row.eventUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-slate-300 hover:text-cyan-400 font-medium transition-colors flex items-center gap-1.5 line-clamp-1 group-hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        {row.eventText}
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-purple-400 font-semibold">{row.strategy}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <a 
                        href={row.notionUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold uppercase text-[10px] tracking-wider"
                      >
                        Notion Page <Link className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 text-right text-slate-500 font-medium whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {row.timestamp.split(" ")[1] || row.timestamp}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    No active citations listed in cited.md. Run a demo strike to generate traces.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-medium">Click links to audit raw Web source parameters</span>
        <a 
          href="/api/dashboard/cited"
          target="_blank"
          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
        >
          View raw cited.md <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
