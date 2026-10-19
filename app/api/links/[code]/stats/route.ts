import { NextResponse } from "next/server"
import { getLinkStats } from "@/lib/neon"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const url = new URL(request.url)
  const now = new Date()
  const fromValue = url.searchParams.get("from")
  const toValue = url.searchParams.get("to")
  let from = fromValue ? new Date(`${fromValue}T00:00:00.000Z`) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  let to = toValue ? new Date(`${toValue}T23:59:59.999Z`) : now
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
  }
  const maxRange = 92 * 24 * 60 * 60 * 1000
  if (to.getTime() - from.getTime() > maxRange) from = new Date(to.getTime() - maxRange)

  const stats = await getLinkStats(code, from, new Date(to.getTime() + 1))
  if (!stats) return NextResponse.json({ error: "Link not found" }, { status: 404 })

  const byDay = new Map(stats.days.map((row) => [row.day, Number(row.clicks || 0)]))
  const days = []
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
  while (cursor <= end && days.length < 93) {
    const day = cursor.toISOString().slice(0, 10)
    days.push({ day, clicks: byDay.get(day) || 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return NextResponse.json({ ...stats, days })
}
