import Link from "next/link"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"
import { BgFooter } from "@/components/svg/BgFooter"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface FooterProps {
  locale: Locale
  dict: typeof en
}

export function Footer({ locale, dict }: FooterProps) {
  return (
    <footer className="mt-auto w-full h-fit">
      <BgFooter className="block w-full -mb-px text-king-900 dark:text-king-800" fill="currentColor" />
      <div className="dark flex items-center bg-king-900 dark:bg-king-800 px-4 py-10 md:px-10 md:h-100 md:py-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <FbcnLogo className="size-8" fill="#F2EBF9" />
              <span className="font-burbank text-2xl text-primary-foreground mt-1">FOUNDERBACON</span>
            </div>
            <p className="text-sm text-muted-foreground">{dict.footer.tagline}</p>
            <ThemeToggle />
          </div>

          <div className="flex gap-10 sm:gap-16">
            <div className="flex flex-col gap-3">
              <h3 className="font-akkordeon-11 text-xl uppercase text-primary-foreground">{dict.footer.projects}</h3>
              <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.apiDocs}</Link>
              <Link href={`/${locale}/roadmap`} className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">Roadmap</Link>
              <Link href={`/${locale}/changelog`} className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">Changelog</Link>
              <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.status}</Link>
              <Link href={`/${locale}/privacy`} className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.privacy}</Link>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-akkordeon-11 text-xl uppercase text-primary-foreground">{dict.footer.social}</h3>
              <a href="https://x.com/FounderBacon" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.twitter}</a>
              <a href="https://github.com/FounderBacon" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.github}</a>
              <a href="mailto:contact@founderbacon.com" className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors">{dict.footer.contact}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
