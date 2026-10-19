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
