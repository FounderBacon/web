"use client"

import { useId, useState } from "react"
import { useCompareT } from "@/lib/compare/i18n"

interface OffensiveFieldProps {
  value: number
  // Vrai quand la fiche porte sa propre valeur ; faux quand elle suit le profil.
  isLocal: boolean
  onChange: (value: number) => void
  onReset: () => void
}

/**
 * Champ F.O.R.T. offensive d'une fiche (arme, piege), partage par les deux
 * selecteurs de tier.
 *
 * Il dit d'ou vient la valeur : "Profil" tant qu'elle suit le loadout du
 * profil, "Local" des qu'on la modifie ici — avec de quoi revenir au profil.
 */
export function OffensiveField({ value, isLocal, onChange, onReset }: OffensiveFieldProps) {
  const t = useCompareT()
  // La fiche rend son selecteur deux fois (mobile, desktop) : id unique par instance.
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  // La valeur peut changer sans saisie (profil hydrate, profil modifie, retour
  // au profil) : on reprend celle recue, sauf pendant que l'utilisateur tape.
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    if (!focused) setDraft(String(value))
  }

  function commit(raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0)
    setDraft(String(n))
    // Retaper la valeur du profil ne doit pas la detacher du profil.
    if (!isLocal && n === value) return
    onChange(n)
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Offensive
        </label>
        {isLocal ? (
          <button
            type="button"
            onClick={onReset}
            title={t.offensiveReset}
            className="text-[10px] font-semibold uppercase tracking-wider text-primary underline-offset-2 transition-colors hover:underline"
          >
            {t.offensiveLocal} · {t.offensiveReset}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t.offensiveProfile}</span>
        )}
      </div>
      <input
        id={id}
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false)
          commit(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value)
        }}
        className={`w-full border bg-muted/60 px-3 py-1.5 text-center text-xs font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10 ${
          isLocal ? "border-primary/60" : "border-border/50"
        }`}
      />
    </div>
  )
}
