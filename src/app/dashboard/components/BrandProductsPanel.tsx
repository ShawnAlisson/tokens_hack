"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

interface Product {
  name: string;
  price_gbp: number;
  category: string;
  image_url: string;
}

export default function BrandProductsPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading || products.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-semibold text-slate-700">Latest Products</span>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            {products.length} items
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 grid grid-cols-2 gap-2 animate-fade-in">
          {products.map((product) => (
            <div
              key={product.name}
              className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-slate-100 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x400/F5F3EF/64748B?text=${encodeURIComponent(product.category)}`;
                  }}
                />
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">{product.category}</p>
                <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">{product.name}</p>
                <p className="text-sm font-bold text-slate-900 mt-1">£{product.price_gbp}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
