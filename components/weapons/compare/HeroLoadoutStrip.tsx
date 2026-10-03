"use client"

import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { teamPerkIcon } from "@/lib/cdn"
import type { HeroBuild } from "@/lib/compare/hero"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { RARITY_BORDER } from "@/lib/constants"
import { useLoadout, type LoadoutHeroSlot, type LoadoutTeamPerk } from "@/lib/loadout/store"

interface HeroLoadoutStripProps {
  // Loadout propre a la colonne ; absent, c'est celui du profil qui s'applique.
  hero: HeroBuild | undefined
}

/**
 * Heros reellement appliques a une colonne, en une rangee de portraits.
 *
 * Le nom du loadout ne suffit pas pour comparer : deux colonnes "Profile
 * loadout" et "Custom loadout" ne disent pas quels heros font la difference.
 * Ici on les voit, commandant en premier, avec le detail au survol.
 *
 * La rangee tient dans une colonne de ~110px (trois colonnes sur telephone) :
 * portraits de 20px qui passent a la ligne plutot que de deborder.
 */
export function HeroLoadoutStrip({ hero }: HeroLoadoutStripProps) {
  const t = useCompareT()
  const profileCommander = useLoadout((s) => s.commander)
  const profileSupport = useLoadout((s) => s.support)
  const profileTeamPerks = useLoadout((s) => s.teamPerks)

  // Loadout recu par lien : seuls les identifiants de perks ont voyage.
  if (hero && !hero.slots) {
    const count = (hero.commanderPerkId ? 1 : 0) + hero.supportPerkIds.length
    return <p className="text-[10px] leading-tight text-muted-foreground/80">{fmt(t.heroPerksOnly, { count })}</p>
  }

  const commander = hero ? (hero.slots?.commander ?? null) : profileCommander
  const support = (hero ? (hero.slots?.support ?? []) : profileSupport).filter((s): s is LoadoutHeroSlot => s !== null)
  const teamPerks = hero ? (hero.slots?.teamPerks ?? []) : profileTeamPerks

  if (!commander && support.length === 0 && teamPerks.length === 0) {
    return <p className="text-[10px] leading-tight text-muted-foreground/70">{t.noHeroes}</p>
  }

  return (
    <ul className="flex flex-wrap items-center justify-center gap-0.5" aria-label={t.heroBonusTitle}>
      {commander && <HeroAvatar slot={commander} role={t.heroCommander} large />}
      {support.map((slot, i) => (
        <HeroAvatar key={`${slot.heroSlug}-${i}`} slot={slot} role={t.heroSupportN} />
      ))}
      {teamPerks.map((perk) => (
        <TeamPerkBadge key={perk.perkId} perk={perk} teamPerkLabel={t.heroTeamPerk} />
      ))}
    </ul>
  )
}

function HeroAvatar({ slot, role, large = false }: { slot: LoadoutHeroSlot; role: string; large?: boolean }) {
  const accent = RARITY_BORDER[slot.rarity] ?? "border-l-border"
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Le commandant est plus grand : c'est son perk, a pleine puissance,
              qui pese le plus sur les chiffres de la colonne. */}
          <span
            tabIndex={0}
            className={`relative block overflow-hidden border border-border/50 border-l-2 ${accent} bg-muted/30 ${large ? "size-6 md:size-7" : "size-5 md:size-6"}`}
          >
            <AssetImage src={slot.heroIconUrl} alt={slot.heroName} className="absolute inset-0 size-full object-cover" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0">
          <TooltipCard
            image={<AssetImage src={slot.heroIconUrl} alt="" className="absolute inset-0 size-full object-cover" />}
            imageClassName={`border-l-2 ${accent}`}
            eyebrow={role}
            title={slot.heroName}
            detailTitle={slot.perkName}
            detail={slot.perkDescription !== slot.perkName ? slot.perkDescription : undefined}
          />
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

/**
 * Contenu d'une infobulle de heros ou de perk d'equipe : une petite carte
 * verticale. Le contenu par defaut des infobulles est une rangee horizontale,
 * qui alignait role, nom et perk cote a cote sur une seule ligne illisible.
 */
function TooltipCard({
  image,
  imageClassName = "",
  eyebrow,
  title,
  detailTitle,
  detail,
}: {
  image: React.ReactNode
  imageClassName?: string
  eyebrow: string
  title: string
  detailTitle?: string
  detail?: string
}) {
  return (
    <div className="flex w-64 flex-col gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`relative size-10 shrink-0 overflow-hidden border border-border/50 bg-muted/30 ${imageClassName}`}>{image}</span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</span>
          <span className="text-sm font-semibold leading-tight text-foreground">{title}</span>
        </div>
      </div>
      {(detailTitle || detail) && (
        <div className="flex flex-col gap-0.5 border-t border-primary/20 pt-2">
          {detailTitle && <span className="text-xs font-semibold text-foreground">{detailTitle}</span>}
          {detail && <span className="text-[11px] leading-snug text-muted-foreground">{detail}</span>}
        </div>
      )}
    </div>
  )
}

function TeamPerkBadge({ perk, teamPerkLabel }: { perk: LoadoutTeamPerk; teamPerkLabel: string }) {
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="relative ml-0.5 block size-5 overflow-hidden border border-primary/40 bg-card/60 md:size-6">
            <AssetImage src={teamPerkIcon(perk.name)} alt={perk.name} className="absolute inset-0 size-full object-contain p-0.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0">
          <TooltipCard
            image={<AssetImage src={teamPerkIcon(perk.name)} alt="" className="absolute inset-0 size-full object-contain p-1" />}
            eyebrow={teamPerkLabel}
            title={perk.name}
            detailTitle={perk.requirements}
            detail={perk.description}
          />
        </TooltipContent>
      </Tooltip>
    </li>
  )
}
