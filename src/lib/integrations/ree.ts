import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { ClassifiedEventOutput } from "./gemini";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export type ClassificationSource = "ree_live" | "ree_cached" | "gemini" | "heuristic";

export interface ReeReceiptCacheEntry {
  content_hash: string;
  title: string;
  snippet: string;
  classification: ClassifiedEventOutput;
  model: string;
  source: "ree_cached" | "ree_live" | "demo_seed";
  receipt: Record<string, unknown> | null;
  raw_output?: string;
  generated_at: string;
  seeded?: boolean;
}

export interface ClassificationResult extends ClassifiedEventOutput {
  source: ClassificationSource;
  ree_receipt_hash?: string;
  ree_model?: string;
}

const RECEIPTS_DIR = path.join(process.cwd(), "data", "ree_receipts");

export function contentHash(title: string, snippet: string): string {
  return crypto
    .createHash("sha256")
    .update(`${title.trim()}|${snippet.trim()}`)
    .digest("hex")
    .slice(0, 16);
}

export function buildClassificationPrompt(title: string, snippet: string): string {
  return `You are an expert market intelligence classifier for retail brand analysts.
Analyze the following competitor news/event:
Title: "${title}"
Snippet: "${snippet}"

Perform the following classification task:
1. "severity": Rate the competitive threat level to an activewear brand as:
   - "high": Direct, aggressive price cuts, direct hostile promotions, or high-impact product releases.
   - "medium": Moderate changes, general brand expansions, standard campaigns.
   - "low": Minor news, small sponsorships, generic corporate announcements.
2. "category": Choose one of: "pricing", "product_launch", "influencer_partnership", "logistics_issue", "brand_campaign".
3. "summary": Create a concise, professional 2-sentence summary.

Return ONLY a raw JSON object with this schema:
{
  "severity": "high" | "medium" | "low",
  "category": string,
  "summary": string
}`;
}

function ensureReceiptsDir() {
  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  }
}

function receiptPath(hash: string): string {
  return path.join(RECEIPTS_DIR, `${hash}.json`);
}

export function loadCachedReceipt(title: string, snippet: string): ReeReceiptCacheEntry | null {
  ensureReceiptsDir();
  const hash = contentHash(title, snippet);
  const filePath = receiptPath(hash);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as ReeReceiptCacheEntry;
  } catch {
    return null;
  }
}

export function saveCachedReceipt(entry: ReeReceiptCacheEntry): void {
  ensureReceiptsDir();
  fs.writeFileSync(receiptPath(entry.content_hash), JSON.stringify(entry, null, 2), "utf8");
}

export function getReceiptByHash(hash: string): ReeReceiptCacheEntry | null {
  const filePath = receiptPath(hash);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as ReeReceiptCacheEntry;
  } catch {
    return null;
  }
}

function parseClassificationJson(rawText: string): ClassifiedEventOutput | null {
  let text = rawText.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    text = fence[1].trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return null;
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as ClassifiedEventOutput;
    if (!["high", "medium", "low"].includes(parsed.severity)) {
      return null;
    }
    return {
      severity: parsed.severity,
      category: parsed.category || "brand_campaign",
      summary: parsed.summary || "",
    };
  } catch {
    return null;
  }
}

function cacheEntryToResult(entry: ReeReceiptCacheEntry): ClassificationResult {
  return {
    ...entry.classification,
    source: entry.source === "demo_seed" ? "ree_cached" : entry.source,
    ree_receipt_hash: entry.content_hash,
    ree_model: entry.model,
  };
}

export async function classifyWithReeLive(
  title: string,
  snippet: string
): Promise<ClassificationResult | null> {
  const serviceUrl = process.env.REE_SERVICE_URL?.replace(/\/$/, "");
  if (!serviceUrl) {
    return null;
  }

  const timeoutMs = Number(process.env.REE_REQUEST_TIMEOUT_MS || "300000");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, snippet }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[REE] Modal classify failed: HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      classification?: ClassifiedEventOutput;
      receipt?: Record<string, unknown> | null;
      model?: string;
      raw_output?: string;
    };

    if (!data.ok || !data.classification) {
      console.warn("[REE] Modal classify error:", data.error || "unknown");
      return null;
    }

    const hash = contentHash(title, snippet);
    const cacheEntry: ReeReceiptCacheEntry = {
      content_hash: hash,
      title,
      snippet,
      classification: data.classification,
      model: data.model || process.env.REE_MODEL_NAME || "Qwen/Qwen3-8B",
      source: "ree_live",
      receipt: data.receipt ?? null,
      raw_output: data.raw_output,
      generated_at: new Date().toISOString(),
    };
    saveCachedReceipt(cacheEntry);

    return {
      ...data.classification,
      source: "ree_live",
      ree_receipt_hash: hash,
      ree_model: cacheEntry.model,
    };
  } catch (e) {
    console.warn("[REE] Modal classify request failed, falling back.", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function classifyWithReeCache(title: string, snippet: string): ClassificationResult | null {
  const cached = loadCachedReceipt(title, snippet);
  if (!cached) {
    return null;
  }
  console.log(`[REE] Serving cached receipt for hash ${cached.content_hash}`);
  return cacheEntryToResult(cached);
}
