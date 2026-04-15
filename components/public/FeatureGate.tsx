"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowLeft } from "lucide-react"
import { useFeature } from "@/components/providers"
import { SectionContainer } from "@/components/public/SectionContainer"
import type { ReactNode } from "react"

const REDIRECT_DELAY = 5

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

function DisabledScreen({ feature, redirectTo }: { feature: string; redirectTo?: string }) {
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const redirectPath = redirectTo ?? `/${params.locale}`

  useEffect(() => {
    if (countdown <= 0) {
      router.push(redirectPath)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router, redirectPath])

  return (
    <SectionContainer className="flex flex-col items-center justify-center gap-6 py-40">
      <Lock className="size-16 text-muted-foreground" />
      <h1 className="font-burbank text-4xl uppercase text-foreground md:text-5xl">Fonctionnalite indisponible</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        <span className="font-semibold">{feature}</span> est temporairement desactive. Reessaie plus tard.
      </p>
      <div className="flex flex-col items-center gap-2">
        <span className="font-burbank text-6xl text-primary">{countdown}</span>
        <p className="text-sm text-muted-foreground">Redirection automatique...</p>
      </div>
      <Link
        href={redirectPath}
        className="flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>
    </SectionContainer>
  )
}

export function FeatureGate({ feature, children, fallback, redirectTo }: FeatureGateProps) {
  const enabled = useFeature(feature)

  if (!enabled) {
    return fallback ?? <DisabledScreen feature={feature} redirectTo={redirectTo} />
  }

  return <>{children}</>
}
