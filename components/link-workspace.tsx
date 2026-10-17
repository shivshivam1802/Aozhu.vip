"use client"

import { ArrowUpRight, Copy, Link2, RefreshCw, Search, ScrollText } from "lucide-react"
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react"
import { Logo } from "@/components/logo"

type Mode = "forwarder" | "whatsapp" | "redirect"
type LinkRecord = { code: string; target_url: string; visits: number; created_at?: string }
type LinkPage = { links: LinkRecord[]; hasMore: boolean }

export function LinkWorkspace() {
  const [mode, setMode] = useState<Mode>("forwarder")
  const [targetUrl, setTargetUrl] = useState("")
  const [alias, setAlias] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [result, setResult] = useState<LinkRecord | null>(null)
  const [links, setLinks] = useState<LinkRecord[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [origin, setOrigin] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)

  useEffect(() => {
    setOrigin(window.location.origin)
    loadLinks(1)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pageRef.current > 0 && hasMoreRef.current && !loadingRef.current) {
        loadLinks(pageRef.current + 1)
      }
    }, { rootMargin: "240px" })
    if (sentinel.current) observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, page])

  const loadLinks = async (nextPage: number, term = searchTerm) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/links?page=${nextPage}&limit=12&q=${encodeURIComponent(term)}`)
      if (!response.ok) return
      const data: LinkPage = await response.json()
      setLinks((current) => nextPage === 1 ? data.links : [...current, ...data.links])
      setPage(nextPage)
      setHasMore(data.hasMore)
      pageRef.current = nextPage
      hasMoreRef.current = data.hasMore
    } finally {
      loadingRef.current = false
      setLoadingMore(false)
    }
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTerm = searchInput.trim()
    setSearchTerm(nextTerm)
    setHasMore(true)
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
      await loadLinks(1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create link")
    } finally {
      setBusy(false)
    }
  }

  const refresh = async () => {
    if (!result) return
    const response = await fetch(`/api/links/${encodeURIComponent(result.code)}`)
    if (response.ok) {
      const updated = await response.json()
      setResult(updated)
      setLinks((current) => current.map((link) => link.code === updated.code ? updated : link))
    }
  }

  const trackedUrl = result ? `${origin}/r/${encodeURIComponent(result.code)}` : ""
  const directUrl = result ? `${origin}/link?url=${encodeURIComponent(result.target_url)}` : ""
  const copy = (value: string) => navigator.clipboard.writeText(value)

  return (
    <main className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between rounded-full border border-[#10221C]/10 bg-white/80 px-4 py-3 backdrop-blur">
          <Logo />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#10221C]/45">
            Link workspace
          </span>
        </header>

        <div className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E7A62]">Build and measure</p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
              Every useful link, in one ledger.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#10221C]/60">
              Forward a URL, start a WhatsApp chat, or create a code-based redirect. Each generated link is stored with its visit total.
            </p>

            <form onSubmit={create} className="mt-8 rounded-[1.75rem] border border-[#10221C]/10 bg-white p-5 shadow-[0_24px_60px_-36px_rgba(16,34,28,0.45)] sm:p-7">
              <div className="mb-7 grid grid-cols-3 gap-2 rounded-2xl bg-[#F3F6F4] p-1.5">
                <ModeButton active={mode === "forwarder"} onClick={() => setMode("forwarder")} icon={<ArrowUpRight size={15} />} label="Forwarder" />
                <ModeButton active={mode === "whatsapp"} onClick={() => setMode("whatsapp")} icon={<WhatsAppIcon />} label="WhatsApp" />
                <ModeButton active={mode === "redirect"} onClick={() => setMode("redirect")} icon={<Link2 size={15} />} label="Code redirect" />
              </div>
              {mode === "whatsapp" ? (
                <>
                  <label className="block text-sm font-semibold">
                    Phone number with country code
                    <input required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="919999999999" aria-describedby="phone-help" className="mt-2 w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-3 outline-none focus:border-[#0E7A62] focus:bg-white" />
                    <span id="phone-help" className="mt-2 block text-xs font-normal text-[#10221C]/50">Digits only, including country code. Example: 919999999999.</span>
                  </label>
                  <label className="mt-5 block text-sm font-semibold">
                    Opening message <span className="font-normal text-[#10221C]/45">optional</span>
                    <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder="Hi, I found you through your link..." className="mt-2 w-full resize-y rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-3 outline-none focus:border-[#0E7A62] focus:bg-white" />
                  </label>
                </>
              ) : (
                <label className="block text-sm font-semibold">
                  Destination URL
                  <input required type="url" inputMode="url" autoComplete="url" placeholder="https://example.com/offer" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} aria-describedby="url-help" className="mt-2 w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-3 outline-none focus:border-[#0E7A62] focus:bg-white" />
                  <span id="url-help" className="mt-2 block text-xs font-normal text-[#10221C]/50">The destination is normalized, so trailing-slash variants share one link and count.</span>
                </label>
              )}
              {mode === "redirect" && (
                <label className="mt-5 block text-sm font-semibold">
                  Custom code <span className="font-normal text-[#10221C]/45">optional</span>
                  <div className="mt-2 flex items-center rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] focus-within:border-[#0E7A62]">
                    <span className="px-3 text-sm text-[#10221C]/40">/r/</span>
                    <input pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, underscores, or dashes" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="spring-offer" className="min-w-0 flex-1 bg-transparent px-1 py-3 outline-none" />
                  </div>
                  <span className="mt-2 block text-xs font-normal text-[#10221C]/50">Letters, numbers, underscores, and dashes only.</span>
                </label>
              )}
              {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
              <button disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#10221C] px-5 py-3 text-sm font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62] disabled:opacity-50">
                {busy ? "Creating..." : "Create tracked link"}
                <ArrowUpRight size={16} />
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-[1.75rem] bg-[#10221C] p-6 text-[#F4F7F2] lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6F24E]">Supported links</p>
            <dl className="mt-6 space-y-6 text-sm">
              <Info title="Forwarder" text="/link?url=... sends visitors to any HTTP or HTTPS destination." />
              <Info title="WhatsApp" text="Tracked /r/ codes open wa.me chats with an optional message." />
              <Info title="Code redirect" text="/r/[code] stores a destination and increments visits." />
            </dl>
          </aside>
        </div>

        {result && (
          <section className="rounded-[1.75rem] border border-[#10221C]/10 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0E7A62]">Latest link</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{result.visits.toLocaleString()} visits recorded</h2>
              </div>
              <button onClick={refresh} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0E7A62]">
                <RefreshCw size={15} /> Refresh count
              </button>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <Result label="Tracked URL" value={trackedUrl} onCopy={() => copy(trackedUrl)} />
              <Result label="Direct forwarder" value={directUrl} onCopy={() => copy(directUrl)} />
              <div className="rounded-2xl bg-[#F3F6F4] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#10221C]/45">Destination</p>
                <p className="mt-4 break-all text-sm leading-6">{result.target_url}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#10221C]/45">Live visits are shown above</p>
              </div>
            </div>
          </section>
        )}

        <section className="py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0E7A62]">Link ledger</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Recent links and visits</h2>
            </div>
            <button onClick={() => loadLinks(1)} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0E7A62]">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl overflow-hidden rounded-full border border-[#10221C]/15 bg-white focus-within:border-[#0E7A62]">
            <Search className="m-3 shrink-0 text-[#10221C]/45" size={18} />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by destination or link code" aria-label="Search links and visit counts" className="min-w-0 flex-1 bg-transparent py-3 pr-3 text-sm outline-none" />
            <button type="submit" className="px-5 text-sm font-semibold text-[#10221C] hover:bg-[#10221C] hover:text-[#F4F7F2]">Search</button>
          </form>
          {searchTerm && <p className="mt-3 text-xs text-[#10221C]/50">Showing results for “{searchTerm}”.</p>}
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#10221C]/10 bg-white">
            {links.map((link) => <LedgerRow key={link.code} link={link} origin={origin} />)}
            {!links.length && !loadingMore && <p className="px-5 py-8 text-sm text-[#10221C]/55">No tracked links match this search.</p>}
          </div>
          <div ref={sentinel} className="flex flex-col items-center gap-3 py-8 text-sm text-[#10221C]/50">
            {loadingMore ? "Loading more links..." : hasMore ? (
              <>
                <span>Scroll for more</span>
                <button type="button" onClick={() => loadLinks(pageRef.current + 1)} className="rounded-full border border-[#10221C]/20 px-4 py-2 font-semibold text-[#10221C] hover:border-[#0E7A62]">Load more</button>
              </>
            ) : "All matching links loaded"}
          </div>
        </section>
      </div>
    </main>
  )
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm ${active ? "bg-[#10221C] text-[#F4F7F2]" : "text-[#10221C]/50"}`}>
      {icon}{label}
    </button>
  )
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-[#25D366]">
      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.55 0 .24 5.31.24 11.84c0 2.09.55 4.13 1.59 5.93L.14 23.86l6.23-1.63a11.82 11.82 0 0 0 5.71 1.46h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.17-1.23-6.15-3.41-8.37ZM12.09 21.7h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.69.97.99-3.6-.23-.37a9.82 9.82 0 1 1 8.31 4.58Zm5.39-7.36c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.04-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  )
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <dt className="font-semibold text-white">{title}</dt>
      <dd className="mt-1 leading-6 text-[#F4F7F2]/60">{text}</dd>
    </div>
  )
}

function Result({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-2xl bg-[#F3F6F4] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[#10221C]/45">{label}</p>
      <p className="mt-4 break-all text-sm leading-6">{value}</p>
      <button type="button" onClick={onCopy} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0E7A62]">
        <Copy size={14} /> Copy
      </button>
    </div>
  )
}

function LedgerRow({ link, origin }: { link: LinkRecord; origin: string }) {
  const isWhatsApp = link.target_url.includes("wa.me/") || link.target_url.includes("api.whatsapp.com/")
  const isExternalUrl = /^https?:\/\//i.test(link.target_url)
  const previewUrl = isWhatsApp || isExternalUrl ? link.target_url : `${origin}/r/${link.code}`
  const type = isWhatsApp ? "WhatsApp" : isExternalUrl ? "Forwarder" : "Code redirect"

  return (
    <div className="flex flex-col gap-3 border-b border-[#10221C]/8 px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0E7A62]">
          <ScrollText size={14} /> {type}
        </div>
        <p className="mt-2 truncate text-sm font-semibold">{previewUrl}</p>
        <p className="mt-1 truncate text-sm text-[#10221C]/50">{origin}/r/{link.code}</p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs uppercase tracking-[0.16em] text-[#10221C]/45">Visits</p>
        <p className="mt-1 font-display text-3xl font-semibold">{link.visits.toLocaleString()}</p>
      </div>
    </div>
  )
}
