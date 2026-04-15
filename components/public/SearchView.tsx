"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, RotateCcw } from "lucide-react";
import { fetchRangedWeapons, fetchMeleeWeapons } from "@/lib/api/weapons";
import type { WeaponSummary, MeleeWeaponSummary, PaginatedResponse } from "@/lib/types/weapon";
import type { Locale } from "@/lib/i18n";
import type en from "@/lang/en.json";
import { Arrow } from "@/components/svg/Arrow";
import { weaponIcon } from "@/lib/cdn";
import { RANGED_CATEGORIES, MELEE_CATEGORIES, RARITIES, ELEMENTS, RARITY_TEXT, RARITY_BG } from "@/lib/constants";
import { SkeletonWeaponGrid } from "@/components/ui/skeleton";
import { AssetImage } from "@/components/ui/asset-image";

type WeaponType = "ranged" | "melee";
type AnyWeapon = WeaponSummary | MeleeWeaponSummary;

interface SearchViewProps {
  dict: typeof en;
  locale: Locale;
}

// Bordures par rarete (accent gauche)
const RARITY_BORDER: Record<string, string> = {
  common: "border-l-common",
  uncommon: "border-l-uncommon",
  rare: "border-l-rare",
  epic: "border-l-epic",
  legendary: "border-l-legendary",
  mythic: "border-l-mythic",
};

// Degrades subtils par rarete (fond carte)
const RARITY_GRADIENT: Record<string, string> = {
  common: "from-common/5",
  uncommon: "from-uncommon/5",
  rare: "from-rare/10",
  epic: "from-epic/10",
  legendary: "from-legendary/10",
  mythic: "from-mythic/15",
};

export function SearchView({ dict, locale }: SearchViewProps) {
  const [type, setType] = useState<WeaponType>("ranged");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [rarity, setRarity] = useState("");
  const [element, setElement] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaginatedResponse<AnyWeapon> | null>(null);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: search || undefined, category: category || undefined, rarity: rarity || undefined, element: element || undefined, page, limit: 24 };
      const res = type === "ranged" ? await fetchRangedWeapons(params) : await fetchMeleeWeapons(params);
      setResult(res as PaginatedResponse<AnyWeapon>);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [type, search, category, rarity, element, page]);

  useEffect(() => {
    setPage(1);
  }, [type, search, category, rarity, element]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const categories = type === "ranged" ? RANGED_CATEGORIES : MELEE_CATEGORIES;
  const activeFilters = useMemo(() => [category, rarity, element, search].filter(Boolean).length, [category, rarity, element, search]);
  const hasFilters = activeFilters > 0;

  function resetAll() {
    setSearch("");
    setCategory("");
    setRarity("");
    setElement("");
  }

  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-8">
      {/* Searchbar + segmented type */}
      <div className="flex flex-col gap-4">
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

        {/* Segmented Ranged / Melee */}
        <div className="inline-flex w-fit border border-border/50 bg-card/40 p-1 backdrop-blur-sm">
          <SegmentedButton label={dict.search.typeRanged} active={type === "ranged"} onClick={() => { setType("ranged"); setCategory(""); }} />
          <SegmentedButton label={dict.search.typeMelee} active={type === "melee"} onClick={() => { setType("melee"); setCategory(""); }} />
        </div>
      </div>

      {/* Groupes de filtres */}
      <div className="flex flex-col gap-4">
        <FilterGroup label={dict.search.category}>
          <FilterChip label={dict.search.all} active={!category} onClick={() => setCategory("")} />
          {categories.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
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
            {result.data.map((weapon) => (
              <WeaponCard key={weapon.slug} weapon={weapon} locale={locale} type={type} />
            ))}
          </div>

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      ) : null}
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

// ── Weapon card flat (sans cadre PNG) ──────────────────────
function WeaponCard({ weapon, locale, type }: { weapon: AnyWeapon; locale: Locale; type: WeaponType }) {
  const rarity = weapon.rarity;
  const borderColor = RARITY_BORDER[rarity] ?? "border-l-border";
  const gradient = RARITY_GRADIENT[rarity] ?? "from-transparent";
  const rarityTextColor = RARITY_TEXT[rarity] ?? "text-muted-foreground";
  const rarityBgColor = RARITY_BG[rarity] ?? "bg-muted";

  return (
    <Link
      href={`/${locale}/weapons/${type}/${weapon.slug}`}
      className={`group relative flex flex-col overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg`}
    >
      {/* Zone icone avec gradient rarete */}
      <div className={`relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br ${gradient} to-transparent`}>
        {/* Dot de rarete en corner */}
        <span className={`absolute right-2 top-2 size-2 rounded-full ${rarityBgColor} shadow-sm`} />

        <AssetImage
          src={weaponIcon(weapon.icon, type === "ranged" ? "weapons-ranged" : "weapons-melee")}
          alt={weapon.name}
          className="size-4/5 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Bandeau info */}
      <div className="flex flex-col gap-0.5 border-t border-border/50 bg-card px-3 py-2.5">
        <p className="truncate font-sans text-sm font-semibold leading-tight text-foreground">{weapon.name}</p>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={`font-semibold ${rarityTextColor}`}>{rarity}</span>
          <span className="text-border">·</span>
          <span className="truncate">{weapon.category}</span>
          {weapon.element && weapon.element !== "physical" && (
            <>
              <span className="text-border">·</span>
              <span className="truncate capitalize">{weapon.element}</span>
            </>
          )}
        </p>
      </div>
    </Link>
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
