import { NextResponse } from "next/server";
import { getReceiptByHash } from "@/lib/integrations/ree";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const receipt = getReceiptByHash(hash);

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ receipt });
}
