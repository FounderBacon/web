"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Plus, Share2, Trash2 } from "lucide-react"
import { SectionContainer } from "@/components/public/SectionContainer"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { CompareCard } from "@/components/weapons/compare/CompareCard"
import { CompareRadar } from "@/components/weapons/compare/CompareRadar"
import { CompareStatsTable } from "@/components/weapons/compare/CompareStatsTable"
import {
  useCompareSlot,
  parseWeaponRef,
  serializeWeaponRef,
  type WeaponRef,
  type CompareSlotInit,
} from "@/lib/compare/useCompareSlot"
import { useCompare, MAX_COMPARE, type CompareEntry } from "@/lib/compare/store"
import { useLoadout } from "@/lib/loadout/store"
import { loadoutToApiPayload } from "@/lib/loadout/selectors"

// Trois colonnes max : au-dela le radar devient illisible et les colonnes
// ne tiennent plus sur desktop.
const SLOT_KEYS = ["a", "b", "c"] as const
type SlotKey = (typeof SLOT_KEYS)[number]

// Couleurs de serie fixes : la rarete ne peut pas servir de cle visuelle
// puisque deux armes comparees ont souvent la meme.
const SERIES_COLORS = ["#38bdf8", "#fb923c", "#a78bfa"]

function readInit(params: URLSearchParams, key: SlotKey): CompareSlotInit {
  const level = parseInt(params.get(`l${key}`) ?? "", 10)
  const offensive = parseInt(params.get(`o${key}`) ?? "", 10)
  const material = params.get(`m${key}`)
  const perks = params.get(`p${key}`)

  return {
    ...(params.get(`t${key}`) && { tier: params.get(`t${key}`)! }),
    ...(material === "ore" || material === "crystal" ? { material } : {}),
    ...(!isNaN(level) && { level }),
    ...(!isNaN(offensive) && { offensive }),
    // Les perks sont positionnels : l'index dans la liste = le numero de slot.
    ...(perks && { perkIds: perks.split(",") }),
  }
}

export default function WeaponComparePage() {
  const routeParams = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const initialRef = useRef(new URLSearchParams(searchParams.toString()))

  const setEntryAt = useCompare((s) => s.setAt)
  const clearCompare = useCompare((s) => s.clear)

  const urlEntries = useRef<CompareEntry[]>(
    SLOT_KEYS.map((key) => {
      const ref = parseWeaponRef(initialRef.current.get(key))
      return ref ? { ref, init: readInit(initialRef.current, key) } : null
    }).filter((e): e is CompareEntry => e !== null),
  )

  // Selection de depart figee au montage : l'URL est prioritaire (un lien
  // partage doit s'afficher tel quel), sinon on reprend le store persiste.
  //
  // Lecture unique et volontaire, via getState() : cette page ecrit dans le
  // store a chaque changement de colonne. S'abonner a `entries` ferait
  // reinjecter cette ecriture dans le rendu — c'est ce qui bouclait a l'infini.
  const initialEntries = useRef<CompareEntry[]>(
    urlEntries.current.length > 0 ? urlEntries.current : useCompare.getState().entries,
  )

  // La selection courante vit en etat local ; le store n'est qu'une destination.
  const [refs, setRefs] = useState<(WeaponRef | null)[]>(() =>
    SLOT_KEYS.map((_, i) => initialEntries.current[i]?.ref ?? null),
  )
  const refsKey = refs.map((r) => (r ? serializeWeaponRef(r) : "")).join("|")

  const [copied, setCopied] = useState(false)

  // Le loadout est partage par toutes les colonnes : c'est la condition
  // pour que la comparaison reste valide.
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const heroPayload = loadoutToApiPayload({ commander, support, teamPerks })

  // Les init ne sont lus qu'au premier chargement de chaque arme (le hook les
  // fige dans une ref), donc la selection de depart suffit.
  const slotA = useCompareSlot(refs[0], heroPayload, initialEntries.current[0]?.init)
  const slotB = useCompareSlot(refs[1], heroPayload, initialEntries.current[1]?.init)
  const slotC = useCompareSlot(refs[2], heroPayload, initialEntries.current[2]?.init)
  const slots = [slotA, slotB, slotC]

  // La troisieme colonne n'apparait qu'une fois demandee.
  const [thirdVisible, setThirdVisible] = useState(false)
  // Une troisieme arme deja presente (store ou URL) force l'affichage.
  const visibleCount = thirdVisible || refs[2] !== null ? 3 : 2

  function setRef(index: number, ref: WeaponRef | null) {
    setRefs((prev) => {
      const next = [...prev]
      next[index] = ref
      return next
    })
    // Le store suit ; l'effet de report completera la config une fois l'arme chargee.
    setEntryAt(index, ref ? { ref, init: {} } : null)
  }

  // Empreinte des colonnes : change uniquement quand une valeur affichee change,
  // contrairement aux objets de slot qui sont recrees a chaque rendu.
  const slotsKey = slots
    .map((s) =>
      s.weapon
        ? [
            s.weapon.slug,
            s.tier,
            s.material,
            s.level,
            s.offensive,
            Object.entries(s.selectedPerks)
              .filter(([, p]) => p)
              .map(([slot, p]) => `${slot}:${p!.perkId}`)
              .sort()
              .join(","),
          ].join("-")
        : "",
    )
    .join("|")

  // Synchronisation de l'URL : chaque colonne porte sa propre configuration.
  const writeUrl = useCallback(
    (url: URL) => {
      url.search = ""
      SLOT_KEYS.forEach((key, i) => {
        if (i >= visibleCount) return
        const ref = refs[i]
        const slot = slots[i]
        if (!ref || !slot.weapon) return

        url.searchParams.set(key, serializeWeaponRef(ref))
        url.searchParams.set(`t${key}`, slot.tier)
        if (slot.hasSplit) url.searchParams.set(`m${key}`, slot.material)
        if (slot.level > 0) url.searchParams.set(`l${key}`, String(slot.level))
        if (slot.offensive > 0) url.searchParams.set(`o${key}`, String(slot.offensive))

        // Encodage positionnel des perks : les slots vides restent vides.
        const maxSlot = Math.max(-1, ...Object.keys(slot.selectedPerks).map(Number))
        if (maxSlot >= 0) {
          const encoded = Array.from({ length: maxSlot + 1 }, (_, s) => slot.selectedPerks[s]?.perkId ?? "")
          if (encoded.some(Boolean)) url.searchParams.set(`p${key}`, encoded.join(","))
        }
      })
    },
    // Les slots sont recrees a chaque rendu : on depend d'une cle serialisee de
    // leurs valeurs, pas des objets, sinon l'effet de synchro boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refs, visibleCount, slotsKey],
  )

  useEffect(() => {
    const url = new URL(window.location.href)
    writeUrl(url)
    window.history.replaceState(null, "", url.pathname + url.search)
  }, [writeUrl])

  // Report de la config des colonnes vers le store, pour que quitter la page ne
  // perde pas tier/level/perks.
  //
  // L'ecriture passe par une ref et ne lit jamais `entries` pendant le rendu :
  // cet effet alimente le store dont `source` derive, donc toute dependance a
  // l'etat du store rendrait le cycle auto-entretenu.
  const snapshotRef = useRef<{ slotsKey: string; refsKey: string }>({ slotsKey: "", refsKey: "" })

  useEffect(() => {
    // Rien a reporter tant qu'aucune arme n'est chargee : ecrire ici ecraserait
    // les entrees restaurees depuis l'URL avec des colonnes vides.
    if (!slotsKey.replace(/\|/g, "")) return

    const prev = snapshotRef.current
    if (prev.slotsKey === slotsKey && prev.refsKey === refsKey) return
    snapshotRef.current = { slotsKey, refsKey }

    const next: CompareEntry[] = []
    SLOT_KEYS.forEach((_, i) => {
      const ref = refs[i]
      const slot = slots[i]
      if (!ref || !slot.weapon) return

      const maxSlot = Math.max(-1, ...Object.keys(slot.selectedPerks).map(Number))
      const perkIds =
        maxSlot >= 0
          ? Array.from({ length: maxSlot + 1 }, (_, s) => slot.selectedPerks[s]?.perkId ?? "")
          : undefined

      next.push({
        ref,
        init: {
          tier: slot.tier,
          ...(slot.hasSplit && { material: slot.material }),
          ...(slot.level > 0 && { level: slot.level }),
          ...(slot.offensive > 0 && { offensive: slot.offensive }),
          ...(perkIds?.some(Boolean) && { perkIds }),
        },
        // L'arme chargee fait autorite sur les metadonnees d'affichage : c'est
        // ce qui alimente les vignettes de la barre flottante ailleurs sur le site.
        name: slot.weapon.name,
        icon: slot.weapon.icon,
        rarity: slot.weapon.rarity,
      })
    })

    useCompare.setState({ entries: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsKey, refsKey])

  async function handleShare() {
    const url = new URL(window.location.href)
    writeUrl(url)
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Copie refusee par le navigateur : on laisse l'URL de la barre d'adresse faire le travail.
    }
  }

  const active = slots.slice(0, visibleCount)
  const statColumns = active.map((s) => s.stats)
  const names = active.map((s) => s.weapon?.name ?? null)
  const hasAnyWeapon = active.some((s) => s.weapon !== null)
  const comparableCount = active.filter((s) => s.stats !== null).length

  return (
    <TooltipProvider delayDuration={200}>
      <SectionContainer className="min-h-screen">
        {/* En-tete */}
        <div className="border-b border-border/50 bg-background px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold uppercase leading-tight text-foreground sm:text-xl">
                Weapon Compare
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Stats side by side. Set each build on its weapon page.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {visibleCount < MAX_COMPARE && (
                <Button size="xs" variant="outline" onClick={() => setThirdVisible(true)}>
                  <Plus className="size-3" />
                  <span className="hidden sm:inline">Add a third</span>
                </Button>
              )}
              <Button size="xs" variant="outline" onClick={handleShare} disabled={!hasAnyWeapon}>
                {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  clearCompare()
                  setRefs(SLOT_KEYS.map(() => null))
                  setThirdVisible(false)
                }}
                disabled={!hasAnyWeapon}
              >
                <Trash2 className="size-3" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {/* Cartes d'armes : compactes et en lecture seule, pour que le tableau
              de stats reste atteignable sans scroller. Le meme scroll horizontal
              que le tableau garde les colonnes lisibles sur mobile. */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${visibleCount}, minmax(240px, 1fr))` }}
            >
              {active.map((slot, i) => (
                <CompareCard
                  key={i}
                  slot={slot}
                  color={SERIES_COLORS[i]}
                  locale={routeParams.locale}
                  onPick={(ref) => setRef(i, ref)}
                  onClear={() => {
                    setRef(i, null)
                    if (i === 2) setThirdVisible(false)
                  }}
                  removable={i === 2}
                />
              ))}
            </div>
          </div>

          {/* Resultats de la comparaison */}
          {comparableCount >= 2 ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:items-start">
              <div className="border border-border/50 p-4">
                <p className="mb-2 font-burbank text-sm uppercase tracking-wider text-foreground">Profile</p>
                <CompareRadar columns={statColumns} names={names} colors={SERIES_COLORS} />
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Axes are scaled against the weapons shown here, not against the whole game.
                </p>
              </div>

              {/* Le tableau deborde sur mobile : il scrolle dans son propre
                  conteneur plutot que d'ecraser les colonnes. */}
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div style={{ minWidth: `${180 + visibleCount * 110}px` }}>
                  <CompareStatsTable columns={statColumns} names={names} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-border/60 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Pick at least two weapons to see the comparison.
              </p>
              <Link
                href={`/${routeParams.locale}/search/weapons`}
                className="mt-2 inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Browse all weapons
              </Link>
            </div>
          )}
        </div>
      </SectionContainer>
    </TooltipProvider>
  )
}
