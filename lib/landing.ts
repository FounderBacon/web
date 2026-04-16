// Date cible avant laquelle le site est en mode landing (countdown)
// Une fois depassee, la home complete s'affiche
export const TARGET_DATE = new Date("2026-04-16T22:00:00")

export function isBeforeLaunch(now: number = Date.now()): boolean {
  return now < TARGET_DATE.getTime()
}
