"use client"

import { Users } from "lucide-react"
import { useEffect, useState } from "react"
import { LoadoutDrawer } from "@/components/loadout/LoadoutDrawer"
import { countFilledSlots } from "@/lib/loadout/selectors"
import { useLoadout } from "@/lib/loadout/store"

export function LoadoutTrigger() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)

  // Skip pendant l'hydration (zustand persist) pour eviter mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const count = mounted ? countFilledSlots({ commander, support, teamPerks }) : 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open loadout"
        className="relative flex size-9 items-center justify-center rounded-md border border-king-700 bg-king-900 text-king-400 transition-colors hover:border-primary hover:text-king-200"
      >
        <Users className="size-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
            {count}
          </span>
        )}
      </button>
      <LoadoutDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
