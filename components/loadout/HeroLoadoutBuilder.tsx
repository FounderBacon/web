"use client"

import { Camera, Check, QrCode, RotateCcw, Save, Share2, Users } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { LoadoutBonusesPanel } from "@/components/loadout/LoadoutBonusesPanel"
import { LoadoutScreenshotDialog } from "@/components/loadout/LoadoutScreenshotDialog"
import { LoadoutSlot } from "@/components/loadout/LoadoutSlot"
import { PresetsDialog } from "@/components/loadout/PresetsDialog"
import { TeamPerkPicker } from "@/components/loadout/TeamPerkPicker"
import { SectionContainer } from "@/components/public/SectionContainer"
import { QrShareDialog } from "@/components/share/QrShareDialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Locale } from "@/lib/i18n"
import type { LoadoutPresetSnapshot } from "@/lib/loadout/presets"
import { countFilledSlots, hasAnyLoadout } from "@/lib/loadout/selectors"
import { useLoadout } from "@/lib/loadout/store"
import { decodeLoadoutFromParams, encodeLoadoutToParams, hasLoadoutParams } from "@/lib/loadout/url"

interface Props {
  locale: Locale
}

export function HeroLoadoutBuilder({ locale: _locale }: Props) {
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const offensive = useLoadout((s) => s.offensive)
  const setCommander = useLoadout((s) => s.setCommander)
  const setSupport = useLoadout((s) => s.setSupport)
  const toggleTeamPerk = useLoadout((s) => s.toggleTeamPerk)
  const setTeamPerk = useLoadout((s) => s.setTeamPerk)
  const setOffensive = useLoadout((s) => s.setOffensive)
  const clear = useLoadout((s) => s.clear)

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const filled = hasAnyLoadout({ commander, support, teamPerks })
  const filledCount = countFilledSlots({ commander, support, teamPerks })

  // Input offensive : decouple du store pour eviter sync sur chaque keystroke
  const [localOffensive, setLocalOffensive] = useState(String(offensive))
  useEffect(() => {
    setLocalOffensive(String(offensive))
  }, [offensive])

  function commitOffensive(raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0)
    setLocalOffensive(String(n))
    setOffensive(n)
  }

  // ── Auto-load depuis URL au mount (lien partage) ──────────────
  // Le sync URL <-> store reste actif apres : l'URL refletera toujours le state actuel.
  const loadedFromUrlRef = useRef(false)
  const [loadingShared, setLoadingShared] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(false)
  useEffect(() => {
    if (loadedFromUrlRef.current) return
    loadedFromUrlRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    if (!hasLoadoutParams(params)) {
      setSyncEnabled(true)
      return
    }
    setLoadingShared(true)
    decodeLoadoutFromParams(params)
      .then((snapshot) => {
        setCommander(snapshot.commander)
        snapshot.support.forEach((slot, i) => setSupport(i, slot))
        setTeamPerk(snapshot.teamPerks[0] ?? null)
        setOffensive(snapshot.offensive)
      })
      .finally(() => {
        setLoadingShared(false)
        setSyncEnabled(true)
      })
  }, [searchParams, setCommander, setSupport, setTeamPerk, setOffensive])

  // ── Share path/url (calcule a chaque changement du loadout) ───
  // path : "/{locale}/hero-loadout?c=...&s=...&t=...&o=..."
  // url  : "https://.../{locale}/hero-loadout?..."
  const { sharePath, shareUrl } = useMemo(() => {
    const params = encodeLoadoutToParams({ commander, support, teamPerks, offensive })
    const query = params.toString()
    const path = query ? `${pathname}?${query}` : pathname
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return { sharePath: path, shareUrl: `${origin}${path}` }
  }, [commander, support, teamPerks, offensive, pathname])

  // ── Sync URL barre <-> store ──────────────────────────────────
  // L'URL reflete toujours le loadout actuel : copier depuis la barre = partage direct.
  // Utilise history.replaceState pour eviter de declencher un re-render Next.
  useEffect(() => {
    if (!syncEnabled) return
    if (typeof window === "undefined") return
    const current = window.location.pathname + window.location.search
    if (current === sharePath) return
    window.history.replaceState(null, "", sharePath)
  }, [syncEnabled, sharePath])

  // Copy URL dans le clipboard
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleShare() {
    if (!filled) return
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // fallback silencieux : on pourrait afficher un toast
      })
  }
  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
  }, [])

  // ── Dialogs : QR + Presets + Screenshot ───────────────────────
  const [qrOpen, setQrOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [screenshotOpen, setScreenshotOpen] = useState(false)

  // Applique un snapshot (depuis preset) au store actif. Clear d'abord
  // pour eviter les residus dans les slots support non remplis par le preset.
  function applySnapshot(snapshot: LoadoutPresetSnapshot) {
    clear()
    setCommander(snapshot.commander)
    snapshot.support.forEach((slot, i) => setSupport(i, slot))
    setTeamPerk(snapshot.teamPerks[0] ?? null)
    setOffensive(snapshot.offensive)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <SectionContainer className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-3 border-b border-border/50 pb-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            <Users className="size-3" />
            Loadout builder
          </p>
          <h1 className="font-burbank text-4xl uppercase leading-none text-foreground md:text-6xl">
            Build your hero loadout
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Configure your commander, support team and team perks. Save presets, share via URL or QR code, and visualize the combined bonuses applied to your weapons and traps.
          </p>
        </header>

        {/* Layout 2-col : configuration a gauche, sidebar stats/actions a droite */}
        <div className="grid gap-8 md:grid-cols-[1fr_340px] md:gap-8 xl:grid-cols-[1fr_380px] xl:gap-10">
          {/* ── Configuration ── */}
          <div className="flex flex-col gap-10">
            {/* F.O.R.T. */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">F.O.R.T.</h2>
              <div className="flex items-center gap-4 border border-border/50 bg-card/40 p-4">
                <label className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">Offensive</span>
                  <span className="text-xs text-muted-foreground">Account-wide offense bonus (0–110+)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={localOffensive}
                  onChange={(e) => setLocalOffensive(e.target.value)}
                  onBlur={(e) => commitOffensive(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitOffensive((e.target as HTMLInputElement).value)
                  }}
                  className="w-24 border border-border/50 bg-muted/60 px-2 py-2 text-center text-lg font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
                />
              </div>
            </section>

            {/* Commander */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Commander</h2>
              <LoadoutSlot slot={commander} label="Commander" kind="commander" onChange={setCommander} />
            </section>

            {/* Support team */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Support team</h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {support.map((slot, i) => (
                  <LoadoutSlot
                    key={i}
                    slot={slot}
                    label={`Support ${i + 1}`}
                    kind="support"
                    onChange={(s) => setSupport(i, s)}
                  />
                ))}
              </div>
            </section>

            {/* Team perks */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Team perks {teamPerks.length > 0 && <span className="text-foreground">({teamPerks.length})</span>}
              </h2>
              <TeamPerkPicker selected={teamPerks} onToggle={toggleTeamPerk} />
            </section>
          </div>

          {/* ── Sidebar : stats + actions ── */}
          <aside className="flex flex-col gap-4 md:sticky md:top-24 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:pr-1">
            {/* Status */}
            <div className="border border-border/50 bg-card/40 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
              <p className="mt-2 font-burbank text-2xl uppercase text-foreground">
                {filled ? `${filledCount} slot${filledCount > 1 ? "s" : ""} filled` : "Empty"}
              </p>
            </div>

            {/* Actions (placees en haut : toujours visibles, le panneau bonuses peut etre long) */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!filled || loadingShared}
                  className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-3 text-sm font-semibold text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-uncommon" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="size-4" />
                      Share
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  disabled={!filled || loadingShared}
                  className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-3 text-sm font-semibold text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50"
                >
                  <QrCode className="size-4" />
                  QR code
                </button>
              </div>
              <button
                type="button"
                onClick={() => setScreenshotOpen(true)}
                disabled={!filled || loadingShared}
                className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-3 text-sm font-semibold text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50"
              >
                <Camera className="size-4" />
                Screenshot
              </button>
              <button
                type="button"
                onClick={() => setPresetsOpen(true)}
                className="flex items-center justify-center gap-2 border border-border/50 bg-card/40 p-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
              >
                <Save className="size-4" />
                Presets
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={!filled}
                className="flex items-center justify-center gap-2 border border-border/50 bg-card/20 p-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="size-4" />
                Clear all
              </button>
            </div>

            {/* Combined bonuses (peut etre long, place en dernier) */}
            <LoadoutBonusesPanel
              commander={commander}
              support={support}
              teamPerks={teamPerks}
              offensive={offensive}
            />
          </aside>
        </div>
      </SectionContainer>

      <QrShareDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        path={sharePath}
        fullUrl={shareUrl}
        title="Hero loadout"
        description="Scan or download to share this loadout"
      />

      <PresetsDialog
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        current={{ commander, support, teamPerks, offensive }}
        hasCurrent={filled}
        onLoad={applySnapshot}
      />

      <LoadoutScreenshotDialog
        open={screenshotOpen}
        onOpenChange={setScreenshotOpen}
        commander={commander}
        support={support}
        teamPerks={teamPerks}
        offensive={offensive}
        sharePath={sharePath}
      />
    </TooltipProvider>
  )
}
