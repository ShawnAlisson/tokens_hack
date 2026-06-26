"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react";

interface TenantSummary {
  id: string;
  display_name: string;
  domain: string;
  logo_url: string;
  market: string;
}

interface BrandOnboardingProps {
  onComplete: (tenantId: string) => void;
}

export default function BrandOnboarding({ onComplete }: BrandOnboardingProps) {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [query, setQuery] = useState("Gymshark");
  const [selected, setSelected] = useState<TenantSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/tenants")
      .then((r) => r.json())
      .then((data) => {
        const list: TenantSummary[] = data.tenants || [];
        setTenants(list);
        const gymshark = list.find((t) => t.id === "gymshark") || list[0];
        if (gymshark) {
          setSelected(gymshark);
          setQuery(gymshark.display_name);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.display_name.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.market.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [query, tenants]);

  const handleSelect = (tenant: TenantSummary) => {
    setSelected(tenant);
    setQuery(tenant.display_name);
    setShowResults(false);
  };

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/set-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: selected.id }),
      });
      localStorage.setItem("brandcompete_onboarded", "true");
      localStorage.setItem("brandcompete_tenant", selected.id);
      onComplete(selected.id);
    } finally {
      setSubmitting(false);
    }
  };

  const logoSrc = (url: string) =>
    url ? `/api/dashboard/media?url=${encodeURIComponent(url)}` : "";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
              BrandCompete
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Which brand are you protecting?
          </h1>
          <p className="text-sm text-slate-500">
            Search any configured brand. Agents will dynamically load its context, products, and competitors.
          </p>
        </div>

        <div className="bc-panel-elevated rounded-2xl p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search brands… e.g. Gymshark"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />

            {showResults && !loading && filtered.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bc-panel-elevated rounded-xl py-1 max-h-48 overflow-y-auto">
                {filtered.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleSelect(tenant)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      selected?.id === tenant.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <img
                      src={logoSrc(tenant.logo_url)}
                      alt=""
                      className="w-7 h-7 object-contain rounded"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{tenant.display_name}</p>
                      <p className="text-xs text-slate-400">{tenant.domain} · {tenant.market}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
              <img
                src={logoSrc(selected.logo_url)}
                alt={selected.display_name}
                className="w-10 h-10 object-contain rounded-lg bg-white border border-teal-100 p-1"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div>
                <p className="font-bold text-teal-900">{selected.display_name}</p>
                <p className="text-xs text-teal-700">{selected.market}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={submitting || !selected}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Activate agents for {selected?.display_name ?? "brand"} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
