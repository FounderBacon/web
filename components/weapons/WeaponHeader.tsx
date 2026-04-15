"use client"

import type { WeaponDetail, RangedWeaponDetail } from "@/lib/types/weapon"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { AssetImage } from "@/components/ui/asset-image"
import { Share2, Check, Camera } from "lucide-react"

interface WeaponHeaderProps {
  weapon: WeaponDetail
  onShare: () => void
  copied: boolean
  onScreenshot: () => void
}

export function WeaponHeader({ weapon, onShare, copied, onScreenshot }: WeaponHeaderProps) {
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-muted-foreground"
  const isRanged = weapon.type === "ranged"

  return (
    <div className="border-b border-border/50 bg-background px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AssetImage
            src={weaponIcon(weapon.icon, weapon.type === "ranged" ? "weapons-ranged" : "weapons-melee")}
            alt={weapon.name}
            className="size-10 shrink-0 object-contain sm:size-12"
          />
          <div>
            <h1 className="text-lg font-bold uppercase leading-tight text-foreground sm:text-xl">
              {weapon.name}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              <span className={`font-medium capitalize ${rarityColor}`}>{weapon.rarity}</span>
              {" / "}
              <span className="capitalize">{weapon.category}</span>
              {isRanged && (
                <>
                  {" / "}
                  <span className="capitalize">{(weapon as RangedWeaponDetail).ammoType}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="xs" variant="outline" onClick={onShare}>
            {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </Button>
          <Button size="xs" variant="outline" onClick={onScreenshot}>
            <Camera className="size-3" />
            <span className="hidden sm:inline">Screenshot</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
