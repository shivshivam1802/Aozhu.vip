import { NextResponse } from "next/server"
import { visitTrackedLink } from "@/lib/neon"
import { visitFromHeaders, withLocation } from "@/lib/visit"

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  try {
    const destination = await visitTrackedLink(code, await withLocation(visitFromHeaders(_request.headers), _request.headers))
    if (destination) return NextResponse.redirect(destination)
  } catch (error) {
    console.error("Failed to forward tracked link:", error)
  }

  return NextResponse.redirect(new URL("/?error=invalid_url", _request.url))
}
