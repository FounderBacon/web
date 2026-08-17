"use client"

import { Camera, Check, GitCompareArrows, QrCode, Share2 } from "lucide-react"
import { useState } from "react"
import { QrShareDialog } from "@/components/share/QrShareDialog"
import { AssetImage } from "@/components/ui/asset-image"
import { Button } from "@/components/ui/button"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import type { RangedWeaponDetail, WeaponDetail } from "@/lib/types/weapon"

interface WeaponHeaderProps {
  weapon: WeaponDetail
  onShare: () => void
  copied: boolean
  onScreenshot: () => void
  // Path complet pour le QR (ex: "/fr/weapons/ranged/destroyer?t=2&l=30")
  sharePath: string
  // URL absolue pour affichage + copy (https://...)
  shareUrl: string
  onCompare: () => void
  // Etat du comparateur, pour basculer le libelle du bouton.
  inCompare: boolean
  compareFull: boolean
  compareCount: number
}

export function WeaponHeader({
  weapon,
  onShare,
  copied,
  onScreenshot,
  sharePath,
  shareUrl,
  onCompare,
  inCompare,
  compareFull,
  compareCount,
}: WeaponHeaderProps) {
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-muted-foreground"
  const isRanged = weapon.type === "ranged"
  const [qrOpen, setQrOpen] = useState(false)

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
          <Button
            size="xs"
            variant={inCompare ? "default" : "outline"}
            onClick={onCompare}
            // Le comparateur plein n'accepte plus d'arme, sauf pour mettre a
            // jour la config de celle qui y est deja.
            disabled={compareFull && !inCompare}
            title={
              inCompare
                ? "Update this weapon's build in the comparison"
                : compareFull
                  ? "Comparison is full — remove a weapon first"
                  : "Add this weapon to the comparison"
            }
          >
            {inCompare ? <Check className="size-3" /> : <GitCompareArrows className="size-3" />}
            <span className="hidden sm:inline">
              {inCompare ? "In compare" : "Compare"}
              {compareCount > 0 && ` (${compareCount})`}
            </span>
          </Button>
          <Button size="xs" variant="outline" onClick={onShare}>
            {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </Button>
          <Button size="xs" variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="size-3" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          <Button size="xs" variant="outline" onClick={onScreenshot}>
            <Camera className="size-3" />
            <span className="hidden sm:inline">Screenshot</span>
          </Button>
        </div>
      </div>

      <QrShareDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        path={sharePath}
        fullUrl={shareUrl}
        title={weapon.name}
        description="Scan or download to share this build"
      />
    </div>
  )
}
