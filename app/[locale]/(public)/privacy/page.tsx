import type { Metadata } from "next"
import { readFile } from "fs/promises"
import { join } from "path"
import Markdown from "react-markdown"
import { getDictionary, isValidLocale } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "FounderBacon privacy policy. Learn how we handle your data.",
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  const content = await readFile(join(process.cwd(), "content", `privacy.${locale}.md`), "utf-8")

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl text-foreground">{dict.privacy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.privacy.lastUpdated}</p>
      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  )
}
