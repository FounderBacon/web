"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchRangedWeapon, fetchMeleeWeapon, calculateWeaponStats } from "@/lib/api/weapons";
import { fetchHero } from "@/lib/api/heroes";
import { fetchTeamPerk } from "@/lib/api/team-perks";
import { track } from "@/lib/api/track";
import { buildHeroSlot } from "@/lib/loadout/buildSlot";
import { loadoutToApiPayload } from "@/lib/loadout/selectors";
import { useLoadout, type LoadoutHeroSlot, type LoadoutTeamPerk } from "@/lib/loadout/store";
import type { WeaponDetail, TierData, TierEntry, Perk } from "@/lib/types/weapon";
import type { CalculatedStats } from "@/lib/types/calculate";
import { isTierSplit } from "@/lib/types/weapon";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WeaponHeader } from "@/components/weapons/WeaponHeader";
import { ScreenshotDialog } from "@/components/weapons/ScreenshotDialog";
import { TierSelector } from "@/components/weapons/TierSelector";
import { StatsColumn } from "@/components/weapons/StatsColumn";
import { BuildColumn } from "@/components/weapons/BuildColumn";
import { EffectsColumn } from "@/components/weapons/EffectsColumn";
import { InfoColumn } from "@/components/weapons/InfoColumn";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function WeaponPage() {
  const params = useParams<{ locale: string; type: string; slug: string }>();
  const searchParams = useSearchParams();
  const [weapon, setWeapon] = useState<WeaponDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tier, setTier] = useState(searchParams.get("t") ?? "1");
  const [material, setMaterial] = useState<"ore" | "crystal">((searchParams.get("m") as "ore" | "crystal") ?? "ore");
  const [selectedPerks, setSelectedPerks] = useState<Record<number, Perk | null>>({});
  const [previewPerk, setPreviewPerk] = useState<Perk | null>(null);
  const initialParamsRef = useRef(Object.fromEntries(searchParams.entries()));
  // Init level/offensive depuis l'URL si presents (sinon 0 = sera reset par tier change)
  const [level, setLevel] = useState(() => {
    const v = parseInt(initialParamsRef.current.l ?? "", 10);
    return isNaN(v) ? 0 : v;
  });
  const [offensive, setOffensive] = useState(() => {
    const v = parseInt(initialParamsRef.current.o ?? "", 10);
    return isNaN(v) ? 0 : v;
  });
  // Si l'URL contient un loadout, on bypass le reset auto du level (sinon le mount le ramene au min du tier)
  const levelFromUrlRef = useRef(!!initialParamsRef.current.l);
  const [copied, setCopied] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  // Stats calculees par le back :
  // - baseStats : vraie base de l'arme (sans heros, sans perks)
  // - heroStats : avec heros (sans perks) — = baseStats si pas de loadout
  // - modifiedStats : avec heros + perks (final affiche)
  const [baseStats, setBaseStats] = useState<CalculatedStats | null>(null);
  const [heroStats, setHeroStats] = useState<CalculatedStats | null>(null);
  const [modifiedStats, setModifiedStats] = useState<CalculatedStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const calcAbortRef = useRef<AbortController | null>(null);
  const trackCalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loadout (commander + support + team perks + offensive F.O.R.T.) - persistant entre pages
  const loadoutCommander = useLoadout((s) => s.commander);
  const loadoutSupport = useLoadout((s) => s.support);
  const loadoutTeamPerks = useLoadout((s) => s.teamPerks);
  const loadoutOffensive = useLoadout((s) => s.offensive);
  const heroPayload = loadoutToApiPayload({
    commander: loadoutCommander,
    support: loadoutSupport,
    teamPerks: loadoutTeamPerks,
  });

  // Hydrate offensive depuis le loadout sauve si pas dans l'URL (au premier rendu apres hydration zustand)
  const offensiveHydratedRef = useRef(!!initialParamsRef.current.o);
  useEffect(() => {
    if (offensiveHydratedRef.current) return;
    if (loadoutOffensive > 0) {
      setOffensive(loadoutOffensive);
      offensiveHydratedRef.current = true;
    }
  }, [loadoutOffensive]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const data = params.type === "melee" ? await fetchMeleeWeapon(params.slug) : await fetchRangedWeapon(params.slug);
        setWeapon(data);

        const init = initialParamsRef.current;
        const perks: Record<number, Perk | null> = {};
        for (const slot of data.perkSlots) {
          const perkId = init[`p${slot.slot}`];
          if (perkId) {
            const found = slot.availablePerks.find((p) => p.perkId === perkId);
            if (found) perks[slot.slot] = found;
          }
        }
        if (Object.keys(perks).length > 0) setSelectedPerks(perks);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.type, params.slug]);

  // Hydratation du loadout depuis l'URL au mount (une seule fois)
  // Param : hc=commanderSlug, hs1..hs5=supportSlug, htp=teamPerkId,teamPerkId
  useEffect(() => {
    const init = initialParamsRef.current;
    const hasHeroData =
      !!init.hc ||
      [1, 2, 3, 4, 5].some((i) => !!init[`hs${i}`]) ||
      !!init.htp;
    if (!hasHeroData) return;

    let cancelled = false;
    async function hydrate() {
      // Commander
      const commanderTask = init.hc
        ? fetchHero(init.hc).then((d) => buildHeroSlot(d, "commander")).catch(() => null)
        : Promise.resolve<LoadoutHeroSlot | null>(null);

      // Support (5 slots positionnels)
      const supportTasks = [1, 2, 3, 4, 5].map((i) => {
        const slug = init[`hs${i}`];
        if (!slug) return Promise.resolve<LoadoutHeroSlot | null>(null);
        return fetchHero(slug).then((d) => buildHeroSlot(d, "support")).catch(() => null);
      });

      // Team perks
      const teamPerkIds = init.htp ? init.htp.split(",").filter(Boolean) : [];
      const teamPerkTasks = teamPerkIds.map((id) =>
        fetchTeamPerk(id)
          .then<LoadoutTeamPerk>((d) => ({
            perkId: d.perkId,
            name: d.name,
            icon: d.icon,
            requirements: d.requirements,
            description: d.description,
          }))
          .catch(() => null),
      );

      const [commander, support, teamPerks] = await Promise.all([
        commanderTask,
        Promise.all(supportTasks),
        Promise.all(teamPerkTasks),
      ]);

      if (cancelled) return;
      useLoadout.setState({
        commander,
        support,
        teamPerks: teamPerks.filter((p): p is LoadoutTeamPerk => p !== null),
      });
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track view une seule fois par arme chargee
  useEffect(() => {
    if (!weapon) return;
    track({
      type: "weapon.viewed",
      entityType: weapon.type === "melee" ? "weapon-melee" : "weapon-ranged",
      entitySlug: weapon.slug,
    });
  }, [weapon?.slug, weapon?.type]);

  // Reset level au min du tier quand tier/material change
  // Exception : au premier passage, on garde le level de l'URL (clamped)
  useEffect(() => {
    if (!weapon) return;
    const tierEntry: TierEntry | undefined = weapon.tiers[tier];
    if (!tierEntry) return;
    const td = isTierSplit(tierEntry) ? tierEntry[material] : tierEntry;
    const range = td?.levelRange;
    if (!range) return;

    if (levelFromUrlRef.current) {
      // Premier passage : clamp le level URL dans le range courant
      levelFromUrlRef.current = false;
      setLevel((prev) => Math.max(range.min, Math.min(range.max, prev)));
      return;
    }
    setLevel(range.min);
  }, [weapon, tier, material]);

  // Appel /calculate a chaque changement de tier/material/perks/level/offensive
  useEffect(() => {
    if (!weapon) return;

    const tierEntry: TierEntry | undefined = weapon.tiers[tier];
    if (!tierEntry) return;

    const weaponType = params.type as "ranged" | "melee";

    // Annuler les requetes precedentes
    calcAbortRef.current?.abort();
    const controller = new AbortController();
    calcAbortRef.current = controller;

    const perkIds = Object.values(selectedPerks)
      .filter((p): p is Perk => p !== null)
      .map((p) => p.perkId);

    setStatsLoading(true);

    // 3 niveaux de stats pour les jauges :
    // 1. rawBase : sans heros, sans perks (vraie base de l'arme)
    // 2. withHero : avec heros, sans perks (= rawBase si pas de loadout)
    // 3. withPerks : avec heros + perks (= withHero si pas de perks)
    const hasHero = !!heroPayload;
    const hasPerks = perkIds.length > 0;

    const rawBaseReq = calculateWeaponStats(weaponType, params.slug, {
      tier,
      material,
      level,
      offensive,
      perkIds: [],
    });

    const withHeroReq = hasHero
      ? calculateWeaponStats(weaponType, params.slug, {
          tier,
          material,
          level,
          offensive,
          perkIds: [],
          hero: heroPayload,
        })
      : null;

    const withPerksReq = hasPerks
      ? calculateWeaponStats(weaponType, params.slug, {
          tier,
          material,
          level,
          offensive,
          perkIds,
          ...(hasHero && { hero: heroPayload }),
        })
      : null;

    Promise.all([rawBaseReq, withHeroReq, withPerksReq])
      .then(([rawRes, heroRes, perksRes]) => {
        if (controller.signal.aborted) return;
        const rawBase = rawRes.stats;
        const withHero = heroRes ? heroRes.stats : rawBase;
        const withPerks = perksRes ? perksRes.stats : withHero;
        setBaseStats(rawBase);
        setHeroStats(withHero);
        setModifiedStats(withPerks);

        // Track calculated debounced (1.5s) — evite de spammer a chaque tweak
        if (trackCalcRef.current) clearTimeout(trackCalcRef.current);
        trackCalcRef.current = setTimeout(() => {
          track({
            type: "weapon.calculated",
            entityType: params.type === "melee" ? "weapon-melee" : "weapon-ranged",
            entitySlug: params.slug,
          });
        }, 1500);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // Fallback silencieux — les stats resteront null
        if (process.env.NODE_ENV === "development") {
          console.error("[calculate] error:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });

    return () => {
      controller.abort();
      if (trackCalcRef.current) clearTimeout(trackCalcRef.current);
    };
  // Le heroPayload est serialise pour avoir une dep stable (re-calc seulement quand le loadout change reellement)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapon, tier, material, level, offensive, selectedPerks, params.type, params.slug, JSON.stringify(heroPayload)]);

  // Construction des query params (utilisee par sync URL + share)
  const writeUrlParams = useCallback((url: URL) => {
    url.search = "";
    url.searchParams.set("t", tier);
    url.searchParams.set("m", material);
    for (const [slot, perk] of Object.entries(selectedPerks)) {
      if (perk) url.searchParams.set(`p${slot}`, perk.perkId);
    }
    if (level > 0) url.searchParams.set("l", String(level));
    if (offensive > 0) url.searchParams.set("o", String(offensive));
    if (loadoutCommander) url.searchParams.set("hc", loadoutCommander.heroSlug);
    loadoutSupport.forEach((s, i) => {
      if (s) url.searchParams.set(`hs${i + 1}`, s.heroSlug);
    });
    if (loadoutTeamPerks.length > 0) {
      url.searchParams.set("htp", loadoutTeamPerks.map((p) => p.perkId).join(","));
    }
  }, [tier, material, selectedPerks, level, offensive, loadoutCommander, loadoutSupport, loadoutTeamPerks]);

  useEffect(() => {
    if (!weapon) return;
    const url = new URL(window.location.href);
    writeUrlParams(url);
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [weapon, writeUrlParams]);

  const buildShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    writeUrlParams(url);
    return url.toString();
  }, [writeUrlParams]);

  // Path absolu (avec query) pour l'API QR — synchro avec les memes params que share
  const buildSharePath = useCallback(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    writeUrlParams(url);
    return url.pathname + url.search;
  }, [writeUrlParams]);

  async function handleShare() {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux
    }
  }

  if (loading) {
    return (
      <SectionContainer className="flex items-center justify-center py-40">
        <div className="size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      </SectionContainer>
    );
  }

  if (error || !weapon) {
    return (
      <SectionContainer className="flex flex-col items-center justify-center gap-4 py-40">
        <p className="text-xl font-semibold text-muted-foreground">Weapon not found</p>
        <Link href={`/${params.locale}/search/weapons`} className="text-primary underline underline-offset-4 hover:text-primary/80">
          Back to search
        </Link>
      </SectionContainer>
    );
  }

  const isRanged = weapon.type === "ranged";
  const tierEntry: TierEntry | undefined = weapon.tiers[tier];
  const hasSplit = tierEntry ? isTierSplit(tierEntry) : false;
  const tierData: TierData | undefined = tierEntry ? (isTierSplit(tierEntry) ? tierEntry[material] : tierEntry) : undefined;

  const lastSlot = weapon.perkSlots[weapon.perkSlots.length - 1];
  const weaponPerk = lastSlot ? (selectedPerks[lastSlot.slot] ?? lastSlot.availablePerks[0] ?? null) : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Search", item: `https://founderbacon.com/${params.locale}/search` },
      { "@type": "ListItem", position: 2, name: "Weapons", item: `https://founderbacon.com/${params.locale}/search/weapons` },
      { "@type": "ListItem", position: 3, name: params.type, item: `https://founderbacon.com/${params.locale}/search/weapons?type=${params.type}` },
      { "@type": "ListItem", position: 4, name: weapon.category },
      { "@type": "ListItem", position: 5, name: weapon.name },
    ],
  };

  return (
    <TooltipProvider delayDuration={200}>
      <SectionContainer className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

        <WeaponHeader
          weapon={weapon}
          onShare={handleShare}
          copied={copied}
          onScreenshot={() => setScreenshotOpen(true)}
          sharePath={buildSharePath()}
          shareUrl={buildShareUrl()}
        />

        {tierData && (
          <>
            {/* Desktop */}
            <div className="hidden px-4 py-6 lg:block lg:px-6">
              <div className="flex items-start gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-[3fr_3fr_3fr] items-start gap-4">
                  <div>
                    <TierSelector weapon={weapon} tier={tier} material={material} hasSplit={hasSplit} level={level} offensive={offensive} onTierChange={setTier} onMaterialChange={setMaterial} onLevelChange={setLevel} onOffensiveChange={setOffensive} />
                    <StatsColumn baseStats={baseStats} heroStats={heroStats} modifiedStats={modifiedStats} isRanged={isRanged} loading={statsLoading} />
                  </div>
                  <BuildColumn slots={weapon.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onSelect={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} onHover={setPreviewPerk} onResetAll={() => setSelectedPerks({})} />
                  <EffectsColumn tierData={tierData} slots={weapon.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onPerkChange={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} isRanged={isRanged} weaponPerk={weaponPerk} weaponPerkLevel={lastSlot?.unlockLevel} />
                </div>

                <div className="mx-6 w-px self-stretch bg-border/50" />

                <div className="w-100 shrink-0">
                  <InfoColumn weapon={weapon} tierData={tierData} />
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="px-4 py-4 lg:hidden">
              <TierSelector weapon={weapon} tier={tier} material={material} hasSplit={hasSplit} level={level} offensive={offensive} onTierChange={setTier} onMaterialChange={setMaterial} onLevelChange={setLevel} onOffensiveChange={setOffensive} />
              <Tabs defaultValue="build" className="mt-3">
                <TabsList variant="line" className="mb-4 w-full">
                  <TabsTrigger value="build">Build</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>
                <TabsContent value="build">
                  <BuildColumn slots={weapon.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onSelect={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} onHover={setPreviewPerk} onResetAll={() => setSelectedPerks({})} />
                </TabsContent>
                <TabsContent value="stats">
                  <StatsColumn baseStats={baseStats} modifiedStats={modifiedStats} isRanged={isRanged} loading={statsLoading} />
                </TabsContent>
                <TabsContent value="effects">
                  <EffectsColumn tierData={tierData} slots={weapon.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onPerkChange={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} isRanged={isRanged} weaponPerk={weaponPerk} weaponPerkLevel={lastSlot?.unlockLevel} />
                </TabsContent>
                <TabsContent value="info">
                  <InfoColumn weapon={weapon} tierData={tierData} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        {weapon && tierData && <ScreenshotDialog open={screenshotOpen} onOpenChange={setScreenshotOpen} weapon={weapon} tierData={tierData} selectedPerks={selectedPerks} slots={weapon.perkSlots.slice(0, -1)} isRanged={isRanged} baseStats={baseStats} heroStats={heroStats} modifiedStats={modifiedStats} commander={loadoutCommander} support={loadoutSupport} teamPerks={loadoutTeamPerks} sharePath={buildSharePath()} />}
      </SectionContainer>
    </TooltipProvider>
  );
}
