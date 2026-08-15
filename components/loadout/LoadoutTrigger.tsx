"use client"

import { Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { LoadoutDrawer } from "@/components/loadout/LoadoutDrawer"
import { LoadoutHint } from "@/components/loadout/LoadoutHint"
import { countFilledSlots, hasAnyLoadout } from "@/lib/loadout/selectors"
import { useLoadout } from "@/lib/loadout/store"

// Dismiss par session : le hint revient a la session suivante tant que le
// loadout est vide, mais n'insiste pas pendant la navigation en cours.
const HINT_DISMISSED_KEY = "fbcn-loadout-hint-dismissed"
// Laisse la page se poser avant d'afficher le coach mark
const HINT_DELAY_MS = 1200

export function LoadoutTrigger() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hintArmed, setHintArmed] = useState(false)
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)

  // Skip pendant l'hydration (zustand persist) pour eviter mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const filled = hasAnyLoadout({ commander, support, teamPerks })
  const count = mounted ? countFilledSlots({ commander, support, teamPerks }) : 0

  useEffect(() => {
    if (!mounted || filled) return

    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(HINT_DISMISSED_KEY) === "1"
    } catch {
      // sessionStorage indisponible (mode prive strict) : on affiche le hint
    }
    if (dismissed) return

    const timer = setTimeout(() => setHintArmed(true), HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [mounted, filled])

  // Derive plutot que stocke : des qu'un slot est rempli le hint disparait
  const hintVisible = hintArmed && !filled

  const dismissHint = useCallback(() => {
    setHintArmed(false)
    try {
      sessionStorage.setItem(HINT_DISMISSED_KEY, "1")
    } catch {
      // Echec silencieux : le hint reapparaitra, sans casser la navbar
    }
  }, [])

  function openLoadout() {
    dismissHint()
    setOpen(true)
  }

  return (
    <>
      <LoadoutHint open={hintVisible} onDismiss={dismissHint} onOpenLoadout={openLoadout}>
        <button
          type="button"
          onClick={openLoadout}
          aria-label="Open loadout"
          className="relative flex size-9 items-center justify-center rounded-md border border-king-700 bg-king-900 text-king-400 transition-colors hover:border-primary hover:text-king-200"
        >
          <Users className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
              {count}
            </span>
          )}
          {hintVisible && (
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-md border border-primary opacity-60" />
          )}
        </button>
      </LoadoutHint>
      <LoadoutDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
