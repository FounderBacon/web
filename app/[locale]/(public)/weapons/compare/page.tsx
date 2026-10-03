"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, ChevronDown, Plus, Share2, Trash2 } from "lucide-react"
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
import { useCompare, MAX_COMPARE, SERIES_COLORS, type CompareEntry } from "@/lib/compare/store"
import { compareGridVars, CMP_ROW, CMP_VALUES, CMP_STICKY_TOP } from "@/lib/compare/grid"
import { useCompareT } from "@/lib/compare/i18n"
import { useLoadout } from "@/lib/loadout/store"
import { loadoutToApiPayload } from "@/lib/loadout/selectors"

// Une cle d'URL par colonne, dans l'ordre. Le plafond vit dans le store
// (MAX_COMPARE) : cette liste doit en avoir autant.
const SLOT_KEYS = ["a", "b", "c", "d"] as const
type SlotKey = (typeof SLOT_KEYS)[number]

// Largeur de la colonne des libelles de stats, a partir de md seulement :
// en dessous, les libelles passent au-dessus des valeurs et cette colonne
// n'existe plus. Voir lib/compare/grid.ts.
const LABEL_MIN_WIDTH = 150

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
  const t = useCompareT()
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
  // Le premier rendu (SSR puis hydratation) ne peut se baser que sur l'URL :
  // le store persist lit le localStorage, invisible cote serveur, donc s'en
  // servir ici desynchronise le HTML serveur du premier rendu client — React
  // le detecte comme une erreur d'hydratation et rejoue tout l'arbre. Le
  // store n'est repris qu'apres coup, dans l'effet ci-dessous.
  const initialEntries = useRef<CompareEntry[]>(urlEntries.current)

  // La selection courante vit en etat local ; le store n'est qu'une destination.
  const [refs, setRefs] = useState<(WeaponRef | null)[]>(() =>
    SLOT_KEYS.map((_, i) => initialEntries.current[i]?.ref ?? null),
  )
  const refsKey = refs.map((r) => (r ? serializeWeaponRef(r) : "")).join("|")

  // Reprise du store persiste, uniquement quand l'URL n'apportait rien.
  // useLayoutEffect (plutot que useEffect) pour appliquer la selection avant
  // la premiere peinture du navigateur et eviter un flash "vide".
  //
  // Lecture unique et volontaire, via getState() : cette page ecrit dans le
  // store a chaque changement de colonne. S'abonner a `entries` ferait
  // reinjecter cette ecriture dans le rendu — c'est ce qui bouclait a l'infini.
  useLayoutEffect(() => {
    if (urlEntries.current.length > 0) return
    const stored = useCompare.getState().entries
    if (stored.length === 0) return
    initialEntries.current = stored
    setRefs(SLOT_KEYS.map((_, i) => stored[i]?.ref ?? null))
  }, [])

  const [copied, setCopied] = useState(false)

  // Radar replie par defaut sous md, deplie des md via la classe md:block :
  // l'etat initial est le meme cote serveur et cote client, donc pas de
  // divergence d'hydratation.
  const [radarOpen, setRadarOpen] = useState(false)

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
  const slotD = useCompareSlot(refs[3], heroPayload, initialEntries.current[3]?.init)
  const slots = [slotA, slotB, slotC, slotD]

  // Deux colonnes par defaut ; les suivantes n'apparaissent qu'a la demande.
  const [extraColumns, setExtraColumns] = useState(0)
  // Une colonne deja remplie (store ou URL) force son affichage. Les colonnes
  // se remplissent dans l'ordre, donc le dernier index rempli donne le compte.
  const filledCount = refs.reduce((max, ref, i) => (ref !== null ? i + 1 : max), 0)
  const visibleCount = Math.min(MAX_COMPARE, Math.max(2, 2 + extraColumns, filledCount))

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
              <h1 className="font-burbank text-lg uppercase leading-tight text-foreground sm:text-xl">
                {t.title}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {t.subtitle}
              </p>
            </div>

            {/* Les libelles restent visibles sur mobile : trois boutons
                reduits a une icone de 12px etaient indevinables, et l'un
                d'eux efface la comparaison. */}
            <div className="flex flex-wrap items-center gap-2">
              {visibleCount < MAX_COMPARE && (
                <Button size="xs" variant="outline" onClick={() =>
                    // Depuis le nombre affiche : des colonnes restaurees du
                    // store ou de l'URL le portent deja au-dela de 2 + extra,
                    // et un simple +1 ne changeait rien au premier clic.
                    setExtraColumns(visibleCount + 1 - 2)
                  }>
                  <Plus className="size-3" />
                  {t.addColumn}
                </Button>
              )}
              <Button size="xs" variant="outline" onClick={handleShare} disabled={!hasAnyWeapon}>
                {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
                {copied ? t.copied : t.share}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  clearCompare()
                  setRefs(SLOT_KEYS.map(() => null))
                  setExtraColumns(0)
                }}
                disabled={!hasAnyWeapon}
              >
                <Trash2 className="size-3" />
                {t.clear}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {/* xl:grid-cols n'apparait qu'avec un radar a afficher a cote : sinon
              une seule colonne, pleine largeur, pour les colonnes + le tableau. */}
          <div
            className={`grid gap-5 ${comparableCount >= 2 ? "xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:items-start" : ""}`}
          >
            {comparableCount >= 2 && (
              // Colle sous la navbar en xl : le tableau de stats est bien plus
              // long que le radar, le laisser scroller seul plutot que de vider
              // tout l'espace sous un bloc plus court.
              <div className={`border border-border/50 xl:sticky ${CMP_STICKY_TOP}`}>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <p className="font-burbank text-sm uppercase tracking-wider text-foreground">{t.profile}</p>
                  {/* Repli sur mobile uniquement : le radar y occupe un ecran
                      entier avant qu'on atteigne le tableau, qui est ce que
                      la page promet. Des md il est ouvert et le bouton
                      disparait. */}
                  <button
                    type="button"
                    onClick={() => setRadarOpen((v) => !v)}
                    aria-expanded={radarOpen}
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground md:hidden"
                  >
                    {radarOpen ? t.hide : t.show}
                    <ChevronDown className={`size-3.5 transition-transform ${radarOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                <div className={`px-4 pb-4 ${radarOpen ? "" : "hidden"} md:block`}>
                  <CompareRadar columns={statColumns} names={names} colors={SERIES_COLORS} />
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {t.radarScaleNote}
                  </p>
                </div>
              </div>
            )}

            {/* En-tete de colonnes et tableau de stats partagent la meme grille,
                portee par des variables CSS posees ici. Plus aucun conteneur a
                defilement horizontal : sous md, le tableau passe en lignes
                empilees (voir lib/compare/grid.ts), ce qui supprime a la fois
                le scroll lateral et le sticky pris en defaut par un ancetre
                scrollable. */}
            <div style={compareGridVars(visibleCount, LABEL_MIN_WIDTH)}>
              <div
                className={`sticky z-20 border border-b-0 border-border/50 bg-background md:gap-2 ${CMP_STICKY_TOP} ${CMP_ROW}`}
              >
                <div className="hidden items-end px-4 pb-3 md:flex">
                  <p className="font-burbank text-sm uppercase tracking-wider text-muted-foreground">{t.weapon}</p>
                </div>

                <div className={CMP_VALUES}>
                  {active.map((slot, i) => (
                    // Meme separateur vertical que les lignes de stats en
                    // dessous : la colonne reste identifiable a la limite pres.
                    <div key={i} className={i > 0 ? "border-l border-border/30" : ""}>
                      <CompareCard
                        slot={slot}
                        color={SERIES_COLORS[i]}
                        locale={routeParams.locale}
                        onPick={(ref) => setRef(i, ref)}
                        onClear={() => {
                          setRef(i, null)
                          // Les deux premieres colonnes sont le socle de la
                          // comparaison ; seules celles ajoutees se retirent.
                          if (i >= 2) setExtraColumns(Math.max(0, visibleCount - 1 - 2))
                        }}
                        removable={i >= 2}
                        // Remplir une colonne avant les precedentes desynchronise sa
                        // position du store (qui compacte par ordre de remplissage).
                        locked={i > 0 && refs[i - 1] === null}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {comparableCount >= 2 ? (
                <CompareStatsTable columns={statColumns} names={names} colors={SERIES_COLORS} />
              ) : (
                <div className="border border-dashed border-border/60 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t.pickTwo}
                  </p>
                  <Link
                    href={`/${routeParams.locale}/search/weapons`}
                    className="mt-2 inline-block text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    {t.browseWeapons}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionContainer>
    </TooltipProvider>
  )
}
