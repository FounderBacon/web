"use client"

import Link from "next/link"
import { GitCompareArrows, PackageOpen, Shield, SlidersHorizontal, X } from "lucide-react"
import { AssetImage } from "@/components/ui/asset-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { weaponIcon, type AssetCategory } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { useCompare, MAX_COMPARE, SERIES_COLORS } from "@/lib/compare/store"
import { compareGridVars, CMP_ROW, CMP_VALUES } from "@/lib/compare/grid"
import { perkSummary, resolvePerks } from "@/lib/compare/summary"
import { compareEditHref } from "@/lib/compare/editLink"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { useCompareEntries, type ResolvedEntry } from "@/lib/compare/useCompareEntries"
import { useLoadout } from "@/lib/loadout/store"
import { loadoutToApiPayload } from "@/lib/loadout/selectors"
import { CompareStatsTable } from "./CompareStatsTable"
import { HeroLoadoutStrip } from "./HeroLoadoutStrip"

interface CompareQuickEditProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
}

function iconCategory(type: "ranged" | "melee"): AssetCategory {
  return type === "ranged" ? "weapons-ranged" : "weapons-melee"
}

// Colonne des libelles de stats, a partir de md seulement : en dessous, la
// modal est trop etroite pour une grille complete et les libelles passent
// au-dessus des valeurs. Voir lib/compare/grid.ts.
const LABEL_MIN_WIDTH = 116

/**
 * En-tete d'une colonne : identite de l'arme et build qui lui est propre.
 *
 * La barre de couleur en haut reprend celle des barres de magnitude du
 * tableau, pour que la colonne reste identifiable une fois le nom tronque —
 * et c'est la seule cle disponible sur mobile, ou les valeurs passent en
 * lignes empilees sous leur libelle.
 */
function ColumnHeader({
  item,
  color,
  locale,
  onRemove,
  onNavigate,
}: {
  item: ResolvedEntry
  color: string
  locale: string
  onRemove: () => void
  onNavigate: () => void
}) {
  const t = useCompareT()
  const { entry, weapon } = item
  const name = weapon?.name ?? entry.name ?? entry.ref.slug.replace(/-/g, " ")
  const icon = weapon?.icon ?? entry.icon
  const rarity = weapon?.rarity ?? entry.rarity

  const build: string[] = []
  if (entry.init.tier) build.push(`T${entry.init.tier}`)
  if (entry.init.material) build.push(entry.init.material)
  if (entry.init.level) build.push(`Lv${entry.init.level}`)
  // Offensive propre a la colonne seulement : sans elle, la colonne suit le profil.
  if (entry.init.offensive !== undefined) build.push(`${t.offensiveShort} ${entry.init.offensive}`)
  // Les perks sont nommes, pas comptes : c'est souvent la seule difference
  // entre deux colonnes portant la meme arme. L'entree stockee ne garde que
  // leurs identifiants, l'arme chargee fournit les libelles.
  const perkCount = entry.init.perkIds?.filter(Boolean).length ?? 0
  const perkLabel = perkSummary(resolvePerks(weapon?.perkSlots, entry.init.perkIds), (count) =>
    fmt(t.perksCount, { count }),
  )
  if (perkLabel) build.push(perkLabel)
  else if (perkCount > 0) build.push(`${perkCount}p`)

  return (
    <div className="group/col relative flex h-full flex-col items-center gap-1 px-1 pb-2.5 pt-3 text-center md:px-2">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }} aria-hidden />

      {/* Retrait discret : revele au survol sur desktop, toujours present au
          doigt — un controle qui n'apparait qu'au hover est inatteignable
          sur mobile. Decale sous la barre de couleur plutot que dessus. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={fmt(t.removeFromComparison, { name })}
        className="absolute right-0.5 top-2 p-0.5 text-muted-foreground transition-colors hover:text-foreground md:opacity-0 md:transition-opacity md:focus-visible:opacity-100 md:group-hover/col:opacity-100"
      >
        <X className="size-3.5" />
      </button>

      {icon ? (
        <AssetImage
          src={weaponIcon(icon, iconCategory(entry.ref.type))}
          alt={name}
          className="size-9 shrink-0 object-contain md:size-11"
        />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center border border-border/60 text-xs uppercase text-muted-foreground md:size-11">
          {name.charAt(0)}
        </div>
      )}

      {/* Hauteur reservee pour deux lignes : sans elle, une arme au nom court
          remonte tout le reste de sa colonne et les resumes de build ne
          s'alignent plus d'une colonne a l'autre. */}
      <div className="flex min-h-8 w-full items-center justify-center md:min-h-10">
        <p className="line-clamp-2 text-[11px] font-bold uppercase leading-tight text-foreground md:text-sm">
          {name}
        </p>
      </div>

      {/* La rarete ne tient pas dans une colonne etroite sans tronquer le nom :
          elle n'apparait qu'a partir de md. */}
      {rarity && (
        <p className={`hidden text-[11px] capitalize md:block ${RARITY_TEXT[rarity] ?? "text-muted-foreground"}`}>
          {rarity}
        </p>
      )}

      {/* Le build est propre a chaque arme : il ne se propage pas aux autres
          colonnes. Sur deux lignes plutot que tronque : quand plusieurs
          colonnes portent la meme arme, c'est le seul texte qui les
          distingue. */}
      <p className="line-clamp-2 w-full text-[10px] capitalize leading-snug text-muted-foreground md:text-[11px]">
        {build.length > 0 ? build.join(" / ") : t.defaultBuild}
      </p>

      {/* Loadout de heros applique : son nom quand la colonne en fixe un, et
          toujours les heros, ceux du profil a defaut. */}
      {entry.init.hero && (
        <p className="flex w-full items-center justify-center gap-1 truncate text-[10px] text-muted-foreground md:text-[11px]">
          <Shield className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{entry.init.hero.name ?? t.heroCustom}</span>
        </p>
      )}
      <HeroLoadoutStrip hero={entry.init.hero} />

      {/* La modal est en lecture seule : le reglage du build se fait sur la
          fiche de l'arme, qui n'etait accessible depuis nulle part ici. */}
      <Link
        href={compareEditHref(locale, entry.ref, entry.init)}
        onClick={onNavigate}
        className="mt-auto inline-flex items-center gap-1 pt-1 text-[10px] text-primary underline underline-offset-2 hover:text-primary/80 md:text-[11px]"
      >
        <SlidersHorizontal className="size-3 shrink-0" />
        <span className="hidden sm:inline">{t.editBuild}</span>
        <span className="sm:hidden">{t.build}</span>
      </Link>
    </div>
  )
}

// Message pleine largeur pour les etats ou il n'y a pas de tableau a montrer.
function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <PackageOpen className="size-7 text-muted-foreground/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-64 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  )
}

/**
 * Comparaison en modal, ouverte depuis la barre flottante. Lecture seule :
 * le reglage fin du build reste sur la page dediee, qui a la place pour
 * afficher les selecteurs.
 *
 * La modal est une colonne flex a hauteur bornee : titre et en-tete de
 * colonnes en haut, pied en bas, et une seule zone qui defile entre les deux.
 * Auparavant toute la modal defilait et ces trois blocs etaient rattrapes par
 * `sticky` — ce qui emportait aussi le bouton de fermeture, pose en absolute
 * par DialogContent, hors de l'ecran des le premier scroll.
 *
 * Le chassis (titre, en-tete de colonnes, pied) est sur `card`, les stats sur
 * `background` : en theme sombre, le fond de dialogue par defaut est un violet
 * moyen sur lequel les couleurs de serie et les ecarts vert/rouge perdaient
 * beaucoup de contraste, et le meme tableau n'avait pas le meme aspect ici et
 * sur la page dediee. En theme clair les deux jetons sont identiques : seules
 * les bordures separent, comme avant.
 */
export function CompareQuickEdit({ open, onOpenChange, locale }: CompareQuickEditProps) {
  const t = useCompareT()
  const entries = useCompare((s) => s.entries)
  const removeAt = useCompare((s) => s.removeAt)
  const clear = useCompare((s) => s.clear)

  // Le loadout est partage par toutes les colonnes, comme sur la page compare.
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const heroPayload = loadoutToApiPayload({ commander, support, teamPerks })
  const profileOffensive = useLoadout((s) => s.offensive)

  // Les appels ne partent qu'a l'ouverture : la modal est montee en permanence.
  const { resolved, loading } = useCompareEntries(entries, heroPayload, open, profileOffensive)

  const columns = resolved.map((r) => r.stats)
  const names = resolved.map((r) => r.weapon?.name ?? r.entry.name ?? null)
  const hasStats = columns.some((c) => c !== null)

  return (
    // Infobulles des en-tetes (heros) comme du tableau : un seul provider,
    // le contexte traverse le portail du dialogue.
    <TooltipProvider delayDuration={200}>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 gap-0.5 border-b border-border/50 bg-card px-4 py-3 pr-12">
          <DialogTitle className="font-burbank text-sm uppercase tracking-wider">
            {t.modalTitle}{" "}
            <span className="text-muted-foreground">
              {entries.length}/{MAX_COMPARE}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t.modalDescription}
          </DialogDescription>
        </DialogHeader>

        {/* En-tete de colonnes et tableau partagent la meme grille, portee par
            des variables CSS posees ici. Aucun conteneur a defilement
            horizontal : sous md le tableau passe en lignes empilees (voir
            lib/compare/grid.ts), donc les colonnes n'ont plus a etre ecrasees
            ni poussees hors de l'ecran. */}
        <div className="flex min-h-0 flex-col" style={compareGridVars(resolved.length, LABEL_MIN_WIDTH)}>
          {resolved.length > 0 && (
            // Hors de la zone qui defile : l'identite des colonnes reste
            // visible pendant tout le parcours de la liste de stats.
            <div className={`shrink-0 border-b border-border/50 bg-card px-2 md:gap-2 md:px-4 ${CMP_ROW}`}>
              {/* Meme repere que sur la page compare, a la meme place dans la grille. */}
              <div className="hidden items-end pb-3 md:flex">
                <p className="font-burbank text-sm uppercase tracking-wider text-muted-foreground">{t.weapon}</p>
              </div>
              <div className={CMP_VALUES}>
                {resolved.map((item, i) => (
                  // Meme separateur vertical que les lignes de stats en dessous :
                  // la colonne reste identifiable a la limite pres.
                  // Index en cle : la meme arme peut occuper deux colonnes
                  // avec deux builds differents, donc la reference ne
                  // distingue plus les entrees.
                  <div key={i} className={i > 0 ? "border-l border-border/30" : ""}>
                    <ColumnHeader
                      item={item}
                      color={SERIES_COLORS[i] ?? SERIES_COLORS[0]}
                      locale={locale}
                      onRemove={() => removeAt(i)}
                      onNavigate={() => onOpenChange(false)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && !hasStats ? (
              <div className="flex justify-center py-14">
                <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                title={t.emptyTitle}
                hint={t.emptyHint}
              />
            ) : entries.length < 2 ? (
              <EmptyState
                title={t.oneMoreTitle}
                hint={t.oneMoreHint}
              />
            ) : (
              <>
                {/* Sans cadre ni marge : le tableau est le contenu de la modal,
                    l'encadrer dedans faisait une boite dans une boite et
                    rognait la largeur utile des colonnes. */}
                <CompareStatsTable columns={columns} names={names} colors={SERIES_COLORS} bordered={false} />
              </>
            )}
          </div>
        </div>

        <div className="z-10 flex shrink-0 items-center justify-between gap-2 border-t border-border/50 bg-card px-4 py-3 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.5)]">
          <Button size="xs" variant="ghost" onClick={clear} disabled={entries.length === 0}>
            {t.clearAll}
          </Button>
          <Button size="xs" asChild>
            <Link href={`/${locale}/weapons/compare`} onClick={() => onOpenChange(false)}>
              <GitCompareArrows className="size-3" />
              {t.openFull}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  )
}
