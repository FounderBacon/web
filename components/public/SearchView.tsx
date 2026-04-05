"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchRangedWeapons, fetchMeleeWeapons } from "@/lib/api/weapons";
import type { WeaponSummary, MeleeWeaponSummary, PaginatedResponse } from "@/lib/types/weapon";
import type { Locale } from "@/lib/i18n";
import type en from "@/lang/en.json";
import { Arrow } from "@/components/svg/Arrow";
import { weaponIcon } from "@/lib/cdn";
import { RANGED_CATEGORIES, MELEE_CATEGORIES, RARITIES, ELEMENTS, RARITY_TEXT } from "@/lib/constants";

type WeaponType = "ranged" | "melee";
type AnyWeapon = WeaponSummary | MeleeWeaponSummary;

interface SearchViewProps {
  dict: typeof en;
  locale: Locale;
}

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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.search.placeholder}
            aria-label={dict.search.placeholder}
            className="w-full border-b-2 border-king-700 bg-transparent px-1 py-2.5 font-akkordeon-11 text-lg uppercase text-foreground placeholder:text-muted-foreground/50 focus:border-king-500 focus:outline-none transition-colors"
          />

          <div className="flex flex-wrap gap-2">
            <FilterChip
              label={dict.search.typeRanged}
              active={type === "ranged"}
              onClick={() => {
                setType("ranged");
                setCategory("");
              }}
            />
            <FilterChip
              label={dict.search.typeMelee}
              active={type === "melee"}
              onClick={() => {
                setType("melee");
                setCategory("");
              }}
            />
            <span className="mx-1 self-center text-king-700">|</span>
            <FilterChip label={dict.search.all} active={!category} onClick={() => setCategory("")} />
            {categories.map((c) => (
              <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip label={dict.search.all} active={!rarity} onClick={() => setRarity("")} />
            {RARITIES.map((r) => (
              <FilterChip key={r} label={r} active={rarity === r} onClick={() => setRarity(r)} colorClass={RARITY_TEXT[r]} />
            ))}
            <span className="mx-1 self-center text-king-700">|</span>
            <FilterChip label={dict.search.all} active={!element} onClick={() => setElement("")} />
            {ELEMENTS.map((e) => (
              <FilterChip key={e} label={e} active={element === e} onClick={() => setElement(e)} />
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-king-700 border-t-king-400" />
          </div>
        )}

        {!loading && result && result.data.length === 0 && <p className="py-20 text-center font-akkordeon-11 text-xl uppercase text-muted-foreground">{dict.search.noResults}</p>}

        {!loading && result && result.data.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {result.data.map((weapon) => (
                <WeaponCard key={weapon.slug} weapon={weapon} locale={locale} type={type} />
              ))}
            </div>

            {result.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="cursor-pointer text-foreground transition-opacity hover:opacity-80 disabled:opacity-20">
                  <Arrow fill="currentColor" className="size-6 rotate-180" />
                </button>
                <span className="font-akkordeon-11 text-sm text-muted-foreground">{page} / {result.pagination.totalPages}</span>
                <button type="button" disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer text-foreground transition-opacity hover:opacity-80 disabled:opacity-20">
                  <Arrow fill="currentColor" className="size-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

function FilterChip({ label, active, onClick, colorClass }: { label: string; active: boolean; onClick: () => void; colorClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-3 py-1 font-akkordeon-11 text-sm uppercase transition-colors ${active ? "bg-king-500 text-king-50" : `bg-transparent border border-king-700 ${colorClass ?? "text-muted-foreground"} hover:bg-king-800 hover:text-king-50`}`}
    >
      {label}
    </button>
  );
}

function WeaponCard({ weapon, locale, type }: { weapon: AnyWeapon; locale: Locale; type: WeaponType }) {
  const rarityName = weapon.rarity === "mythic" ? "mythic" : weapon.rarity;
  const topImg = `/card/top_${rarityName}.png`;
  const bottomImg = `/card/bottom_${rarityName}.png`;

  return (
    <Link href={`/${locale}/weapons/${type}/${weapon.slug}`} className="group relative cursor-pointer transition-all hover:scale-105">
      {/* z-0 : fond */}
      <img src={bottomImg} alt="" className="relative z-0 w-full" />
      {/* z-10 : icone arme */}
      <img src={weaponIcon(weapon.icon)} alt={weapon.name} className="absolute inset-0 z-10 m-auto size-28 object-contain drop-shadow-lg sm:size-32" />
      {/* z-20 : cadre par-dessus */}
      <img src={topImg} alt="" className="absolute inset-0 z-20 w-full h-full" />
      {/* z-30 : texte */}
      <span className="absolute bottom-[16%] left-2 z-30 text-[10px] uppercase text-white/60">{weapon.category}</span>
      <span className="absolute bottom-[5%] left-2 z-30 text-[11px] font-semibold leading-tight text-white sm:text-xs">{weapon.name}</span>
    </Link>
  );
}
