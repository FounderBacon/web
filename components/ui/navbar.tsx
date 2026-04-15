"use client"

import { useState } from "react"
import Link from "next/link"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"
import { BgNavbar } from "@/components/svg/BgNavbar"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { SearchBar } from "@/components/ui/search-bar"

interface NavbarProps {
  locale: Locale
  dict: typeof en
}

const navLinkClass = "text-base uppercase font-bold text-primary-foreground px-3 py-1 transition-colors duration-200 hover:bg-white hover:text-king-900"

export function Navbar({ locale, dict }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between bg-king-900 px-4 py-4 dark:bg-king-800 md:px-10">
        <div className="flex items-center gap-2">
          <FbcnLogo className="size-7 md:size-9" fill="#F2EBF9" />
          <Link href={`/${locale}`} className="mt-1 font-burbank text-xl text-primary-foreground md:mt-1.5 md:text-3xl">FOUNDERBACON</Link>
        </div>

        <SearchBar locale={locale} />

        <button type="button" onClick={() => setOpen(!open)} className="flex flex-col gap-1.5 md:hidden" aria-label="Menu">
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        <div className="hidden items-center gap-6 md:flex">
          <Link href={`/${locale}/search`} className={navLinkClass}>{dict.navbar.search}</Link>
          <a href="https://api.founderbacon.com/docs/" target="_blank" rel="noopener noreferrer" className={navLinkClass}>{dict.navbar.API}</a>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 bg-king-900 px-4 pb-6 dark:bg-king-800 md:hidden">
          <SearchBar locale={locale} variant="mobile" onNavigate={() => setOpen(false)} />
          <Link href={`/${locale}/search`} className={navLinkClass} onClick={() => setOpen(false)}>{dict.navbar.search}</Link>
          <a href="https://api.founderbacon.com/docs/" target="_blank" rel="noopener noreferrer" className={navLinkClass} onClick={() => setOpen(false)}>{dict.navbar.API}</a>
        </div>
      )}

      <BgNavbar className="pointer-events-none absolute -left-20 z-40 block h-auto w-full text-king-900 dark:text-king-800" fill="currentColor" />
    </nav>
  )
}
