import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "cited.md");
    
    let content = "";
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    } else {
      content = `# Competitor Counter-Strike Agent — Provenance Citations Log\n\nNo citations have been published yet. Trigger a campaign brief to generate citation provenance traces.\n`;
    }

    return NextResponse.json({ markdown: content });
  } catch (error: any) {
    console.error("[Cited API] Error reading cited.md:", error);
    return NextResponse.json(
      { error: "Failed to read cited.md", details: error.message },
      { status: 500 }
    );
  }
}
