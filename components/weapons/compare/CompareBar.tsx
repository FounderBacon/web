"use client"

import { useState } from "react"
import { useParams, usePathname } from "next/navigation"
import { GitCompareArrows, X } from "lucide-react"
import { AssetImage } from "@/components/ui/asset-image"
import { Button } from "@/components/ui/button"
import { weaponIcon, type AssetCategory } from "@/lib/cdn"
import { useCompare, type CompareEntry } from "@/lib/compare/store"
import { CompareQuickEdit } from "./CompareQuickEdit"

function entryIconPath(entry: CompareEntry): AssetCategory {
  return entry.ref.type === "ranged" ? "weapons-ranged" : "weapons-melee"
}

// Repli lisible tant que les metadonnees ne sont pas connues (entree restauree
// depuis une URL partagee, par exemple).
function entryLabel(entry: CompareEntry): string {
  return entry.name ?? entry.ref.slug.replace(/-/g, " ")
}

export function CompareBar() {
  const params = useParams<{ locale: string }>()
  const pathname = usePathname()
  const entries = useCompare((s) => s.entries)
  const removeAt = useCompare((s) => s.removeAt)
  const [editOpen, setEditOpen] = useState(false)

  // Rien a rappeler quand on est deja dans le comparateur.
  const onComparePage = pathname.includes("/weapons/compare")
  if (entries.length === 0 || onComparePage) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <div className="pointer-events-auto flex items-center gap-3 border border-border bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
          {/* Vignettes des armes en comparaison */}
          <div className="flex items-center gap-1.5">
            {entries.map((entry, i) => (
              <div key={`${entry.ref.type}:${entry.ref.slug}`} className="group relative">
                {entry.icon ? (
                  <AssetImage
                    src={weaponIcon(entry.icon, entryIconPath(entry))}
                    alt={entryLabel(entry)}
                    title={entryLabel(entry)}
                    className="size-8 shrink-0 object-contain"
                  />
                ) : (
                  // Entree sans metadonnees : initiale du slug plutot qu'un trou.
                  <div
                    title={entryLabel(entry)}
                    className="flex size-8 shrink-0 items-center justify-center border border-border/60 text-[11px] uppercase text-muted-foreground"
                  >
                    {entryLabel(entry).charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${entryLabel(entry)} from comparison`}
                  className="absolute -right-1 -top-1 hidden rounded-full bg-background p-0.5 text-muted-foreground transition-colors hover:text-foreground group-hover:block"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>

          <Button size="sm" onClick={() => setEditOpen(true)}>
            <GitCompareArrows className="size-3.5" />
            Compare ({entries.length})
          </Button>
        </div>
      </div>

      <CompareQuickEdit open={editOpen} onOpenChange={setEditOpen} locale={params.locale} />
    </>
  )
}
