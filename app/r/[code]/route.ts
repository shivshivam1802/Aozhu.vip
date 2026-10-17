import { NextResponse } from "next/server"
import { visitTrackedLink } from "@/lib/neon"

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  try {
    const destination = await visitTrackedLink(code)
    if (destination) return NextResponse.redirect(destination)
  } catch (error) {
    console.error("Failed to forward tracked link:", error)
  }

  return NextResponse.redirect(new URL("/?error=invalid_url", _request.url))
}
