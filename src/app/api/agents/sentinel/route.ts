import { NextResponse } from "next/server";
import { executeSentinelSweep } from "@/lib/agents/sentinel";

export async function POST() {
  try {
    const summary = await executeSentinelSweep();
    return NextResponse.json(summary, { status: 200 });
  } catch (error: any) {
    console.error("[Sentinel API] Sweep error:", error);
    return NextResponse.json(
      { error: "Sentinel Sweep failed", details: error.message },
      { status: 500 }
    );
  }
}
