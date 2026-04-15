"use client"

import Image from "next/image"
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
  const code = params.get("code")
  const [error, setError] = useState<string | null>(
    !code ? dict.authCallback.missingCode : null
  )

  useEffect(() => {
    // Garde anti double-execution (StrictMode + re-render)
    if (handled.current) return
    if (!code) return
    handled.current = true

    handleCallback(code)
      .then(() => {
        router.replace(`/${locale}/dashboard`)
      })
      .catch(() => {
        setError(dict.authCallback.failed)
      })
  }, [code, router, locale])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 text-center">
        <Image src="/svg/fbcn_logo.svg" alt="FounderBacon" width={64} height={64} />
        {error ? (
          <>
            <h1 className="font-(family-name:--font-heading) text-xl text-card-foreground">{dict.authCallback.errorTitle}</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <a href={`/${locale}/login`} className="text-sm text-primary underline-offset-4 hover:underline">
              {dict.authCallback.backToLogin}
            </a>
          </>
        ) : (
          <>
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
            <h1 className="font-(family-name:--font-heading) text-xl text-card-foreground">{dict.authCallback.title}</h1>
            <p className="text-sm text-muted-foreground">{dict.authCallback.subtitle}</p>
          </>
        )}
      </div>
    </div>
  )
}
