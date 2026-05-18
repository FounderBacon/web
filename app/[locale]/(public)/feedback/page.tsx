import type { Metadata } from "next"
import { MessageSquare } from "lucide-react"
import { FeedbackForm } from "@/components/feedback/FeedbackForm"
import { FeedbackSidebar } from "@/components/feedback/FeedbackSidebar"
import { SectionContainer } from "@/components/public/SectionContainer"
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ scope?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Send feedback",
    description:
      "Report bugs, share ideas or say hello. Your feedback shapes what gets fixed and built next on FounderBacon.",
    alternates: pageAlternates(locale, "/feedback"),
    robots: { index: false, follow: false },
  }
}

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { scope } = await searchParams
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)
  const t = dict.feedback

  return (
    <SectionContainer className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-12">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-3 border-b border-border/50 pb-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          <MessageSquare className="size-3" />
          {t.kicker}
        </p>
        <h1 className="font-burbank text-4xl uppercase leading-none text-foreground md:text-6xl">
          {t.title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{t.subtitle}</p>
      </header>

      {/* Layout 2-col : form a gauche, sidebar info a droite */}
      <div className="grid gap-8 md:grid-cols-[1fr_320px] md:gap-10 xl:grid-cols-[1fr_360px]">
        <FeedbackForm t={t} scope={scope} />
        <FeedbackSidebar t={t} scope={scope} />
      </div>
    </SectionContainer>
  )
}
