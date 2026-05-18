"use client"

import { Activity, MessageSquare, Shield, Sparkles, Wrench } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchFeedbackCount } from "@/lib/api/feedback"
import type { FeedbackPublicCount } from "@/lib/types/feedback"
import type en from "@/lang/en.json"

interface Props {
  t: typeof en.feedback
  scope?: string
}

export function FeedbackSidebar({ t, scope }: Props) {
  const [count, setCount] = useState<FeedbackPublicCount | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchFeedbackCount()
      .then((c) => {
        if (!cancelled) setCount(c)
      })
      .catch(() => {
        // silent : sidebar reste sans count
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <aside className="flex flex-col gap-4 md:sticky md:top-24 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:pr-1">
      {/* Scope actif */}
      {scope && (
        <div className="border border-primary/40 bg-primary/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.contextScope}
          </p>
          <p className="mt-1 font-burbank text-xl uppercase leading-none text-primary-foreground">
            {scope}
          </p>
        </div>
      )}

      {/* Stats publiques */}
      <div className="border border-border/50 bg-card/40 p-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Activity className="size-3" />
          {t.sidebarStatsTitle}
        </p>
        <p className="mt-2 font-burbank text-3xl uppercase leading-none text-foreground">
          {count ? count.total.toLocaleString() : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t.sidebarStatsCount}</p>
      </div>

      {/* How it works */}
      <div className="border border-border/50 bg-card/40 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.sidebarHowTitle}
        </p>
        <ol className="mt-3 flex flex-col gap-3 text-xs leading-relaxed text-foreground/90">
          <li className="flex gap-2">
            <Wrench className="mt-0.5 size-3.5 shrink-0 text-uncommon" />
            <span>{t.sidebarHowStep1}</span>
          </li>
          <li className="flex gap-2">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-rare" />
            <span>{t.sidebarHowStep2}</span>
          </li>
          <li className="flex gap-2">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-legendary" />
            <span>{t.sidebarHowStep3}</span>
          </li>
        </ol>
      </div>

      {/* Discord CTA */}
      <a
        href="https://discord.gg/5EVarVstFk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
      >
        <MessageSquare className="size-4" />
        {t.sidebarDiscord}
      </a>

      <p className="text-center text-[11px] text-muted-foreground">{t.privacyNote}</p>
    </aside>
  )
}
