"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { handleCallback } from "@/lib/api"
import type en from "@/lang/en.json"

type Dict = typeof en

interface Props {
  dict: Dict
  locale: string
}

export function AuthCallback({ dict, locale }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const handled = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Garde anti double-execution (StrictMode + re-render)
    if (handled.current) return
    handled.current = true

    const code = params.get("code")
    if (!code) {
      setError(dict.authCallback.missingCode)
      return
    }

    handleCallback(code)
      .then(() => {
        router.replace(`/${locale}/dashboard`)
      })
      .catch(() => {
        setError(dict.authCallback.failed)
      })
  }, [params, router, locale, dict])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 text-center">
        <img src="/svg/fbcn_logo.svg" alt="FounderBacon" className="size-16" />
        {error ? (
          <>
            <h1 className="font-[family-name:var(--font-heading)] text-xl text-card-foreground">{dict.authCallback.errorTitle}</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <a href={`/${locale}/login`} className="text-sm text-primary underline-offset-4 hover:underline">
              {dict.authCallback.backToLogin}
            </a>
          </>
        ) : (
          <>
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
            <h1 className="font-[family-name:var(--font-heading)] text-xl text-card-foreground">{dict.authCallback.title}</h1>
            <p className="text-sm text-muted-foreground">{dict.authCallback.subtitle}</p>
          </>
        )}
      </div>
    </div>
  )
}
