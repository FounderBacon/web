"use client"

import { AssetImage } from "@/components/ui/asset-image"
import { perkIcon, teamPerkIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "@/lib/loadout/store"

interface Props {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  offensive: number
}

// Affiche la liste lisible des perks actifs du loadout. Pas de calcul agrege :
// chaque ligne expose le perk avec sa description telle que retournee par l'API,
// pour eviter toute divergence avec le calcul backend.
export function LoadoutBonusesPanel({ commander, support, teamPerks, offensive }: Props) {
  const supportSlots = support.filter((s): s is LoadoutHeroSlot => s !== null)
  const totalPerks = (commander ? 1 : 0) + supportSlots.length + teamPerks.length

  if (totalPerks === 0 && offensive === 0) {
    return (
      <div className="border border-border/50 bg-card/40 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Combined bonuses</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Configure your loadout to see the active perks and bonuses listed here.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border/50 bg-card/40 p-5">
      <header className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Combined bonuses</p>
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
          {totalPerks} {totalPerks === 1 ? "perk" : "perks"}
        </span>
      </header>

      <div className="flex flex-col gap-4">
        {/* F.O.R.T. */}
        {offensive > 0 && (
          <section className="flex items-center justify-between border-l-2 border-l-uncommon bg-card/30 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">F.O.R.T. offensive</span>
            <span className="font-burbank text-xl text-uncommon">+{offensive}</span>
          </section>
        )}

        {/* Commander perk */}
        {commander && (
          <PerkRow
            kind="Commander"
            heroName={commander.heroName}
            heroRarity={commander.rarity}
            iconUrl={perkIcon(commander.perkName)}
            perkName={commander.perkName}
            perkDescription={commander.perkDescription}
            primary
          />
        )}

        {/* Support perks */}
        {supportSlots.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Support standard ({supportSlots.length})
            </p>
            {supportSlots.map((s) => (
              <PerkRow
                key={`${s.heroSlug}-${s.perkId}`}
                kind="Support"
                heroName={s.heroName}
                heroRarity={s.rarity}
                iconUrl={perkIcon(s.perkName)}
                perkName={s.perkName}
                perkDescription={s.perkDescription}
              />
            ))}
          </section>
        )}

        {/* Team perks */}
        {teamPerks.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Team perks ({teamPerks.length})
            </p>
            {teamPerks.map((p) => (
              <PerkRow
                key={p.perkId}
                kind="Team"
                iconUrl={teamPerkIcon(p.name)}
                perkName={p.name}
                perkDescription={p.description ?? p.requirements}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

interface PerkRowProps {
  kind: string
  heroName?: string
  heroRarity?: string
  iconUrl: string
  perkName: string
  perkDescription: string
  primary?: boolean
}

function PerkRow({ kind, heroName, heroRarity, iconUrl, perkName, perkDescription, primary }: PerkRowProps) {
  const rarityClass = heroRarity ? RARITY_TEXT[heroRarity] : undefined
  return (
    <div
      className={`flex gap-3 border border-border/40 ${primary ? "border-l-2 border-l-primary bg-card/60" : "bg-card/30"} p-3`}
    >
      <div className="relative size-10 shrink-0 overflow-hidden border border-border/50 bg-muted/30">
        <AssetImage src={iconUrl} alt="" className="absolute inset-0 size-full object-contain" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{perkName}</p>
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{kind}</span>
        </div>
        {heroName && (
          <p className="text-[11px] text-muted-foreground">
            {heroName}
            {heroRarity && (
              <>
                {" · "}
                <span className={`capitalize ${rarityClass ?? ""}`}>{heroRarity}</span>
              </>
            )}
          </p>
        )}
        <p className="text-xs leading-relaxed text-foreground/90">{perkDescription}</p>
      </div>
    </div>
  )
}
