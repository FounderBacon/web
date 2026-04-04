import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { getDictionary, isValidLocale } from "@/lib/i18n"

const isLanding = process.env.NEXT_PUBLIC_ENABLE_LANDING === "true"

export default async function PublicLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <div className="flex min-h-screen flex-col">
      {!isLanding && <Navbar locale={locale} dict={dict} />}
      <main className="flex-1">{children}</main>
      {!isLanding && <Footer locale={locale} dict={dict} />}
    </div>
  )
}
