// scripts/seed-senso.ts
import { senso, type SensoFact } from "../src/lib/integrations/senso";

console.log("=== Seeding Senso.ai Brand Knowledge Base ===");

const TENANT_ID = "gymshark";

const GYMSHARK_FACTS: Omit<SensoFact, "id" | "tenant_id">[] = [
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

async function main() {
  try {
    await senso.seedKnowledgeBase(TENANT_ID, GYMSHARK_FACTS);
    console.log("[SUCCESS] Successfully seeded brand facts in Senso Knowledge Base!");
  } catch (error) {
    console.error("[ERROR] Failed to seed Senso:", error);
    process.exit(1);
  }
}

main();
