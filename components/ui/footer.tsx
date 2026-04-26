import Link from "next/link"
import { BgFooter } from "@/components/svg/BgFooter"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"

interface FooterProps {
  locale: Locale
  dict: typeof en
}

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-primary-foreground"
const headingClass =
  "mb-4 font-burbank text-lg uppercase text-primary-foreground"

export function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto h-fit w-full">
      <BgFooter className="-mb-px block w-full text-king-700 dark:text-king-700" fill="currentColor" />
      <div className="dark bg-king-700 px-8 pt-12 pb-6 dark:bg-king-700 md:px-12 md:pt-14 lg:px-24 xl:px-48 xl:pt-16 xl:pb-8">
        {/* Grille principale */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 flex max-w-sm flex-col gap-3 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <FbcnLogo className="size-9" fill="#F2EBF9" />
              <span className="mt-1 font-burbank text-3xl uppercase text-primary-foreground">
                FounderBacon
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{dict.footer.tagline}</p>
          </div>

          {/* Browse */}
          <div className="flex flex-col gap-2.5">
            <h3 className={headingClass}>{dict.footer.browse}</h3>
            <Link href={`/${locale}/search/weapons`} className={linkClass}>{dict.footer.weapons}</Link>
            <Link href={`/${locale}/search/traps`} className={linkClass}>{dict.footer.traps}</Link>
            <Link href={`/${locale}/search`} className={linkClass}>{dict.footer.heroes}</Link>
            <Link href={`/${locale}/search`} className={linkClass}>{dict.footer.searchHub}</Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-2.5">
            <h3 className={headingClass}>{dict.footer.resources}</h3>
            <a
              href="https://api.founderbacon.com/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {dict.footer.apiDocs}
            </a>
            <Link href={`/${locale}/changelog`} className={linkClass}>{dict.footer.changelog}</Link>
            <Link href={`/${locale}/roadmap`} className={linkClass}>{dict.footer.roadmap}</Link>
            <Link href={`/${locale}`} className={linkClass}>{dict.footer.status}</Link>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-2.5">
            <h3 className={headingClass}>{dict.footer.community}</h3>
            <a
              href="https://x.com/FounderBacon"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {dict.footer.twitter}
            </a>
            <a
              href="https://github.com/FounderBacon"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {dict.footer.github}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start gap-3 border-t border-king-50/10 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:gap-4">
          <p>© {year} FounderBacon — Built by a Founder, for the community.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-primary-foreground transition-colors">
              {dict.footer.privacy}
            </Link>
            <a href="mailto:contact@founderbacon.com" className="hover:text-primary-foreground transition-colors">
              {dict.footer.contact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
