"use client"

import { usePathname } from "next/navigation"
import { useFeatures } from "@/components/providers/feature-provider"
import { FeatureGate } from "@/components/public/FeatureGate"
import type { ReactNode } from "react"

// Mapping pathname prefix → feature flag
// Si le pathname commence par la cle, la feature doit etre active
const ROUTE_FEATURES: { prefix: string; feature: string }[] = [
  { prefix: "/profile/stw/link", feature: "stwLink" },
  { prefix: "/profile/stw", feature: "stwProfile" },
  { prefix: "/search/traps", feature: "traps" },
  { prefix: "/traps", feature: "traps" },
  { prefix: "/search", feature: "search" },
]

function findFeatureForPath(pathname: string): { feature: string; redirectTo: string } | null {
  // Retire le prefix locale (ex: /en/search → /search)
  const withoutLocale = pathname.replace(/^\/[a-z]{2}/, "")

  for (const route of ROUTE_FEATURES) {
    if (withoutLocale === route.prefix || withoutLocale.startsWith(`${route.prefix}/`)) {
      // Redirige vers la home de la locale
      const locale = pathname.match(/^\/([a-z]{2})/)?.[1] ?? "en"
      return { feature: route.feature, redirectTo: `/${locale}` }
    }
  }

  return null
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const features = useFeatures()

  const match = findFeatureForPath(pathname)

  // Pas de feature requise pour cette route, ou features pas encore chargees
  if (!match) return <>{children}</>

  // Si les features sont vides (pas encore chargees), on laisse passer
  // pour eviter un flash "indisponible" au premier render
  if (Object.keys(features).length === 0) return <>{children}</>

  return (
    <FeatureGate feature={match.feature} redirectTo={match.redirectTo}>
      {children}
    </FeatureGate>
  )
}
