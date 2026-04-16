// Date cible avant laquelle le site est en mode landing (countdown)
// Une fois depassee, la home complete s'affiche
export const TARGET_DATE = new Date("2026-04-16T22:00:00")

// Override via env : "true" force la landing, "false" la desactive, sinon on se base sur la date
function getLandingFlag(): boolean | null {
  const flag = process.env.NEXT_PUBLIC_ENABLE_LANDING
  if (flag === "true") return true
  if (flag === "false") return false
  return null
}

export function isBeforeLaunch(now: number = Date.now()): boolean {
  const flag = getLandingFlag()
  if (flag !== null) return flag
  return now < TARGET_DATE.getTime()
}
