// scripts/seed-demo-data.ts
import crypto from "crypto";
import { clickhouse, type CompetitorEvent, type CounterAction, type RevenueEvent } from "../src/lib/integrations/clickhouse";

console.log("=== Seeding Demo Data for Gymshark ===");

const TENANT_ID = "gymshark";

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Generate dates over last 14 days
const getDateDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  // Add some random times
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d.toISOString();
};

const SEED_EVENTS: Omit<CompetitorEvent, "id" | "inserted_at" | "url_hash" | "processed">[] = [
  {
    tenant_id: TENANT_ID,
    competitor: "Lululemon",
    source_type: "pricing",
    severity: "high",
    url: "https://www.lululemon.co.uk/en-gb/p/align-high-rise-pant-25/prod10480023.html",
    title: "Lululemon slashes Align leggings pricing by 15% across UK e-commerce",
    snippet: "Lululemon has updated their price points for the signature Align legging line in the UK from £88 to £74.80. This unexpected discount is being promoted on several activewear comparison blogs and marks a strategic move to capture market share ahead of the summer gym season.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Lululemon",
    source_type: "launch",
    severity: "medium",
    url: "https://www.retailgazette.co.uk/blog/2026/06/lululemon-bio-nylon/",
    title: "Lululemon launches bio-nylon premium clothing range in London flagship stores",
    snippet: "Lululemon Athletica is rolling out an eco-friendly bio-synthetic clothing capsule across selected London stores. Promoted under their carbon-neutral commitment, this premium activewear collection uses 100% plant-based nylons, directly challenging competitor eco-campaigns.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Nike",
    source_type: "pricing",
    severity: "high",
    url: "https://www.nike.com/uk/w/mens-sale-gym-training-37v78z5e1x6z5e1x",
    title: "Nike UK launches 48-hour flash sale with up to 40% off Training Gear",
    snippet: "Nike UK has launched a high-impact summer training flash sale. Running shorts, moisture-wicking tees, and training shoes are heavily discounted. Early traffic charts show a major surge in online purchases from gymgoers in key metropolitan areas.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Nike",
    source_type: "launch",
    severity: "medium",
    url: "https://www.nike.com/uk/launch/t/metcon-9-premium-edition",
    title: "Nike Metcon 9 UK launch features customized team color options",
    snippet: "Nike introduces the premium custom-engineered Metcon 9 training shoes in the UK market. The shoe targets professional lifting gyms and Crossfit affiliates with customized colourways and personalized heel-clip configurations.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "ASOS",
    source_type: "comparison",
    severity: "medium",
    url: "https://www.asos.com/women/activewear/asos-4505-activewear-launch",
    title: "ASOS 4505 private-label activewear expanded with £18 budget gym leggings",
    snippet: "ASOS expands its budget activewear collection, ASOS 4505. They are launching seamless high-rise leggings at £18, targeted directly at Gen-Z social media users. Influencer reviews are highlighting the squat-proof fabric and low cost compared to premium brands.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Adidas",
    source_type: "launch",
    severity: "low",
    url: "https://www.adidas.co.uk/stella_mccartney",
    title: "Adidas by Stella McCartney launches recycled earth-tone collection",
    snippet: "Adidas releases its new seasonal premium collection with designer Stella McCartney in the UK. The collection focuses on high-end ocean plastics and minimalist earth tones, combining fashion aesthetics with high-performance running silhouettes.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Under Armour",
    source_type: "trend",
    severity: "low",
    url: "https://www.drapers.co.uk/news/under-armour-uk-logistics-update",
    title: "Under Armour resolves UK distribution center delays, launching restock",
    snippet: "Under Armour has resolved its supply chain and shipping delays at its primary UK fulfillment hub. Store inventories across London and Manchester are being restocked with training garments and cold-weather baselayers.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Lululemon",
    source_type: "comparison",
    severity: "medium",
    url: "https://www.cosmopolitan.com/uk/fashion/style/g3422/best-gym-leggings-reviews/",
    title: "Cosmopolitan UK ranks Lululemon Align vs Gymshark Adapt leggings",
    snippet: "Cosmopolitan editors publish their ultimate 2026 workout leggings breakdown. Lululemon is praised for extreme comfort and second-skin feel, while Gymshark is commended for muscle support, waistband hold, and value for money.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Nike",
    source_type: "mention",
    severity: "medium",
    url: "https://www.instagram.com/nike-uk-running-community/",
    title: "Nike Running Club UK launches London summer running hub",
    snippet: "Nike UK Runner communities on social media report heavy interest in Nike's weekend street-training clubs. The club offers free tracking sensors, pacing maps, and branded community moisture-wicking shirts to active attendees.",
  },
  {
    tenant_id: TENANT_ID,
    competitor: "Adidas",
    source_type: "pricing",
    severity: "low",
    url: "https://www.adidas.co.uk/sale-gym-accessories",
    title: "Adidas UK rolls out 15% discount on running socks and water bottles",
    snippet: "Adidas offers checkout-basket discounts on minor fitness gear, workout towels, and gym sacks. A tactical pricing tweak designed to clear excess accessory inventory.",
  }
];

async function seed() {
  try {
    console.log("Cleaning existing fallback records...");
    clickhouse.clearAll();

    // 1. Setup tables
    await clickhouse.setupTables();

    // 2. Insert Events scattered across 14 days
    console.log(`Inserting ${SEED_EVENTS.length} events...`);
    const processedEvents: CompetitorEvent[] = SEED_EVENTS.map((item, index) => {
      // Scatter dates from 0 to 12 days ago
      const daysAgo = index % 12;
      const insertedAt = getDateDaysAgo(daysAgo);
      const urlHash = crypto.createHash("md5").update(item.url).digest("hex");
      return {
        id: `evt_${uuid()}`,
        inserted_at: insertedAt,
        url_hash: urlHash,
        processed: index < 3, // mark first 3 events as already strategic-analyzed
        ...item,
      } as CompetitorEvent;
    });

    for (const event of processedEvents) {
      await clickhouse.insertCompetitorEvent(event);
    }

    // 3. Insert some Counter Actions for processed events
    console.log("Inserting counter action drafts...");
    const counterActions: CounterAction[] = [
      {
        id: `act_${uuid()}`,
        event_id: processedEvents[0].id, // Lululemon align pricing
        tenant_id: TENANT_ID,
        competitor: "Lululemon",
        trigger_title: processedEvents[0].title,
        strategy_angle: "Value-Driven Multi-Pack Bundle Campaign",
        content_draft: `### Tactical Counter-Strike Campaign: "Double the Fit, Real Value"

#### Trigger:
Lululemon slashes Align leggings pricing to £74.80 in the UK.

#### Strategic Brand Stance:
Lululemon is trying to lower prices, but they are still perceived as expensive single items. Gymshark should strike back with our Core USP: high-quality durability, style, and unmatched value via a multi-buy bundle.

#### Counter-Content Copy Draft:
"Premium shouldn't mean overpriced. Why buy one pair of leggings when you can get two that last twice as long? Get 2 Gymshark Everyday Seamless Leggings for £60 today. Built for sweat. Styled for life. No compromises."

#### Distribution Channel:
Published to Gymshark UK Hub, Social Media channels (TikTok/Instagram Ads targeting UK activewear shoppers).`,
        published_url: "https://notion.so/gymshark-workspace/lululemon-align-price-cut-counter-strike-1a2b3c4f",
        notion_page_id: "notion_page_99812736",
        latency_ms: 1250,
        published_at: getDateDaysAgo(0),
      },
      {
        id: `act_${uuid()}`,
        event_id: processedEvents[1].id, // Lululemon bio-nylon launch
        tenant_id: TENANT_ID,
        competitor: "Lululemon",
        trigger_title: processedEvents[1].title,
        strategy_angle: "Highlight Existing Sustainable Recycled Lines",
        content_draft: `### Tactical Counter-Strike Campaign: "Our Planet, Our Gym"

#### Trigger:
Lululemon introduces plant-based nylons capsule in premium London storefronts.

#### Strategic Brand Stance:
Lululemon is treating sustainability as a premium luxury feature. Gymshark believes eco-friendly high-performance gear should be accessible to everyone. We will highlight our existing recycled polyester lines.

#### Counter-Content Copy Draft:
"Real athletes care about the planet. That's why sustainable workout gear shouldn't be locked behind a luxury paywall. Our Recycled Seamless range features 85% eco-friendly yarn starting at £28. Because green energy belongs in every workout."

#### Distribution Channel:
Email newsletter segment to UK customer base, Organic Instagram Carousel.`,
        published_url: "https://notion.so/gymshark-workspace/lululemon-bio-nylon-counter-campaign-2b3c4d5e",
        notion_page_id: "notion_page_11223344",
        latency_ms: 1840,
        published_at: getDateDaysAgo(1),
      },
      {
        id: `act_${uuid()}`,
        event_id: processedEvents[2].id, // Nike flash sale
        tenant_id: TENANT_ID,
        competitor: "Nike",
        trigger_title: processedEvents[2].title,
        strategy_angle: "Affiliate Community Free Delivery & Accessories Hook",
        content_draft: `### Tactical Counter-Strike Campaign: "Complete the Fit"

#### Trigger:
Nike launching a 48h 40% flash sale.

#### Strategic Brand Stance:
Rather than starting a price war, we will hijack Nike's checkout frenzy by offering a free accessory bundle (socks + shaker) and free shipping on all orders over £35, cross-promoting our new arrivals.

#### Counter-Content Copy Draft:
"Spotted Nike's sale? Upgrade your gym bag with the final touches. Get a FREE Gymshark shaker and crew socks with every order. No code needed. Added automatically at checkout. Speed through your reps."

#### Distribution Channel:
Push Notification via Gymshark iOS App, TikTok Banner Ad.`,
        published_url: "https://notion.so/gymshark-workspace/nike-flash-sale-hijack-3c4d5e6f",
        notion_page_id: "notion_page_55667788",
        latency_ms: 980,
        published_at: getDateDaysAgo(2),
      }
    ];

    for (const action of counterActions) {
      await clickhouse.insertCounterAction(action);
    }

    // 4. Insert some x402 revenue events
    console.log("Inserting revenue events...");
    const revenueEvents: RevenueEvent[] = [
      { id: `rev_${uuid()}`, event_id: processedEvents[0].id, amount_usd: 0.01, timestamp: getDateDaysAgo(0) },
      { id: `rev_${uuid()}`, event_id: processedEvents[1].id, amount_usd: 0.01, timestamp: getDateDaysAgo(1) },
      { id: `rev_${uuid()}`, event_id: processedEvents[2].id, amount_usd: 0.01, timestamp: getDateDaysAgo(2) },
      { id: `rev_${uuid()}`, event_id: processedEvents[3].id, amount_usd: 0.01, timestamp: getDateDaysAgo(3) },
      { id: `rev_${uuid()}`, event_id: processedEvents[4].id, amount_usd: 0.01, timestamp: getDateDaysAgo(4) },
    ];

    for (const rev of revenueEvents) {
      await clickhouse.insertRevenueEvent(rev);
    }

    console.log("[SUCCESS] Successfully seeded database fallback file!");
  } catch (error) {
    console.error("[ERROR] Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
