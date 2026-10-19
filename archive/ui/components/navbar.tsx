"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, Shield, Sparkles, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"

interface UserProfile {
  id: string
  email: string
  fullName: string
  role: "user" | "admin"
  paymentStatus: "pending" | "verified" | "rejected"
}

const links = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Features" },
  { href: "/contact", label: "Support" },
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          setIsPremium(data.user.role === "admin" || data.user.paymentStatus === "verified")
        } else {
          setUser(null)
          setIsPremium(false)
        }
      }
    } catch (e) {
      console.error("Navbar session fetch error:", e)
    }
  }

  useEffect(() => {
    fetchUser()
    const interval = setInterval(fetchUser, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        setUser(null)
        setIsPremium(false)
        window.location.href = "/"
      }
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-[#10221C]/10 bg-[#F7FAF8]/90 px-3 py-2 shadow-[0_16px_40px_-28px_rgba(16,34,28,0.7)] backdrop-blur-xl sm:px-4">
        <Logo />

        {isPremium && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-[#10221C] text-[#F4F7F2]" : "text-[#10221C]/70 hover:bg-[#10221C]/5 hover:text-[#10221C]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Link
              href="/admin/payments"
              className="hidden items-center gap-1.5 rounded-full border border-[#10221C]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#10221C] transition hover:border-[#0E7A62] sm:inline-flex"
            >
              <Shield className="h-3.5 w-3.5 text-[#0E7A62]" />
              Admin
            </Link>
          )}

          {isPremium && user?.role !== "admin" && (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#E7F7A8] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#1A3A12] sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              PREMIUM
            </span>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[160px] truncate text-right text-xs text-[#10221C]/55 lg:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#10221C] px-3 py-2 text-xs font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <span className="hidden rounded-full border border-[#10221C]/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#10221C]/55 md:inline-flex">
              v1.0.0 Stable
            </span>
          )}

          {isPremium && (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#10221C]/10 bg-white md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {open && isPremium && (
        <nav className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl border border-[#10221C]/10 bg-[#F7FAF8] p-3 shadow-lg md:hidden" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-2xl px-4 py-3 text-sm font-medium text-[#10221C] hover:bg-white">
              {link.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin/payments" className="rounded-2xl px-4 py-3 text-sm font-medium text-[#10221C] hover:bg-white sm:hidden">
              Admin Console
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
