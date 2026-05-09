"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchTrap } from "@/lib/api/traps";
import { calculateTrapStats, type TrapCalculatedStats } from "@/lib/api/traps";
import { track } from "@/lib/api/track";
import type { TrapDetail } from "@/lib/types/trap";
import type { TierData } from "@/lib/types/shared";
import type { Perk } from "@/lib/types/weapon";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrapHeader } from "@/components/traps/TrapHeader";
import { TrapTierSelector } from "@/components/traps/TrapTierSelector";
import { TrapStatsColumn } from "@/components/traps/TrapStatsColumn";
import { TrapInfoColumn } from "@/components/traps/TrapInfoColumn";
import { BuildColumn } from "@/components/weapons/BuildColumn";
import { EffectsColumn } from "@/components/weapons/EffectsColumn";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function TrapPage() {
  const params = useParams<{ locale: string; slug: string }>();
  const searchParams = useSearchParams();
  const [trap, setTrap] = useState<TrapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tier, setTier] = useState(searchParams.get("t") ?? "1");
  const [selectedPerks, setSelectedPerks] = useState<Record<number, Perk | null>>({});
  const [previewPerk, setPreviewPerk] = useState<Perk | null>(null);
  const [level, setLevel] = useState(0);
  const [offensive, setOffensive] = useState(0);
  const [copied, setCopied] = useState(false);
  const initialParamsRef = useRef(Object.fromEntries(searchParams.entries()));

  // Stats calculees par le back
  const [baseStats, setBaseStats] = useState<TrapCalculatedStats | null>(null);
  const [modifiedStats, setModifiedStats] = useState<TrapCalculatedStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const calcAbortRef = useRef<AbortController | null>(null);
  const trackCalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchTrap(params.slug);
        setTrap(data);

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
  }, [params.slug]);

  // Track view une seule fois par trap chargee
  useEffect(() => {
    if (!trap) return;
    track({
      type: "trap.viewed",
      entityType: "trap",
      entitySlug: trap.slug,
    });
  }, [trap?.slug]);

  // Reset level au min du tier quand le tier change
  useEffect(() => {
    if (!trap) return;
    const td: TierData | undefined = trap.tiers[tier];
    if (td?.levelRange?.min !== undefined) setLevel(td.levelRange.min);
  }, [trap, tier]);

  // Appel /calculate a chaque changement
  useEffect(() => {
    if (!trap) return;

    const td: TierData | undefined = trap.tiers[tier];
    if (!td) return;

    calcAbortRef.current?.abort();
    const controller = new AbortController();
    calcAbortRef.current = controller;

    const perkIds = Object.values(selectedPerks)
      .filter((p): p is Perk => p !== null)
      .map((p) => p.perkId);

    setStatsLoading(true);

    const baseReq = calculateTrapStats(params.slug, {
      tier,
      level,
      offensive,
      perkIds: [],
    });

    const modifiedReq = perkIds.length > 0
      ? calculateTrapStats(params.slug, { tier, level, offensive, perkIds })
      : null;

    Promise.all([baseReq, modifiedReq])
      .then(([baseRes, modifiedRes]) => {
        if (controller.signal.aborted) return;
        setBaseStats(baseRes.stats);
        setModifiedStats(modifiedRes ? modifiedRes.stats : baseRes.stats);

        // Track calculated debounced (1.5s) — evite de spammer a chaque tweak
        if (trackCalcRef.current) clearTimeout(trackCalcRef.current);
        trackCalcRef.current = setTimeout(() => {
          track({
            type: "trap.calculated",
            entityType: "trap",
            entitySlug: params.slug,
          });
        }, 1500);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (process.env.NODE_ENV === "development") {
          console.error("[calculate trap] error:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });

    return () => {
      controller.abort();
      if (trackCalcRef.current) clearTimeout(trackCalcRef.current);
    };
  }, [trap, tier, level, offensive, selectedPerks, params.slug]);

  // Sync URL
  useEffect(() => {
    if (!trap) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("t", tier);
    for (const [slot, perk] of Object.entries(selectedPerks)) {
      if (perk) url.searchParams.set(`p${slot}`, perk.perkId);
    }
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [tier, selectedPerks, trap]);

  const buildShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("t", tier);
    for (const [slot, perk] of Object.entries(selectedPerks)) {
      if (perk) url.searchParams.set(`p${slot}`, perk.perkId);
    }
    return url.toString();
  }, [tier, selectedPerks]);

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

  if (error || !trap) {
    return (
      <SectionContainer className="flex flex-col items-center justify-center gap-4 py-40">
        <p className="text-xl font-semibold text-muted-foreground">Trap not found</p>
        <Link href={`/${params.locale}/search/traps`} className="text-primary underline underline-offset-4 hover:text-primary/80">
          Back to search
        </Link>
      </SectionContainer>
    );
  }

  const tierData: TierData | undefined = trap.tiers[tier];

  const lastSlot = trap.perkSlots[trap.perkSlots.length - 1];
  const weaponPerk = lastSlot ? (selectedPerks[lastSlot.slot] ?? lastSlot.availablePerks[0] ?? null) : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Search", item: `https://founderbacon.com/${params.locale}/search` },
      { "@type": "ListItem", position: 2, name: "Traps", item: `https://founderbacon.com/${params.locale}/search/traps` },
      { "@type": "ListItem", position: 3, name: trap.placement, item: `https://founderbacon.com/${params.locale}/search/traps?placement=${trap.placement}` },
      { "@type": "ListItem", position: 4, name: trap.name },
    ],
  };

  return (
    <TooltipProvider delayDuration={200}>
      <SectionContainer className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

        <TrapHeader trap={trap} onShare={handleShare} copied={copied} />

        {tierData && (
          <>
            {/* Desktop */}
            <div className="hidden px-4 py-6 lg:block lg:px-6">
              <div className="flex items-start gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-[3fr_3fr_3fr] items-start gap-4">
                  <div>
                    <TrapTierSelector trap={trap} tier={tier} level={level} offensive={offensive} onTierChange={setTier} onLevelChange={setLevel} onOffensiveChange={setOffensive} />
                    <TrapStatsColumn baseStats={baseStats} modifiedStats={modifiedStats} loading={statsLoading} />
                  </div>
                  <BuildColumn slots={trap.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onSelect={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} onHover={setPreviewPerk} onResetAll={() => setSelectedPerks({})} />
                  <EffectsColumn tierData={tierData} slots={trap.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onPerkChange={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} isRanged={false} weaponPerk={weaponPerk} weaponPerkLevel={lastSlot?.unlockLevel} />
                </div>

                <div className="mx-6 w-px self-stretch bg-border/50" />

                <div className="w-100 shrink-0">
                  <TrapInfoColumn trap={trap} tierData={tierData} />
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="px-4 py-4 lg:hidden">
              <TrapTierSelector trap={trap} tier={tier} level={level} offensive={offensive} onTierChange={setTier} onLevelChange={setLevel} onOffensiveChange={setOffensive} />
              <Tabs defaultValue="build" className="mt-3">
                <TabsList variant="line" className="mb-4 w-full">
                  <TabsTrigger value="build">Build</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>
                <TabsContent value="build">
                  <BuildColumn slots={trap.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onSelect={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} onHover={setPreviewPerk} onResetAll={() => setSelectedPerks({})} />
                </TabsContent>
                <TabsContent value="stats">
                  <TrapStatsColumn baseStats={baseStats} modifiedStats={modifiedStats} loading={statsLoading} />
                </TabsContent>
                <TabsContent value="effects">
                  <EffectsColumn tierData={tierData} slots={trap.perkSlots.slice(0, -1)} selectedPerks={selectedPerks} onPerkChange={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))} isRanged={false} weaponPerk={weaponPerk} weaponPerkLevel={lastSlot?.unlockLevel} />
                </TabsContent>
                <TabsContent value="info">
                  <TrapInfoColumn trap={trap} tierData={tierData} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SectionContainer>
    </TooltipProvider>
  );
}
