import type { Metadata } from "next"
import { ArrowRight, Check, Clock, Sparkles } from "lucide-react"
import { notFound } from "next/navigation"
import { Fragment } from "react"
import { RoadmapScrollContainer } from "@/components/public/RoadmapScrollContainer"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { fetchRoadmap } from "@/lib/api/roadmap"
import { STATUS_BADGE, type RoadmapMilestone } from "@/lib/data/roadmap"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"

// ISR : revalide toutes les 5 minutes (la roadmap change rarement)
export const revalidate = 300

function MilestoneCard({ ms }: { ms: RoadmapMilestone }) {
  const badge = STATUS_BADGE[ms.status]
  const completed = ms.items.filter((i) => i.done).length
  const totalItems = ms.items.length
  const progressPct = totalItems === 0 ? 0 : (completed / totalItems) * 100
  const isLive = ms.status === "live"
  const isInProgress = ms.status === "in-progress"
  const isPlanned = ms.status === "planned"

  // Accent color pour border-left + barre de progression (coherent par status)
  const accent = isLive
    ? { border: "border-l-uncommon", bar: "bg-uncommon", header: "bg-uncommon/10 border-uncommon/30" }
    : isInProgress
      ? { border: "border-l-rare", bar: "bg-rare", header: "bg-rare/10 border-rare/30" }
      : { border: "border-l-border", bar: "bg-muted", header: "bg-muted/20 border-border/40" }

  return (
    <div
      className={`flex w-64 flex-col overflow-hidden border border-l-[3px] border-border/50 ${accent.border} bg-card backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 ${isInProgress ? "roadmap-pulse" : ""} ${isPlanned ? "opacity-85" : ""}`}
    >
      {/* Header : version + status pill */}
      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${accent.header}`}>
        <span className={`font-burbank text-2xl uppercase leading-none ${ms.color}`}>{ms.version}</span>
        <span className={`flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] ${badge.class}`}>
          {isLive ? <Sparkles className="size-2.5" /> : isInProgress ? <ArrowRight className="size-2.5" /> : <Clock className="size-2.5" />}
          {badge.label}
        </span>
      </div>

      {/* Body : titre + progress */}
      <div className="flex flex-col gap-3 p-4">
        <p className={`font-burbank text-xl uppercase leading-tight ${isPlanned ? "text-muted-foreground" : "text-foreground"}`}>{ms.title}</p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Tasks</span>
            <span className="tabular-nums">
              <span className={isLive ? "font-bold text-uncommon" : isInProgress ? "font-bold text-rare" : "text-foreground"}>{completed}</span>
              <span className="text-muted-foreground/60"> / {totalItems}</span>
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
            <div className={`h-full rounded-full transition-all duration-500 ${accent.bar}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Marker en forme de losange (rotated square) — plus distinctif qu'un carré simple
function MilestoneMarker({ ms }: { ms: RoadmapMilestone }) {
  const badge = STATUS_BADGE[ms.status]
  const isLive = ms.status === "live"
  const isInProgress = ms.status === "in-progress"

  return (
    <div className="relative shrink-0" title={`${ms.version} · ${ms.title}`}>
      {/* Diamond shape (square rotated 45deg) */}
      <div
        className={`relative z-20 flex size-12 rotate-45 items-center justify-center border-2 ${badge.class} ${isInProgress ? "roadmap-pulse" : ""}`}
        style={{ background: "var(--background)" }}
      >
        {/* Icone status (re-rotate -45 pour rester droite) */}
        <span className="-rotate-45">
          {isLive ? <Check className="size-5" /> : isInProgress ? <ArrowRight className="size-5" /> : <Clock className="size-5" />}
        </span>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Roadmap",
    description: "FounderBacon development roadmap — what's live, what's next, and what's planned.",
    alternates: pageAlternates(locale, "/roadmap"),
  }
}

export default async function RoadmapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  // Fetch depuis le back. En cas d'echec on degrade a une roadmap vide.
  let milestones: RoadmapMilestone[] = []
  try {
    milestones = await fetchRoadmap()
  } catch {
    milestones = []
  }

  return (
    <SectionContainer className="relative flex h-[calc(100dvh-var(--navbar-h,4.75rem))] flex-col overflow-hidden px-4 py-6 md:px-10">
      <FbcnLogo className="pointer-events-none absolute right-0 top-0 z-0 size-64 opacity-[0.03] md:size-96" />

      {/* Sr-only h1 (le hero header est retire pour eviter le scroll vertical) */}
      <h1 className="sr-only">Roadmap</h1>

      {milestones.length === 0 ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Roadmap unavailable.</p>
        </div>
      ) : null}

      {/* Timeline horizontale en zig-zag avec progression centrale (3 rows : top cards / ligne / bottom cards) */}
      {milestones.length > 0 && (() => {
        // Largeur de colonne par milestone : depend du nombre d'items pour eviter
        // qu'un milestone avec 50 items deforme tout. Card reste centree (largeur fixe).
        const CARD_WIDTH = 280
        const PX_PER_ITEM = 56 // espace alloue par mini-check
        const COL_PADDING = 100
        const COL_MIN = CARD_WIDTH + 64 // largeur min : doit pouvoir contenir une card
        const COL_MAX = 820 // cap pour eviter qu'un milestone avec 22 items deforme tout
        const GAP = 32 // gap-x-8
        const SIDE_PADDING = 64 // padding gauche/droit du grid pour eviter que les cards soient collees aux bords
        const MARKER_SIZE = 48 // size-12
        const MARKER_HALF = MARKER_SIZE / 2
        const GAP_TO_MARKER = 8 // gap-2 entre flex des checks et marker
        const colWidths = milestones.map((m) => {
          const ideal = m.items.length * PX_PER_ITEM + COL_PADDING
          return Math.min(COL_MAX, Math.max(COL_MIN, ideal))
        })
        const gridCols = colWidths.map((w) => `${w}px`).join(" ")
        const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (milestones.length - 1) * GAP

        // Position absolue de debut de chaque colonne (depuis le debut du grid, hors SIDE_PADDING)
        const colStarts: number[] = []
        {
          let acc = 0
          for (let i = 0; i < milestones.length; i++) {
            colStarts[i] = acc
            acc += colWidths[i] + GAP
          }
        }

        // Progress en px, alignee sur les positions visuelles :
        // - Milestone done complet : barre s'arrete au centre du marker losange
        // - Milestone partiel : barre s'arrete au centre du dernier check done
        //   (les checks sont en justify-evenly dans flex-1 = colWidths[i] - MARKER_SIZE - GAP_TO_MARKER)
        let progressPx = 0
        for (let i = 0; i < milestones.length; i++) {
          const ms = milestones[i]
          const done = ms.items.filter((x) => x.done).length
          const total = ms.items.length
          if (total === 0) continue
          if (done === total) {
            progressPx = colStarts[i] + colWidths[i] - MARKER_HALF
            continue
          }
          if (done > 0) {
            const flexWidth = colWidths[i] - MARKER_SIZE - GAP_TO_MARKER
            progressPx = colStarts[i] + (done / (total + 1)) * flexWidth
          }
          break
        }
        const progress = totalWidth === 0 ? 0 : (progressPx / totalWidth) * 100

        return (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <RoadmapScrollContainer>
              <div
                className="relative grid h-full min-w-full gap-x-8"
                style={{
                  gridTemplateColumns: gridCols,
                  gridTemplateRows: "1fr 5rem 1fr",
                  paddingLeft: `${SIDE_PADDING}px`,
                  paddingRight: `${SIDE_PADDING}px`,
                }}
              >
                {/* Background line (sur toute la largeur incl. paddings pour debordement visuel) */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-muted/40" aria-hidden="true" />
                {/* Progress line : gradient violet, glow. Demarre a 0 (couvre le SIDE_PADDING gauche aussi) */}
                <div
                  className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 transition-all duration-500"
                  style={{
                    left: 0,
                    width: progressPx > 0 ? `${SIDE_PADDING + progressPx}px` : "0px",
                    background: "linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--primary) 80%, white))",
                    boxShadow: "0 0 16px rgba(149, 98, 208, 0.7)",
                  }}
                  aria-hidden="true"
                />
                {/* Leading edge : cercle pulsant a l'extremite de la progress bar */}
                {progress > 0 && progress < 100 && (
                  <div
                    className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${SIDE_PADDING + (progress / 100) * totalWidth}px` }}
                    aria-hidden="true"
                  >
                    <div className="relative">
                      <div className="size-3 rounded-full bg-primary shadow-[0_0_12px_rgba(149,98,208,0.9)]" />
                      <div className="absolute inset-0 size-3 animate-ping rounded-full bg-primary opacity-60" />
                    </div>
                  </div>
                )}

                {/* Pour chaque milestone : 3 cells (top card / line+items / bottom card) — meme col d'origine */}
                {milestones.map((ms, idx) => {
                  const isTop = idx % 2 === 0

                  return (
                    <Fragment key={ms.version}>
                      {/* Cell 1 : top card (visible seulement si isTop) */}
                      <div className={`row-start-1 flex items-end justify-end ${isTop ? "" : "pointer-events-none opacity-0"}`}>
                        {isTop && <MilestoneCard ms={ms} />}
                      </div>

                      {/* Cell 2 : ligne items + marker carre a la fin */}
                      <div className="relative row-start-2 flex items-center gap-2">
                        <div className="flex flex-1 items-center justify-evenly">
                          {ms.items.map((item, i) => (
                            <div key={i} className="group relative z-10">
                              <div
                                className={`size-4 rounded-full border-2 transition-all group-hover:scale-125 ${
                                  item.done
                                    ? "border-primary bg-primary shadow-[0_0_10px_rgba(149,98,208,0.7)]"
                                    : "border-border bg-background"
                                }`}
                              />
                              <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-3 hidden -translate-x-1/2 group-hover:block">
                                <div className="flex flex-col gap-1 whitespace-nowrap border border-primary/40 bg-card px-3 py-2 text-popover-foreground shadow-xl">
                                  <div className="flex items-center gap-2">
                                    {item.done ? (
                                      <Check className="size-3 text-uncommon" />
                                    ) : (
                                      <div className="size-3 border border-border/50" />
                                    )}
                                    <span className="text-xs font-semibold">{item.label}</span>
                                  </div>
                                  <span className={`text-[10px] uppercase tracking-widest ${item.done ? "text-uncommon" : "text-muted-foreground"}`}>
                                    {item.done ? "Shipped" : "Planned"} · {ms.version}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Marker losange + connector vers la card */}
                        <div className="relative shrink-0">
                          <MilestoneMarker ms={ms} />
                          {/* Connector segmente vers la card (haut ou bas selon parite) */}
                          <div
                            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 w-[2px] ${ms.status === "live" ? "bg-primary" : ms.status === "in-progress" ? "bg-rare" : "bg-border/50"}`}
                            style={{ height: "1.25rem", [isTop ? "bottom" : "top"]: "calc(100% - 4px)" }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Cell 3 : bottom card (visible seulement si !isTop) */}
                      <div className={`row-start-3 flex items-start justify-end ${!isTop ? "" : "pointer-events-none opacity-0"}`}>
                        {!isTop && <MilestoneCard ms={ms} />}
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            </RoadmapScrollContainer>
          </div>
        )
      })()}
    </SectionContainer>
  )
}
