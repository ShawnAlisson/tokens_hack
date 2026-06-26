import { NextResponse } from "next/server";
import { executeStrategistAnalysis } from "@/lib/agents/strategist";

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required parameter: eventId" },
        { status: 400 }
      );
    }

    const counterPlan = await executeStrategistAnalysis(eventId);
    return NextResponse.json(counterPlan, { status: 200 });
  } catch (error: any) {
    console.error("[Strategist API] Strategic analysis error:", error);
    return NextResponse.json(
      { error: "Strategist Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}
