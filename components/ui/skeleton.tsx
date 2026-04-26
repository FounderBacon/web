import type { HTMLAttributes } from "react"

// Bloc de base, a composer pour construire n'importe quel skeleton
// Le CSS .skeleton est defini dans globals.css (shimmer + respect prefers-reduced-motion)
export function Skeleton({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`skeleton ${className}`} {...rest} />
}

// ── Skeleton weapon card (search grid) ───────────────────
export function SkeletonWeaponCard() {
  return (
    <div className="flex flex-col overflow-hidden border border-border/50 bg-card/40">
      <Skeleton className="aspect-square" />
      <div className="flex flex-col gap-1.5 border-t border-border/50 bg-card px-3 py-2.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  )
}

// Grille de skeletons pour la page search
export function SkeletonWeaponGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonWeaponCard key={i} />
      ))}
    </div>
  )
}

// ── Skeleton ligne de texte (generique) ──────────────────
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  )
}

// ── Skeleton weapon detail page (perk builder) ───────────
export function SkeletonWeaponDetail() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
        <Skeleton className="size-12" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* 3 colonnes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skeleton item Trending Weekly ────────────────────────
export function SkeletonTrendingItem() {
  return (
    <div className="flex items-center gap-3 border border-king-700/50 bg-king-800/40 px-4 py-2">
      <Skeleton className="size-14 shrink-0" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="size-5 shrink-0" />
    </div>
  )
}

export function SkeletonTrendingList({ count = 6 }: { count?: number }) {
  return (
    <ul className="flex max-w-lg flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <SkeletonTrendingItem />
        </li>
      ))}
    </ul>
  )
}

// ── Skeleton Updates Section (home) ──────────────────────
export function SkeletonUpdatesSection() {
  return (
    <section className="px-8 py-16 md:px-12 md:py-20 lg:px-24 lg:py-24 xl:px-48">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8 lg:gap-12">
        {/* Liste changelogs */}
        <div className="md:col-span-3">
          <Skeleton className="mb-6 h-9 w-40 md:h-11" />
          <ul className="flex flex-col gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="bg-king-800/40 p-4">
                <div className="mb-3 flex items-baseline gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-1 h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </li>
            ))}
          </ul>
        </div>
        {/* Last update */}
        <aside className="flex flex-col gap-3 md:col-span-1">
          <div className="flex flex-col gap-2 border-l-2 border-primary/40 pl-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        </aside>
      </div>
    </section>
  )
}

// ── Skeleton hub card (search hub) ───────────────────────
export function SkeletonHubCard() {
  return (
    <div className="flex flex-col overflow-hidden border border-border/50 bg-card/40">
      <div className="flex items-center justify-between border-b border-border/50 bg-card px-5 py-2.5">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col gap-5 px-5 py-6">
        <Skeleton className="h-12 w-32" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 bg-card px-5 py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-4" />
      </div>
    </div>
  )
}
