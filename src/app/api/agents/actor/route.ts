import { NextResponse } from "next/server";
import { executeActorPublish } from "@/lib/agents/actor";

export async function POST(request: Request) {
  try {
    const { counterPlan } = await request.json();

    if (!counterPlan) {
      return NextResponse.json(
        { error: "Missing required parameter: counterPlan" },
        { status: 400 }
      );
    }

    const summary = await executeActorPublish(counterPlan);
    return NextResponse.json(summary, { status: 200 });
  } catch (error: any) {
    console.error("[Actor API] Publication error:", error);
    return NextResponse.json(
      { error: "Actor Publish failed", details: error.message },
      { status: 500 }
    );
  }
}
