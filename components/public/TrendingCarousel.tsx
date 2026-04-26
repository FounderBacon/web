"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingWeeklyCard } from "@/components/public/TrendingWeeklyCard"
import type { PopularGlobalItem } from "@/lib/api/stats"

export interface CarouselItemProps {
  item: PopularGlobalItem
  href: string | null
  bgClass: string
  colorClass: string
  subtype: string
}

interface TrendingCarouselProps {
  items: CarouselItemProps[]
  intervalMs?: number
}

// Carousel horizontal pour mobile : scroll snap + auto-advance + pause au touch.
export function TrendingCarousel({ items, intervalMs = 4000 }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLUListElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      const el = scrollRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        el.scrollBy({ left: el.clientWidth, behavior: "smooth" })
      }
    }, intervalMs)
    return () => clearInterval(id)
  }, [paused, intervalMs])

  if (items.length === 0) return null

  return (
    <ul
      ref={scrollRef}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((it) => (
        <li
          key={`${it.item.entityType}-${it.item.entitySlug}`}
          className="aspect-[4/5] min-w-[60%] shrink-0 snap-center"
        >
          <TrendingWeeklyCard {...it} />
        </li>
      ))}
    </ul>
  )
}
