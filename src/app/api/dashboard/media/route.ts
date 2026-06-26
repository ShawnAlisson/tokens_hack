import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "https only" }, { status: 400 });
    }

    const upstream = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BrandCompete/1.0)",
        Accept: "image/*,*/*",
      },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream failed" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
}
