"use client"

import Link from "next/link"
import { ArrowUpRight, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { Logo } from "@/components/logo"

interface LinkRecord { code: string; target_url: string; visits: number }

export function LinkBuilder() {
  const [targetUrl, setTargetUrl] = useState("")
  const [alias, setAlias] = useState("")
  const [result, setResult] = useState<LinkRecord | null>(null)
  const [origin, setOrigin] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => setOrigin(window.location.origin), [])

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl, alias }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to create link")
      setResult({ code: data.code, target_url: data.targetUrl || targetUrl, visits: 0 })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create link")
    } finally {
      setBusy(false)
    }
  }

  const refresh = async () => {
    if (!result) return
    const response = await fetch(`/api/links/${encodeURIComponent(result.code)}`)
    if (response.ok) setResult(await response.json())
  }

  const trackedUrl = result ? `${origin}/r/${encodeURIComponent(result.code)}` : ""
  const directUrl = result ? `${origin}/link?url=${encodeURIComponent(targetUrl)}` : ""
  const copy = (value: string) => navigator.clipboard.writeText(value)

  return (
    <main className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <div className="mx-auto min-h-screen max-w-5xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between rounded-full border border-[#10221C]/10 bg-white/80 px-4 py-3">
          <Logo />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#10221C]/45">Link builder</span>
        </header>

        <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E7A62]">Create a tracked link</p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">One destination. A clearer signal.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#10221C]/60">Enter a destination and get a redirect URL with a visit counter. Add an alias when you want a memorable path.</p>

            <form onSubmit={create} className="mt-8 rounded-[1.75rem] border border-[#10221C]/10 bg-white p-5 sm:p-7">
              <label className="block text-sm font-semibold">Destination URL<input required type="url" placeholder="https://example.com/offer" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} className="mt-2 w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-3 outline-none focus:border-[#0E7A62]" /></label>
              <label className="mt-5 block text-sm font-semibold">Custom alias <span className="font-normal text-[#10221C]/45">optional</span><div className="mt-2 flex items-center rounded-xl border border-[#10221C]/15 bg-[#F7FAF8]"><span className="px-3 text-sm text-[#10221C]/40">/r/</span><input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="spring-offer" className="min-w-0 flex-1 bg-transparent px-1 py-3 outline-none" /></div></label>
              {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
              <button disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#10221C] px-5 py-3 text-sm font-semibold text-[#F4F7F2] hover:bg-[#0E7A62] disabled:opacity-50">{busy ? "Creating..." : "Create tracked link"}<ArrowUpRight size={16} /></button>
            </form>
          </section>

          <aside className="h-fit rounded-[1.75rem] bg-[#10221C] p-6 text-[#F4F7F2]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6F24E]">What gets tracked</p>
            <dl className="mt-6 space-y-6 text-sm">
              <Info title="Alias links" text="/r/your-alias links created here." />
              <Info title="Direct forwarders" text="/link?url=... requests are counted too." />
              <Info title="Visit totals" text="Every redirect increments its Neon row." />
            </dl>
          </aside>
        </div>

        {result && (
          <section className="rounded-[1.75rem] border border-[#10221C]/10 bg-white p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0E7A62]">Created</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Your link is live</h2>
              </div>
              <button onClick={refresh} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0E7A62]"><RefreshCw size={15} /> Refresh count</button>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <Result label="Tracked URL" value={trackedUrl} onCopy={() => copy(trackedUrl)} />
              <Result label="Direct forwarder" value={directUrl} onCopy={() => copy(directUrl)} />
              <div className="rounded-2xl bg-[#F3F6F4] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#10221C]/45">Total visits</p>
                <p className="mt-4 font-display text-5xl font-semibold tracking-tight">{result.visits.toLocaleString()}</p>
                <Link href={`/stats/${encodeURIComponent(result.code)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">View stats <ExternalLink size={14} /></Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function Info({ title, text }: { title: string; text: string }) {
  return <div><dt className="font-semibold text-white">{title}</dt><dd className="mt-1 leading-6 text-[#F4F7F2]/60">{text}</dd></div>
}

function Result({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-2xl bg-[#F3F6F4] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[#10221C]/45">{label}</p>
      <p className="mt-4 break-all text-sm leading-6">{value}</p>
      <button onClick={onCopy} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-[#0E7A62]"><Copy size={14} /> Copy</button>
    </div>
  )
}
