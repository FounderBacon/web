import { Activity, ChevronLeft, Clock, Crosshair, Hourglass, Star, Target, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroViewTracker } from "@/components/public/HeroViewTracker";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AssetImage } from "@/components/ui/asset-image";
import { fetchHero, type HeroAbility, type HeroDetail, type HeroPerk } from "@/lib/api/heroes";
import { abilityIcon, perkIcon, teamPerkIcon } from "@/lib/cdn";
import { RARITY_BORDER, RARITY_DECO, RARITY_TEXT } from "@/lib/constants";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { breadcrumbSchema, thingPageSchema } from "@/lib/jsonld";
import { pageAlternates } from "@/lib/seo";
import { JsonLd } from "@/components/common/JsonLd";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isValidLocale(raw) ? raw : "en";
  const alternates = pageAlternates(locale, `/heroes/${slug}`);
  try {
    const hero = await fetchHero(slug);
    return {
      title: hero.name,
      description: hero.description || `${hero.name}, a ${hero.rarity} ${hero.heroClass} hero from Fortnite Save the World.`,
      alternates,
    };
  } catch {
    return { title: "Hero", alternates };
  }
}

// ── Card perk : icone + texte, meme niveau visuel pour tous les perks ──
function PerkCard({ perk, label, primary, accent, rarityColor, kind }: { perk: HeroPerk; label: string; primary?: boolean; accent: string; rarityColor: string; kind: "perk" | "team-perk" }) {
  const iconSrc = kind === "team-perk" ? teamPerkIcon(perk.name) : perkIcon(perk.name);
  return (
    <div className={`flex gap-4 border border-border/50 ${primary ? `border-l-4 ${accent} bg-card/60` : "border-l-2 border-l-border bg-card/40"} p-6 md:p-7`}>
      <div className="relative size-16 shrink-0 overflow-hidden border border-border/50 bg-muted/30 md:size-20">
        <AssetImage src={iconSrc} alt="" className="absolute inset-0 size-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
        <p className={`font-burbank text-2xl uppercase leading-tight md:text-3xl ${primary ? rarityColor : "text-foreground"}`}>{perk.name}</p>
        <p className="text-base leading-relaxed text-foreground">{perk.description}</p>
        {perk.magnitude !== null && (
          <p className="text-xs text-muted-foreground">
            Magnitude: <span className="font-medium text-foreground">{perk.magnitude}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Carte ability : icone + stats en pills ──────────────────────
function AbilityCard({ ability }: { ability: HeroAbility }) {
  const stats = ability.stats;
  const hasStats = [stats.cooldown, stats.cost, stats.duration, stats.radius, stats.weaponDamage, stats.fireRate, stats.attackSpeed].some((v) => typeof v === "number");
  return (
    <article className="flex flex-col gap-3 border border-border/50 bg-card/40 p-5">
      <header className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden border border-border/50 bg-muted/30">
          <AssetImage src={abilityIcon(ability.name)} alt="" className="absolute inset-0 size-full object-contain" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="text-base font-bold uppercase leading-tight text-foreground md:text-lg">{ability.name}</h3>
          <div className="flex flex-wrap gap-1.5">
            {ability.element && <span className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{ability.element}</span>}
            {ability.damageType && ability.damageType !== "none" && <span className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{ability.damageType}</span>}
          </div>
        </div>
      </header>
      <p className="text-sm leading-relaxed text-muted-foreground">{ability.description}</p>
      {hasStats && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/30 pt-3">
          {typeof stats.cooldown === "number" && <StatPill icon={Clock} label="Cooldown" value={`${stats.cooldown}s`} />}
          {typeof stats.cost === "number" && <StatPill icon={Zap} label="Energy" value={String(stats.cost)} />}
          {typeof stats.duration === "number" && <StatPill icon={Hourglass} label="Duration" value={`${stats.duration}s`} />}
          {typeof stats.radius === "number" && <StatPill icon={Target} label="Radius" value={String(stats.radius)} />}
          {typeof stats.weaponDamage === "number" && <StatPill icon={Crosshair} label="Weapon dmg" value={`×${stats.weaponDamage}`} />}
          {typeof stats.fireRate === "number" && <StatPill icon={Activity} label="Fire rate" value={`×${stats.fireRate}`} />}
          {typeof stats.attackSpeed === "number" && <StatPill icon={Activity} label="Atk speed" value={`×${stats.attackSpeed}`} />}
        </div>
      )}
    </article>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs">
      <Icon className="size-3 shrink-0 fill-current text-muted-foreground" strokeWidth={0} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

// ── Colonne info droite (alignée sur InfoColumn weapon) ──────────
function InfoColumn({ hero }: { hero: HeroDetail }) {
  const rarityClass = RARITY_TEXT[hero.rarity] ?? "text-muted-foreground";
  const rarityDeco = RARITY_DECO[hero.rarity] ?? "text-primary";
  const stars = hero.stars ?? 0;

  return (
    <div className="space-y-5">
      {/* Image hero */}
      <div className="relative aspect-square overflow-hidden border border-border/50 bg-card/40">
        <AssetImage src={hero.iconUrlLarge ?? hero.iconUrl} alt={hero.name} className="absolute inset-0 size-full object-cover" />
      </div>

      {/* Title + stars */}
      <div className="flex flex-col gap-2">
        <h1 className="font-burbank text-3xl uppercase leading-none text-foreground md:text-4xl">{hero.name}</h1>
        {stars > 0 && (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className={`size-4 fill-current ${rarityDeco}`} />
            ))}
          </span>
        )}
      </div>

      {/* Description */}
      {hero.description && <p className="text-sm italic leading-relaxed text-muted-foreground">&ldquo;{hero.description}&rdquo;</p>}

      <div className="h-px w-full bg-border/50" />

      {/* Infos */}
      <div className="space-y-1.5">
        <InfoRow label="Rarity" value={hero.rarity} valueClass={`capitalize ${rarityClass}`} />
        <InfoRow label="Class" value={hero.heroClass} valueClass="capitalize" />
        {hero.subclass && <InfoRow label="Subclass" value={hero.subclass} />}
        {hero.gender && <InfoRow label="Gender" value={hero.gender} valueClass="capitalize" />}
        {hero.statLine && <InfoRow label="Main stat" value={hero.statLine} />}
      </div>

      {/* Tiers */}
      {Object.keys(hero.tiers).length > 0 && (
        <>
          <div className="h-px w-full bg-border/50" />
          <div className="overflow-hidden border border-border/50">
            <div className="border-b border-border/50 bg-card px-4 py-2">
              <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Tiers</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/30">
                {Object.values(hero.tiers).map((t) => (
                  <tr key={t.tier}>
                    <td className="px-4 py-1.5 text-muted-foreground">Tier {t.tier}</td>
                    <td className="px-4 py-1.5 text-right font-medium tabular-nums text-foreground">
                      {t.levelRange.min} – {t.levelRange.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${valueClass}`}>{value}</span>
    </div>
  );
}

export default async function HeroDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return null;

  let hero;
  try {
    hero = await fetchHero(slug);
  } catch {
    notFound();
  }

  const accent = RARITY_BORDER[hero.rarity] ?? "border-l-border";
  const rarityDecoColor = RARITY_DECO[hero.rarity] ?? "text-primary";

  const heroUrl = `/${locale}/heroes/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name: hero.name,
            description: hero.description || `${hero.name}, a ${hero.rarity} ${hero.heroClass} hero from Fortnite: Save the World.`,
            url: heroUrl,
            category: hero.heroClass,
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Heroes", url: `/${locale}/search/heroes` },
            { name: hero.name, url: heroUrl },
          ]),
        ]}
      />
      <HeroViewTracker slug={slug} />

      <SectionContainer className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-12">
        <Link href={`/${locale}/search/heroes`} className="mb-6 flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="size-3" />
          Heroes
        </Link>

        {/* Layout 2 cols : Perks + Abilities (gauche, large) | InfoColumn (droite) */}
        <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:gap-10">
          <div className="flex flex-col gap-8">
            {/* Perks (le plus important - les joueurs viennent pour ca) */}
            {(hero.commanderPerk || hero.standardPerk || hero.teamPerk) && (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Perks</h2>
                <div className="flex flex-col gap-4">
                  {hero.commanderPerk && <PerkCard label="Commander Perk" perk={hero.commanderPerk} primary accent={accent} rarityColor={rarityDecoColor} kind="perk" />}
                  {hero.standardPerk && <PerkCard label="Standard" perk={hero.standardPerk} accent={accent} rarityColor={rarityDecoColor} kind="perk" />}
                  {hero.teamPerk && <PerkCard label="Team Perk" perk={hero.teamPerk} accent={accent} rarityColor={rarityDecoColor} kind="team-perk" />}
                </div>
              </section>
            )}

            {/* Abilities */}
            {hero.abilities.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Abilities</h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  {hero.abilities.map((a, i) => (
                    <AbilityCard key={i} ability={a} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right : Info column */}
          <aside className="md:sticky md:top-20 md:self-start">
            <InfoColumn hero={hero} />
          </aside>
        </div>
      </SectionContainer>
    </>
  );
}
