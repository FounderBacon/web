"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CARD_REVEAL_ITEM_TRANSITION,
  CARD_REVEAL_ITEM_VARIANTS,
  CardRevealModal,
} from "@/components/public/CardRevealModal"
import type { Rarity } from "@/lib/types/shared"
import { RARITY_BG, RARITY_BORDER, RARITY_GRADIENT, RARITY_TEXT } from "@/lib/constants"

// Une variante affichee dans le fan (icone + lien vers sa page rarete).
export interface FanVariant {
  rarity: Rarity
  href: string
  iconUrl: string
}

interface FanCardProps {
  name: string
  maxRarity: Rarity
  mainIconUrl: string
  subtitle?: ReactNode
  variants: FanVariant[]
}

// Carte groupee par nom. Au repos, la max rarete. Desktop hover -> fan inline.
// Mobile (no hover) tap -> shared layout vers le centre (CardRevealModal) puis
// les autres variantes apparaissent autour. Si 1 seule variante, comportement
// = card standard cliquable.
export function FanCard({ name, maxRarity, mainIconUrl, subtitle, variants }: FanCardProps) {
  const singleVariant = variants.length <= 1
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  // Visibilite du secondary : separe de modalOpen pour pouvoir le faire exit
  // AVANT le main au close (reverse de l'open : variantes disparaissent d'abord,
  // puis main scale-down vers le centre)
  const [showSecondary, setShowSecondary] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detecte si l'appareil n'a pas de hover (touch only)
  useEffect(() => {
    const mql = window.matchMedia("(hover: none)")
    const update = () => setIsTouchDevice(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  // Fermeture au tap-outside du fan desktop
  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  const main = variants.find((v) => v.rarity === maxRarity) ?? variants[0]
  const borderColor = RARITY_BORDER[maxRarity] ?? "border-l-border"
  const gradient = RARITY_GRADIENT[maxRarity] ?? "from-transparent"
  const rarityTextColor = RARITY_TEXT[maxRarity] ?? "text-muted-foreground"
  const rarityBgColor = RARITY_BG[maxRarity] ?? "bg-muted"

  // Toutes les variantes triees ASC (commune -> max) pour le fan desktop ET le modal.
  // On inclut la max-rarity car le main fade au hover -> le user clique sur n'importe
  // quelle variante incluant la max (qui prend la place du main visuellement)
  const sortedAll = [...variants].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])
  const sortedAllDesc = [...variants].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])

  const mainCardInner = (
    <>
      <div className={`relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br ${gradient} to-transparent`}>
        <span className={`absolute right-2 top-2 size-2 rounded-full ${rarityBgColor} shadow-sm`} />
        {variants.length > 1 && (
          <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm">
            <span className="tabular-nums">{variants.length}</span>
          </span>
        )}
        <AssetImage
          src={mainIconUrl}
          alt={name}
          className="size-4/5 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 border-t border-border/50 bg-card px-3 py-2.5">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{name}</p>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={`font-semibold ${rarityTextColor}`}>{maxRarity}</span>
          {subtitle && (
            <>
              <span className="text-border">·</span>
              {subtitle}
            </>
          )}
        </p>
      </div>
    </>
  )

  // Cas 1 variante : pas de fan, le main devient un Link direct (UX standard)
  if (singleVariant) {
    return (
      <Link
        href={main.href}
        className={`group relative flex h-full flex-col overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-card hover:shadow-lg`}
      >
        {mainCardInner}
      </Link>
    )
  }

  const mainCardClasses = `group relative z-20 flex h-full w-full cursor-pointer flex-col overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card/40 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-card hover:shadow-lg`

  function openReveal() {
    setModalOpen(true)
    setShowSecondary(true)
  }

  function closeReveal() {
    // Sequence reverse de l'open :
    // 1. Cache le secondary -> stagger exit reverse (~280ms)
    // 2. Apres l'exit secondary, exit du modal -> main scale-down + fade
    setShowSecondary(false)
    window.setTimeout(() => {
      setModalOpen(false)
    }, 280)
  }

  function handleMainClick() {
    if (isTouchDevice) {
      openReveal()
    } else {
      setOpen((prev) => !prev)
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        className={`relative ${open ? "z-50" : "z-0"}`}
        onMouseEnter={isTouchDevice ? undefined : () => setOpen(true)}
        onMouseLeave={isTouchDevice ? undefined : () => setOpen(false)}
        // A11y : declare le groupe + son etat "expanded" quand le fan est ouvert
        role={isTouchDevice ? undefined : "group"}
        aria-expanded={isTouchDevice ? undefined : open}
        aria-label={
          isTouchDevice
            ? undefined
            : `${name} — ${variants.length} ${variants.length > 1 ? "variants" : "variant"} (hover to expand)`
        }
      >
        {/* Fan desktop : TOUTES les variantes (incluant la max) spread en eventail.
            Le main fade au hover -> le user clique sur la variante de son choix */}
        {!isTouchDevice && (
          <AnimatePresence>
            {open &&
              sortedAll.map((variant, i) => {
                const n = sortedAll.length
                const ratio = n === 1 ? 0 : i / (n - 1) - 0.5
                const angle = ratio * 28
                const translateX = ratio * 100
                const translateY = Math.abs(ratio) * 12 - 4
                const scale = 0.92 + Math.abs(ratio) * 0.12 // centre 0.92 -> bords ~0.98

                const rarityTextColor = RARITY_TEXT[variant.rarity] ?? "text-foreground"
                return (
                  <motion.div
                    key={variant.href}
                    initial={{ opacity: 0, scale: 0.7, rotate: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: 1,
                      scale,
                      rotate: angle,
                      x: translateX,
                      y: translateY,
                      zIndex: 30 + i,
                    }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 0, x: 0, y: 0 }}
                    // Hover : la carte se decale vers le haut (-25px) -> elle se
                    // distingue visuellement sans deborder lateralement sur les
                    // voisines, et la hitbox bouge avec donc on peut glisser
                    // vers une autre sans gymnastique
                    whileHover={{ y: translateY - 25 }}
                    transition={{ duration: 0.22, delay: i * 0.04, ease: "easeOut" }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={variant.href}
                          aria-label={`Open ${name} (${variant.rarity})`}
                          className="block h-full"
                        >
                          <FanVariantCard variant={variant} name={name} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="bg-popover text-popover-foreground">
                        <span className="text-xs font-semibold text-foreground">{name}</span>
                        <span className="text-border"> · </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${rarityTextColor}`}>{variant.rarity}</span>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        )}

        {/* Main : Link vers la max rarete sur desktop, button qui ouvre modal sur mobile.
            Au hover desktop, fade out + pointer-events-none pour laisser passer aux variantes du fan */}
        {isTouchDevice ? (
          <button
            type="button"
            onClick={handleMainClick}
            aria-expanded={modalOpen}
            aria-label={`${name} — ${variants.length} variants`}
            className={mainCardClasses}
          >
            {mainCardInner}
          </button>
        ) : (
          <motion.div
            animate={{ opacity: open ? 0 : 1 }}
            transition={{ duration: 0.18 }}
            className={open ? "pointer-events-none" : ""}
          >
            <Link
              href={main.href}
              aria-label={`${name} ${maxRarity}`}
              className={mainCardClasses}
            >
              {mainCardInner}
            </Link>
          </motion.div>
        )}
      </div>

      {/* Modal mobile : scale + opacity sur le main, variantes en stagger */}
      <CardRevealModal
        open={modalOpen}
        onClose={closeReveal}
        main={
          <div className={`w-48 max-w-[60vw] overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card shadow-2xl`}>
            <Link href={main.href} onClick={closeReveal} className="block">
              {mainCardInner}
            </Link>
          </div>
        }
        secondary={
          showSecondary ? (
            <div className="grid max-w-[90vw] grid-cols-3 gap-2 sm:grid-cols-4">
              {sortedAllDesc.map((variant) => (
                <motion.div
                  key={variant.href}
                  variants={CARD_REVEAL_ITEM_VARIANTS}
                  transition={CARD_REVEAL_ITEM_TRANSITION}
                  className="w-24"
                >
                  <Link href={variant.href} onClick={closeReveal} className="block">
                    <FanVariantCard variant={variant} name={name} />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : undefined
        }
      />
    </TooltipProvider>
  )
}

// ── Carte variante ───────────────────────────────────────────────

function FanVariantCard({ variant, name }: { variant: FanVariant; name: string }) {
  const borderColor = RARITY_BORDER[variant.rarity] ?? "border-l-border"
  const gradient = RARITY_GRADIENT[variant.rarity] ?? "from-transparent"
  const rarityTextColor = RARITY_TEXT[variant.rarity] ?? "text-muted-foreground"

  return (
    // Pas de scale au hover : on ne deborde pas sur les cartes voisines du fan.
    // Highlight via border-primary + brightness + shadow-xl pour le feedback visuel.
    <div
      className={`flex h-full flex-col overflow-hidden border border-border border-l-2 ${borderColor} bg-card shadow-lg ring-1 ring-black/10 transition-all duration-150 hover:border-primary hover:brightness-110 hover:shadow-xl hover:ring-primary/30`}
    >
      <div className={`relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br ${gradient} to-transparent`}>
        <AssetImage
          src={variant.iconUrl}
          alt={`${name} ${variant.rarity}`}
          className="size-4/5 object-contain drop-shadow-md"
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-center border-t border-border/50 bg-card px-2 py-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${rarityTextColor}`}>
          {variant.rarity}
        </span>
      </div>
    </div>
  )
}

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
  ruby: 6,
  diamond: 7,
}
