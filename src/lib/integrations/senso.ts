import fs from "fs";
import path from "path";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface SensoFact {
  id: string;
  tenant_id: string;
  category: "usp" | "product_line" | "brand_voice" | "positioning";
  topic: string;
  content: string;
}

const SENSO_KB_PATH = path.join(process.cwd(), "data", "senso_kb.json");

// Ensure data directory and load facts helper
function loadSensoKb(): SensoFact[] {
  const dir = path.dirname(SENSO_KB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(SENSO_KB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SENSO_KB_PATH, "utf8"));
    } catch {
      // Return empty if corrupted
    }
  }

  const defaults = getPreCodedGymsharkFacts();
  saveSensoKb(defaults);
  return defaults;
}

function saveSensoKb(facts: SensoFact[]) {
  const dir = path.dirname(SENSO_KB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SENSO_KB_PATH, JSON.stringify(facts, null, 2), "utf8");
}

class SensoClient {
  private isFallback: boolean = true;

  constructor() {
    if (process.env.SENSO_API_KEY) {
      this.isFallback = false;
      console.log("[Senso.ai] Real client initialized.");
    } else {
      console.log("[Senso.ai] Operating in JSON Local Fallback mode.");
      this.isFallback = true;
    }
  }

  // Seed the KB for a specific tenant
  async seedKnowledgeBase(tenantId: string, facts: Omit<SensoFact, "id" | "tenant_id">[]) {
    const existingFacts = loadSensoKb();
    
    // Clear existing for this tenant to avoid infinite appends on re-runs
    const filtered = existingFacts.filter((f) => f.tenant_id !== tenantId);

    const newFacts: SensoFact[] = facts.map((f, i) => ({
      id: `fact_${tenantId}_${i}`,
      tenant_id: tenantId,
      ...f,
    }));

    const merged = [...filtered, ...newFacts];
    saveSensoKb(merged);
    console.log(`[Senso.ai] Seeded ${newFacts.length} facts for tenant "${tenantId}".`);
  }

  // Queries the brand's KB using semantic/keyword similarity
  async queryKnowledgeBase(tenantId: string, queryText: string, limit: number = 3): Promise<SensoFact[]> {
    const allFacts = loadSensoKb();
    const tenantFacts = allFacts.filter((f) => f.tenant_id === tenantId);

    if (!process.env.SENSO_API_KEY) {
      // Local fallback heuristic search (word match similarity)
      const queryWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      const scoredFacts = tenantFacts.map((fact) => {
        const contentLower = `${fact.topic} ${fact.content}`.toLowerCase();
        let score = 0;
        
        queryWords.forEach((word) => {
          if (contentLower.includes(word)) {
            score += 1;
          }
        });
        
        return { fact, score };
      });

      return scoredFacts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.fact);
    }

    // Real API query simulation/call if API key is provided
    try {
      const response = await fetch("https://api.senso.ai/v1/kb/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SENSO_API_KEY}`,
        },
        body: JSON.stringify({ query: queryText, tenant_id: tenantId, limit }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error("[Senso.ai] Live query failed, falling back to keyword search.", e);
    }

    return tenantFacts.slice(0, limit);
  }
}

function getPreCodedGymsharkFacts(): SensoFact[] {
  const tenantId = "gymshark";
  const facts: Omit<SensoFact, "id" | "tenant_id">[] = [
    {
      category: "usp",
      topic: "Multi-buy Value Bundles",
      content: "Gymshark offers unmatched value via high-quality multi-buy bundles (e.g. 2 training shorts for £35 or 2 seamless leggings for £60). This is our most effective competitive pricing counter-strike.",
    },
    {
      category: "usp",
      topic: "Inclusivity & Accessibility",
      content: "Gymshark values fitness as a lifestyle accessible to everyone, not just luxury elites. Gymshark pricing remains accessible (£20-£50 range) while matching premium apparel engineering and performance standards.",
    },
    {
      category: "product_line",
      topic: "Adapt & Seamless Ranges",
      content: "Our flagship seamless technology (Adapt Seamless, Vital Seamless) provides squat-proof leg support, moisture-wicking yarns, and sweat-absorption. Highly popular with UK powerlifters and functional trainers.",
    },
    {
      category: "brand_voice",
      topic: "Bold, Authentic, Community-Centric",
      content: "The Gymshark brand voice is bold, authentic, raw, and deeply connected to gym culture and athlete communities. We use relatable gym humor, straight-forward claims, and bold declarations.",
    },
    {
      category: "positioning",
      topic: "The Working Athlete",
      content: "Gymshark is positioned as the gear of the everyday dedicated gymgoer - the working athlete. Unlike luxury activewear brands (e.g. Lululemon) focusing on wellness/yoga, Gymshark focuses on weightlifting, heavy workouts, and performance community.",
    }
  ];

  return facts.map((f, i) => ({
    id: `fact_${tenantId}_${i}`,
    tenant_id: tenantId,
    ...f,
  }));
}

export const senso = new SensoClient();
