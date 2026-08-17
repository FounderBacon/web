"use client"

import Link from "next/link"
import { GitCompareArrows, X } from "lucide-react"
import { AssetImage } from "@/components/ui/asset-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { weaponIcon, type AssetCategory } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { useCompare, MAX_COMPARE } from "@/lib/compare/store"
import { useCompareEntries, type ResolvedEntry } from "@/lib/compare/useCompareEntries"
import { useLoadout } from "@/lib/loadout/store"
import { loadoutToApiPayload } from "@/lib/loadout/selectors"
import { CompareStatsTable } from "./CompareStatsTable"

interface CompareQuickEditProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
}

function iconCategory(type: "ranged" | "melee"): AssetCategory {
  return type === "ranged" ? "weapons-ranged" : "weapons-melee"
}

// En-tete d'une colonne : identite de l'arme et build qui lui est propre.
function ColumnHeader({ item, onRemove }: { item: ResolvedEntry; onRemove: () => void }) {
  const { entry, weapon } = item
  const name = weapon?.name ?? entry.name ?? entry.ref.slug.replace(/-/g, " ")
  const icon = weapon?.icon ?? entry.icon
  const rarity = weapon?.rarity ?? entry.rarity

  const build: string[] = []
  if (entry.init.tier) build.push(`Tier ${entry.init.tier}`)
  if (entry.init.material) build.push(entry.init.material)
  if (entry.init.level) build.push(`Lv ${entry.init.level}`)
  const perkCount = entry.init.perkIds?.filter(Boolean).length ?? 0
  if (perkCount > 0) build.push(`${perkCount} perk${perkCount > 1 ? "s" : ""}`)

  return (
    <div className="relative flex flex-col items-center gap-1.5 px-2 text-center">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name} from comparison`}
        className="absolute right-0 top-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>

      {icon ? (
        <AssetImage
          src={weaponIcon(icon, iconCategory(entry.ref.type))}
          alt={name}
          className="size-10 shrink-0 object-contain"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center border border-border/60 text-xs uppercase text-muted-foreground">
          {name.charAt(0)}
        </div>
      )}

      <p className="w-full truncate text-xs font-bold uppercase leading-tight text-foreground">{name}</p>
      {rarity && (
        <p className={`text-[10px] capitalize ${RARITY_TEXT[rarity] ?? "text-muted-foreground"}`}>{rarity}</p>
      )}
      {/* Le build est propre a chaque arme : il ne se propage pas aux autres colonnes. */}
      <p className="w-full text-[10px] leading-snug text-muted-foreground">
        {build.length > 0 ? build.join(" / ") : "Default build"}
      </p>
    </div>
  )
}

/**
 * Comparaison en modal, ouverte depuis la barre flottante. Lecture seule :
 * le reglage fin du build reste sur la page dediee, qui a la place pour
 * afficher les selecteurs.
 */
export function CompareQuickEdit({ open, onOpenChange, locale }: CompareQuickEditProps) {
  const entries = useCompare((s) => s.entries)
  const removeAt = useCompare((s) => s.removeAt)
  const clear = useCompare((s) => s.clear)

  // Le loadout est partage par toutes les colonnes, comme sur la page compare.
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const heroPayload = loadoutToApiPayload({ commander, support, teamPerks })

  // Les appels ne partent qu'a l'ouverture : la modal est montee en permanence.
  const { resolved, loading } = useCompareEntries(entries, heroPayload, open)

  const columns = resolved.map((r) => r.stats)
  const names = resolved.map((r) => r.weapon?.name ?? r.entry.name ?? null)
  const hasStats = columns.some((c) => c !== null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/50 px-4 py-3">
          <DialogTitle className="font-burbank text-sm uppercase tracking-wider">
            Comparison ({entries.length}/{MAX_COMPARE})
          </DialogTitle>
        </DialogHeader>

        {/* En-tetes de colonnes, alignes sur la grille du tableau. Le meme
            conteneur scrollable que les stats evite d'ecraser les colonnes
            sur mobile. */}
        <div className="overflow-x-auto border-b border-border/50 bg-card">
          <div
            className="grid items-start gap-2 px-4 py-3"
            style={{
              gridTemplateColumns: `minmax(110px,1.2fr) repeat(${resolved.length}, minmax(100px,1fr))`,
              minWidth: `${140 + resolved.length * 110}px`,
            }}
          >
            <div />
            {resolved.map((item, i) => (
              <ColumnHeader
                key={`${item.entry.ref.type}:${item.entry.ref.slug}`}
                item={item}
                onRemove={() => removeAt(i)}
              />
            ))}
          </div>
        </div>

        {loading && !hasStats ? (
          <div className="flex justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : entries.length < 2 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Add at least two weapons to compare.
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="overflow-x-auto p-4">
              <div style={{ minWidth: `${140 + resolved.length * 110}px` }}>
                <CompareStatsTable columns={columns} names={names} />
              </div>
            </div>
          </TooltipProvider>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border/50 px-4 py-3">
          <Button size="xs" variant="ghost" onClick={clear} disabled={entries.length === 0}>
            Clear all
          </Button>
          <Button size="xs" asChild>
            <Link href={`/${locale}/weapons/compare`} onClick={() => onOpenChange(false)}>
              <GitCompareArrows className="size-3" />
              Open full comparison
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
