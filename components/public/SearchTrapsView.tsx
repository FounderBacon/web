"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, RotateCcw } from "lucide-react";
import { fetchTraps } from "@/lib/api/traps";
import type { TrapSummary } from "@/lib/types/trap";
import type { PaginatedResponse } from "@/lib/types/shared";
import type { Locale } from "@/lib/i18n";
import type en from "@/lang/en.json";
import { Arrow } from "@/components/svg/Arrow";
import { weaponIcon } from "@/lib/cdn";
import { TRAP_PLACEMENTS, TRAP_TARGETS, RARITIES, ELEMENTS, RARITY_TEXT, RARITY_BG } from "@/lib/constants";
import { SkeletonWeaponGrid } from "@/components/ui/skeleton";
import { AssetImage } from "@/components/ui/asset-image";

interface SearchTrapsViewProps {
  dict: typeof en;
  locale: Locale;
}

const RARITY_BORDER: Record<string, string> = {
  common: "border-l-common",
  uncommon: "border-l-uncommon",
  rare: "border-l-rare",
  epic: "border-l-epic",
  legendary: "border-l-legendary",
  mythic: "border-l-mythic",
};

const RARITY_GRADIENT: Record<string, string> = {
  common: "from-common/5",
  uncommon: "from-uncommon/5",
  rare: "from-rare/10",
  epic: "from-epic/10",
  legendary: "from-legendary/10",
  mythic: "from-mythic/15",
};

export function SearchTrapsView({ dict, locale }: SearchTrapsViewProps) {
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("");
  const [target, setTarget] = useState("");
  const [rarity, setRarity] = useState("");
  const [element, setElement] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaginatedResponse<TrapSummary> | null>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        placement: placement || undefined,
        target: target || undefined,
        rarity: rarity || undefined,
        element: element || undefined,
        page,
        limit: 24,
      };
      const res = await fetchTraps(params);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [search, placement, target, rarity, element, page]);

  useEffect(() => {
    setPage(1);
  }, [search, placement, target, rarity, element]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const activeFilters = useMemo(
    () => [placement, target, rarity, element, search].filter(Boolean).length,
    [placement, target, rarity, element, search]
  );
  const hasFilters = activeFilters > 0;

  function resetAll() {
    setSearch("");
    setPlacement("");
    setTarget("");
    setRarity("");
    setElement("");
  }

  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-8">
      {/* Searchbar */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.search.placeholder}
          aria-label={dict.search.placeholder}
          className="w-full border border-border/50 bg-card/40 px-11 py-3.5 font-burbank text-lg uppercase tracking-wide text-foreground placeholder:text-muted-foreground/60 backdrop-blur-sm focus:border-primary focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label={dict.search.clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-4">
        <FilterGroup label={dict.search.placement}>
          <FilterChip label={dict.search.all} active={!placement} onClick={() => setPlacement("")} />
          {TRAP_PLACEMENTS.map((p) => (
            <FilterChip key={p} label={p} active={placement === p} onClick={() => setPlacement(p)} />
          ))}
        </FilterGroup>

        <FilterGroup label={dict.search.target}>
          <FilterChip label={dict.search.all} active={!target} onClick={() => setTarget("")} />
          {TRAP_TARGETS.map((t) => (
            <FilterChip key={t} label={t} active={target === t} onClick={() => setTarget(t)} />
          ))}
        </FilterGroup>

        <FilterGroup label={dict.search.rarity}>
          <FilterChip label={dict.search.all} active={!rarity} onClick={() => setRarity("")} />
          {RARITIES.map((r) => (
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

        <FilterGroup label={dict.search.element}>
          <FilterChip label={dict.search.all} active={!element} onClick={() => setElement("")} />
          {ELEMENTS.map((e) => (
            <FilterChip key={e} label={e} active={element === e} onClick={() => setElement(e)} />
          ))}
        </FilterGroup>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between border-t border-border/50 pt-5">
        <div className="flex items-baseline gap-2">
          {loading ? (
            <span className="font-burbank text-2xl uppercase text-muted-foreground md:text-3xl">...</span>
          ) : (
            <>
              <span className="font-burbank text-2xl uppercase text-foreground md:text-3xl">{total.toLocaleString()}</span>
              <span className="text-sm uppercase tracking-wider text-muted-foreground">
                {total === 1 ? dict.search.resultCount : dict.search.resultsCount}
              </span>
            </>
          )}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="flex cursor-pointer items-center gap-1.5 border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            {dict.search.resetAll}
            <span className="ml-1 bg-primary/20 px-1.5 text-primary">{activeFilters}</span>
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonWeaponGrid />
      ) : result && result.data.length === 0 ? (
        <EmptyState dict={dict} onReset={resetAll} hasFilters={hasFilters} />
      ) : result && result.data.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {result.data.map((trap) => (
              <TrapCard key={trap.slug} trap={trap} locale={locale} />
            ))}
          </div>

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      ) : null}
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

function TrapCard({ trap, locale }: { trap: TrapSummary; locale: Locale }) {
  const rarity = trap.rarity;
  const borderColor = RARITY_BORDER[rarity] ?? "border-l-border";
  const gradient = RARITY_GRADIENT[rarity] ?? "from-transparent";
  const rarityTextColor = RARITY_TEXT[rarity] ?? "text-muted-foreground";
  const rarityBgColor = RARITY_BG[rarity] ?? "bg-muted";

  return (
    <Link
      href={`/${locale}/traps/${trap.slug}`}
      className={`group relative flex flex-col overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg`}
    >
      <div className={`relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br ${gradient} to-transparent`}>
        <span className={`absolute right-2 top-2 size-2 rounded-full ${rarityBgColor} shadow-sm`} />

        <AssetImage
          src={weaponIcon(trap.icon, "traps")}
          alt={trap.name}
          className="size-4/5 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border/50 bg-card px-3 py-2.5">
        <p className="truncate font-sans text-sm font-semibold leading-tight text-foreground">{trap.name}</p>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={`font-semibold ${rarityTextColor}`}>{rarity}</span>
          <span className="text-border">·</span>
          <span className="truncate">{trap.placement}</span>
          {trap.element && trap.element !== "physical" && (
            <>
              <span className="text-border">·</span>
              <span className="truncate capitalize">{trap.element}</span>
            </>
          )}
        </p>
      </div>
    </Link>
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
