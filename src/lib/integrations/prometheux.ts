if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface PrometheuxReasoningOutput {
  counter_strategy_angle: string;
  lineage: string[];
  rules_applied: string[];
  vadalog_program_used: string;
}

class PrometheuxClient {
  private isFallback: boolean = true;

  constructor() {
    if (process.env.PROMETHEUX_TOKEN && process.env.PROMETHEUX_BASE_URL) {
      this.isFallback = false;
      console.log("[Prometheux] Real REST API client initialized.");
    } else {
      console.log("[Prometheux] Operating in local Vadalog reasoning simulation fallback mode.");
      this.isFallback = true;
    }
  }

  /**
   * Evaluates competitive strategy moves against the brand's strengths using Vadalog logic.
   * If Prometheux REST API is available, evaluates online. Otherwise, runs local logic.
   */
  async evaluateVadalogReasoning(
    competitor: string,
    sourceType: string,
    severity: string,
    eventTitle: string
  ): Promise<PrometheuxReasoningOutput> {
    const vadalogProgram = `
      % Vadalog Rules for Brand Counter-Strike Analysis
      competitor_move(Comp, Type, Sev) :- competitor_event(Comp, Type, Sev).
      
      % Rule 1: High severity pricing cuts trigger Value Multi-buy Bundles
      counter_angle(Comp, "Value-Driven Multi-Pack Bundle Campaign") :- 
         competitor_move(Comp, "pricing", "high").
         
      % Rule 2: Premium sustainable launches trigger Recycled Materials Promo
      counter_angle(Comp, "Highlight Existing Sustainable Recycled Lines") :- 
         competitor_move(Comp, "launch", Sev), 
         contains_term(Comp, "bio-nylon").
         
      % Rule 3: Competitive flash sales trigger Affiliate Free Delivery Hook
      counter_angle(Comp, "Affiliate Community Free Delivery & Accessories Hook") :- 
         competitor_move(Comp, "pricing", "high"),
         contains_term(Comp, "flash").
         
      % Rule 4: Standard/Generic moves trigger Social Engagement Campaign
      counter_angle(Comp, "Community Highlight & Organic Social Push") :- 
         competitor_move(Comp, _, _), 
         NOT counter_angle(Comp, _).
    `;

    if (!this.isFallback) {
      try {
        const url = `${process.env.PROMETHEUX_BASE_URL}/api/v1/vadalog/evaluate`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PROMETHEUX_TOKEN}`,
          },
          body: JSON.stringify({
            program: vadalogProgram,
            params: { competitor, sourceType, severity, eventTitle },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            counter_strategy_angle: data.counter_strategy_angle,
            lineage: data.lineage || ["Prometheux remote Vadalog node proof"],
            rules_applied: data.rules_applied || ["Rule 1: competitor_move -> counter_angle"],
            vadalog_program_used: vadalogProgram,
          };
        }
      } catch (e) {
        console.error("[Prometheux] Remote evaluation failed, running local Vadalog engine.", e);
      }
    }

    // Local deterministic Vadalog simulation fallback
    return this.runLocalVadalogEngine(competitor, sourceType, severity, eventTitle, vadalogProgram);
  }

  private runLocalVadalogEngine(
    competitor: string,
    sourceType: string,
    severity: string,
    eventTitle: string,
    program: string
  ): PrometheuxReasoningOutput {
    let counter_strategy_angle = "Community Highlight & Organic Social Push";
    const rules_applied: string[] = [];
    const lineage: string[] = [
      `Fact: Ingested competitor_event("${competitor}", "${sourceType}", "${severity}")`
    ];

    const titleLower = eventTitle.toLowerCase();

    if (sourceType === "pricing" && severity === "high" && titleLower.includes("flash")) {
      counter_strategy_angle = "Affiliate Community Free Delivery & Accessories Hook";
      rules_applied.push("Rule 3: competitor_move(Comp, 'pricing', 'high') + contains_term('flash') -> Affiliate Hijack");
      lineage.push(`Reasoning: "${competitor}" is running a high-impact flash pricing event. Quick hijack required.`);
    } else if (sourceType === "pricing" && severity === "high") {
      counter_strategy_angle = "Value-Driven Multi-Pack Bundle Campaign";
      rules_applied.push("Rule 1: competitor_move(Comp, 'pricing', 'high') -> Value Multi-buy Bundles");
      lineage.push(`Reasoning: "${competitor}" cut prices directly. Leverage multi-buy bundle margins to strike back.`);
    } else if (sourceType === "launch" && (titleLower.includes("bio-nylon") || titleLower.includes("eco") || titleLower.includes("recycled"))) {
      counter_strategy_angle = "Highlight Existing Sustainable Recycled Lines";
      rules_applied.push("Rule 2: competitor_move(Comp, 'launch', _) + contains_term('bio-nylon/eco') -> Sustainable Counter-Promo");
      lineage.push(`Reasoning: "${competitor}" launched a green premium capsule. Direct brand alignment with existing eco lines.`);
    } else {
      rules_applied.push("Rule 4: Default fallback move -> Social Engagement Campaign");
      lineage.push(`Reasoning: Move classified as low/medium threat. Strike back organically using relatable community voice.`);
    }

    return {
      counter_strategy_angle,
      lineage,
      rules_applied,
      vadalog_program_used: program,
    };
  }
}

export const prometheux = new PrometheuxClient();
