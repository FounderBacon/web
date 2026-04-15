"use client"

import type { WeaponDetail, RangedWeaponDetail, TierData, CraftingIngredient } from "@/lib/types/weapon"
import { weaponIconLarge } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { AssetImage } from "@/components/ui/asset-image"

interface InfoColumnProps {
  weapon: WeaponDetail
  tierData: TierData
}

export function InfoColumn({ weapon, tierData }: InfoColumnProps) {
  const rarityName = weapon.rarity === "mythic" ? "mythic" : weapon.rarity
  const topRarity = rarityName === "legendary" ? "Legendary" : rarityName
  const topImg = `/card/top-${topRarity}-h.png`
  const bottomImg = `/card/bottom-${rarityName}-h.png`
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-muted-foreground"
  const isRanged = weapon.type === "ranged"

  return (
    <div className="space-y-4">
      {/* Image arme */}
      <div className="relative mx-auto w-full">
        <img src={bottomImg} alt="" className="relative z-0 w-full" />
        <AssetImage
          src={weaponIconLarge(weapon.icon, weapon.type === "ranged" ? "weapons-ranged" : "weapons-melee")}
          alt={weapon.name}
          className="absolute inset-0 z-10 m-auto size-full object-contain drop-shadow-xl"
        />
        <img src={topImg} alt="" className="absolute inset-0 z-20 h-full w-full" />
      </div>

      {/* Description */}
      {weapon.description && (
        <p className="text-sm italic leading-relaxed text-muted-foreground">
          {weapon.description}
        </p>
      )}

      <Separator className="border-border/50" />

      {/* Infos */}
      <div className="space-y-1">
        <InfoRow label="Rarity" value={weapon.rarity} className={`capitalize ${rarityColor}`} />
        <InfoRow label="Element" value={weapon.element} className="capitalize" />
        <InfoRow label="Category" value={weapon.category} className="capitalize" />
        {isRanged && (weapon as RangedWeaponDetail).ammoType && (
          <InfoRow label="Ammo" value={(weapon as RangedWeaponDetail).ammoType as string} className="capitalize" />
        )}
        {weapon.isFounders && (
          <InfoRow label="Set" value="Founders" className="text-legendary-dark dark:text-legendary" />
        )}
      </div>

      <Separator className="border-border/50" />

      {/* Resources */}
      <div className="overflow-hidden border border-border/50">
        <div className="border-b border-border/50 bg-card px-4 py-2">
          <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Resources</p>
        </div>
        <div className="p-4">
          <CraftingSection
            crafting={tierData.crafting}
            recycle={tierData.recycle}
            evolution={tierData.evolution}
          />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${className}`}>{value}</span>
    </div>
  )
}

function CraftingSection({
  crafting,
  recycle,
  evolution,
}: {
  crafting: CraftingIngredient[]
  recycle?: CraftingIngredient[]
  evolution?: CraftingIngredient[]
}) {
  const sections: { id: string; title: string; items: CraftingIngredient[] }[] = []
  if (evolution && evolution.length > 0) sections.push({ id: "evolution", title: "Evolution", items: evolution })
  if (crafting && crafting.length > 0) sections.push({ id: "craft", title: "Craft", items: crafting })
  if (recycle && recycle.length > 0) sections.push({ id: "recycle", title: "Recycle", items: recycle })

  if (sections.length === 0) {
    return <p className="py-2 text-center text-sm text-muted-foreground">No crafting data</p>
  }

  return (
    <Accordion type="multiple" defaultValue={["craft"]}>
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="border-border/50">
          <AccordionTrigger className="py-1.5 text-xs text-muted-foreground hover:no-underline">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-0.5">
              {section.items.map((ing) => (
                <div key={ing.name} className="flex items-center justify-between py-0.5">
                  <span className="text-sm capitalize text-muted-foreground">{cleanName(ing.name)}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">x{ing.quantity}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function cleanName(name: string): string {
  return (
    name
      .replace(/^(ingredient|reagent|schematicxp)_?/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (s) => s.toUpperCase()) || name
  )
}
