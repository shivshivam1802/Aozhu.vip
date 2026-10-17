import type React from "react"
import type { Metadata } from "next"
import { Manrope, Syne } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://gaurmarketing.com"),
  title: "AOZHU – Dynamic Redirector, Smart Redirect & UTM Builder",
  description:
    "AOZHU is a powerful smart link generator that lets users create WhatsApp direct chat links, dynamic redirects, UTM campaign URLs, QR codes, and shareable smart links instantly.",
  keywords:
    "AOZHU, Dynamic Redirector, Smart Redirect, WhatsApp Link Generator, UTM Builder, QR Code Generator, Smart Links, URL Shortener, Marketing Tools",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "AOZHU – Dynamic Redirector & Smart Link Generator",
    description: "Generate WhatsApp links, smart redirects, UTM URLs, and QR codes instantly.",
    siteName: "AOZHU",
    url: "https://gaurmarketing.com",
    type: "website",
    images: [{ url: "/logo.svg", alt: "AOZHU" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AOZHU – Dynamic Redirector",
    description: "Build WhatsApp links, Smart Redirects, and UTM Campaign URLs in seconds.",
    images: ["/logo.svg"],
  },
  applicationName: "AOZHU",
  generator: "Next.js"
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AOZHU",
  "alternateName": "AOZHU Dynamic Redirector",
  "url": "https://gaurmarketing.com",
  "description": "AOZHU is a powerful smart link generator that lets users create WhatsApp direct chat links, dynamic redirects, UTM campaign URLs, QR codes, and shareable smart links instantly.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${syne.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
