"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { DecoFrame } from "@/components/svg/DecoFrame"
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/ui/icons/arrow-right"
import type { PopularGlobalItem } from "@/lib/api/stats"
import { entityIcon } from "@/lib/cdn"

interface TrendingWeeklyCardProps {
  item: PopularGlobalItem
  href: string | null
  bgClass: string
  colorClass: string
  subtype: string
}

// Variante card verticale du TrendingWeeklyItem, utilisee dans le carousel mobile.
export function TrendingWeeklyCard({ item, href, bgClass, colorClass, subtype }: TrendingWeeklyCardProps) {
  const iconRef = useRef<ArrowRightIconHandle>(null)

  const inner = (
    <div
      className={`relative flex h-full flex-col items-center justify-between gap-3 ${bgClass} px-4 py-5 ${colorClass} backdrop-blur-sm transition-colors`}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <DecoFrame className="pointer-events-none absolute" />

      <Image
        src={entityIcon(item.entityType, item.icon)}
        alt=""
        width={144}
        height={144}
        className="relative mt-2 size-36 shrink-0"
      />

      <div className="relative flex w-full min-w-0 max-w-[200px] flex-col items-center gap-1 px-2 text-center">
        <span className="block w-full text-balance break-words text-lg font-semibold leading-tight text-primary-foreground">
          {item.name}
        </span>
        <span className="block w-full break-words text-xs capitalize leading-tight text-muted-foreground">
          {subtype}
        </span>
      </div>

      <div className="relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
        <span className="capitalize">{item.rarity}</span>
        <ArrowRightIcon ref={iconRef} size={16} />
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  )
}
