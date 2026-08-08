"use client"

import { useCallback, useState } from "react"
import { Countdown } from "@/components/ui/countdown"

const COUNTDOWN_LABELS = { days: "d", hours: "h", minutes: "m", seconds: "s" }

interface VentureTimerProps {
  label: string
  // Echeance : Date derivee (ventureEndDate) ou chaine ISO brute de l'API
  date: Date | string
  // Affiche la date cible sous le compteur
  showTarget?: boolean
}

// Formatte la date cible en UTC : les rotations STW sont annoncees en UTC,
// afficher l'heure locale du visiteur induirait en erreur.
function formatTarget(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " UTC"
}

export function VentureTimer({ label, date, showTarget = false }: VentureTimerProps) {
  // Pas de comparaison a Date.now() au rendu : impur et source de mismatch
  // SSR/client. Countdown monte cote client et signale l'echeance via onComplete
  // (y compris si la date est deja passee au premier tick).
  const [expired, setExpired] = useState(false)
  const handleComplete = useCallback(() => setExpired(true), [])

  const target = date instanceof Date ? date : new Date(date)
  // L'API peut renvoyer une date vide ou mal formee : on n'affiche rien
  if (Number.isNaN(target.getTime())) return null

  return (
    <div className="flex flex-col gap-1.5 py-4">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      {expired ? (
        <span className="font-burbank text-xl uppercase leading-none text-muted-foreground md:text-2xl">
          Rotating now
        </span>
      ) : (
        <Countdown
          targetDate={target}
          labels={COUNTDOWN_LABELS}
          onComplete={handleComplete}
          className="font-burbank text-2xl uppercase leading-none text-primary-foreground tabular-nums md:text-3xl"
        />
      )}
      {showTarget && !expired && (
        <span className="text-[11px] text-muted-foreground">{formatTarget(target)}</span>
      )}
    </div>
  )
}
