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
