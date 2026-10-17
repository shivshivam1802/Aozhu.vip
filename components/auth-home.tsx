"use client"

import Link from "next/link"
import { ArrowRight, Check, Copy, LogIn, UserPlus, Wallet } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { Logo } from "@/components/logo"

export function AuthHome() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [fields, setFields] = useState({
    fullName: "",
    email: "",
    password: "",
    transactionHash: "",
    walletAddress: "",
  })

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  const updateField = (name: string, value: string) => setFields((current) => ({ ...current, [name]: value }))
  const walletAddress = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || ""
  const walletQr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(walletAddress)}`

  const copyWallet = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopiedWallet(true)
    window.setTimeout(() => setCopiedWallet(false), 1800)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
    const body = mode === "login"
      ? { email: fields.email, password: fields.password }
      : fields

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Something went wrong")
      setMessage(mode === "login" ? "Signed in. Open the builder when you are ready." : "Account created. You can sign in once payment is reviewed.")
      if (mode === "login") setUser(data.user)
      else setMode("login")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#10221C] px-6 py-7 text-[#F4F7F2] sm:px-10 sm:py-9">
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#0E7A62]/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#C6F24E]/15 blur-3xl" />
          <Logo tone="light" />
          <div className="relative z-10 max-w-xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C6F24E]">Simple link intelligence</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
              Make a link. Know when it moves.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#F4F7F2]/70 sm:text-lg">
              Build direct forwarding links, share them anywhere, and see every visit in one quiet workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-sm text-[#F4F7F2]/80">
              {["Direct redirects", "Visit counts", "Neon-backed"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs uppercase tracking-[0.18em] text-[#F4F7F2]/40">AOZHU link studio</p>
        </section>

        <section className="flex items-center px-5 py-12 sm:px-10">
          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[#10221C]/10 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(16,34,28,0.55)] sm:p-8">
            {user ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0E7A62]">Welcome back</p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">{user.fullName || user.email}</h2>
                <p className="mt-3 text-sm leading-6 text-[#10221C]/60">Your workspace is ready. Create a tracked link and keep its stats close.</p>
                <Link href="/generate" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10221C] px-4 py-3 text-sm font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62]">
                  Go to builder <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7 grid grid-cols-2 rounded-full bg-[#F3F6F4] p-1">
                  <button type="button" onClick={() => setMode("login")} className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold ${mode === "login" ? "bg-[#10221C] text-[#F4F7F2]" : "text-[#10221C]/45"}`}>
                    <LogIn size={15} /> Sign in
                  </button>
                  <button type="button" onClick={() => setMode("register")} className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold ${mode === "register" ? "bg-[#10221C] text-[#F4F7F2]" : "text-[#10221C]/45"}`}>
                    <UserPlus size={15} /> Register
                  </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  {mode === "register" && <Field label="Name" value={fields.fullName} onChange={(value) => updateField("fullName", value)} />}
                  <Field label="Email" type="email" value={fields.email} onChange={(value) => updateField("email", value)} />
                  <Field label="Password" type="password" value={fields.password} onChange={(value) => updateField("password", value)} />
                  {mode === "register" && (
                    <>
                      <div className="rounded-2xl border border-[#0E7A62]/25 bg-[#F3F6F4] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0E7A62]"><Wallet size={14} /> Web3 access</p>
                            <p className="mt-2 text-sm font-semibold">Send 10 USDT on TRON (TRC20)</p>
                            <p className="mt-1 text-xs leading-5 text-[#10221C]/55">Submit the transaction hash below for account review.</p>
                          </div>
                          <img src={walletQr} alt="USDT wallet QR code" className="size-16 rounded-lg bg-white p-1" />
                        </div>
                        <button type="button" onClick={copyWallet} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#10221C]/10 bg-white px-3 py-2 text-left text-xs font-mono hover:border-[#0E7A62]">
                          <span className="min-w-0 flex-1 truncate">{walletAddress}</span>
                          {copiedWallet ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <Field label="Transaction hash" value={fields.transactionHash} onChange={(value) => updateField("transactionHash", value)} />
                      <Field label="Wallet address (optional)" value={fields.walletAddress} onChange={(value) => updateField("walletAddress", value)} />
                    </>
                  )}
                  {message && <p className="text-sm leading-5 text-[#0E7A62]">{message}</p>}
                  <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#10221C] px-4 py-3 text-sm font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62] disabled:opacity-50">
                    {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        required={label !== "Wallet address (optional)"}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-2.5 outline-none transition focus:border-[#0E7A62] focus:bg-white"
      />
    </label>
  )
}
