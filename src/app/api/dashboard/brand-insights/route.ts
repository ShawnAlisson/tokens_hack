import { NextResponse } from "next/server";
import { resolveTenantId } from "@/lib/tenant";
import { getBrandContext } from "@/lib/agents/brand-context";
import { clickhouse } from "@/lib/integrations/clickhouse";
import { senso } from "@/lib/integrations/senso";

export async function GET(request: Request) {
  try {
    const tenantId = resolveTenantId(request);
    const context = getBrandContext(tenantId);

    const facts = await senso.queryKnowledgeBase(tenantId, "positioning", 5);
    const positioningFact = facts.find((f) => f.category === "positioning") || facts[0];
    const positioning_summary = context.positioning_summary || positioningFact?.content ||
      `${context.display_name} focuses on delivering high-quality products in ${context.market}.`;

    const events = await clickhouse.getCompetitorEvents(tenantId, 100);
    let highCount = 0;
    let mediumCount = 0;
    events.forEach((e) => {
      if (e.severity === "high") highCount++;
      else if (e.severity === "medium") mediumCount++;
    });

    let threatScore = 15 + mediumCount * 8 + highCount * 22;
    if (threatScore > 100) threatScore = 100;

    let threatLevel: "Critical" | "Elevated" | "Low" = "Low";
    if (threatScore >= 70) threatLevel = "Critical";
    else if (threatScore >= 35) threatLevel = "Elevated";

    return NextResponse.json({
      display_name: context.display_name,
      domain: context.domain,
      market: context.market,
      logo_url: context.logo_url,
      positioning_summary,
      threat_level: threatLevel,
      threat_color:
        threatLevel === "Critical" ? "text-rose-600" :
        threatLevel === "Elevated" ? "text-amber-600" : "text-emerald-600",
      threat_score: threatScore,
      products_synced_at: context.synced_at,
      products_source: context.source,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
