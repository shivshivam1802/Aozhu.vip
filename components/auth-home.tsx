"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

export function AuthHome() {
  const router = useRouter()
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState({ email: "", password: "" })

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          router.replace("/generate")
        }
      })
      .catch(() => setUser(null))
  }, [router])

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
      setUser(data.user)
      router.replace("/generate")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-4 text-[#495057]">
      <div className="w-full max-w-md rounded-md border border-[#e6e9ef] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src="/icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-[#1e2a3a]">AOZHU</p>
            <p className="text-xs text-[#8a94a6]">Dashboard</p>
          </div>
        </div>
        {user ? (
          <p className="text-sm">Opening your dashboard...</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#1e2a3a]">Sign in</h1>
            <p className="mt-2 text-sm text-[#8a94a6]">Open the link dashboard.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Email" type="email" value={fields.email} onChange={(value) => setFields((current) => ({ ...current, email: value }))} />
              <Field label="Password" type="password" value={fields.password} onChange={(value) => setFields((current) => ({ ...current, password: value }))} />
              {message && <p className="text-sm text-[#d9534f]">{message}</p>}
              <button disabled={loading} className="h-11 w-full rounded-md bg-[#3b7ddd] text-sm font-semibold text-white hover:bg-[#2f6bc4] disabled:opacity-50">
                {loading ? "Working..." : "Sign in"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-semibold text-[#1e2a3a]">
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block h-11 w-full rounded-md border border-[#d9dee7] px-3 text-sm font-normal outline-none focus:border-[#3b7ddd]"
      />
    </label>
  )
}
