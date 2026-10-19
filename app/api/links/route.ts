import { NextResponse } from "next/server"
import { buildLinkCode, ensureLinksTable, normalizeTargetUrl, sql } from "@/lib/neon"
import crypto from "crypto"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "12")))
  const offset = (page - 1) * limit
  const search = url.searchParams.get("q")?.trim() || ""
  const searchPattern = `%${search}%`

  await ensureLinksTable()
  const rows = await sql`
    SELECT code, target_url, visits, created_at,
      (SELECT COUNT(DISTINCT visitor_key)::int FROM link_visits WHERE link_visits.code = links.code) AS unique_visits
    FROM links
    WHERE (${search === ""} OR code ILIKE ${searchPattern} OR target_url ILIKE ${searchPattern})
    ORDER BY created_at DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `
  const totals = page === 1
    ? await sql`
      SELECT
        COUNT(*)::int AS links,
        COALESCE(SUM(visits), 0)::int AS clicks,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS links_today,
        (
          SELECT COUNT(*)::int
          FROM link_visits
          JOIN links visited ON visited.code = link_visits.code
          WHERE link_visits.created_at >= date_trunc('day', NOW())
            AND (${search === ""} OR visited.code ILIKE ${searchPattern} OR visited.target_url ILIKE ${searchPattern})
        ) AS clicks_today
      FROM links
      WHERE (${search === ""} OR code ILIKE ${searchPattern} OR target_url ILIKE ${searchPattern})
    `
    : []
  const summary = totals[0] as { links?: number; clicks?: number; links_today?: number; clicks_today?: number } | undefined

  return NextResponse.json({
    links: rows.slice(0, limit),
    hasMore: rows.length > limit,
    page,
    limit,
    totals: summary
      ? {
          links: Number(summary.links || 0),
          clicks: Number(summary.clicks || 0),
          linksToday: Number(summary.links_today || 0),
          clicksToday: Number(summary.clicks_today || 0),
        }
      : undefined,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : ""
    const alias = typeof body.alias === "string" ? body.alias.trim().toLowerCase() : ""
    const normalizedTarget = normalizeTargetUrl(targetUrl)

    try {
      const parsedUrl = new URL(normalizedTarget)
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error()
    } catch {
      return NextResponse.json({ error: "A valid HTTP or HTTPS URL is required" }, { status: 400 })
    }

    const reservedCodes = new Set(["about", "admin", "api", "contact", "favicon", "generate", "icon", "link", "logo", "manifest", "r", "robots", "services", "sitemap", "stats"])
    if (alias && (!/^[a-zA-Z0-9_-]+$/.test(alias) || reservedCodes.has(alias))) {
      return NextResponse.json({ error: "Invalid alias" }, { status: 400 })
    }

    await ensureLinksTable()
    const code = alias || buildLinkCode(normalizedTarget) || crypto.randomBytes(6).toString("base64url")

    try {
      const result = await sql`
        INSERT INTO links (code, target_url)
        VALUES (${code}, ${normalizedTarget})
        ON CONFLICT (code) DO UPDATE SET target_url = EXCLUDED.target_url
        RETURNING code
      `

      return NextResponse.json({ code: result[0].code })
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().includes("duplicate key")) {
        return NextResponse.json({ error: "That alias is already in use" }, { status: 409 })
      }
      throw error
    }
  } catch (error: unknown) {
    console.error("Failed to create tracked link:", error)
    return NextResponse.json({ error: "Unable to create link" }, { status: 500 })
  }
}