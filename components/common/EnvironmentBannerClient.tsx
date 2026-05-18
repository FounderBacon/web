"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, MessageSquare, X } from "lucide-react"
import Link from "next/link"
import { ENVIRONMENT } from "@/lib/env"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"

const STORAGE_KEY = "fbcn:env-banner-dismissed"

const ENV_LABEL: Record<typeof ENVIRONMENT, string> = {
  production: "PROD",
  staging: "STAGING",
  development: "DEV",
}

const ENV_COLOR: Record<typeof ENVIRONMENT, string> = {
  production: "bg-uncommon text-king-900",
  staging: "bg-rare text-king-900",
  development: "bg-epic text-white",
}

interface Props {
  t: typeof en.envBanner
  locale: Locale
}

export function EnvironmentBannerClient({ t, locale }: Props) {
  // false par defaut pour eviter un flash en SSR ; on revele apres mount.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === "true"
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "true")
    setVisible(false)
  }

  if (!visible) return null

  const label = ENV_LABEL[ENVIRONMENT]
  const color = ENV_COLOR[ENVIRONMENT]

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
    >
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rare" aria-hidden="true" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-card-foreground">
            <span className={`mr-2 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${color}`}>
              {label}
            </span>
            {t.title}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t.description}{" "}
            <a
              href="https://founderbacon.com"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.liveLink}
            </a>
            .
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{t.feedbackPrompt}</span>
            <Link
              href={`/${locale}/feedback`}
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setVisible(false)}
            >
              {t.feedbackLink}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.dismiss}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
