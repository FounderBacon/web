"use client"

import { Sparkles, X } from "lucide-react"
import { PopoverAnchor, PopoverContent, Popover } from "@/components/ui/popover"

interface LoadoutHintProps {
  open: boolean
  onDismiss: () => void
  onOpenLoadout: () => void
  children: React.ReactNode
}

// Coach mark ancre sur le bouton loadout de la navbar. Le bouton reste
// cliquable (Popover sans modal + onOpenAutoFocus annule) : le hint guide,
// il ne bloque pas.
export function LoadoutHint({ open, onDismiss, onOpenLoadout, children }: LoadoutHintProps) {
  return (
    <Popover open={open}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={12}
        showArrow
        // Le focus reste sur la page : le hint ne vole pas la navigation clavier
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={onDismiss}
        className="w-72"
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 text-king-400 transition-colors hover:text-king-200"
        >
          <X className="size-3.5" />
        </button>

        <div className="flex flex-col gap-2 pr-4">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            See your own stats
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Set your heroes, team perk and F.O.R.T. offense here. Every weapon, trap and
            hero page then shows the numbers for <span className="text-foreground">your</span> account.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLoadout}
            className="flex-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Set it up
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Later
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
