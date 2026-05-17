"use client"

import { Check, Pencil, Save, Trash2, Upload, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  PRESETS_LIMIT,
  usePresets,
  type LoadoutPreset,
  type LoadoutPresetSnapshot,
} from "@/lib/loadout/presets"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Snapshot du loadout actif — sert au "save current"
  current: LoadoutPresetSnapshot
  hasCurrent: boolean
  // Callback : charge un preset dans le store actif
  onLoad: (snapshot: LoadoutPresetSnapshot) => void
}

export function PresetsDialog({ open, onOpenChange, current, hasCurrent, onLoad }: Props) {
  const presets = usePresets((s) => s.presets)
  const save = usePresets((s) => s.save)
  const remove = usePresets((s) => s.remove)
  const rename = usePresets((s) => s.rename)

  const [name, setName] = useState("")
  const [justSaved, setJustSaved] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  // Reset l'etat local quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setName("")
      setJustSaved(false)
      setRenamingId(null)
      setRenameValue("")
    }
  }, [open])

  const atLimit = presets.length >= PRESETS_LIMIT
  const canSave = hasCurrent && !atLimit && name.trim().length > 0

  function handleSave() {
    if (!canSave) return
    save(name, current)
    setName("")
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  function handleStartRename(p: LoadoutPreset) {
    setRenamingId(p.id)
    setRenameValue(p.name)
  }

  function handleCommitRename() {
    if (!renamingId) return
    rename(renamingId, renameValue)
    setRenamingId(null)
    setRenameValue("")
  }

  function handleLoad(p: LoadoutPreset) {
    onLoad(p.snapshot)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 bg-king-900 p-5">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-base font-semibold">Loadout presets</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Save your current loadout to recall it later. Presets are stored locally in this browser.
          </p>
        </div>

        {/* Save current ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-2 border border-border/50 bg-card/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Save current loadout
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
              placeholder={hasCurrent ? "Preset name" : "Configure a loadout first"}
              disabled={!hasCurrent || atLimit}
              maxLength={60}
              className="flex-1 border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button size="sm" onClick={handleSave} disabled={!canSave}>
              {justSaved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
              {justSaved ? "Saved" : "Save"}
            </Button>
          </div>
          {atLimit && (
            <p className="text-[11px] text-destructive">
              Preset limit reached ({PRESETS_LIMIT}). Delete one to save a new preset.
            </p>
          )}
        </section>

        {/* Saved presets ────────────────────────────────────────── */}
        <section className="flex flex-col gap-2">
          <header className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Saved presets
            </p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
              {presets.length} / {PRESETS_LIMIT}
            </span>
          </header>

          {presets.length === 0 ? (
            <div className="border border-dashed border-border/50 bg-card/20 p-4 text-center text-xs text-muted-foreground">
              No saved presets yet.
            </div>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              {presets.map((p) => {
                const isRenaming = renamingId === p.id
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 border border-border/40 bg-card/30 p-2"
                  >
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename()
                          if (e.key === "Escape") {
                            setRenamingId(null)
                            setRenameValue("")
                          }
                        }}
                        autoFocus
                        maxLength={60}
                        className="flex-1 border border-border/50 bg-muted/60 px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {summarizePreset(p)} · {formatDate(p.createdAt)}
                        </p>
                      </div>
                    )}

                    <div className="flex shrink-0 items-center gap-1">
                      {isRenaming ? (
                        <>
                          <IconButton title="Confirm" onClick={handleCommitRename}>
                            <Check className="size-3.5" />
                          </IconButton>
                          <IconButton
                            title="Cancel"
                            onClick={() => {
                              setRenamingId(null)
                              setRenameValue("")
                            }}
                          >
                            <X className="size-3.5" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton title="Load" onClick={() => handleLoad(p)}>
                            <Upload className="size-3.5" />
                          </IconButton>
                          <IconButton title="Rename" onClick={() => handleStartRename(p)}>
                            <Pencil className="size-3.5" />
                          </IconButton>
                          <IconButton title="Delete" onClick={() => remove(p.id)} danger>
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ────────────────────────────────────────────────

interface IconButtonProps {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}

function IconButton({ title, onClick, danger, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex size-7 items-center justify-center border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:bg-card hover:text-foreground ${
        danger ? "hover:border-destructive/60 hover:text-destructive" : ""
      }`}
    >
      {children}
    </button>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function summarizePreset(p: LoadoutPreset): string {
  const s = p.snapshot
  const supportCount = s.support.filter(Boolean).length
  const parts: string[] = []
  if (s.commander) parts.push("1 cmd")
  if (supportCount > 0) parts.push(`${supportCount} sup`)
  if (s.teamPerks.length > 0) parts.push("team perk")
  if (s.offensive > 0) parts.push(`+${s.offensive} off`)
  return parts.length > 0 ? parts.join(" · ") : "empty"
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
