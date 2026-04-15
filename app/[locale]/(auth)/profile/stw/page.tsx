"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { RefreshCw, Shield, Sword, Hammer, Users, Crosshair, UserCheck, Loader2 } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { SectionContainer } from "@/components/public/SectionContainer"

interface StwProfile {
  linked: true
  lastRefreshedAt: string
  account: { epicId: string; displayName: string }
  progression: {
    commanderLevel: number
    collectionBookLevel: number
    totalXp: number
  }
  research: {
    fortitude: number
    offense: number
    resistance: number
    technology: number
  }
  founders: { isFounder: boolean; pack: string | null }
  heroLoadout: {
    commander: { templateId: string; level: number; rarity: string } | null
    supportTeam: Array<{ slot: number; templateId: string; level: number; rarity: string }>
    teamPerk: string | null
  }
  stats: {
    totalHeroes: number
    totalSchematics: number
    totalWeaponsRanged: number
    totalWeaponsMelee: number
    totalTraps: number
    totalSurvivors: number
    totalDefenders: number
  }
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 border border-border/50 bg-card p-4">
      {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
      <span className="font-burbank text-3xl text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export default function StwProfilePage() {
  const params = useParams<{ locale: string }>()
  const [profile, setProfile] = useState<StwProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notLinked, setNotLinked] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchProfile(force = false) {
    try {
      if (force) {
        setRefreshing(true)
        const data = await api.post<StwProfile>("/v1/bacon/me/stw/refresh")
        setProfile(data)
      } else {
        const data = await api.get<StwProfile>("/v1/bacon/me/stw")
        setProfile(data)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) { setNotLinked(true); return }
        if (err.status === 410) { setError("Ton lien STW a expire, relink necessaire"); setNotLinked(true); return }
        setError(err.message)
      } else {
        setError("Erreur reseau")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  if (loading) {
    return (
      <SectionContainer className="flex items-center justify-center py-40">
        <Loader2 className="size-8 animate-spin text-primary" />
      </SectionContainer>
    )
  }

  if (notLinked) {
    return (
      <SectionContainer className="flex flex-col items-center justify-center gap-6 py-40">
        <h1 className="font-burbank text-4xl uppercase text-foreground">Profil STW</h1>
        <p className="text-muted-foreground">Ton compte STW n'est pas encore lie.</p>
        {error && <p className="text-sm text-malus">{error}</p>}
        <Link
          href={`/${params.locale}/profile/stw/link`}
          className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Lier mon compte
        </Link>
      </SectionContainer>
    )
  }

  if (error) {
    return (
      <SectionContainer className="flex flex-col items-center justify-center gap-4 py-40">
        <p className="text-lg text-malus">{error}</p>
      </SectionContainer>
    )
  }

  if (!profile) return null

  const totalWeapons = profile.stats.totalWeaponsRanged + profile.stats.totalWeaponsMelee

  return (
    <SectionContainer className="mx-auto max-w-4xl px-4 py-16 md:px-10">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-burbank text-4xl uppercase text-foreground md:text-5xl">{profile.account.displayName}</h1>
          {profile.founders.isFounder && (
            <span className="text-sm font-semibold capitalize text-legendary">Founder — {profile.founders.pack}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchProfile(true)}
          disabled={refreshing}
          className="flex items-center gap-2 border border-border/50 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refresh..." : "Actualiser"}
        </button>
      </div>

      {/* Progression */}
      <h2 className="mb-3 font-burbank text-2xl uppercase text-foreground">Progression</h2>
      <div className="mb-10 grid grid-cols-3 gap-3">
        <StatCard label="Commander Level" value={profile.progression.commanderLevel} icon={<Shield className="size-5" />} />
        <StatCard label="Collection Book" value={profile.progression.collectionBookLevel} />
        <StatCard label="Total XP" value={profile.progression.totalXp.toLocaleString()} />
      </div>

      {/* Research */}
      <h2 className="mb-3 font-burbank text-2xl uppercase text-foreground">F.O.R.T. Research</h2>
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Fortitude" value={profile.research.fortitude} />
        <StatCard label="Offense" value={profile.research.offense} />
        <StatCard label="Resistance" value={profile.research.resistance} />
        <StatCard label="Technology" value={profile.research.technology} />
      </div>

      {/* Inventaire */}
      <h2 className="mb-3 font-burbank text-2xl uppercase text-foreground">Inventaire</h2>
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Heroes" value={profile.stats.totalHeroes} icon={<Users className="size-5" />} />
        <StatCard label="Schematics" value={profile.stats.totalSchematics} />
        <StatCard label="Ranged" value={profile.stats.totalWeaponsRanged} icon={<Crosshair className="size-5" />} />
        <StatCard label="Melee" value={profile.stats.totalWeaponsMelee} icon={<Sword className="size-5" />} />
        <StatCard label="Traps" value={profile.stats.totalTraps} icon={<Hammer className="size-5" />} />
        <StatCard label="Survivors" value={profile.stats.totalSurvivors} />
        <StatCard label="Defenders" value={profile.stats.totalDefenders} icon={<UserCheck className="size-5" />} />
        <StatCard label="Total Weapons" value={totalWeapons} />
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground">
        Derniere synchro : {new Date(profile.lastRefreshedAt).toLocaleString()}
      </p>
    </SectionContainer>
  )
}
