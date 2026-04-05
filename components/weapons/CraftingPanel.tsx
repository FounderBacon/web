import type { CraftingIngredient } from "@/lib/types/weapon"

interface CraftingPanelProps {
  crafting: CraftingIngredient[]
  recycle?: CraftingIngredient[]
  evolution?: CraftingIngredient[]
}

export function CraftingPanel({ crafting, recycle, evolution }: CraftingPanelProps) {
  return (
    <div className="space-y-6">
      {evolution && evolution.length > 0 && (
        <div>
          <h3 className="mb-2 font-akkordeon-11 text-sm uppercase text-foreground">Evolution</h3>
          <IngredientList items={evolution} />
        </div>
      )}

      {crafting.length > 0 && (
        <div>
          <h3 className="mb-2 font-akkordeon-11 text-sm uppercase text-foreground">Craft</h3>
          <IngredientList items={crafting} />
        </div>
      )}

      {recycle && recycle.length > 0 && (
        <div>
          <h3 className="mb-2 font-akkordeon-11 text-sm uppercase text-foreground">Recycle</h3>
          <IngredientList items={recycle} />
        </div>
      )}
    </div>
  )
}

function IngredientList({ items }: { items: CraftingIngredient[] }) {
  return (
    <div className="space-y-0.5">
      {items.map((ing) => (
        <div key={ing.name} className="flex items-center justify-between gap-4 border-b border-border/30 py-1.5">
          <span className="text-sm capitalize text-muted-foreground">{cleanName(ing.name)}</span>
          <span className="shrink-0 text-sm font-semibold text-foreground">x{ing.quantity}</span>
        </div>
      ))}
    </div>
  )
}

function cleanName(name: string): string {
  return name
    .replace(/^(ingredient|reagent|schematicxp)_?/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (s) => s.toUpperCase())
    || name
}
