"use client"

import { Pencil, Shield } from "lucide-react"
import { useState } from "react"
import { LocalLoadoutSheet } from "@/components/loadout/LocalLoadoutSheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { heroFromPreset, sameHero, type HeroBuild } from "@/lib/compare/hero"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { usePresets } from "@/lib/loadout/presets"

interface HeroBuildPickerProps {
  hero: HeroBuild | undefined
  onChange: (hero: HeroBuild | undefined) => void
}

const CURRENT = "__current__"

/**
 * Choix du loadout de heros d'une colonne : celui de l'utilisateur (defaut), ou
 * l'un de ses presets enregistres.
 *
 * Un preset est copie dans la colonne au moment du choix : le modifier ensuite
 * ne change pas une comparaison deja partagee ou enregistree.
 */
export function HeroBuildPicker({ hero, onChange }: HeroBuildPickerProps) {
  const t = useCompareT()
  const presets = usePresets((s) => s.presets)
  const [editorOpen, setEditorOpen] = useState(false)

  const choices = presets.flatMap((preset) => {
    const build = heroFromPreset(preset.name, preset.snapshot)
    return build ? [{ id: preset.id, name: preset.name, build }] : []
  })

  // Preset dont le contenu est celui de la colonne : coche, meme si le nom a change.
  const selected = hero ? (choices.find((c) => sameHero(c.build, hero))?.id ?? "__custom__") : CURRENT
  const label = hero ? (hero.name ?? t.heroCustom) : t.heroCurrent

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={t.heroPickerTitle}
          aria-label={fmt(t.heroPickerAria, { name: label })}
          className="inline-flex max-w-full items-center gap-1 text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground md:text-[11px]"
        >
          <Shield className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="max-h-72 min-w-48 overflow-y-auto">
        <DropdownMenuLabel>{t.heroPickerTitle}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selected}
          onValueChange={(value) => {
            if (value === CURRENT) return onChange(undefined)
            const choice = choices.find((c) => c.id === value)
            if (choice) onChange(choice.build)
          }}
        >
          <DropdownMenuRadioItem value={CURRENT}>{t.heroCurrent}</DropdownMenuRadioItem>
          {choices.map((choice) => (
            <DropdownMenuRadioItem key={choice.id} value={choice.id}>
              {choice.name}
            </DropdownMenuRadioItem>
          ))}
          {selected === "__custom__" && <DropdownMenuRadioItem value="__custom__">{t.heroCustom}</DropdownMenuRadioItem>}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* Un loadout propre a la colonne, sans passer par un preset ni toucher
            au profil. */}
        <DropdownMenuItem onSelect={() => setEditorOpen(true)}>
          <Pencil className="size-3.5" aria-hidden />
          {t.heroEdit}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <LocalLoadoutSheet
      open={editorOpen}
      onOpenChange={setEditorOpen}
      hero={hero}
      onApply={onChange}
      title={t.heroEditTitle}
      hint={t.heroEditHint}
    />
    </>
  )
}
