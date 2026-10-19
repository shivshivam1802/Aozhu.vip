"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { MessageSquare, Link2, Globe, QrCode, ArrowUpRight } from "lucide-react"

export default function ServicesPage() {
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

  const services = [
    {
      icon: MessageSquare,
      title: "WhatsApp Direct Chat Links",
      description:
        "Generate direct click-to-chat links for any phone number with pre-filled custom message templates so customers can reach you instantly.",
      features: [
        "Pre-filled text messages",
        "Clean mobile-ready format",
        "Zero registration required",
        "Instant WhatsApp launch",
      ],
    },
    {
      icon: Link2,
      title: "Smart Redirect Links",
      description:
        "Create lightweight, stateless redirection links that forward visitors to any URL securely, using either clean readable paths or base64 obfuscation.",
      features: [
        "Base64 secure obfuscation",
        "Clean URL forwarding",
        "100% serverless redirections",
        "Privacy-respecting hops",
      ],
    },
    {
      icon: Globe,
      title: "UTM Campaign Builder",
      description:
        "Standardize and build your marketing campaign URLs with Google Analytics UTM parameters to easily track your traffic sources and mediums.",
      features: [
        "Set source, medium, campaign",
        "Obfuscated target redirection",
        "Pre-validated URL formats",
        "Marketing strategy integration",
      ],
    },
    {
      icon: QrCode,
      title: "Instant QR Code Generator",
      description:
        "Get instant, downloadable QR code images for any of your generated links to place on brochures, flyers, slides, and packaging.",
      features: [
        "Dynamic high-resolution images",
        "One-click direct downloads",
        "Universal scanner compatibility",
        "Offline-to-online connection",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-[#10221C]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 pb-8 pt-28 sm:px-8">
        <section className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E7A62]">What we build</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Our Utilities
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#10221C]/70">
            Comprehensive smart linking utilities designed to help your campaigns run efficiently
          </p>
        </section>

        <section className="mt-14 divide-y divide-[#10221C]/10 overflow-hidden rounded-[2rem] border border-[#10221C]/10 bg-white">
          {services.map((service, index) => (
            <article key={service.title} className="grid gap-6 px-6 py-8 md:grid-cols-[120px_1fr] md:px-8">
              <div className="flex items-start justify-between md:block">
                <span className="font-display text-sm text-[#0E7A62]">0{index + 1}</span>
                <service.icon className="h-7 w-7 text-[#10221C] md:mt-4" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-semibold">{service.title}</h2>
                <p className="mt-3 max-w-2xl text-[#10221C]/65 leading-7">{service.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="rounded-full bg-[#F3F6F4] px-3 py-1.5 text-xs font-medium text-[#10221C]/75">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section className="my-16 grid overflow-hidden rounded-[2rem] bg-[#10221C] text-[#F4F7F2] md:grid-cols-[1.4fr_0.6fr]">
          <div className="p-8 sm:p-12">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">Ready to Build a Link?</h2>
            <p className="mt-4 max-w-xl text-[#F4F7F2]/70">
              Start creating your custom WhatsApp links, redirects, and campaign URLs right now.
            </p>
          </div>
          <Link href="/" className="flex items-center justify-between gap-4 bg-[#C6F24E] px-8 py-8 text-[#10221C] transition hover:bg-[#d4f86a] sm:px-10">
            <span className="font-display text-2xl font-semibold">Launch Link Workspace</span>
            <ArrowUpRight className="h-6 w-6 shrink-0" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
