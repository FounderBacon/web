"use client"

import { useEffect, useState } from "react"

interface VentureCountdownBlocksProps {
  // Echeances en ISO : une Date ne traverse pas la frontiere serveur -> client.
  // Chacune est facultative : la fin de quete s'affiche meme sans rotation.
  rotatesAt?: string | null
  questlineEndsAt?: string | null
  labels: {
    rotatesIn: string
    rotatingNow: string
    questlineEndsIn: string
    units: { days: string; hours: string; minutes: string; seconds: string }
  }
  // "overlay" : pose sur une image (heros mobile). "panel" : dans un panneau
  // king-800 opaque, ou des blocs de la meme teinte disparaitraient.
  tone?: "overlay" | "panel"
}

const DAY_MS = 24 * 60 * 60 * 1000

function split(ms: number) {
  const left = Math.max(0, ms)
  return {
    days: Math.floor(left / DAY_MS),
    hours: Math.floor((left / (60 * 60 * 1000)) % 24),
    minutes: Math.floor((left / (60 * 1000)) % 60),
    seconds: Math.floor((left / 1000) % 60),
  }
}

// Les rotations STW sont annoncees en UTC : l'heure locale induirait en erreur.
function formatTarget(d: Date): string {
  return (
    d.toLocaleString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " UTC"
  )
}

/**
 * Compte a rebours de la venture en quatre blocs, pour le heros mobile.
 *
 * L'heure courante n'est lue qu'apres le montage : la lire au rendu ferait
 * diverger le HTML serveur du premier rendu client.
 */
export function VentureCountdownBlocks({ rotatesAt, questlineEndsAt, labels, tone = "overlay" }: VentureCountdownBlocksProps) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    // Premier tick differe d'un tour : un setState synchrone dans l'effet
    // declencherait un second rendu en cascade.
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  const target = rotatesAt ? new Date(rotatesAt) : null
  const hasTarget = target !== null && !Number.isNaN(target.getTime())
  const questlineEnd = questlineEndsAt ? new Date(questlineEndsAt) : null
  const hasQuestline = questlineEnd !== null && !Number.isNaN(questlineEnd.getTime())
  if (!hasTarget && !hasQuestline) return null

  const parts = now === null || !hasTarget ? null : split(target.getTime() - now)
  const expired = hasTarget && now !== null && target.getTime() <= now

  const questlineDays =
    now !== null && hasQuestline ? Math.max(0, Math.ceil((questlineEnd.getTime() - now) / DAY_MS)) : null
  const questlineText = questlineDays === null ? null : labels.questlineEndsIn.replace("{n}", String(questlineDays))

  const blocks = [
    { key: "days", label: labels.units.days, value: parts?.days },
    { key: "hours", label: labels.units.hours, value: parts?.hours },
    { key: "minutes", label: labels.units.minutes, value: parts?.minutes },
    { key: "seconds", label: labels.units.seconds, value: parts?.seconds },
  ]

  // Sans date de rotation exploitable, seule la fin de quete reste a dire.
  if (!hasTarget) {
    return questlineText ? <p className="text-[11px] text-muted-foreground">{questlineText}</p> : null
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {labels.rotatesIn}
      </span>

      {expired ? (
        <span className="font-burbank text-3xl uppercase leading-none text-primary-foreground">{labels.rotatingNow}</span>
      ) : (
        <div className="grid grid-cols-4 gap-1.5" role="timer" aria-live="off">
          {blocks.map((b) => (
            <div key={b.key} className={`border border-foreground/10 py-2 text-center ${tone === "panel" ? "bg-king-950" : "bg-king-800/90"}`}>
              <div className="font-burbank text-[34px] leading-none text-primary-foreground tabular-nums">
                {b.value === undefined ? "--" : String(b.value).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.label}</div>
            </div>
          ))}
        </div>
      )}

      <span className="text-[11px] text-muted-foreground">
        {formatTarget(target)}
        {questlineText && ` · ${questlineText}`}
      </span>
    </div>
  )
}
