"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { WeaponSummary, MeleeWeaponSummary } from "@/lib/types/weapon";
import { fetchRangedWeapons, fetchMeleeWeapons } from "@/lib/api/weapons";
import { weaponIcon } from "@/lib/cdn";
import { RANGED_CATEGORIES, MELEE_CATEGORIES, ELEMENTS, RARITIES } from "@/lib/constants";
import { Search, X, SlidersHorizontal } from "lucide-react";

type SearchResult = {
  slug: string;
  name: string;
  type: "ranged" | "melee";
  category: string;
  rarity: string;
  icon: string;
};

type FilterKey = "type" | "category" | "element" | "rarity" | "ammo";

interface ActiveFilter {
  key: FilterKey;
  value: string;
}

const FILTER_OPTIONS: Record<FilterKey, readonly string[]> = {
  type: ["ranged", "melee"],
  category: [...RANGED_CATEGORIES, ...MELEE_CATEGORIES],
  element: ELEMENTS,
  rarity: RARITIES,
  ammo: ["light", "medium", "heavy", "shells", "energy", "rockets"],
};

const FILTER_LABELS: Record<FilterKey, string> = {
  type: "Type",
  category: "Category",
  element: "Element",
  rarity: "Rarity",
  ammo: "Ammo",
};

interface SearchBarProps {
  locale: Locale;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function SearchBar({ locale, variant = "desktop", onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (query.trim()) params.search = query.trim();
    for (const f of filters) {
      if (f.key === "type") continue;
      params[f.key === "ammo" ? "ammoType" : f.key] = f.value;
    }
    return params;
  }, [query, filters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const hasFilters = filters.length > 0;
    if (query.trim().length < 2 && !hasFilters) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = buildParams();
        const typeFilter = filters.find((f) => f.key === "type");
        const searchRanged = !typeFilter || typeFilter.value === "ranged";
        const searchMelee = !typeFilter || typeFilter.value === "melee";

        const [ranged, melee] = await Promise.all([searchRanged ? fetchRangedWeapons({ ...params, limit: 5 }) : Promise.resolve({ data: [] }), searchMelee ? fetchMeleeWeapons({ ...params, limit: 5 }) : Promise.resolve({ data: [] })]);

        const mapped: SearchResult[] = [
          ...(ranged.data as WeaponSummary[]).map((w) => ({ slug: w.slug, name: w.name, type: "ranged" as const, category: w.category, rarity: w.rarity, icon: w.icon })),
          ...(melee.data as MeleeWeaponSummary[]).map((w) => ({ slug: w.slug, name: w.name, type: "melee" as const, category: w.category, rarity: w.rarity, icon: w.icon })),
        ];

        setResults(mapped.slice(0, 8));
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, buildParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addFilter(key: FilterKey, value: string) {
    setFilters((prev) => {
      const without = prev.filter((f) => f.key !== key);
      return [...without, { key, value }];
    });
    setShowFilters(false);
    setShowDropdown(true);
    inputRef.current?.focus();
  }

  function removeFilter(key: FilterKey) {
    setFilters((prev) => prev.filter((f) => f.key !== key));
    inputRef.current?.focus();
  }

  function handleSelect(result: SearchResult) {
    setQuery("");
    setFilters([]);
    setShowDropdown(false);
    router.push(`/${locale}/weapons/${result.type}/${result.slug}`);
    onNavigate?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && filters.length === 0) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    for (const f of filters) params.set(f.key, f.value);
    router.push(`/${locale}/search/weapons?${params.toString()}`);
    setQuery("");
    setFilters([]);
    setShowDropdown(false);
    onNavigate?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && query === "" && filters.length > 0) {
      removeFilter(filters[filters.length - 1].key);
    }
  }

  const hasActiveFilters = filters.length > 0;

  // ── Mobile ──
  if (variant === "mobile") {
    return (
      <div ref={containerRef}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-lg border border-king-700 bg-king-800/60 px-3 py-2">
            <Search className="size-4 shrink-0 text-king-400" />
            {filters.map((f) => (
              <span key={f.key} className="flex shrink-0 items-center gap-1 rounded-md bg-primary/20 px-1.5 py-0.5 text-[11px] font-medium capitalize text-primary">
                {f.value}
                <button type="button" onClick={() => removeFilter(f.key)}>
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search weapons..." className="min-w-20 flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-king-500 focus:outline-none" />
          </div>
        </form>
        {showDropdown && results.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-lg border border-king-700 bg-king-800">
            {results.map((result) => (
              <button key={`${result.type}-${result.slug}`} type="button" onClick={() => handleSelect(result)} className="flex w-full items-center gap-3 border-b border-king-700/50 px-4 py-2 text-left last:border-0 hover:bg-king-700/30">
                <img src={weaponIcon(result.icon, result.type === "ranged" ? "weapons-ranged" : "weapons-melee")} alt={result.name} className="size-7 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary-foreground">{result.name}</p>
                  <p className="text-xs capitalize text-king-400">
                    {result.type} / {result.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Desktop ──
  return (
    <div ref={containerRef} className="relative mx-6 hidden max-w-xl flex-1 md:block">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center rounded-lg border border-king-700 bg-king-900 transition-colors focus-within:border-primary">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-1.5">
            <Search className="size-4 shrink-0 text-king-400" />

            {filters.map((f) => (
              <span key={f.key} className="flex shrink-0 items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                <span className="text-primary/60">{FILTER_LABELS[f.key]}:</span>
                {f.value}
                <button type="button" onClick={() => removeFilter(f.key)} className="ml-0.5 hover:text-foreground">
                  <X className="size-2.5" />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={hasActiveFilters ? "Refine..." : "Search or filter by..."}
              className="min-w-16 flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-king-500 focus:outline-none"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-l border-king-700">
            {loading && <div className="ml-3 size-3 animate-spin rounded-full border border-king-500 border-t-transparent" />}
            <button
              type="button"
              onClick={() => {
                setShowFilters(!showFilters);
                setShowDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${showFilters || hasActiveFilters ? "text-primary" : "text-king-400 hover:text-king-200"}`}
            >
              <SlidersHorizontal className="size-3.5" />
              {hasActiveFilters && <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{filters.length}</span>}
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown filtres */}
      {showFilters && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="space-y-3 p-4">
            {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => {
              const activeValue = filters.find((f) => f.key === key)?.value;
              return (
                <div key={key}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{FILTER_LABELS[key]}</p>
                  <div className="flex flex-wrap gap-1">
                    {FILTER_OPTIONS[key].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => (activeValue === value ? removeFilter(key) : addFilter(key, value))}
                        className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-all ${activeValue === value ? "border-primary bg-primary/20 font-medium text-foreground" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropdown resultats */}
      {showDropdown && !showFilters && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Search className="mx-auto mb-2 size-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{loading ? "Searching..." : "No weapons found"}</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border/50 px-4 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {results.length} result{results.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="py-1">
                {results.map((result) => (
                  <button key={`${result.type}-${result.slug}`} type="button" onClick={() => handleSelect(result)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted">
                    <img src={weaponIcon(result.icon, result.type === "ranged" ? "weapons-ranged" : "weapons-melee")} alt={result.name} className="size-8 shrink-0 object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{result.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {result.type} / {result.category}
                      </p>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{result.rarity}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
