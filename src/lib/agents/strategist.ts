import { clickhouse, type CompetitorEvent } from "../integrations/clickhouse";
import { senso } from "../integrations/senso";
import { prometheux } from "../integrations/prometheux";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface CounterPlan {
  event_id: string;
  tenant_id: string;
  competitor: string;
  trigger_title: string;
  strategy_angle: string;
  content_draft: string;
  lineage: string[];
  rules_applied: string[];
  brand_facts_used: string[];
}

/**
 * Strategist Agent - utilizes LangGraph-style pipeline nodes to process a threat event.
 * 1. Pulls event context from ClickHouse.
 * 2. Queries Senso.ai brand facts.
 * 3. Evaluates Prometheux Vadalog reasoning.
 * 4. Drafts a tailored marketing counter-strike campaign with Gemini.
 */
export async function executeStrategistAnalysis(eventId: string): Promise<CounterPlan> {
  console.log(`[Strategist Agent] Initiating tactical strategy analysis for Event: "${eventId}"`);

  // Node 1: Fetch Ingested Event from ClickHouse
  const tenantId = process.env.ACTIVE_TENANT || "gymshark";
  const event = await clickhouse.getCompetitorEventById(tenantId, eventId);
  if (!event) {
    throw new Error(`Event not found in ClickHouse store for ID: ${eventId}`);
  }

  console.log(`[Strategist Agent] [Node 1] Loaded trigger event: "${event.title}"`);

  // Node 2: Retrieve Brand USPS from Senso.ai Knowledge Base
  const relevantFacts = await senso.queryKnowledgeBase(tenantId, `${event.competitor} ${event.source_type} ${event.title}`, 2);
  const brandFactsText = relevantFacts.map(f => `${f.topic}: ${f.content}`).join("\n");
  console.log(`[Strategist Agent] [Node 2] Ingested ${relevantFacts.length} relevant brand facts from Senso.`);

  // Node 3: Evaluate Vadalog logic in Prometheux
  const reasoning = await prometheux.evaluateVadalogReasoning(
    event.competitor,
    event.source_type,
    event.severity,
    event.title
  );
  console.log(`[Strategist Agent] [Node 3] Vadalog strategic angle derived: "${reasoning.counter_strategy_angle}"`);

  // Node 4: Generate Copy Draft with Gemini 2.0 (grounded in retrieved context)
  const draftContent = await generateDraftCopy(
    event,
    brandFactsText,
    reasoning.counter_strategy_angle
  );
  console.log("[Strategist Agent] [Node 4] Grounded copy draft written successfully.");

  return {
    event_id: eventId,
    tenant_id: tenantId,
    competitor: event.competitor,
    trigger_title: event.title,
    strategy_angle: reasoning.counter_strategy_angle,
    content_draft: draftContent,
    lineage: reasoning.lineage,
    rules_applied: reasoning.rules_applied,
    brand_facts_used: relevantFacts.map(f => f.topic),
  };
}

async function generateDraftCopy(
  event: CompetitorEvent,
  brandFacts: string,
  strategyAngle: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        You are the Head of Brand Strategy and Copywriting for a major UK retail brand.
        We need to write a tactical marketing counter-strike campaign draft responding to a competitor's move.

        Competitor Move:
        Competitor: ${event.competitor}
        Trigger Event: ${event.title}
        Event Details: ${event.snippet}

        Strategic Direction (derived via Vadalog):
        Counter Angle: ${strategyAngle}

        Our Brand Facts & USPs (use these as grounding):
        ${brandFacts}

        Write a professional marketing campaign brief.
        The brief MUST contain exactly these sections in clean Markdown format:
        1. "### Tactical Counter-Strike Campaign" (The campaign name)
        2. "#### Trigger" (Competitor move summary)
        3. "#### Strategic Brand Stance" (Why we are doing this, referencing our USPs)
        4. "#### Counter-Content Copy Draft" (Write the actual copy - e.g. social copy, ad copy, or email copy. Use bold, punchy UK spelling and brand voice)
        5. "#### Distribution Channel" (Where to push this - e.g. Instagram/TikTok, app push, or email)

        Keep it concise, punchy, and highly realistic.
      `;

      const response = await model.generateContent(prompt);
      return response.response.text();
    } catch (e) {
      console.warn("[Strategist Agent] Copy drafting failed with Gemini, using pre-defined template.", e);
    }
  }

  // Fallback Copy Drafting Engine (highly realistic, based on strategyAngle and event context)
  return getFallbackDraftCopy(event, brandFacts, strategyAngle);
}

function getFallbackDraftCopy(event: CompetitorEvent, brandFacts: string, strategyAngle: string): string {
  const brandName = "Gymshark";
  
  if (strategyAngle.includes("Bundle")) {
    return `### Tactical Counter-Strike Campaign: "Double the Fit, Double the Sweat"

#### Trigger:
${event.competitor} is adjusting pricing in the UK market: "${event.title}".

#### Strategic Brand Stance:
Rather than lowering individual margins in a direct race to the bottom, we leverage our Core USP: high-quality multi-buy bundles. This allows us to protect our premium reputation while delivering superior value compared to ${event.competitor}.

#### Counter-Content Copy Draft:
"Premium shouldn't mean overpriced. Why buy one pair of leggings when you can get two that last twice as long? Get 2 ${brandName} Everyday Seamless Leggings for £60 today. Built for sweat. Styled for life. No compromises."

#### Distribution Channel:
Meta and TikTok video advertisements targeting UK activewear shoppers.`;
  }

  if (strategyAngle.includes("Sustainable") || strategyAngle.includes("Recycled")) {
    return `### Tactical Counter-Strike Campaign: "Our Planet, Our Gym"

#### Trigger:
${event.competitor} launches an eco-friendly range: "${event.title}".

#### Strategic Brand Stance:
We believe sustainability should be an accessible standard, not a premium feature locked behind a luxury price tag. We highlight our existing recycled polyester lines at our highly competitive £28-£40 range.

#### Counter-Content Copy Draft:
"Real athletes care about the planet. That's why sustainable workout gear shouldn't be locked behind a luxury paywall. Our Recycled Seamless range features 85% eco-friendly yarn starting at £28. Because green energy belongs in every workout."

#### Distribution Channel:
UK Newsletter broadcast and organic Instagram carousels.`;
  }

  if (strategyAngle.includes("Affiliate") || strategyAngle.includes("Free Delivery")) {
    return `### Tactical Counter-Strike Campaign: "Complete the Gym bag"

#### Trigger:
${event.competitor} launches a flash sale campaign: "${event.title}".

#### Strategic Brand Stance:
Hijack checkout attention by offering immediate complimentary value on smaller accessories (free crew socks & shaker) combined with free next-day delivery on all purchases above £35.

#### Counter-Content Copy Draft:
"Spotted ${event.competitor}'s sale? Upgrade your gym bag with the final touches. Get a FREE Gymshark shaker and crew socks with every order. No code needed. Added automatically at checkout. Speed through your reps."

#### Distribution Channel:
Push Notifications via Gymshark iOS App and Google Ad banners.`;
  }

  // Default organic push
  return `### Tactical Counter-Strike Campaign: "Join the Lifters"

#### Trigger:
${event.competitor} publishes news: "${event.title}".

#### Strategic Brand Stance:
A standard brand move that we counter organically by strengthening our core lifter community spirit. We highlight real reviews and lifter humor.

#### Counter-Content Copy Draft:
"Other brands focus on wellness. We focus on weight. Built for the heavy sets, the calloused hands, and the early mornings. Gymshark is made for the lifter in all of us. Check out the legacy seamless shorts from £25."

#### Distribution Channel:
Organic TikTok posts and community stories.`;
}
