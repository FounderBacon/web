"use client"

import { ExternalLink, RotateCcw, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadoutSlot } from "@/components/loadout/LoadoutSlot"
import { TeamPerkPicker } from "@/components/loadout/TeamPerkPicker"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n"
import { hasAnyLoadout } from "@/lib/loadout/selectors"
import { useLoadout } from "@/lib/loadout/store"

interface LoadoutDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Extrait la locale du pathname Next ("/fr/heroes/..." -> "fr"). Fallback default.
function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1] ?? ""
  return isValidLocale(seg) ? seg : defaultLocale
}

export function LoadoutDrawer({ open, onOpenChange }: LoadoutDrawerProps) {
  const pathname = usePathname()
  const locale = localeFromPath(pathname)
  const onBuilderPage = pathname.startsWith(`/${locale}/hero-loadout`)

  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const offensive = useLoadout((s) => s.offensive)
  const setCommander = useLoadout((s) => s.setCommander)
  const setSupport = useLoadout((s) => s.setSupport)
  const toggleTeamPerk = useLoadout((s) => s.toggleTeamPerk)
  const setOffensive = useLoadout((s) => s.setOffensive)
  const clear = useLoadout((s) => s.clear)

  const filled = hasAnyLoadout({ commander, support, teamPerks })

  // Local state pour l'input offensive (decouple du store pour eviter sync sur chaque keystroke)
  const [localOffensive, setLocalOffensive] = useState(String(offensive))
  useEffect(() => {
    setLocalOffensive(String(offensive))
  }, [offensive, open])

  function commitOffensive(raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0)
    setLocalOffensive(String(n))
    setOffensive(n)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-king-900">
        <TooltipProvider delayDuration={200}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Loadout
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Saved across pages and sessions.</p>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">F.O.R.T.</h3>
            <div className="flex items-center gap-3 border border-border/50 bg-card/40 px-3 py-2.5">
              <label className="flex flex-1 flex-col">
                <span className="text-xs font-medium text-foreground">Offensive</span>
                <span className="text-[11px] text-muted-foreground">Account-wide offense bonus</span>
              </label>
              <input
                type="number"
                min={0}
                value={localOffensive}
                onChange={(e) => setLocalOffensive(e.target.value)}
                onBlur={(e) => commitOffensive(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitOffensive((e.target as HTMLInputElement).value) }}
                className="w-20 border border-border/50 bg-muted/60 px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commander</h3>
            <LoadoutSlot
              slot={commander}
              label="Commander"
              kind="commander"
              onChange={setCommander}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Support team</h3>
            <div className="flex flex-col gap-2">
              {support.map((slot, i) => (
                <LoadoutSlot
                  key={i}
                  slot={slot}
                  label={`Support ${i + 1}`}
                  kind="support"
                  onChange={(s) => setSupport(i, s)}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Team perks {teamPerks.length > 0 && <span className="text-foreground">({teamPerks.length})</span>}
            </h3>
            <TeamPerkPicker selected={teamPerks} onToggle={toggleTeamPerk} />
          </section>
        </SheetBody>

        <SheetFooter className="flex-col items-stretch gap-3">
          {!onBuilderPage && (
            <Link
              href={`/${locale}/hero-loadout`}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-2.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-card"
            >
              <ExternalLink className="size-3.5" />
              Open full builder
            </Link>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filled ? "Loadout active" : "No loadout active"}
            </p>
            <button
              type="button"
              onClick={clear}
              disabled={!filled}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3" />
              Clear all
            </button>
          </div>
        </SheetFooter>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  )
}
