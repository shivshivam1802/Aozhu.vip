"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Target, Eye, Heart, TrendingUp, Users, Award } from "lucide-react"

export default function AboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F4] text-[#10221C] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#10221C]/15 border-t-[#0E7A62]"></div>
      </div>
    );
  }

  const principles = [
    {
      icon: Target,
      title: "Our Mission",
      text: "To simplify link redirection and tracking preparation by providing lightning-fast, zero-overhead client utilities.",
    },
    {
      icon: Eye,
      title: "Our Vision",
      text: "To become the go-to smart link optimization suite, continuously launching essential marketer helper modules.",
    },
    {
      icon: Heart,
      title: "Our Values",
      text: "Simplicity, data privacy, developer accessibility, and speed. We never store your link targets on a backend database.",
    },
  ]

  const stats = [
    { icon: Users, number: "1M+", label: "Monthly Links Generated" },
    { icon: TrendingUp, number: "5M+", label: "Successful Redirects" },
    { icon: Award, number: "99.99%", label: "Platform Uptime" },
    { icon: Target, number: "3M+", label: "QR Codes Generated" },
  ]

  const team = [
    { name: "John Gaur", role: "Founder & Lead Architect", specialty: "Product Strategy" },
    { name: "Sarah Miller", role: "Lead Engineer", specialty: "Full Stack Development" },
    { name: "David Park", role: "UI/UX Designer", specialty: "Visual Interfaces" },
    { name: "Lisa Wong", role: "Growth Marketer", specialty: "User Acquisition" },
  ]

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 pb-8 pt-28 sm:px-8">
        <section className="grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E7A62]">The studio</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
              About AOZHU
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#10221C]/70">
              We build powerful, stateless developer and marketer link utilities to help you guide users to their destination instantly and securely.
            </p>
          </div>
          <div className="rounded-[2rem] bg-[#10221C] p-8 text-[#F4F7F2]">
            <TrendingUp className="h-8 w-8 text-[#C6F24E]" />
            <p className="mt-8 font-display text-6xl font-semibold">100%</p>
            <p className="mt-2 text-sm text-[#F4F7F2]/65">Stateless & Secure</p>
          </div>
        </section>

        <section className="mt-20 grid gap-8 border-t border-[#10221C]/10 pt-12 lg:grid-cols-12">
          <h2 className="font-display text-4xl font-semibold lg:col-span-4">Our Story</h2>
          <div className="space-y-5 text-[#10221C]/70 leading-7 lg:col-span-8">
            <p>
              AOZHU was created to solve a common digital marketing problem: standard URL shorteners are often heavy, require accounts, track user data, and lack unified utilities for WhatsApp linking or campaign tags.
            </p>
            <p>
              We designed a purely client-side, stateless workspace that lets you create direct WhatsApp links, dynamic secure redirects, and UTM builder flows in seconds, with instant QR code generation built right in.
            </p>
            <p>
              Today, AOZHU serves as a crucial day-to-day tool for digital marketers, growth hackers, and content creators looking for a fast, reliable utility hub.
            </p>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-[#10221C]/10 bg-white p-7">
              <item.icon className="h-7 w-7 text-[#0E7A62]" />
              <h3 className="mt-6 font-display text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#10221C]/65">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-[2rem] bg-[#10221C] px-6 py-12 text-[#F4F7F2] sm:px-10">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">Our Impact in Numbers</h2>
            <p className="mt-3 text-[#F4F7F2]/65">Proven track record of success</p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <stat.icon className="h-5 w-5 text-[#C6F24E]" />
                <p className="mt-4 font-display text-4xl font-semibold">{stat.number}</p>
                <p className="mt-1 text-sm text-[#F4F7F2]/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 pb-8">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">Meet Our Team</h2>
            <p className="mt-3 text-[#10221C]/65">Talented professionals dedicated to your success</p>
          </div>
          <div className="mt-8 divide-y divide-[#10221C]/10 overflow-hidden rounded-[1.75rem] border border-[#10221C]/10 bg-white">
            {team.map((member, index) => (
              <div key={member.name} className="grid gap-2 px-6 py-5 sm:grid-cols-[auto_1fr_1fr] sm:items-center sm:gap-6">
                <span className="font-display text-sm text-[#0E7A62]">0{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-[#0E7A62]">{member.role}</p>
                </div>
                <p className="text-sm text-[#10221C]/55 sm:text-right">{member.specialty}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
