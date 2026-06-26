if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import fs from "fs";
import path from "path";
import { tavily } from "@tavily/core";
import { getTenantConfig, type TenantConfig } from "../tenant";
import { senso } from "../integrations/senso";
import { logAgentActivity } from "../agent-activity";

export interface BrandProduct {
  name: string;
  price_gbp: number | null;
  category: string;
  image_url: string;
  source_url: string;
}

export interface BrandContextSnapshot {
  tenant_id: string;
  display_name: string;
  domain: string;
  market: string;
  logo_url: string;
  positioning_summary: string;
  products: BrandProduct[];
  synced_at: string;
  source: "live" | "cache";
}

const CACHE_DIR = path.join(process.cwd(), "data", "brand_context_cache");

function cachePath(tenantId: string) {
  return path.join(CACHE_DIR, `${tenantId}.json`);
}

export function loadBrandContextCache(tenantId: string): BrandContextSnapshot | null {
  const file = cachePath(tenantId);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as BrandContextSnapshot;
  } catch {
    return null;
  }
}

function saveBrandContextCache(snapshot: BrandContextSnapshot) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath(snapshot.tenant_id), JSON.stringify(snapshot, null, 2), "utf8");
}

function extractPrice(text: string): number | null {
  const match = text.match(/£\s?(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
}

function isProductUrl(url: string, domain: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const brandHost = domain.replace(/^www\./, "");
    if (!host.endsWith(brandHost)) return false;
    return /\/products?\//i.test(url) || /\/p\//i.test(url) || /\/shop\//i.test(url);
  } catch {
    return false;
  }
}

async function fetchLogo(tenant: TenantConfig): Promise<string> {
  const homepage = `https://www.${tenant.domain.replace(/^www\./, "")}`;

  if (process.env.TAVILY_API_KEY) {
    try {
      const tv = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const extracted = await tv.extract([homepage], { includeFavicon: true, extractDepth: "basic" });
      const favicon = extracted.results[0]?.favicon;
      if (favicon) return favicon;
    } catch (e) {
      console.warn("[Brand Context] Tavily favicon extract failed:", e);
    }
  }

  return `https://www.google.com/s2/favicons?domain=${tenant.domain}&sz=128`;
}

async function fetchProducts(tenant: TenantConfig): Promise<BrandProduct[]> {
  if (!process.env.TAVILY_API_KEY) return [];

  const tv = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const domain = tenant.domain.replace(/^www\./, "");

  const response = await tv.search(
    `${tenant.display_name} latest new products shop`,
    {
      includeDomains: [domain, `www.${domain}`],
      maxResults: 10,
      includeImages: true,
      includeImageDescriptions: true,
      searchDepth: "advanced",
    }
  );

  const products: BrandProduct[] = [];
  const seen = new Set<string>();

  for (const result of response.results) {
    if (!isProductUrl(result.url, domain)) continue;
    if (seen.has(result.url)) continue;
    seen.add(result.url);

    const matchedImage = response.images?.find((img) =>
      img.description?.toLowerCase().includes(result.title.toLowerCase().split(" ")[0] ?? "")
    );

    products.push({
      name: result.title.replace(/\s*\|.*$/, "").trim(),
      price_gbp: extractPrice(`${result.content} ${result.title}`),
      category: "Product",
      image_url: matchedImage?.url || response.images?.[products.length]?.url || result.favicon || "",
      source_url: result.url,
    });

    if (products.length >= 4) break;
  }

  if (products.length < 4 && response.images?.length) {
    for (const img of response.images) {
      if (products.length >= 4) break;
      if (products.some((p) => p.image_url === img.url)) continue;
      products.push({
        name: img.description?.slice(0, 60) || `${tenant.display_name} product`,
        price_gbp: null,
        category: "Featured",
        image_url: img.url,
        source_url: `https://www.${domain}`,
      });
    }
  }

  return products.slice(0, 4);
}

/**
 * Brand Context Agent — dynamically ingests logo, products, and positioning
 * for any configured tenant using Tavily + Senso. No per-brand hardcoding.
 */
export async function executeBrandContextSync(tenantId: string): Promise<BrandContextSnapshot> {
  const tenant = getTenantConfig(tenantId);

  await logAgentActivity({
    tenant_id: tenantId,
    agent: "system",
    message: `Brand Context Agent syncing live data for ${tenant.display_name}`,
    status: "running",
  });

  const [logo_url, products, facts] = await Promise.all([
    fetchLogo(tenant),
    fetchProducts(tenant),
    senso.queryKnowledgeBase(tenantId, "brand positioning products USP", 5),
  ]);

  const positioningFact = facts.find((f) => f.category === "positioning") || facts[0];
  const positioning_summary = positioningFact
    ? positioningFact.content
    : `${tenant.display_name} operates in ${tenant.market}. Competitive intelligence is active across ${tenant.competitors.length} rivals.`;

  const snapshot: BrandContextSnapshot = {
    tenant_id: tenantId,
    display_name: tenant.display_name,
    domain: tenant.domain,
    market: tenant.market,
    logo_url,
    positioning_summary,
    products,
    synced_at: new Date().toISOString(),
    source: process.env.TAVILY_API_KEY ? "live" : "cache",
  };

  saveBrandContextCache(snapshot);

  await logAgentActivity({
    tenant_id: tenantId,
    agent: "system",
    message: `Brand context ready — ${products.length} products, logo resolved, Senso positioning loaded`,
    status: "success",
    meta: { products: products.length },
  });

  return snapshot;
}

export function getBrandContext(tenantId: string): BrandContextSnapshot {
  const cached = loadBrandContextCache(tenantId);
  if (cached) return cached;

  const tenant = getTenantConfig(tenantId);
  return {
    tenant_id: tenantId,
    display_name: tenant.display_name,
    domain: tenant.domain,
    market: tenant.market,
    logo_url: `https://www.google.com/s2/favicons?domain=${tenant.domain}&sz=128`,
    positioning_summary: `Loading brand context for ${tenant.display_name}…`,
    products: [],
    synced_at: new Date(0).toISOString(),
    source: "cache",
  };
}
