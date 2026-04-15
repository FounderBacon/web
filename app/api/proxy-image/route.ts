import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  // Autoriser uniquement le CDN founderbacon
  if (!url.startsWith("https://cdn.founderbacon.com/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: res.status })

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") ?? "image/png"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 })
  }
}
