import Link from "next/link"
import { Logo } from "@/components/logo"

const links = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Features" },
  { href: "/contact", label: "Support" },
  { href: "/generate", label: "Workspace" },
]

export function Footer() {
  return (
    <footer className="border-t border-[#10221C]/10 bg-[#10221C] text-[#F4F7F2]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_0.7fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#F4F7F2]/65">
            WhatsApp chat links, smart redirects, campaign URLs, and QR codes from one stateless workspace.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C6F24E]">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[#F4F7F2]/75 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C6F24E]">Studio</p>
          <ul className="mt-4 space-y-2 text-sm text-[#F4F7F2]/75">
            <li>AOZHU HQ, Alambagh, Lucknow</li>
            <li>
              <a href="tel:+919999999999" className="hover:text-white">+91 99999 99999</a>
            </li>
            <li>
              <a href="mailto:hello@gaurlinks.com" className="hover:text-white">hello@gaurlinks.com</a>
            </li>
            <li>
              <a href="mailto:support@gaurlinks.com" className="hover:text-white">support@gaurlinks.com</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-[#F4F7F2]/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>&copy; {new Date().getFullYear()} AOZHU. All rights reserved.</p>
          <p>Dynamic redirector for marketers and creators.</p>
        </div>
      </div>
    </footer>
  )
}
