"use client"

import { useState, useCallback, useEffect } from "react"
import { Check, Clock } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import { CardFrame } from "@/components/svg/CardFrame"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"

interface Category {
  label: string
  version: string
  count: string
  status: "live" | "soon"
  color: string
  colorBg: string
  desc: string
  subcategories: string[]
}

const CATEGORIES: Category[] = [
  {
    label: "Weapons & Traps",
    version: "v0.2.0",
    count: "1,000+",
    status: "live",
    color: "text-legendary",
    colorBg: "legendary",
    desc: "Complete weapon database with full stats, perks, and crafting.",
    subcategories: ["Assault", "Shotgun", "Sniper", "SMG", "Pistol", "Launcher", "Sword", "Spear", "Traps"],
  },
  {
    label: "Heroes & Survivors",
    version: "v0.3.0",
    count: "500+",
    status: "soon",
    color: "text-epic",
    colorBg: "epic",
    desc: "Every hero with abilities, perks, team bonuses and loadouts.",
    subcategories: ["Soldier", "Constructor", "Ninja", "Outlander", "Survivors"],
  },
  {
    label: "Live Data",
    version: "v0.4.0",
    count: "Real-time",
    status: "soon",
    color: "text-rare",
    colorBg: "rare",
    desc: "V-Bucks alerts, mission rotations, and store refresh timers.",
    subcategories: ["V-Bucks", "Missions", "Storm Shields", "Store"],
  },
  {
    label: "Website",
    version: "v1.0.0",
    count: "Full app",
    status: "soon",
    color: "text-uncommon",
    colorBg: "uncommon",
    desc: "Search, perk builder, dashboards and complete API documentation.",
    subcategories: ["Search", "Builder", "Dashboard", "API Docs"],
  },
]

const DOT_ACTIVE: Record<string, string> = {
  legendary: "bg-legendary",
  epic: "bg-epic",
  rare: "bg-rare",
  uncommon: "bg-uncommon",
}

export function HomeCategoryCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  return (
    <div className="flex flex-col items-center gap-6">
      <Carousel
        opts={{ align: "center", loop: true, duration: 30 }}
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        setApi={setApi}
        className="w-56 md:w-64"
      >
        <CarouselContent>
          {CATEGORIES.map((cat) => (
            <CarouselItem key={cat.label}>
              <div className="flex w-full flex-col overflow-hidden">
                {/* Bandeau haut */}
                <div className="flex items-center justify-between border border-b-0 border-border/50 bg-card px-4 py-2">
                  <span className="font-burbank text-lg uppercase text-foreground">{cat.version}</span>
                  {cat.status === "live" ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-uncommon">
                      <Check className="size-3" /> Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="size-3" /> Soon
                    </span>
                  )}
                </div>

                {/* Corps */}
                <div className="relative flex aspect-250/400 flex-col items-center justify-center gap-5 border-x border-border/50 bg-background px-5">
                  <CardFrame
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-15"
                    fill="currentColor"
                  />

                  <div className="relative z-10 flex flex-col items-center">
                    <span className={`font-burbank text-5xl leading-none md:text-6xl ${cat.color}`}>{cat.count}</span>
                    <span className="mt-1 text-sm text-muted-foreground">items</span>
                  </div>

                  <p className="relative z-10 text-center text-xs leading-relaxed text-muted-foreground">{cat.desc}</p>

                  <div className="relative z-10 flex flex-wrap justify-center gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span key={sub} className="border border-border/50 bg-card px-2 py-0.5 text-[11px] text-foreground/70">{sub}</span>
                    ))}
                  </div>
                </div>

                {/* Bandeau bas */}
                <div className="border border-t-0 border-border/50 bg-card px-4 py-3">
                  <span className="font-burbank text-lg uppercase text-foreground">{cat.label}</span>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10" />
        <CarouselNext className="-right-10" />
      </Carousel>

      {/* Dots */}
      <div className="flex items-center gap-2.5">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => api?.scrollTo(i)}
            className={`size-2.5 rounded-full transition-all duration-300 ${
              i === current ? `scale-125 ${DOT_ACTIVE[c.colorBg] ?? "bg-primary"}` : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
            }`}
            aria-label={c.label}
          />
        ))}
      </div>
    </div>
  )
}
