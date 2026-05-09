// Utilitaires de formatage de nombres - convention EN (1,234.50)
// Centralise pour garantir la coherence dans toute l'app + les screenshots partages

const LOCALE = "en-US"

/**
 * Formate un nombre avec separateurs de milliers (1,234.50).
 * - Entier : pas de decimales (1,234)
 * - Decimal : 2 decimales (1,234.50)
 * - undefined/null/NaN : "0"
 */
export function formatNumber(n: number | undefined | null): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "0"
  const decimals = n % 1 === 0 ? 0 : 2
  return n.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/**
 * Formate un entier avec separateurs (1,234).
 * Tronque les decimales eventuelles.
 */
export function formatInt(n: number | undefined | null): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "0"
  return Math.trunc(n).toLocaleString(LOCALE)
}

/**
 * Formate avec un nombre fixe de decimales (1,234.50).
 */
export function formatDecimal(n: number | undefined | null, digits = 2): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "0"
  return n.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/**
 * Formate une stat (variante de formatNumber retournant "—" plutot que "0" pour valeur invalide).
 */
export function formatStat(n: number | undefined | null): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—"
  const decimals = n % 1 === 0 ? 0 : 2
  return n.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
