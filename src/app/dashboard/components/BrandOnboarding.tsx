"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

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
  const [selected, setSelected] = useState<string>("gymshark");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/tenants")
      .then((r) => r.json())
      .then((data) => {
        setTenants(data.tenants || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/set-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: selected }),
      });
      localStorage.setItem("brandcompete_onboarded", "true");
      localStorage.setItem("brandcompete_tenant", selected);
      onComplete(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
              BrandCompete
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome to your competitive command centre
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Select the brand you want to protect. Our agents will monitor competitors, reason over your positioning, and publish counter-campaigns.
          </p>
        </div>

        <div className="bc-panel-elevated rounded-3xl p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Choose your brand
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tenants.map((tenant) => {
                const isSelected = selected === tenant.id;
                return (
                  <button
                    key={tenant.id}
                    onClick={() => setSelected(tenant.id)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      {tenant.logo_url ? (
                        <img
                          src={tenant.logo_url}
                          alt={tenant.display_name}
                          className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-100 p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{tenant.display_name}</p>
                        <p className="text-xs text-slate-400">{tenant.market}</p>
                      </div>
                    </div>
                    {tenant.id === "gymshark" && (
                      <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        Demo ready
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={submitting || !selected}
            className="mt-8 w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enter dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          You can switch brands anytime from the dashboard header.
        </p>
      </div>
    </div>
  );
}
