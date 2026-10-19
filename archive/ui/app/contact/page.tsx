"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("gaur_premium_active") === "true";
      if (!active) {
        router.push("/");
      } else {
        setLoading(false);
      }
    }
  }, [router]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("[v0] Form submitted:", formData)
    alert("Thank you for your message! We'll get back to you within 24 hours.")

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      message: "",
    })
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F4] text-[#10221C] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#10221C]/15 border-t-[#0E7A62]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E7A62]">Contact</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Get In Touch
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#10221C]/70">
            Have questions about AOZHU? Let&apos;s start a conversation about our smart redirect and dynamic link platform.
          </p>
        </section>

        <section className="mt-12 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#10221C]/10 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(16,34,28,0.45)] sm:p-8">
            <h2 className="font-display text-3xl font-semibold">Send Us a Message</h2>
            <p className="mt-2 text-sm text-[#10221C]/60">Fill out the form below and we&apos;ll get back to you within 24 hours</p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Full Name *" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
              <Field label="Email Address *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
              <Field label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
              <Field label="Company Name" name="company" value={formData.company} onChange={handleChange} placeholder="Your Company" />
            </div>
            <label className="mt-5 block text-sm font-medium">
              Your Message *
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your feedback or question..."
                required
                rows={6}
                className="mt-2 w-full resize-none rounded-2xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 py-3 outline-none focus:border-[#0E7A62] focus:bg-white"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10221C] px-5 py-3 text-sm font-semibold text-[#F4F7F2] transition hover:bg-[#0E7A62] disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : <>Send Message <Send className="h-4 w-4" /></>}
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] bg-[#10221C] p-7 text-[#F4F7F2]">
              <h2 className="font-display text-3xl font-semibold">Contact Information</h2>
              <p className="mt-3 text-sm leading-6 text-[#F4F7F2]/65">
                Have questions? We&apos;re here to help! Reach out to us through any of the channels below.
              </p>
            </div>

            <InfoCard icon={MapPin} title="Office Address" lines={["AOZHU HQ, Alambagh, Lucknow"]} />
            <InfoCard
              icon={Phone}
              title="Phone"
              lines={["+91 99999 99999", "Mon-Fri: 9:00 AM - 6:00 PM IST"]}
              href="tel:+919999999999"
            />
            <InfoCard
              icon={Mail}
              title="Email"
              lines={["hello@gaurlinks.com", "support@gaurlinks.com"]}
              hrefs={["mailto:hello@gaurlinks.com", "mailto:support@gaurlinks.com"]}
            />

            <div className="flex aspect-video flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[#10221C]/20 bg-white text-[#10221C]/50">
              <MapPin className="mb-2 h-10 w-10" />
              <p className="text-sm">Google Maps Location</p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 h-12 w-full rounded-xl border border-[#10221C]/15 bg-[#F7FAF8] px-3 outline-none focus:border-[#0E7A62] focus:bg-white"
      />
    </label>
  )
}

function InfoCard({
  icon: Icon,
  title,
  lines,
  href,
  hrefs,
}: {
  icon: typeof Mail
  title: string
  lines: string[]
  href?: string
  hrefs?: string[]
}) {
  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-[#10221C]/10 bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7A8] text-[#10221C]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-1 space-y-0.5 text-sm text-[#10221C]/65">
          {lines.map((line, index) => {
            const lineHref = hrefs?.[index] || (index === 0 ? href : undefined)
            return lineHref ? (
              <a key={line} href={lineHref} className="block hover:text-[#0E7A62]">{line}</a>
            ) : (
              <p key={line}>{line}</p>
            )
          })}
        </div>
      </div>
    </div>
  )
}
