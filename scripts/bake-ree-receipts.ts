/**
 * Bake Gensyn REE classification receipts via the Modal sidecar.
 *
 * Usage (from repo root, after `modal deploy` and REE_SERVICE_URL in .env):
 *   REE_SERVICE_URL=https://... npx tsx scripts/bake-ree-receipts.ts
 */

import fs from "fs";
import path from "path";
import { contentHash, saveCachedReceipt, type ReeReceiptCacheEntry } from "../src/lib/integrations/ree";

// Load .env manually (no dotenv dependency)
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const DEMO_THREATS = [
  {
    title: "Lululemon slashes UK Align pants pricing by 22% in mid-season flash sale",
    snippet:
      "Lululemon Athletica has launched an aggressive 48-hour promotional campaign across the UK, pricing flagship leggings at £58 (down from £78) with prominent Google search ads.",
    expected: { severity: "high" as const, category: "pricing" },
  },
  {
    title: "Nike UK launches 'Infinite Sweat' eco-engineered running sets at high premium",
    snippet:
      "Nike's London outlets are rolling out carbon-neutral functional training shirts using recycled ocean plastics, accompanied by heavy influencer endorsements.",
    expected: { severity: "medium" as const, category: "product_launch" },
  },
  {
    title: "ASOS 4505 launches £16 budget seamless gym legging duplicates on social media",
    snippet:
      "ASOS is aggressively expanding its activewear private label, releasing squat-proof seamless gym leggings at an entry price of £16, specifically targeting UK Gen-Z consumers on TikTok.",
    expected: { severity: "high" as const, category: "pricing" },
  },
  {
    title: "Lululemon announces UK-wide loyalty program with free next-day shipping",
    snippet:
      "Lululemon is testing a membership beta in major UK cities, offering free express delivery and priority access to limited edition drops, intensifying conversion competition.",
    expected: { severity: "medium" as const, category: "brand_campaign" },
  },
];

async function main() {
  const serviceUrl = process.env.REE_SERVICE_URL?.replace(/\/$/, "");
  if (!serviceUrl) {
    console.error("Set REE_SERVICE_URL in .env to your Modal deploy URL first.");
    process.exit(1);
  }

  console.log(`Baking receipts via ${serviceUrl}\n`);

  for (const threat of DEMO_THREATS) {
    const hash = contentHash(threat.title, threat.snippet);
    console.log(`→ ${threat.title.slice(0, 50)}... [${hash}]`);

    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: threat.title, snippet: threat.snippet }),
    });

    if (!res.ok) {
      console.error(`  FAILED: HTTP ${res.status}`);
      continue;
    }

    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      classification?: { severity: string; category: string; summary: string };
      receipt?: Record<string, unknown> | null;
      model?: string;
      raw_output?: string;
    };

    if (!data.ok || !data.classification) {
      console.error(`  FAILED: ${data.error || "no classification"}`);
      continue;
    }

    const entry: ReeReceiptCacheEntry = {
      content_hash: hash,
      title: threat.title,
      snippet: threat.snippet,
      classification: {
        severity: data.classification.severity as "high" | "medium" | "low",
        category: data.classification.category,
        summary: data.classification.summary,
      },
      model: data.model || process.env.REE_MODEL_NAME || "Qwen/Qwen3-8B",
      source: "ree_live",
      receipt: data.receipt ?? null,
      raw_output: data.raw_output,
      generated_at: new Date().toISOString(),
    };

    saveCachedReceipt(entry);
    console.log(`  OK — severity=${entry.classification.severity}, receipt=${data.receipt ? "yes" : "no"}`);
  }

  console.log("\nDone. Cached receipts saved to data/ree_receipts/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
