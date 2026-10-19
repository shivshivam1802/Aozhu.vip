"use client"

import Link from "next/link"
import { LogOut, MoreVertical, Search, SlidersHorizontal, X } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"
import { useDelayedPoll } from "@/lib/use-delayed-poll"

type Mode = "whatsapp" | "redirect"
type LinkRecord = { code: string; target_url: string; visits: number; unique_visits?: number; created_at?: string }
type Totals = { links: number; clicks: number; linksToday: number; clicksToday?: number }
type LinkPage = { links: LinkRecord[]; hasMore: boolean; totals?: Totals }
type SessionUser = { fullName?: string; email?: string; role?: string }

const PAGE_SIZE = 12
const POLL_LIMIT = 60
const LIST_POLL_MS = 20_000

export function LinkWorkspace() {
  const [mode, setMode] = useState<Mode>("redirect")
  const [targetUrl, setTargetUrl] = useState("")
  const [alias, setAlias] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [advanced, setAdvanced] = useState(false)
  const [result, setResult] = useState<LinkRecord | null>(null)
  const [links, setLinks] = useState<LinkRecord[]>([])
  const [totals, setTotals] = useState<Totals>({ links: 0, clicks: 0, linksToday: 0, clicksToday: 0 })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [origin, setOrigin] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [copied, setCopied] = useState("")
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const searchRef = useRef("")
  const requestRef = useRef(0)
  searchRef.current = searchTerm

  const pausePoll = useDelayedPoll(async (signal) => {
    if (pageRef.current < 1) return
    const limit = Math.min(POLL_LIMIT, Math.max(PAGE_SIZE, pageRef.current * PAGE_SIZE))
    await loadLinks(1, searchRef.current, { signal, silent: true, limit })
  }, LIST_POLL_MS)

  useEffect(() => {
    const controller = new AbortController()
    setOrigin(window.location.origin)
    loadLinks(1, "", { signal: controller.signal })
    const profile = new AbortController()
    fetch("/api/auth/me", { signal: profile.signal })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return
        setUser(null)
      })
    return () => {
      controller.abort()
      profile.abort()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        document.getElementById("shorten")?.scrollIntoView({ behavior: "smooth", block: "center" })
        document.getElementById(mode === "whatsapp" ? "phone" : "url")?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pageRef.current > 0 && hasMoreRef.current && !loadingRef.current) {
        pausePoll()
        loadLinks(pageRef.current + 1)
      }
    }, { rootMargin: "240px" })
    if (sentinel.current) observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, page])

  const loadLinks = async (nextPage: number, term = searchTerm, options?: { signal?: AbortSignal; silent?: boolean; limit?: number }) => {
    if (options?.signal?.aborted) return
    const id = ++requestRef.current
    loadingRef.current = true
    if (!options?.silent) setLoadingMore(true)
    const limit = options?.limit ?? PAGE_SIZE
    try {
      const response = await fetch(`/api/links?page=${nextPage}&limit=${limit}&q=${encodeURIComponent(term)}`, { signal: options?.signal, cache: "no-store" })
      if (id !== requestRef.current) return
      if (!response.ok) {
        if (options?.silent) throw new Error("Unable to refresh links")
        return
      }
      const data: LinkPage = await response.json()
      if (id !== requestRef.current) return
      setLinks((current) => {
        if (nextPage !== 1) return [...current, ...data.links]
        if (!options?.silent) return data.links
        const seen = new Set(data.links.map((link) => link.code))
        const tail = current.slice(data.links.length).filter((link) => !seen.has(link.code))
        return [...data.links, ...tail]
      })
      if (data.totals) setTotals(data.totals)
      if (options?.silent && nextPage === 1) return
      const resolvedPage = nextPage === 1 ? Math.max(1, Math.ceil(data.links.length / PAGE_SIZE)) : nextPage
      setPage(resolvedPage)
      setHasMore(data.hasMore)
      pageRef.current = resolvedPage
      hasMoreRef.current = data.hasMore
    } catch (error) {
      if (id !== requestRef.current || (error instanceof Error && error.name === "AbortError")) return
      if (options?.silent) throw error
    } finally {
      if (id === requestRef.current) {
        loadingRef.current = false
        if (!options?.silent) setLoadingMore(false)
      }
    }
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTerm = searchInput.trim()
    setSearchTerm(nextTerm)
    searchRef.current = nextTerm
    setHasMore(true)
    pausePoll()
    loadLinks(1, nextTerm)
  }

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      let destination = targetUrl.trim()
      if (mode === "whatsapp") {
        const cleanedPhone = phone.replace(/\D/g, "")
        if (cleanedPhone.length < 7) throw new Error("Enter a WhatsApp number with country code")
        destination = `https://wa.me/${cleanedPhone}${message ? `?text=${encodeURIComponent(message)}` : ""}`
      }
      if (!destination) throw new Error(mode === "whatsapp" ? "Enter a phone number" : "Enter a destination URL")
      const response = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl: destination, alias: mode === "redirect" ? alias : "" }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to create link")
      const statsResponse = await fetch(`/api/links/${encodeURIComponent(data.code)}`)
      const created: LinkRecord = statsResponse.ok ? await statsResponse.json() : { code: data.code, target_url: destination, visits: 0 }
      setResult(created)
      setTargetUrl("")
      setAlias("")
      setPhone("")
      setMessage("")
      pausePoll()
      await loadLinks(1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create link")
    } finally {
      setBusy(false)
    }
  }

  const updateDestination = async (code: string, nextTarget: string) => {
    const response = await fetch(`/api/links/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: nextTarget }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Unable to update link")
    const updated = data as LinkRecord
    setLinks((current) => current.map((link) => link.code === updated.code ? { ...link, ...updated } : link))
    setResult((current) => current && current.code === updated.code ? { ...current, ...updated } : current)
  }

  const deleteLink = async (code: string) => {
    const response = await fetch(`/api/links/${encodeURIComponent(code)}`, { method: "DELETE" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || "Unable to delete link")
    setLinks((current) => current.filter((link) => link.code !== code))
    setTotals((current) => ({ ...current, links: Math.max(0, current.links - 1) }))
    setResult((current) => current && current.code === code ? null : current)
    setPendingDelete(null)
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    window.setTimeout(() => setCopied((current) => current === value ? "" : current), 1600)
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  const displayName = user?.fullName || user?.email || "Account"
  const maxVisits = Math.max(1, ...links.map((link) => link.visits))
  const shortUrl = (code: string) => `${origin}/${code}`

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#495057]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#e6e9ef] bg-white px-4">
          <Link href="/generate" className="flex items-center gap-3">
            <img src="/icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-sm font-bold tracking-[0.18em] text-[#1e2a3a]">AOZHU</span>
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById("url")?.focus()}
            className="hidden items-center rounded-full border border-[#e6e9ef] bg-white px-3 py-2 text-sm text-[#8a94a6] shadow-sm sm:flex"
          >
            <span className="px-2 pr-10">Quick shortener</span>
            <span className="rounded border bg-white px-2 py-0.5 text-xs font-bold">CTRL</span>
            <span className="ml-1 rounded border bg-white px-2 py-0.5 text-xs font-bold">K</span>
          </button>
          <div className="relative ml-auto">
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[#1e2a3a] hover:bg-[#f5f7fb]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f0fb] text-xs font-bold text-[#3b7ddd]">{displayName.slice(0, 1).toUpperCase()}</span>
              <span className="hidden sm:inline">{displayName}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-[#e6e9ef] bg-white py-1 text-sm shadow-lg">
                <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f5f7fb]">
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <StatCard label="Links" value={totals.links} today={totals.linksToday} />
              <StatCard label="Clicks" value={totals.clicks} today={totals.clicksToday} />
            </div>
            <section className="rounded-md border border-[#e6e9ef] bg-white shadow-sm">
              <div className="border-b border-[#e6e9ef] px-4 py-3">
                <h2 className="text-sm font-bold text-[#1e2a3a]">Recent visits</h2>
              </div>
              <div className="space-y-3 px-4 py-4">
                {links.slice(0, 6).map((link) => (
                  <div key={link.code} className="grid grid-cols-[88px_minmax(0,1fr)_48px] items-center gap-3 text-xs">
                    <span className="truncate font-semibold text-[#1e2a3a]">/{link.code}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[#e8eef8]">
                      <span className="block h-full rounded-full bg-[#3b7ddd]" style={{ width: `${Math.max(4, (link.visits / maxVisits) * 100)}%` }} />
                    </span>
                    <span className="text-right font-semibold text-[#1e2a3a]">{link.visits.toLocaleString()}</span>
                  </div>
                ))}
                {!links.length && <p className="text-sm text-[#8a94a6]">No visits yet. Shorten a link to start counting.</p>}
              </div>
            </section>
          </div>

          <section id="shorten" className="mt-4 rounded-md border border-[#e6e9ef] bg-white p-4 shadow-sm md:p-5">
            <form onSubmit={create}>
              <div className="flex items-stretch overflow-hidden rounded-md border border-[#d9dee7]">
                <div className="min-w-0 flex-1">
                  {mode === "whatsapp" ? (
                    <input id="phone" required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp number with country code" className="h-12 w-full px-4 text-sm outline-none" />
                  ) : (
                    <input id="url" required type="url" inputMode="url" autoComplete="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="Paste a long link" className="h-12 w-full px-4 text-sm outline-none" />
                  )}
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <button type="button" aria-label="More options" onClick={() => setAdvanced((open) => !open)} className="grid h-9 w-9 place-items-center rounded-md border border-[#d9dee7] hover:bg-[#f5f7fb]">
                    <SlidersHorizontal size={16} />
                  </button>
                  <button disabled={busy} className="h-9 rounded-md bg-[#3b7ddd] px-4 text-sm font-semibold text-white hover:bg-[#2f6bc4] disabled:opacity-50">
                    {busy ? "..." : "Shorten"}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="inline-flex overflow-hidden rounded-md border border-[#d9dee7] text-xs font-semibold">
                  <button type="button" onClick={() => setMode("redirect")} className={`px-3 py-1.5 ${mode === "redirect" ? "bg-[#3b7ddd] text-white" : "bg-[#f8f9fb]"}`}>Link</button>
                  <button type="button" onClick={() => setMode("whatsapp")} className={`px-3 py-1.5 ${mode === "whatsapp" ? "bg-[#3b7ddd] text-white" : "bg-[#f8f9fb]"}`}>WhatsApp</button>
                </div>
              </div>
              {advanced && (
                <div className="mt-4 grid gap-4 border-t border-[#e6e9ef] pt-4 md:grid-cols-2">
                  {mode === "redirect" ? (
                    <label className="text-sm font-bold text-[#1e2a3a]">
                      Custom
                      <p className="mt-1 text-xs font-normal text-[#8a94a6]">If you need a custom alias, enter it below.</p>
                      <input pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, underscores, or dashes" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Type your custom alias here" className="mt-2 h-10 w-full rounded-md border border-[#d9dee7] px-3 text-sm font-normal outline-none focus:border-[#3b7ddd]" />
                    </label>
                  ) : (
                    <label className="text-sm font-bold text-[#1e2a3a]">
                      Opening message
                      <p className="mt-1 text-xs font-normal text-[#8a94a6]">Optional text that opens in the WhatsApp chat.</p>
                      <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Hi, I found you through your link" className="mt-2 h-10 w-full rounded-md border border-[#d9dee7] px-3 text-sm font-normal outline-none focus:border-[#3b7ddd]" />
                    </label>
                  )}
                </div>
              )}
              {error && <p className="mt-3 text-sm text-[#d9534f]">{error}</p>}
              {result && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-[#f5f7fb] px-3 py-3 text-sm">
                  <span className="font-semibold text-[#1e2a3a]">Short link</span>
                  <span className="min-w-0 flex-1 truncate">{shortUrl(result.code)}</span>
                  <button type="button" onClick={() => copy(shortUrl(result.code))} className="font-semibold text-[#3b7ddd]">{copied === shortUrl(result.code) ? "Copied" : "Copy"}</button>
                </div>
              )}
            </form>
          </section>

          <section id="links" className="mt-4">
            <div className="mb-3 flex items-center">
              <h2 className="text-lg font-bold text-[#1e2a3a]">Recent links</h2>
            </div>
            <div className="mb-3 flex items-center justify-between rounded-md border border-[#e6e9ef] bg-white px-3 py-3 shadow-sm">
              <button type="button" onClick={() => { pausePoll(); loadLinks(1) }} className="text-sm font-semibold text-[#3b7ddd]">Refresh</button>
              <button type="button" aria-label="Search links" onClick={() => setSearchOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-md border border-[#d9dee7]">
                {searchOpen ? <X size={16} /> : <Search size={16} />}
              </button>
            </div>
            {searchOpen && (
              <form onSubmit={submitSearch} className="mb-3 flex overflow-hidden rounded-md border border-[#d9dee7] bg-white">
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search for links" aria-label="Search for links" className="h-12 min-w-0 flex-1 px-4 text-sm outline-none" />
                <button className="px-4 text-[#3b7ddd]"><Search size={16} /></button>
              </form>
            )}
            {searchTerm && <p className="mb-3 text-xs text-[#8a94a6]">Showing results for “{searchTerm}”.</p>}
            <div className="space-y-2">
              {links.map((link) => (
                <LinkCard
                  key={link.code}
                  link={link}
                  shortUrl={shortUrl(link.code)}
                  copied={copied === shortUrl(link.code)}
                  onCopy={() => copy(shortUrl(link.code))}
                  onSave={updateDestination}
                  onDelete={() => setPendingDelete(link.code)}
                />
              ))}
              {!links.length && !loadingMore && <p className="rounded-md border border-[#e6e9ef] bg-white px-4 py-8 text-sm text-[#8a94a6]">No tracked links match this search.</p>}
            </div>
            <div ref={sentinel} className="flex flex-col items-center gap-3 py-6 text-sm text-[#8a94a6]">
              {loadingMore ? "Loading more links..." : hasMore ? (
                <button type="button" onClick={() => { pausePoll(); loadLinks(pageRef.current + 1) }} className="rounded-md border border-[#d9dee7] bg-white px-4 py-2 font-semibold text-[#1e2a3a]">Load more</button>
              ) : "All matching links loaded"}
            </div>
          </section>
        </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1e2a3a]/40 px-4">
          <div className="w-full max-w-md rounded-md bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-[#e6e9ef] px-5 py-4">
              <h3 className="font-bold text-[#1e2a3a]">Are you sure you want to delete this?</h3>
              <button type="button" aria-label="Close" onClick={() => setPendingDelete(null)}><X size={16} /></button>
            </div>
            <p className="px-5 py-4 text-sm">You are trying to delete a record. This action is permanent and cannot be reversed.</p>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-md bg-[#6c757d] px-4 py-2 text-sm font-semibold text-white">Cancel</button>
              <button type="button" onClick={() => deleteLink(pendingDelete)} className="rounded-md bg-[#d9534f] px-4 py-2 text-sm font-semibold text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, today }: { label: string; value: number; today?: number }) {
  return (
    <div className="rounded-md border border-[#e6e9ef] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#1e2a3a]">{label}</h3>
      <p className="mt-3 text-3xl font-semibold text-[#1e2a3a]">{value.toLocaleString()}</p>
      {typeof today === "number" && (
        <p className="mt-2 text-sm">
          <span className="text-[#1cbb8c]">+{today.toLocaleString()}</span> <span className="text-[#8a94a6]">Today</span>
        </p>
      )}
    </div>
  )
}

function LinkCard({ link, shortUrl, copied, onCopy, onSave, onDelete }: { link: LinkRecord; shortUrl: string; copied: boolean; onCopy: () => void; onSave: (code: string, targetUrl: string) => Promise<void>; onDelete: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-md border border-[#e6e9ef] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <a href={link.target_url} target="_blank" rel="nofollow" className="truncate text-sm font-bold text-[#1e2a3a] hover:text-[#3b7ddd]">{link.target_url}</a>
            <div className="relative">
              <button type="button" aria-label="Link actions" onClick={() => setOpen((current) => !current)} className="rounded-md p-1 hover:bg-[#f5f7fb]">
                <MoreVertical size={16} />
              </button>
              {open && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-[#e6e9ef] bg-white py-1 text-sm shadow-lg">
                  <button type="button" onClick={() => { onCopy(); setOpen(false) }} className="block w-full px-3 py-2 text-left hover:bg-[#f5f7fb]">Copy</button>
                  <button type="button" onClick={() => { onDelete(); setOpen(false) }} className="block w-full px-3 py-2 text-left text-[#d9534f] hover:bg-[#f5f7fb]">Delete</button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-[#8a94a6]">
            <span>{shortUrl}</span>
            <button type="button" onClick={onCopy} className="ml-2 font-semibold text-[#3b7ddd]">{copied ? "Copied" : "Copy"}</button>
          </p>
          <p className="mt-1 text-xs font-semibold text-[#3b7ddd]">
            <span className="font-normal text-[#8a94a6]">{timeAgo(link.created_at)}</span>
            {" · "}
            <Link href={`/stats/${encodeURIComponent(link.code)}`}>
              {link.visits.toLocaleString()} clicks ({(link.unique_visits || 0).toLocaleString()} unique)
            </Link>
          </p>
          <DestinationEditor code={link.code} targetUrl={link.target_url} onSave={onSave} />
        </div>
      </div>
    </article>
  )
}

function timeAgo(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`
}

function DestinationEditor({ code, targetUrl, onSave }: { code: string; targetUrl: string; onSave: (code: string, targetUrl: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(targetUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => setDraft(targetUrl), [targetUrl])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSave(code, draft)
      setEditing(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update link")
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="mt-2 text-xs font-semibold text-[#3b7ddd]">
        Edit destination
      </button>
    )
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-2">
      <input required type="url" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Final destination" className="h-10 w-full rounded-md border border-[#d9dee7] px-3 text-sm outline-none focus:border-[#3b7ddd]" />
      {error && <p className="text-sm text-[#d9534f]">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className="rounded-md bg-[#3b7ddd] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        <button type="button" onClick={() => { setEditing(false); setDraft(targetUrl); setError("") }} className="text-xs font-semibold text-[#6c757d]">Cancel</button>
      </div>
    </form>
  )
}

