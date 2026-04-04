import { getDictionary, isValidLocale } from "@/lib/i18n"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">{dict.dashboard.title}</h1>
    </div>
  )
}
