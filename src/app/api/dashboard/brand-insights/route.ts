import { NextResponse } from "next/server";
import { getActiveTenantConfig } from "@/lib/tenant";
import { senso } from "@/lib/integrations/senso";
import { clickhouse } from "@/lib/integrations/clickhouse";

export async function GET(request: Request) {
  try {
    const tenant = getActiveTenantConfig(request);
    const tenantId = tenant.id;

    // Load brand facts from Senso.ai
    const facts = await senso.queryKnowledgeBase(tenantId, "positioning", 5);
    const positioningFact = facts.find(f => f.category === "positioning") || facts[0];
    const positioningSummary = positioningFact 
      ? positioningFact.content 
      : `${tenant.display_name} focuses on delivering high-quality, high-performance apparel engineered for everyday dedicated athletes.`;

    // Fetch clickhouse events to dynamically calculate the threat rating
    const events = await clickhouse.getCompetitorEvents(tenantId, 100);
    
    let highCount = 0;
    let mediumCount = 0;
    
    events.forEach(e => {
      if (e.severity === "high") highCount++;
      else if (e.severity === "medium") mediumCount++;
    });

    // Calculate dynamic threat index (score from 0 to 100)
    let threatScore = 15; // baseline threat
    threatScore += (mediumCount * 8) + (highCount * 22);
    if (threatScore > 100) threatScore = 100;

    let threatLevel: "Critical" | "Elevated" | "Low" = "Low";
    let threatColor = "text-emerald-500";

    if (threatScore >= 70) {
      threatLevel = "Critical";
      threatColor = "text-rose-500";
    } else if (threatScore >= 35) {
      threatLevel = "Elevated";
      threatColor = "text-amber-500";
    }

    return NextResponse.json({
      display_name: tenant.display_name,
      domain: tenant.domain,
      market: tenant.market,
      logo_url: tenant.logo_url,
      positioning_summary: positioningSummary,
      threat_level: threatLevel,
      threat_color: threatColor,
      threat_score: threatScore,
    });
  } catch (error: any) {
    console.error("[Brand Insights API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load brand insights", details: error.message },
      { status: 500 }
    );
  }
}
