import { after, NextResponse } from "next/server"
import { getLinkDestination, recordVisit } from "@/lib/neon"
import { visitFromHeaders, withLocation } from "@/lib/visit"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  try {
    const link = await getLinkDestination(code)
    if (link?.target_url) {
      const headerList = request.headers
      const visitBase = visitFromHeaders(headerList)
      after(async () => {
        try {
          await recordVisit(link.code, await withLocation(visitBase, headerList))
        } catch (error) {
          console.error("Failed to record tracked link visit:", error)
        }
      })
      return NextResponse.redirect(link.target_url)
    }
  } catch (error) {
    console.error("Failed to forward tracked link:", error)
  }

  return NextResponse.redirect(new URL("/?error=invalid_url", request.url))
}
