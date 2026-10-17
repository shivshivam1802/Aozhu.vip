"use client"

import Link from "next/link"
import { ArrowRight, LogIn } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { Logo } from "@/components/logo"

export function AuthHome() {
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.email, password: fields.password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Something went wrong")
      setMessage("Signed in. Open the builder when you are ready.")
      setUser(data.user)
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
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0E7A62]">
                  <LogIn size={15} /> Sign in
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Open the studio</h2>
                <form onSubmit={submit} className="mt-7 space-y-4">
                  <Field label="Email" type="email" value={fields.email} onChange={(value) => setFields((current) => ({ ...current, email: value }))} />
                  <Field label="Password" type="password" value={fields.password} onChange={(value) => setFields((current) => ({ ...current, password: value }))} />
                  {message && <p className="text-sm leading-5 text-[#0E7A62]">{message}</p>}
                  <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#10221C] px-4 py-3 text-sm font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62] disabled:opacity-50">
                    {loading ? "Working..." : "Sign in"}
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
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-2.5 outline-none transition focus:border-[#0E7A62] focus:bg-white"
      />
    </label>
  )
}
