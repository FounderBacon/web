"use client"

import { RotateCcw, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { LoadoutSlot } from "@/components/loadout/LoadoutSlot"
import { TeamPerkPicker } from "@/components/loadout/TeamPerkPicker"
import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { heroFromSlots, type HeroBuild, type HeroSlots } from "@/lib/compare/hero"
import { useCompareT } from "@/lib/compare/i18n"
import { useLoadout, type LoadoutTeamPerk } from "@/lib/loadout/store"

interface ColumnLoadoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Loadout actuel de la colonne, s'il en a un en propre.
  hero: HeroBuild | undefined
  onApply: (hero: HeroBuild | undefined) => void
}

const SUPPORT_SLOTS = 5

function emptySlots(): HeroSlots {
  return { commander: null, support: Array(SUPPORT_SLOTS).fill(null), teamPerks: [] }
}

/**
 * Editeur du loadout de heros d'UNE colonne du comparateur.
 *
 * Il travaille sur un etat local et n'ecrit jamais dans le loadout du profil :
 * modifier un build ici ne touche ni les autres colonnes ni ce que l'utilisateur
 * a regle dans son profil. C'est ce qui permet de comparer deux armes sous deux
 * builds de heros differents.
 *
 * Il repart de ce que la colonne porte deja ; a defaut (colonne qui suit le
 * profil, ou loadout recu par lien), d'une copie du profil actuel.
 */
export function ColumnLoadoutSheet({ open, onOpenChange, hero, onApply }: ColumnLoadoutSheetProps) {
  const t = useCompareT()
  const [slots, setSlots] = useState<HeroSlots>(emptySlots)
  const [name, setName] = useState("")

  // A chaque ouverture, l'editeur repart de la colonne et non des modifications
  // abandonnees a la fermeture precedente. Source des heros : le loadout deja
  // porte par la colonne ; sinon une copie du profil. La copie se fait a
  // l'ouverture seulement — modifier ensuite le profil ailleurs ne doit pas
  // faire bouger un editeur ouvert. Un loadout recu par lien ne porte que des
  // identifiants de perks : on ne sait pas quels heros les ont produits, il
  // repart donc aussi du profil.
  useEffect(() => {
    if (!open) return
    const source = hero?.slots ?? useLoadout.getState()
    setSlots({ commander: source.commander, support: padSupport(source.support), teamPerks: source.teamPerks })
    setName(hero?.name ?? "")
    // `hero` est volontairement hors des dependances : seule l'ouverture reinitialise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function setSupport(index: number, slot: HeroSlots["support"][number]) {
    setSlots((prev) => ({ ...prev, support: prev.support.map((s, i) => (i === index ? slot : s)) }))
  }

  // Un seul perk d'equipe actif a la fois, comme dans le loadout du profil.
  function toggleTeamPerk(perk: LoadoutTeamPerk) {
    setSlots((prev) => ({ ...prev, teamPerks: prev.teamPerks[0]?.perkId === perk.perkId ? [] : [perk] }))
  }

  function apply() {
    onApply(heroFromSlots(name.trim().slice(0, 60) || t.heroCustom, slots))
    onOpenChange(false)
  }

  const hasAny = !!slots.commander || slots.support.some(Boolean) || slots.teamPerks.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-king-900">
        <TooltipProvider delayDuration={200}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="size-4" />
              {t.heroEditTitle}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{t.heroEditHint}</p>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <label htmlFor="column-loadout-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t.heroNameLabel}
              </label>
              <input
                id="column-loadout-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.heroCustom}
                className="border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
              />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.heroCommander}</h3>
              <LoadoutSlot
                slot={slots.commander}
                label={t.heroCommander}
                kind="commander"
                onChange={(slot) => setSlots((prev) => ({ ...prev, commander: slot }))}
              />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.heroSupport}</h3>
              <div className="flex flex-col gap-2">
                {slots.support.map((slot, i) => (
                  <LoadoutSlot
                    key={i}
                    slot={slot}
                    label={`${t.heroSupportN} ${i + 1}`}
                    kind="support"
                    onChange={(s) => setSupport(i, s)}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.heroTeamPerks}</h3>
              <TeamPerkPicker selected={slots.teamPerks} onToggle={toggleTeamPerk} />
            </section>
          </SheetBody>

          <SheetFooter className="flex-col items-stretch gap-3">
            <Button onClick={apply} disabled={!hasAny}>
              {t.heroApply}
            </Button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSlots(emptySlots())}
                disabled={!hasAny}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="size-3" />
                {t.heroClear}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(undefined)
                  onOpenChange(false)
                }}
                className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {t.heroFollowProfile}
              </button>
            </div>
          </SheetFooter>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  )
}

function padSupport(support: HeroSlots["support"]): HeroSlots["support"] {
  return Array.from({ length: SUPPORT_SLOTS }, (_, i) => support[i] ?? null)
}
