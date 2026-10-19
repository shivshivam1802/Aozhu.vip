import crypto from "crypto"
import { neon } from "@neondatabase/serverless"

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

export async function visitTrackedLink(code: string) {
  const normalized = decodeURIComponent(code).trim()
  if (!normalized) return ""

  await ensureLinksTable()
  const candidates = [...new Set([normalized, normalized.toLowerCase()])]
  for (const candidate of candidates) {
    const rows = (await sql`
      UPDATE links
      SET visits = visits + 1
      WHERE code = ${candidate}
      RETURNING target_url
    `) as Array<{ target_url: string }>
    if (rows[0]?.target_url) return rows[0].target_url
  }

  return ""
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