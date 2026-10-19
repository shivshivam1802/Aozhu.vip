import Link from "next/link"

type LogoProps = {
  href?: string
  tone?: "ink" | "light"
  markOnly?: boolean
}

export function Logo({ href = "/", tone = "ink", markOnly = false }: LogoProps) {
  const word = tone === "light" ? "text-[#F4F7F2]" : "text-[#10221C]"
  const caption = tone === "light" ? "text-[#F4F7F2]/55" : "text-[#10221C]/45"

  const mark = (
    <span className="flex items-center gap-3">
      <img src="/icon.svg" alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[1.05rem] font-semibold tracking-[0.22em] ${word}`}>AOZHU</span>
          <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.2em] ${caption}`}>Link studio</span>
        </span>
      )}
    </span>
  )

  if (!href) return mark

  return (
    <Link href={href} className="inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#0E7A62]">
      {mark}
    </Link>
  )
}
