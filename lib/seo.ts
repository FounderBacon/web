import type { Metadata } from "next"
import type { Locale } from "./i18n"

const DOMAIN = "https://founderbacon.com"

// Limite pratique avant troncature dans les SERP Google.
const DESCRIPTION_MAX = 155

// Termes que la communaute STW tape reellement dans Google ("chaos exploder ftn",
// "... stw"). Presents dans le titre pour couvrir les trois formulations sans
// bourrage : "Fortnite STW" + "Save the World" dans la description.
const GAME_SUFFIX = "Fortnite STW"

// Coupe sur une frontiere de mot et suffixe une ellipse si tronque.
function truncate(text: string, max: number = DESCRIPTION_MAX): string {
  const clean = text.trim().replace(/\s+/g, " ")
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// Raretes utilisees comme suffixe de slug : "chaos-exploder-legendary".
const RARITY_SUFFIXES = new Set([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
])

// Fallback quand l'API ne repond pas : derive un nom lisible du slug.
// `stripRarity` retire le suffixe de rarete, mais seulement s'il en est
// vraiment un — contrairement a un strip aveugle du dernier mot, qui
// amputait les noms se terminant autrement.
export function nameFromSlug(slug: string, options?: { stripRarity?: boolean }): string {
  const parts = slug.split("-")
  if (options?.stripRarity && parts.length > 1 && RARITY_SUFFIXES.has(parts[parts.length - 1])) {
    parts.pop()
  }
  return parts.map(capitalize).join(" ")
}

interface ItemMetaInput {
  name: string
  // Description issue de l'API (texte in-game). Optionnelle : fallback genere.
  description?: string
  // Qualificatifs affiches en tete de description (ex: "Legendary", "Assault").
  qualifiers?: (string | undefined)[]
  // Libelle du type d'item, en anglais ("weapon", "trap", "hero").
  kind: string
}

// Titre cible : "<Nom> — Stats, Perks & Rolls | Fortnite STW | FounderBacon".
// Le nom vient en premier (poids SEO + lisibilite dans l'onglet).
export function itemTitle(name: string): string {
  return `${name} — Stats, Perks & Rolls | ${GAME_SUFFIX}`
}

// Description unique par item : on prefixe les qualificatifs (rarete, categorie)
// puis on complete avec le texte in-game, tronque proprement.
// Sans description API, on retombe sur une phrase generee mais toujours
// differenciee par les qualificatifs.
export function itemDescription({ name, description, qualifiers, kind }: ItemMetaInput): string {
  const quals = (qualifiers ?? []).filter(Boolean).map((q) => capitalize(q as string))
  const lead = quals.length > 0 ? `${quals.join(" ")} ${kind}` : capitalize(kind)
  const head = `${name} — ${lead} in Fortnite: Save the World.`

  if (!description) {
    return truncate(`${head} Full stats, perk rolls and crafting costs.`)
  }
  // Le texte in-game seul depasse souvent la limite : on privilegie le contexte
  // (nom + rarete + type) et on complete avec ce qui reste de place.
  const remaining = DESCRIPTION_MAX - head.length - 1
  if (remaining < 40) return truncate(head)
  return `${head} ${truncate(description, remaining)}`
}

// Construit canonical + hreflang pour une page locale-aware.
// `path` doit commencer par "/" et exclure le prefixe locale.
// Ex : pageAlternates("fr", "/heroes/raven-leader") ->
//   canonical: https://founderbacon.com/fr/heroes/raven-leader
//   en, fr, x-default sur les URLs equivalentes.
export function pageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: `${DOMAIN}/${locale}${path}`,
    languages: {
      en: `${DOMAIN}/en${path}`,
      fr: `${DOMAIN}/fr${path}`,
      "x-default": `${DOMAIN}/en${path}`,
    },
  }
}
