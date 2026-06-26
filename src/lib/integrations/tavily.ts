import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { tavily } from "@tavily/core";
import { type TenantConfig, type Competitor } from "../tenant";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface IngestedRawEvent {
  title: string;
  url: string;
  snippet: string;
  score: number;
  competitor: string;
  source_type: "pricing" | "launch" | "mention" | "trend" | "comparison";
}

// Ensure snapshot directory exists for a tenant
export function getSnapshotDirectory(tenantId: string): string {
  const dir = path.join(process.cwd(), "data", "snapshots", tenantId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Load Tavily query profile templates from config/tavily_profiles.yaml
export function loadTavilyProfiles(): any {
  const profilePath = path.join(process.cwd(), "config", "tavily_profiles.yaml");
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Tavily profiles file not found at: ${profilePath}`);
  }
  const fileContents = fs.readFileSync(profilePath, "utf8");
  const data = yaml.load(fileContents) as any;
  return data.profiles;
}

/**
 * Executes a full competitor analysis search across the open web.
 * Uses Tavily if TAVILY_API_KEY is defined and TAVILY_USE_CACHE is not 'true'.
 * Otherwise, falls back to loading the latest pre-saved snapshot for this tenant.
 */
export async function runTenantSweep(tenant: TenantConfig): Promise<IngestedRawEvent[]> {
  const useCache = process.env.TAVILY_USE_CACHE === "true" || !process.env.TAVILY_API_KEY;

  if (useCache) {
    console.log(`[Tavily] Operating in CACHED mode for tenant "${tenant.id}". Reading from snapshots...`);
    return loadLatestSnapshot(tenant.id);
  }

  console.log(`[Tavily] Operating in LIVE API mode for tenant "${tenant.id}". Triggering Tavily OmniSearch...`);
  
  try {
    const profiles = loadTavilyProfiles();
    const results: IngestedRawEvent[] = [];
    
    const tv = tavily({ apiKey: process.env.TAVILY_API_KEY });

    // Loop through competitors and search profiles
    for (const competitor of tenant.competitors) {
      for (const profileKey of tenant.tavily_search_profiles) {
        const profile = profiles[profileKey];
        if (!profile) continue;

        // Build search query using template
        let query = profile.query_template
          .replace(/{brand_name}/g, tenant.display_name)
          .replace(/{competitor_name}/g, competitor.name)
          .replace(/{market}/g, tenant.market);

        // Map profiles to source_types
        let sourceType: IngestedRawEvent["source_type"] = "mention";
        if (profileKey === "competitor_pricing") sourceType = "pricing";
        else if (profileKey === "competitor_launches") sourceType = "launch";
        else if (profileKey === "market_trends") sourceType = "trend";
        else if (profileKey === "comparison_content") sourceType = "comparison";

        console.log(`[Tavily] Searching "${competitor.name}" | Profile: ${profileKey} | Query: "${query}"`);

        try {
          const response = await tv.search(query, {
            searchDepth: profile.search_depth || "advanced",
            days: profile.days_back || 7,
            maxResults: 5,
          });

          if (response.results && Array.isArray(response.results)) {
            response.results.forEach((r: any) => {
              results.push({
                title: r.title || "No Title",
                url: r.url || "",
                snippet: r.content || r.snippet || "",
                score: r.score || 0.5,
                competitor: competitor.name,
                source_type: sourceType,
              });
            });
          }
        } catch (searchError) {
          console.error(`[Tavily] Search failed for query: ${query}`, searchError);
        }
      }
    }

    // Deduplicate results by URL
    const uniqueMap = new Map<string, IngestedRawEvent>();
    results.forEach((item) => {
      if (item.url && !uniqueMap.has(item.url)) {
        uniqueMap.set(item.url, item);
      }
    });

    const uniqueResults = Array.from(uniqueMap.values());
    console.log(`[Tavily] Ingested ${uniqueResults.length} unique live competitor events.`);

    // Write results to a new snapshot file for later demo use (E)
    saveSnapshot(tenant.id, uniqueResults);

    return uniqueResults;
  } catch (error) {
    console.error("[Tavily] Live sweep failed, checking for cached snapshot fallback...", error);
    return loadLatestSnapshot(tenant.id);
  }
}

// Saves ingested records as an offline JSON snapshot
export function saveSnapshot(tenantId: string, events: IngestedRawEvent[]) {
  const dir = getSnapshotDirectory(tenantId);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${dateStr}_sweep.json`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(events, null, 2), "utf8");
  console.log(`[Tavily] Saved snapshot of ${events.length} events to ${filePath}`);

  // Update manifest.json in the snapshot folder
  const manifestPath = path.join(dir, "manifest.json");
  const manifest = {
    last_updated: new Date().toISOString(),
    latest_snapshot: filename,
    event_count: events.length,
    mode: "cached",
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

// Loads the latest offline JSON snapshot for a given tenant
export function loadLatestSnapshot(tenantId: string): IngestedRawEvent[] {
  const dir = getSnapshotDirectory(tenantId);
  const manifestPath = path.join(dir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.warn(`[Tavily] No snapshot manifest.json found for tenant: ${tenantId}. Returning mock records.`);
    return getPreCodedDemoEvents(tenantId);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const snapshotPath = path.join(dir, manifest.latest_snapshot);
    if (fs.existsSync(snapshotPath)) {
      const data = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as IngestedRawEvent[];
      console.log(`[Tavily] Loaded ${data.length} events from cached snapshot: ${manifest.latest_snapshot}`);
      return data;
    }
  } catch (e) {
    console.error("[Tavily] Failed to parse snapshot manifest or file, falling back to mock.", e);
  }

  return getPreCodedDemoEvents(tenantId);
}

// Returns robust offline mock events if no manifest or snapshot file exists on disk
function getPreCodedDemoEvents(tenantId: string): IngestedRawEvent[] {
  console.log(`[Tavily] Returning pre-coded offline demo events for "${tenantId}".`);
  return [
    {
      title: "Lululemon slashes Align leggings pricing by 15% across UK e-commerce",
      url: "https://www.lululemon.co.uk/en-gb/p/align-high-rise-pant-25/prod10480023.html",
      snippet: "Lululemon has updated their price points for the signature Align legging line in the UK from £88 to £74.80. This unexpected discount is being promoted on several activewear comparison blogs.",
      score: 0.92,
      competitor: "Lululemon",
      source_type: "pricing",
    },
    {
      title: "Lululemon launches bio-nylon premium clothing range in London flagship stores",
      url: "https://www.retailgazette.co.uk/blog/2026/06/lululemon-bio-nylon/",
      snippet: "Lululemon Athletica is rolling out an eco-friendly bio-synthetic clothing capsule across selected London stores using 100% plant-based nylons, directly challenging competitor eco-campaigns.",
      score: 0.88,
      competitor: "Lululemon",
      source_type: "launch",
    },
    {
      title: "Nike UK launches 48-hour flash sale with up to 40% off Training Gear",
      url: "https://www.nike.com/uk/w/mens-sale-gym-training-37v78z5e1x6z5e1x",
      snippet: "Nike UK has launched a high-impact summer training flash sale. Running shorts, moisture-wicking tees, and training shoes are heavily discounted.",
      score: 0.94,
      competitor: "Nike",
      source_type: "pricing",
    },
    {
      title: "ASOS 4505 private-label activewear expanded with £18 budget gym leggings",
      url: "https://www.asos.com/women/activewear/asos-4505-activewear-launch",
      snippet: "ASOS expands its budget activewear collection, ASOS 4505. They are launching seamless high-rise leggings at £18, targeted directly at Gen-Z social media users.",
      score: 0.82,
      competitor: "ASOS",
      source_type: "comparison",
    },
  ];
}
