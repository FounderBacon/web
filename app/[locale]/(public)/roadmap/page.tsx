import type { Metadata } from "next"
import { Check, Clock, ArrowRight } from "lucide-react"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { CardFrame } from "@/components/svg/CardFrame"
import { isValidLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Roadmap",
  description: "FounderBacon development roadmap — what's live, what's next, and what's planned.",
}

interface Milestone {
  version: string
  title: string
  status: "live" | "in-progress" | "planned"
  color: string
  items: { label: string; done: boolean }[]
}

const MILESTONES: Milestone[] = [
  {
    version: "v0.1.0",
    title: "Foundation",
    status: "live",
    color: "text-common",
    items: [
      { label: "API infrastructure & hosting", done: true },
      { label: "Website scaffolding (Next.js)", done: true },
      { label: "Landing page with countdown", done: true },
      { label: "Epic Games OAuth login", done: true },
    ],
  },
  {
    version: "v0.2.0",
    title: "Weapons & Traps",
    status: "live",
    color: "text-legendary",
    items: [
      { label: "Ranged weapons database (600+)", done: true },
      { label: "Melee weapons database (350+)", done: true },
      { label: "Full stats, perks, crafting recipes", done: true },
      { label: "Weapon search with filters", done: true },
      { label: "Perk builder with DPS calculator", done: true },
      { label: "Build screenshot export", done: true },
      { label: "Traps database", done: true },
    ],
  },
  {
    version: "v0.3.0",
    title: "Heroes & Survivors",
    status: "planned",
    color: "text-epic",
    items: [
      { label: "Heroes database with abilities", done: false },
      { label: "Hero perks & team perks", done: false },
      { label: "Survivor squads", done: false },
      { label: "Defenders", done: false },
    ],
  },
  {
    version: "v0.4.0",
    title: "Live Data",
    status: "planned",
    color: "text-rare",
    items: [
      { label: "V-Bucks mission alerts", done: false },
      { label: "Mission rotation tracker", done: false },
      { label: "Storm Shield data", done: false },
      { label: "Event store tracking", done: false },
    ],
  },
  {
    version: "v1.0.0",
    title: "Website & Public Launch",
    status: "planned",
    color: "text-uncommon",
    items: [
      { label: "Full API documentation", done: false },
      { label: "User dashboard & STW profile", done: false },
      { label: "Community features", done: false },
      { label: "Multi-language support", done: false },
      { label: "Public launch", done: false },
    ],
  },
]

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  live: { label: "Live", class: "bg-uncommon/10 text-uncommon" },
  "in-progress": { label: "In progress", class: "bg-rare/10 text-rare" },
  planned: { label: "Planned", class: "bg-muted text-muted-foreground" },
}

export default async function RoadmapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return (
    <SectionContainer className="mx-auto max-w-4xl px-4 py-16 md:px-10">
      <FbcnLogo className="pointer-events-none absolute right-0 top-0 size-64 opacity-[0.03] md:size-96" />

      <h1 className="mb-2 font-burbank text-4xl uppercase text-foreground md:text-6xl">Roadmap</h1>
      <p className="mb-14 max-w-lg text-base text-muted-foreground md:text-lg">
        What&apos;s live, what&apos;s next, and what&apos;s planned for FounderBacon.
      </p>

      <div className="relative flex flex-col gap-0">
        {/* Ligne verticale */}
        <div className="absolute left-5 top-0 h-full w-px bg-border/50 md:left-6" />

        {MILESTONES.map((ms, i) => {
          const badge = STATUS_BADGE[ms.status]
          const isLast = i === MILESTONES.length - 1

          return (
            <div key={ms.version} className="relative flex gap-6 pb-12 md:gap-8">
              {/* Dot sur la timeline */}
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center border border-border/50 bg-card md:size-12">
                {ms.status === "live" ? (
                  <Check className="size-5 text-uncommon" />
                ) : ms.status === "in-progress" ? (
                  <ArrowRight className="size-5 text-rare" />
                ) : (
                  <Clock className="size-4 text-muted-foreground" />
                )}
              </div>

              {/* Contenu */}
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`font-burbank text-2xl uppercase md:text-3xl ${ms.color}`}>{ms.version}</span>
                  <span className="font-burbank text-xl uppercase text-foreground md:text-2xl">{ms.title}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}>{badge.label}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {ms.items.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      {item.done ? (
                        <Check className="size-4 shrink-0 text-uncommon" />
                      ) : (
                        <div className="size-4 shrink-0 border border-border/50" />
                      )}
                      <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Card preview pour les milestones principales */}
                {!isLast && ms.status === "live" && (
                  <div className="mt-2 flex items-center gap-2">
                    <CardFrame className="size-8 opacity-20" fill="currentColor" />
                    <span className="text-xs text-muted-foreground">Shipped</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainer>
  )
}
