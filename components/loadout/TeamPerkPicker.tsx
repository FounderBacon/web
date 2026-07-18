"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchTeamPerk, fetchTeamPerks, type TeamPerkSummary } from "@/lib/api/team-perks"
import { teamPerkIcon } from "@/lib/cdn"
import type { LoadoutTeamPerk } from "@/lib/loadout/store"

interface TeamPerkPickerProps {
  selected: LoadoutTeamPerk[]
  onToggle: (perk: LoadoutTeamPerk) => void
}

export function TeamPerkPicker({ selected, onToggle }: TeamPerkPickerProps) {
  const [perks, setPerks] = useState<TeamPerkSummary[]>([])
  const [loading, setLoading] = useState(true)
  // Cache des descriptions fetch lazy au hover
  const [descCache, setDescCache] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    fetchTeamPerks({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        setPerks(res.data)
      })
      .catch(() => {
        if (!cancelled) setPerks([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function ensureDescription(perkId: string) {
    if (descCache[perkId]) return
    try {
      const detail = await fetchTeamPerk(perkId)
      setDescCache((prev) => ({ ...prev, [perkId]: detail.description }))
    } catch {
      // silent
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading team perks...</p>
  }
  if (perks.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No team perks available.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {perks.map((p) => {
        const isSelected = selected.some((s) => s.perkId === p.perkId)
        const description = descCache[p.perkId]
        return (
          <li key={p._id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseEnter={() => ensureDescription(p.perkId)}
                  onFocus={() => ensureDescription(p.perkId)}
                  onClick={() =>
                    onToggle({
                      perkId: p.perkId,
                      name: p.name,
                      icon: p.icon,
                      requirements: p.requirements,
                      description: descCache[p.perkId],
                    })
                  }
                  className={`flex w-full items-center gap-3 border bg-card/40 px-3 py-2 text-left transition-colors ${
                    isSelected ? "border-primary bg-primary/10" : "border-border/50 hover:border-foreground/30 hover:bg-card/60"
                  }`}
                >
                  <div className="relative size-10 shrink-0 overflow-hidden border border-border/50 bg-muted/30">
                    <AssetImage src={teamPerkIcon(p.name)} alt="" className="absolute inset-0 size-full object-contain p-1" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.requirements}</p>
                  </div>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[11px] leading-snug">{p.requirements}</p>
                  {description && (
                    <p className="border-t border-background/20 pt-1 text-[11px] leading-snug">
                      {description}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
