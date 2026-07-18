"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import {
  fetchRangedWeapons,
  fetchMeleeWeapons,
  fetchRangedWeaponsGrouped,
  fetchMeleeWeaponsGrouped,
} from "@/lib/api/weapons";
import type { PaginatedResponse } from "@/lib/types/weapon";
import type {
  RangedWeaponGroupedSummary,
  MeleeWeaponGroupedSummary,
} from "@/lib/types/grouped";
import type { Locale } from "@/lib/i18n";
import type en from "@/lang/en.json";
import { Arrow } from "@/components/svg/Arrow";
import { weaponIcon } from "@/lib/cdn";
import { RANGED_CATEGORIES, MELEE_CATEGORIES, RARITIES_VISIBLE, RARITY_TEXT, RARITY_BG } from "@/lib/constants";
import { formatInt } from "@/lib/format";
import { SkeletonWeaponGrid } from "@/components/ui/skeleton";
import { FanCard, type FanVariant } from "@/components/public/FanCard";

type WeaponType = "ranged" | "melee";
type AnyWeaponGrouped = RangedWeaponGroupedSummary | MeleeWeaponGroupedSummary;

interface SearchViewProps {
  dict: typeof en;
  locale: Locale;
}

export function SearchView({ dict, locale }: SearchViewProps) {
  const [type, setType] = useState<WeaponType>("ranged");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [rarity, setRarity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaginatedResponse<AnyWeaponGrouped> | null>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const baseParams = {
        search: search || undefined,
        category: category || undefined,
        page,
        limit: 24,
      };
      const subdir = type === "ranged" ? "weapons-ranged" : "weapons-melee";
      let res: PaginatedResponse<AnyWeaponGrouped>;
      if (rarity) {
        // Filtre rarete actif : on bypass le grouping et on adapte
        const ungrouped =
          type === "ranged"
            ? await fetchRangedWeapons({ ...baseParams, rarity })
            : await fetchMeleeWeapons({ ...baseParams, rarity });
        res = {
          ...ungrouped,
          data: ungrouped.data.map((w) => {
            const variant = {
              slug: w.slug,
              rarity: w.rarity,
              icon: w.icon,
              iconUrl: weaponIcon(w.icon, subdir),
              iconUrlLarge: weaponIcon(w.icon, subdir),
              isFounders: w.isFounders,
            };
            if (type === "ranged") {
              const r = w as import("@/lib/types/weapon").WeaponSummary;
              return {
                name: r.name,
                baseSlug: r.slug,
                maxRarity: r.rarity,
                variants: [variant],
                category: r.category,
                element: r.element,
                ammoType: r.ammoType ?? "light",
                weaponSet: r.weaponSet,
              } satisfies RangedWeaponGroupedSummary;
            }
            const m = w as import("@/lib/types/weapon").MeleeWeaponSummary;
            return {
              name: m.name,
              baseSlug: m.slug,
              maxRarity: m.rarity,
              variants: [variant],
              category: m.category,
              meleeClass: m.meleeClass,
              element: m.element,
              weaponSet: m.weaponSet,
            } satisfies MeleeWeaponGroupedSummary;
          }),
        };
      } else {
        res =
          type === "ranged"
            ? await fetchRangedWeaponsGrouped(baseParams)
            : await fetchMeleeWeaponsGrouped(baseParams);
      }
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [type, search, category, rarity, page]);

  useEffect(() => {
    setPage(1);
  }, [type, search, category, rarity]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const categories = type === "ranged" ? RANGED_CATEGORIES : MELEE_CATEGORIES;
  const activeFilters = useMemo(() => [category, rarity, search].filter(Boolean).length, [category, rarity, search]);
  const hasFilters = activeFilters > 0;

  function resetAll() {
    setSearch("");
    setCategory("");
    setRarity("");
  }

  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 1;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filtres : sticky sous la navbar (h ~76px) sur desktop */}
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

            <div className="grid grid-cols-2 border border-border/50 bg-background/60 p-1">
              <SegmentedButton label={dict.search.typeRanged} active={type === "ranged"} onClick={() => { setType("ranged"); setCategory(""); }} />
              <SegmentedButton label={dict.search.typeMelee} active={type === "melee"} onClick={() => { setType("melee"); setCategory(""); }} />
            </div>

            <FilterGroup label={dict.search.category}>
              <FilterChip label={dict.search.all} active={!category} onClick={() => setCategory("")} />
              {categories.map((c) => (
                <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
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
              {result.data.map((weapon) => {
                const mainVariant = weapon.variants.find((v) => v.rarity === weapon.maxRarity) ?? weapon.variants[weapon.variants.length - 1];
                const fanVariants: FanVariant[] = weapon.variants.map((v) => ({
                  rarity: v.rarity,
                  href: `/${locale}/weapons/${type}/${v.slug}`,
                  iconUrl: v.iconUrl,
                }));
                return (
                  <FanCard
                    key={weapon.baseSlug}
                    name={weapon.name}
                    maxRarity={weapon.maxRarity}
                    mainIconUrl={mainVariant.iconUrl}
                    variants={fanVariants}
                    subtitle={
                      <>
                        <span className="truncate">{weapon.category}</span>
                        {weapon.element && weapon.element !== "physical" && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate capitalize">{weapon.element}</span>
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

// ── Segmented (Ranged / Melee) ─────────────────────────────
function SegmentedButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-5 py-2 font-burbank text-sm uppercase tracking-wider transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ── Groupe de filtres avec label ───────────────────────────
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// ── Chip de filtre (avec dot optionnel pour rarete) ────────
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

// ── Empty state ────────────────────────────────────────────
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

// ── Pagination ─────────────────────────────────────────────
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

// Construit la liste [1, ..., 5, 6, 7, ..., 20]
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
