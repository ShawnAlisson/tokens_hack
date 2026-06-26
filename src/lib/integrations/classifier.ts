import {
  classifyWithReeCache,
  classifyWithReeLive,
  type ClassificationResult,
} from "./ree";
import {
  classifyWithGemini,
  runLocalHeuristicClassification,
  type ClassifiedEventOutput,
} from "./gemini";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export type { ClassifiedEventOutput, ClassificationResult };

/**
 * Sentinel classification pipeline:
 * REE (cached or live Modal) → Gemini → local heuristics.
 */
export async function classifyEvent(title: string, snippet: string): Promise<ClassificationResult> {
  const preferCache = process.env.REE_USE_CACHE !== "false";

  if (preferCache) {
    const cached = classifyWithReeCache(title, snippet);
    if (cached) {
      return cached;
    }
  }

  const live = await classifyWithReeLive(title, snippet);
  if (live) {
    return live;
  }

  if (!preferCache) {
    const cached = classifyWithReeCache(title, snippet);
    if (cached) {
      return cached;
    }
  }

  const gemini = await classifyWithGemini(title, snippet);
  if (gemini) {
    return { ...gemini, source: "gemini" };
  }

  return { ...runLocalHeuristicClassification(title, snippet), source: "heuristic" };
}
