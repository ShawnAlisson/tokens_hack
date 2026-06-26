"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Loader2, Package, RefreshCw } from "lucide-react";
import BrandInsightPanel from "./BrandInsightPanel";

interface Product {
  name: string;
  price_gbp: number | null;
  category: string;
  image_url: string;
  source_url?: string;
}

function mediaUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("/api/")) return url;
  return `/api/dashboard/media?url=${encodeURIComponent(url)}`;
}

export default function BrandContextPanel({
  refreshTrigger,
  syncing,
  onResync,
}: {
  refreshTrigger: number;
  syncing?: boolean;
  onResync?: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [productsExpanded, setProductsExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/dashboard/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setSource(data.source || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshTrigger]);

  return (
    <div className="bc-panel rounded-2xl p-5 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "var(--font-heading)" }}>
            Brand Context
          </h2>
          <p className="text-xs text-slate-500">
            Dynamically loaded by Brand Context Agent {source === "live" ? "(live)" : ""}
          </p>
        </div>
        {onResync && (
          <button
            onClick={onResync}
            disabled={syncing}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50"
            title="Re-sync brand context"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <BrandInsightPanel refreshTrigger={refreshTrigger} />

      <div>
        <button
          onClick={() => setProductsExpanded(!productsExpanded)}
          className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-slate-700">Latest Products</span>
            {products.length > 0 && (
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            )}
            {syncing && <Loader2 className="w-3 h-3 text-teal-600 animate-spin" />}
          </div>
          {productsExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {productsExpanded && (
          <div className="mt-2">
            {loading || syncing ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 aspect-square animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                {products.map((product) => (
                  <a
                    key={product.source_url || product.name}
                    href={product.source_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      {product.image_url ? (
                        <img
                          src={mediaUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const domain = product.source_url ? new URL(product.source_url).hostname : "example.com";
                            e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No image</div>
                      )}
                      <span className="absolute top-1.5 right-1.5 p-1 bg-white/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-teal-600">{product.category}</p>
                      <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
                      {product.price_gbp != null && (
                        <p className="text-sm font-bold text-slate-900 mt-0.5">£{product.price_gbp}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                Agents are fetching products from the brand website…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
