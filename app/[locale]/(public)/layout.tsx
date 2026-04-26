import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import { isBeforeLaunch } from "@/lib/landing"

export default async function PublicLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)
  const beforeLaunch = isBeforeLaunch()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {locale === "fr" ? "Aller au contenu" : "Skip to content"}
      </a>
      {!beforeLaunch && <Navbar locale={locale} dict={dict} />}
      <main id="main" className="flex-1">{children}</main>
      {!beforeLaunch && <Footer locale={locale} dict={dict} />}
    </div>
  )
}
