"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BgNavbar } from "@/components/svg/BgNavbar"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { SearchBar } from "@/components/ui/search-bar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"

interface NavbarProps {
  locale: Locale
  dict: typeof en
}

const navLinkBase = "text-base uppercase font-bold px-3 py-1 transition-colors duration-200"
const navLinkInactive = "text-primary-foreground hover:bg-white hover:text-king-900"
const navLinkActive = "bg-white/10 text-primary-foreground"

export function Navbar({ locale, dict }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href.startsWith("http")) return false
    if (href === `/${locale}`) return pathname === `/${locale}` || pathname === `/${locale}/`
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function linkClass(href: string): string {
    return `${navLinkBase} ${isActive(href) ? navLinkActive : navLinkInactive}`
  }

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between bg-king-700 px-8 py-4 dark:bg-king-700 md:px-12 lg:px-24 xl:px-48">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <FbcnLogo className="size-7 md:size-9" fill="#F2EBF9" />
          <span className="mt-1 hidden font-burbank text-xl text-primary-foreground md:mt-1.5 md:inline md:text-3xl">
            FOUNDERBACON
          </span>
        </Link>

        <SearchBar locale={locale} />

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-primary-foreground transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href={`/${locale}/changelog`} className={linkClass(`/${locale}/changelog`)}>
            {dict.navbar.changelog}
          </Link>
          <a
            href="https://api.founderbacon.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${navLinkBase} ${navLinkInactive}`}
          >
            {dict.navbar.API}
          </a>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 bg-king-700 px-8 pb-6 dark:bg-king-700 lg:hidden">
          <SearchBar locale={locale} variant="mobile" onNavigate={() => setOpen(false)} />
          <Link
            href={`/${locale}/search`}
            className={linkClass(`/${locale}/search`)}
            onClick={() => setOpen(false)}
          >
            {dict.navbar.search}
          </Link>
          <Link
            href={`/${locale}/changelog`}
            className={linkClass(`/${locale}/changelog`)}
            onClick={() => setOpen(false)}
          >
            {dict.navbar.changelog}
          </Link>
          <a
            href="https://api.founderbacon.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${navLinkBase} ${navLinkInactive}`}
            onClick={() => setOpen(false)}
          >
            {dict.navbar.API}
          </a>
          <div className="px-3">
            <ThemeToggle />
          </div>
        </div>
      )}

      <BgNavbar
        className="pointer-events-none absolute -left-20 z-40 block h-auto w-full text-king-700 dark:text-king-700"
        fill="currentColor"
      />
    </nav>
  )
}
