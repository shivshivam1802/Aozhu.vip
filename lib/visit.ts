import crypto from "crypto"

export type VisitInput = {
  visitorKey: string
  ip: string
  country: string
  city: string
  device: string
  browser: string
  language: string
  referrer: string
}

type HeaderSource = { get(name: string): string | null }

export function clientIpFromHeaders(headers: HeaderSource) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || ""
  return (headers.get("cf-connecting-ip") || headers.get("x-real-ip") || forwarded || "").slice(0, 64)
}

export function visitorKey(ip: string, userAgent: string, existing?: string) {
  const saved = existing?.trim()
  if (saved) return saved.slice(0, 128)
  return crypto.createHash("sha256").update(`${ip}|${userAgent}`).digest("base64url")
}

export function visitFromHeaders(headers: HeaderSource): VisitInput {
  const ip = clientIpFromHeaders(headers)
  const userAgent = headers.get("user-agent") || ""
  const countryCode = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || headers.get("cloudfront-viewer-country") || ""
  const city = decodeHeader(headers.get("x-vercel-ip-city") || headers.get("cf-ipcity") || "")
  const region = decodeHeader(headers.get("cf-region") || headers.get("x-vercel-ip-country-region") || "")
  const languageTag = (headers.get("accept-language") || "").split(",")[0]?.trim() || ""

  return {
    visitorKey: visitorKey(ip, userAgent, headers.get("x-aozhu-vid") || ""),
    ip,
    country: countryName(countryCode),
    city: placeLabel(city, region),
    device: deviceFromAgent(userAgent),
    browser: browserFromAgent(userAgent),
    language: languageName(languageTag),
    referrer: referrerLabel(headers.get("referer") || ""),
  }
}

type Place = { country: string; city: string }

const placeCache = new Map<string, { place: Place | null; until: number }>()

export async function withLocation(visit: VisitInput, headers?: HeaderSource): Promise<VisitInput> {
  let next = visit
  if (!next.country || !next.city) {
    const target = lookupTarget(next.ip)
    if (target !== null) {
      const place = await lookupPlace(target)
      if (place) {
        next = {
          ...next,
          country: next.country || place.country,
          city: next.city || place.city,
        }
      }
    }
  }
  if (!next.country && headers) {
    const tag = (headers.get("accept-language") || "").split(",")[0]?.trim() || ""
    const hinted = countryName(tag.split("-")[1] || "")
    if (hinted) next = { ...next, country: hinted }
  }
  return next
}

function lookupTarget(ip: string) {
  if (isPublicIp(ip)) return ip
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") return ""
  return null
}

function isPublicIp(ip: string) {
  const value = ip.trim().toLowerCase().replace(/^::ffff:/, "")
  if (!value || value === "::1" || value === "127.0.0.1") return false
  if (value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("169.254.")) return false
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return false
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80")) return false
  return true
}

async function lookupPlace(ip: string) {
  const key = ip || "self"
  const cached = placeCache.get(key)
  if (cached && cached.until > Date.now()) return cached.place
  const place = await queryPlace(ip)
  placeCache.set(key, { place, until: Date.now() + (place ? 6 * 60 * 60 * 1000 : 60 * 1000) })
  return place
}

async function queryPlace(ip: string) {
  const encoded = encodeURIComponent(ip)
  const endpoints = ip
    ? [`https://ipwho.is/${encoded}`, `https://get.geojs.io/v1/ip/geo/${encoded}.json`]
    : ["https://ipwho.is/", "https://get.geojs.io/v1/ip/geo.json"]
  for (const url of endpoints) {
    const place = await fetchPlace(url)
    if (place) return place
  }
  return null
}

async function fetchPlace(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500), headers: { accept: "application/json" } })
    if (!response.ok) return null
    const data = await response.json() as { success?: boolean; country?: string; country_code?: string; region?: string; city?: string }
    if (data.success === false) return null
    const country = (data.country || countryName(data.country_code || "")).trim().slice(0, 80)
    const city = placeLabel(data.city || "", data.region || "")
    if (!country && !city) return null
    return { country, city }
  } catch {
    return null
  }
}

function placeLabel(city: string, region: string) {
  return [city.trim(), region.trim()].filter(Boolean).join(", ").slice(0, 80)
}

function decodeHeader(value: string) {
  try {
    return decodeURIComponent(value).slice(0, 80)
  } catch {
    return value.slice(0, 80)
  }
}

function countryName(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized || normalized === "XX" || normalized === "T1") return ""
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(normalized) || normalized
  } catch {
    return normalized
  }
}

function languageName(tag: string) {
  const primary = tag.split("-")[0]?.toLowerCase() || ""
  if (!primary) return ""
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(primary) || primary
  } catch {
    return primary
  }
}

function referrerLabel(value: string) {
  if (!value) return "Direct, email or others"
  try {
    const host = new URL(value).host
    return host || "Direct, email or others"
  } catch {
    return "Direct, email or others"
  }
}

function deviceFromAgent(agent: string) {
  if (/iPad/i.test(agent)) return "iPad"
  if (/iPhone/i.test(agent)) return "iPhone"
  if (/Android/i.test(agent)) return "Android"
  if (/Windows/i.test(agent)) return "Windows"
  if (/Mac OS|Macintosh/i.test(agent)) return "Mac"
  if (/Linux/i.test(agent)) return "Linux"
  if (/Mobile/i.test(agent)) return "Mobile"
  return agent ? "Desktop" : "Unknown"
}

function browserFromAgent(agent: string) {
  if (/Edg\//i.test(agent)) return "Edge"
  if (/OPR\/|Opera/i.test(agent)) return "Opera"
  if (/Firefox\//i.test(agent)) return "Firefox"
  if (/Chrome\//i.test(agent)) return "Chrome"
  if (/Safari\//i.test(agent)) return "Safari"
  return agent ? "Other" : "Unknown"
}
