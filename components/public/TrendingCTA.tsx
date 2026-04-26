"use client"

import Link from "next/link"
import { useRef } from "react"
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/ui/icons/arrow-right"

interface TrendingCTAProps {
  href: string
  label: string
}

export function TrendingCTA({ href, label }: TrendingCTAProps) {
  const iconRef = useRef<ArrowRightIconHandle>(null)

  return (
    <Link
      href={href}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="flex w-full items-center justify-between gap-3 border border-king-700/50 bg-king-800/30 px-4 py-3 text-sm font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary hover:bg-king-800/60 hover:text-primary-foreground md:max-w-lg"
    >
      <span>{label}</span>
      <ArrowRightIcon ref={iconRef} size={20} className="shrink-0" />
    </Link>
  )
}
