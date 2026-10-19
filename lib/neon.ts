import crypto from "crypto"
import { neon } from "@neondatabase/serverless"
import type { VisitInput } from "@/lib/visit"

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

export const sql = neon(databaseUrl || "")

export function normalizeTargetUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ""
  const hasHttpProtocol = /^https?:\/\//i.test(trimmed)
  const hasExplicitProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
  const isHostWithPort = /^[^/:?#]+:\d+(?:[/?#]|$)/.test(trimmed)
  if (hasExplicitProtocol && !hasHttpProtocol && !isHostWithPort) return ""
  const candidate = hasHttpProtocol ? trimmed : trimmed.startsWith("//") ? `https:${trimmed}` : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "")
    return parsed.toString()
  } catch {
    return candidate
  }
}

export function buildLinkCode(targetUrl: string, alias?: string) {
  const normalized = normalizeTargetUrl(targetUrl)
  if (alias) return alias
  return `link_${crypto.createHash("sha256").update(normalized).digest("base64url").replace(/=+$/g, "").slice(0, 16)}`
}

export async function ensureLinksTable() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_POOLED or DATABASE_URL is not configured")
  }

  await sql`
    CREATE TABLE IF NOT EXISTS links (
      code TEXT PRIMARY KEY,
      target_url TEXT NOT NULL,
      visits INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS link_visits (
      id BIGSERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      visitor_key TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      browser TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      visit_index INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS link_visits_code_created_idx ON link_visits (code, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS link_visits_code_visitor_idx ON link_visits (code, visitor_key)`
}

export async function findOrCreateLink(targetUrl: string, alias?: string) {
  const normalizedUrl = normalizeTargetUrl(targetUrl)
  const code = buildLinkCode(normalizedUrl, alias)

  await ensureLinksTable()
  const rows = (await sql`
    INSERT INTO links (code, target_url)
    VALUES (${code}, ${normalizedUrl})
    ON CONFLICT (code) DO UPDATE SET target_url = EXCLUDED.target_url
    RETURNING code, target_url, visits
  `) as Array<{ code: string; target_url: string; visits: number }>

  return rows[0]
}

export async function visitTrackedLink(code: string, visit?: VisitInput) {
  const normalized = decodeURIComponent(code).trim()
  if (!normalized) return ""

  await ensureLinksTable()
  const candidates = [...new Set([normalized, normalized.toLowerCase()])]
  for (const candidate of candidates) {
    const rows = (await sql`SELECT code FROM links WHERE code = ${candidate}`) as Array<{ code: string }>
    if (rows[0]) return recordVisit(rows[0].code, visit)
  }

  return ""
}

export async function recordVisit(code: string, visit?: VisitInput) {
  await ensureLinksTable()
  const details = visit || {
    visitorKey: crypto.randomBytes(16).toString("base64url"),
    ip: "",
    country: "",
    city: "",
    device: "Unknown",
    browser: "Unknown",
    language: "",
    referrer: "Direct, email or others",
  }
  const prior = (await sql`
    SELECT COUNT(*)::int AS n
    FROM link_visits
    WHERE code = ${code} AND visitor_key = ${details.visitorKey}
  `) as Array<{ n: number }>
  const visitIndex = Number(prior[0]?.n || 0) + 1
  await sql`
    INSERT INTO link_visits (code, visitor_key, ip, country, city, device, browser, language, referrer, visit_index)
    VALUES (
      ${code},
      ${details.visitorKey},
      ${details.ip},
      ${details.country},
      ${details.city},
      ${details.device},
      ${details.browser},
      ${details.language},
      ${details.referrer},
      ${visitIndex}
    )
  `
  const rows = (await sql`
    UPDATE links
    SET visits = visits + 1
    WHERE code = ${code}
    RETURNING target_url
  `) as Array<{ target_url: string }>

  return rows[0]?.target_url || ""
}

export async function incrementLinkVisits(code: string) {
  const rows = (await sql`
    UPDATE links
    SET visits = visits + 1
    WHERE code = ${code}
    RETURNING code, target_url, visits
  `) as Array<{ code: string; target_url: string; visits: number }>

  return rows[0]
}

export type VisitRow = {
  country: string
  city: string
  device: string
  browser: string
  language: string
  referrer: string
  ip: string
  visit_index: number
  created_at: string
}

export async function getLinkStats(code: string, from: Date, to: Date) {
  await ensureLinksTable()
  const links = (await sql`
    SELECT code, target_url, visits, created_at
    FROM links
    WHERE code = ${code}
  `) as Array<{ code: string; target_url: string; visits: number; created_at: string }>
  const link = links[0]
  if (!link) return null

  const summary = (await sql`
    SELECT COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_key)::int AS unique_clicks
    FROM link_visits
    WHERE code = ${code} AND created_at >= ${from.toISOString()} AND created_at < ${to.toISOString()}
  `) as Array<{ clicks: number; unique_clicks: number }>
  const days = (await sql`
    SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::int AS clicks
    FROM link_visits
    WHERE code = ${code} AND created_at >= ${from.toISOString()} AND created_at < ${to.toISOString()}
    GROUP BY 1
    ORDER BY 1
  `) as Array<{ day: string; clicks: number }>
  const activity = (await sql`
    SELECT country, city, device, browser, language, referrer, ip, visit_index, created_at
    FROM link_visits
    WHERE code = ${code} AND created_at >= ${from.toISOString()} AND created_at < ${to.toISOString()}
    ORDER BY created_at DESC
    LIMIT 50
  `) as VisitRow[]

  const [countries, devices, browsers, languages, referrers] = await Promise.all([
    grouped(code, from, to, "country"),
    grouped(code, from, to, "device"),
    grouped(code, from, to, "browser"),
    grouped(code, from, to, "language"),
    grouped(code, from, to, "referrer"),
  ])

  return {
    link,
    clicks: Number(summary[0]?.clicks || 0),
    uniqueClicks: Number(summary[0]?.unique_clicks || 0),
    topCountry: countries.find((row) => row.label && row.label !== "Unknown")?.label || "",
    topReferrer: referrers.find((row) => row.label && row.label !== "Unknown")?.label || "",
    days,
    activity,
    countries,
    devices,
    browsers,
    languages,
    referrers,
  }
}

async function grouped(code: string, from: Date, to: Date, column: "country" | "device" | "browser" | "language" | "referrer") {
  const range = sql`code = ${code} AND created_at >= ${from.toISOString()} AND created_at < ${to.toISOString()}`
  const rows = column === "country"
    ? await sql`SELECT country AS label, COUNT(*)::int AS count FROM link_visits WHERE ${range} GROUP BY 1 ORDER BY count DESC LIMIT 12`
    : column === "device"
      ? await sql`SELECT device AS label, COUNT(*)::int AS count FROM link_visits WHERE ${range} GROUP BY 1 ORDER BY count DESC LIMIT 12`
      : column === "browser"
        ? await sql`SELECT browser AS label, COUNT(*)::int AS count FROM link_visits WHERE ${range} GROUP BY 1 ORDER BY count DESC LIMIT 12`
        : column === "language"
          ? await sql`SELECT language AS label, COUNT(*)::int AS count FROM link_visits WHERE ${range} GROUP BY 1 ORDER BY count DESC LIMIT 12`
          : await sql`SELECT referrer AS label, COUNT(*)::int AS count FROM link_visits WHERE ${range} GROUP BY 1 ORDER BY count DESC LIMIT 12`

  return (rows as Array<{ label: string; count: number }>)
    .map((row) => ({ label: row.label || "Unknown", count: Number(row.count || 0) }))
}