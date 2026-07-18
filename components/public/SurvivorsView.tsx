"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchSurvivors, type SurvivorSummary } from "@/lib/api/survivors"
import { RARITIES, RARITY_BG, RARITY_TEXT } from "@/lib/constants"
import type { Locale } from "@/lib/i18n"

const TIERS = [1, 2, 3, 4, 5]

interface SurvivorsViewProps {
  locale: Locale
}

export function SurvivorsView({ locale }: SurvivorsViewProps) {
  const [rarity, setRarity] = useState("")
  const [tier, setTier] = useState<number | "">("")
  const [survivors, setSurvivors] = useState<SurvivorSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSurvivors({
      rarity: rarity || undefined,
      tier: tier || undefined,
      limit: 50,
    })
      .then((res) => {
        if (cancelled) return
        setSurvivors(res.data)
      })
      .catch(() => {
        if (cancelled) return
        setSurvivors([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [rarity, tier])

  const hasFilter = rarity !== "" || tier !== ""

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rarity</span>
          {RARITIES.map((r) => {
            const active = rarity === r
            const dotColor = RARITY_BG[r] ?? "bg-muted"
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRarity(active ? "" : r)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  active ? "border-foreground/30 bg-card text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <span className={`size-1.5 rounded-full ${dotColor}`} />
                {r}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</span>
          {TIERS.map((t) => {
            const active = tier === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTier(active ? "" : t)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                T{t}
              </button>
            )
          })}
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setRarity("")
              setTier("")
            }}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading && survivors.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading survivors...</p>
      ) : survivors.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No survivors match your filters.</p>
      ) : (
        <div className="overflow-hidden border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-card/40">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rarity</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tier</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Level range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {survivors.map((s) => {
                const rarityClass = RARITY_TEXT[s.rarity] ?? "text-foreground"
                return (
                  <tr key={s._id} className="transition-colors hover:bg-card/40">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/${locale}/survivors/${s.slug}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className={`px-4 py-2.5 capitalize ${rarityClass}`}>{s.rarity}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <span className="font-medium text-foreground">T{s.tier}</span>
                      <span className="ml-1 text-xs">/ {s.maxTier}</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {s.levelRange.min} – {s.levelRange.max}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
