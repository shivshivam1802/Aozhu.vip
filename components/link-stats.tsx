"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"
import { useDelayedPoll } from "@/lib/use-delayed-poll"

type Breakdown = { label: string; count: number }
type Activity = {
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
type Stats = {
  link: { code: string; target_url: string; visits: number }
  clicks: number
  uniqueClicks: number
  topCountry: string
  topReferrer: string
  days: { day: string; clicks: number }[]
  activity: Activity[]
  countries: Breakdown[]
  devices: Breakdown[]
  browsers: Breakdown[]
  languages: Breakdown[]
  referrers: Breakdown[]
}

const tabs = [
  { id: "summary", label: "Summary" },
  { id: "countries", label: "Countries" },
  { id: "platforms", label: "Platforms" },
  { id: "browsers", label: "Browsers" },
  { id: "languages", label: "Languages" },
  { id: "referrers", label: "Referrers" },
] as const

type Tab = (typeof tabs)[number]["id"]

const STATS_POLL_MS = 20_000

export function LinkStats({ code }: { code: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("summary")
  const [from, setFrom] = useState(dateInput(addDays(new Date(), -14)))
  const [to, setTo] = useState(dateInput(new Date()))
  const rangeRef = useRef({ from, to })
  const requestRef = useRef(0)
  const inflightRef = useRef<AbortController | null>(null)

  const load = async (start: string, end: string, signal?: AbortSignal) => {
    inflightRef.current?.abort()
    const controller = new AbortController()
    inflightRef.current = controller
    const onAbort = () => controller.abort()
    signal?.addEventListener("abort", onAbort)
    const id = ++requestRef.current
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(code)}/stats?from=${start}&to=${end}`, { signal: controller.signal, cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (id !== requestRef.current) return
      if (!response.ok) throw new Error(data.error || "Unable to load stats")
      setError("")
      setStats(data)
    } catch (error) {
      if (id !== requestRef.current || (error instanceof Error && error.name === "AbortError")) return
      setError(error instanceof Error ? error.message : "Unable to load stats")
      throw error
    } finally {
      signal?.removeEventListener("abort", onAbort)
      if (inflightRef.current === controller) inflightRef.current = null
    }
  }

  const pausePoll = useDelayedPoll(async (signal) => {
    const range = rangeRef.current
    await load(range.from, range.to, signal)
  }, STATS_POLL_MS)

  useEffect(() => {
    rangeRef.current = { from, to }
    load(from, to).catch(() => {})
    return () => inflightRef.current?.abort()
  }, [code])

  const applyRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    rangeRef.current = { from, to }
    pausePoll()
    load(from, to).catch(() => {})
  }

  const breakdown = stats ? listFor(tab, stats) : []
  const peak = Math.max(1, ...(stats?.days.map((day) => day.clicks) || [1]))

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#495057]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-[#e6e9ef] bg-white px-4">
          <Link href="/generate" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-sm font-bold tracking-[0.18em] text-[#1e2a3a]">AOZHU</span>
          </Link>
          <button type="button" onClick={logout} className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[#1e2a3a]">
            <LogOut size={15} /> Log out
          </button>
        </header>

        <main className="p-4 md:p-6">
          {error && <p className="mb-4 text-sm text-[#d9534f]">{error}</p>}
          {stats && (
            <>
              <section className="rounded-md border border-[#e6e9ef] bg-white p-4 shadow-sm">
                <a href={stats.link.target_url} target="_blank" rel="nofollow" className="block truncate text-base font-bold text-[#1e2a3a] hover:text-[#3b7ddd]">{stats.link.target_url}</a>
                <p className="mt-1 text-sm text-[#8a94a6]">{typeof window === "undefined" ? `/${stats.link.code}` : `${window.location.origin}/${stats.link.code}`}</p>
              </section>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Clicks" value={stats.clicks.toLocaleString()} />
                <Metric label="Unique clicks" value={stats.uniqueClicks.toLocaleString()} />
                <Metric label="Top country" value={stats.topCountry || "—"} />
                <Metric label="Top referrer" value={stats.topReferrer || "—"} />
              </div>

              <div className="mt-4 overflow-x-auto rounded-md border border-[#e6e9ef] bg-white shadow-sm">
                <div className="flex min-w-max">
                  {tabs.map((item) => (
                    <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`px-4 py-3 text-sm font-bold ${tab === item.id ? "border-b-2 border-[#3b7ddd] text-[#3b7ddd]" : "text-[#6c757d]"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-[#1e2a3a]">{tab === "summary" ? "Clicks" : tabs.find((item) => item.id === tab)?.label}</h2>
                <form onSubmit={applyRange} className="ml-auto flex flex-wrap items-center gap-2 rounded-md border border-[#e6e9ef] bg-white p-2 shadow-sm">
                  <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" className="h-9 rounded-md border border-[#d9dee7] px-2 text-sm" />
                  <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" className="h-9 rounded-md border border-[#d9dee7] px-2 text-sm" />
                  <button className="h-9 rounded-md bg-[#3b7ddd] px-3 text-sm font-semibold text-white">Apply</button>
                </form>
              </div>

              {tab === "summary" ? (
                <section className="mt-4 rounded-md border border-[#e6e9ef] bg-white p-4 shadow-sm">
                  <div className="flex h-48 items-end gap-1">
                    {stats.days.map((day) => (
                      <div key={day.day} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div className="rounded-t bg-[#3b7ddd]" style={{ height: `${Math.max(day.clicks ? 6 : 0, (day.clicks / peak) * 100)}%` }} title={`${day.day}: ${day.clicks}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-[#8a94a6]">
                    <span>{stats.days[0]?.day}</span>
                    <span>{stats.days[stats.days.length - 1]?.day}</span>
                  </div>
                  <p className="mt-3 text-xs text-[#8a94a6]">All-time clicks for this link: {stats.link.visits.toLocaleString()}. The chart uses visits recorded in the selected dates.</p>
                </section>
              ) : (
                <section className="mt-4 space-y-2">
                  {breakdown.map((row) => (
                    <div key={row.label} className="rounded-md border border-[#e6e9ef] bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#1e2a3a]">{row.label}</span>
                        <span>{row.count.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {!breakdown.length && <p className="rounded-md border border-[#e6e9ef] bg-white px-4 py-8 text-sm text-[#8a94a6]">No data is available for this request.</p>}
                </section>
              )}

              <div className="mb-3 mt-8 flex items-center">
                <h2 className="text-lg font-bold text-[#1e2a3a]">Recent activity</h2>
              </div>
              <div className="space-y-2">
                {stats.activity.map((visit, index) => (
                  <article key={`${visit.created_at}-${index}`} className="rounded-md border border-[#e6e9ef] bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#1e2a3a]">
                      <span>{[visit.city, visit.country].filter(Boolean).join(", ") || "Unknown location"}</span>
                      <span>{visit.device || "Unknown device"}</span>
                      <span>{visit.browser || "Unknown browser"}</span>
                      <span>{visit.referrer || "Direct, email or others"}</span>
                      <span>{visit.language || "Unknown language"}</span>
                      {visit.ip && <span>{visit.ip}</span>}
                      {visit.visit_index > 1 && <span className="font-semibold text-[#3b7ddd]">Repeat visit {visit.visit_index}</span>}
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#6c757d]">{timeAgo(visit.created_at)}</p>
                  </article>
                ))}
                {!stats.activity.length && <p className="rounded-md border border-[#e6e9ef] bg-white px-4 py-8 text-sm text-[#8a94a6]">No visits in this date range.</p>}
              </div>
            </>
          )}
        </main>
    </div>
  )
}

function listFor(tab: Tab, stats: Stats) {
  if (tab === "countries") return stats.countries
  if (tab === "platforms") return stats.devices
  if (tab === "browsers") return stats.browsers
  if (tab === "languages") return stats.languages
  if (tab === "referrers") return stats.referrers
  return []
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e6e9ef] bg-white px-4 py-5 text-center shadow-sm">
      <p className="truncate text-2xl font-bold text-[#1e2a3a]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8a94a6]">{label}</p>
    </div>
  )
}

function logout() {
  fetch("/api/auth/logout", { method: "POST" }).finally(() => {
    window.location.href = "/"
  })
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function dateInput(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function timeAgo(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}
