import { isProduction } from "@/lib/env"
import { getDictionary, type Locale } from "@/lib/i18n"
import { EnvironmentBannerClient } from "./EnvironmentBannerClient"

// Wrapper server : ne rend rien en production (le client n'est meme pas shippe).
export async function EnvironmentBanner({ locale }: { locale: Locale }) {
  if (isProduction()) return null
  const dict = await getDictionary(locale)
  return <EnvironmentBannerClient t={dict.envBanner} locale={locale} />
}
