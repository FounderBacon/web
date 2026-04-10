import { Suspense } from "react"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import { AuthCallback } from "@/components/public/AuthCallback"

export default async function AuthCallbackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <Suspense fallback={null}>
      <AuthCallback dict={dict} locale={locale} />
    </Suspense>
  )
}
