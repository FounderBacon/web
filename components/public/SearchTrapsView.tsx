"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { fetchTraps, fetchTrapsGrouped } from "@/lib/api/traps";
import type { PaginatedResponse } from "@/lib/types/shared";
import type { TrapGroupedSummary } from "@/lib/types/grouped";
import type { Locale } from "@/lib/i18n";
import type en from "@/lang/en.json";
import { Arrow } from "@/components/svg/Arrow";
import { weaponIcon } from "@/lib/cdn";
import { TRAP_PLACEMENTS, RARITIES_VISIBLE, RARITY_TEXT, RARITY_BG } from "@/lib/constants";
import { formatInt } from "@/lib/format";
import { SkeletonWeaponGrid } from "@/components/ui/skeleton";
import { FanCard, type FanVariant } from "@/components/public/FanCard";

interface SearchTrapsViewProps {
  dict: typeof en;
  locale: Locale;
}

export function SearchTrapsView({ dict, locale }: SearchTrapsViewProps) {
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("");
  const [rarity, setRarity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaginatedResponse<TrapGroupedSummary> | null>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const baseParams = {
        search: search || undefined,
        placement: placement || undefined,
        page,
        limit: 24,
      };
      const res = rarity
        ? await fetchTraps({ ...baseParams, rarity }).then((r) => ({
            ...r,
            data: r.data.map(
              (t): TrapGroupedSummary => ({
                name: t.name,
                baseSlug: t.slug,
                maxRarity: t.rarity,
                placement: t.placement,
                trapType: t.trapType,
                target: t.target,
                element: t.element,
                variants: [
                  {
                    slug: t.slug,
                    rarity: t.rarity,
                    icon: t.icon,
                    iconUrl: weaponIcon(t.icon, "traps"),
                    iconUrlLarge: weaponIcon(t.icon, "traps"),
                  },
                ],
              }),
            ),
          }))
        : await fetchTrapsGrouped(baseParams);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [search, placement, rarity, page]);

  useEffect(() => {
    setPage(1);
  }, [search, placement, rarity]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const activeFilters = useMemo(
    () => [placement, rarity, search].filter(Boolean).length,
    [placement, rarity, search]
  );
  const hasFilters = activeFilters > 0;

  function resetAll() {
    setSearch("");
    setPlacement("");
    setRarity("");
  }

  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 1;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filtres : sticky sous la navbar sur desktop */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Filters</p>
              {hasFilters && (
                <span className="bg-primary/20 px-1.5 text-[11px] font-semibold tabular-nums text-primary">{activeFilters}</span>
              )}
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                {dict.search.resetAll}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.search.placeholder}
                aria-label={dict.search.placeholder}
                className="w-full border border-border/50 bg-background/60 px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={dict.search.clear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <FilterGroup label={dict.search.placement}>
              <FilterChip label={dict.search.all} active={!placement} onClick={() => setPlacement("")} />
              {TRAP_PLACEMENTS.map((p) => (
                <FilterChip key={p} label={p} active={placement === p} onClick={() => setPlacement(p)} />
              ))}
            </FilterGroup>

            <FilterGroup label={dict.search.rarity}>
              <FilterChip label={dict.search.all} active={!rarity} onClick={() => setRarity("")} />
              {RARITIES_VISIBLE.map((r) => (
                <FilterChip
                  key={r}
                  label={r}
                  active={rarity === r}
                  onClick={() => setRarity(r)}
                  dotClass={RARITY_BG[r]}
                  activeTextClass={RARITY_TEXT[r]}
                />
              ))}
            </FilterGroup>

          </div>
        </div>
      </aside>

      {/* Content : result count + grid + pagination */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border border-border/50 bg-card/40 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            {loading ? (
              <span className="font-burbank text-2xl uppercase text-muted-foreground">...</span>
            ) : (
              <>
                <span className="font-burbank text-2xl uppercase text-foreground md:text-3xl">{formatInt(total)}</span>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {total === 1 ? dict.search.resultCount : dict.search.resultsCount}
                </span>
              </>
            )}
          </div>
          {totalPages > 1 && !loading && (
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Page <span className="font-bold text-foreground">{page}</span> / {totalPages}
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonWeaponGrid />
        ) : result && result.data.length === 0 ? (
          <EmptyState dict={dict} onReset={resetAll} hasFilters={hasFilters} />
        ) : result && result.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 overflow-visible sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {result.data.map((trap) => {
                const mainVariant = trap.variants.find((v) => v.rarity === trap.maxRarity) ?? trap.variants[trap.variants.length - 1];
                const fanVariants: FanVariant[] = trap.variants.map((v) => ({
                  rarity: v.rarity,
                  href: `/${locale}/traps/${v.slug}`,
                  iconUrl: v.iconUrl,
                }));
                return (
                  <FanCard
                    key={trap.baseSlug}
                    name={trap.name}
                    maxRarity={trap.maxRarity}
                    mainIconUrl={mainVariant.iconUrl}
                    variants={fanVariants}
                    subtitle={
                      <>
                        <span className="truncate">{trap.placement}</span>
                        {trap.element && trap.element !== "physical" && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate capitalize">{trap.element}</span>
                          </>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </>
        ) : null}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick, dotClass, activeTextClass }: { label: string; active: boolean; onClick: () => void; dotClass?: string; activeTextClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-burbank text-xs uppercase tracking-wider transition-all ${
        active
          ? `border-primary/60 bg-primary/10 ${activeTextClass ?? "text-foreground"}`
          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {dotClass && <span className={`size-1.5 rounded-full ${dotClass}`} />}
      {label}
    </button>
  );
}

function EmptyState({ dict, onReset, hasFilters }: { dict: typeof en; onReset: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <SearchIcon className="size-10 text-muted-foreground/40" />
      <p className="font-burbank text-2xl uppercase text-foreground">{dict.search.noResults}</p>
      <p className="text-sm text-muted-foreground">{dict.search.noResultsHint}</p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 flex cursor-pointer items-center gap-1.5 border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-primary/20"
        >
          <RotateCcw className="size-3" />
          {dict.search.resetAll}
        </button>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages = getPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
        className="flex size-9 cursor-pointer items-center justify-center border border-border/50 bg-card/40 text-foreground transition-colors hover:border-primary/60 hover:bg-card disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:border-border/50 disabled:hover:bg-card/40"
      >
        <Arrow fill="currentColor" className="size-4 rotate-180" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-9 min-w-9 cursor-pointer items-center justify-center px-2 border font-burbank text-sm transition-colors ${
              p === page
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
        className="flex size-9 cursor-pointer items-center justify-center border border-border/50 bg-card/40 text-foreground transition-colors hover:border-primary/60 hover:bg-card disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:border-border/50 disabled:hover:bg-card/40"
      >
        <Arrow fill="currentColor" className="size-4" />
      </button>
    </div>
  );
}

function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");

  pages.push(total);
  return pages;
}
