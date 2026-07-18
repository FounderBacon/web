import { notFound } from "next/navigation"
import { fetchChangelog } from "@/lib/api/changelog"
import { fetchHeroes } from "@/lib/api/heroes"
import { fetchSurvivorLeads } from "@/lib/api/survivor-leads"
import { fetchSurvivors } from "@/lib/api/survivors"
import { fetchTraps } from "@/lib/api/traps"
import { fetchMeleeWeapons, fetchRangedWeapons } from "@/lib/api/weapons"
import { isProduction } from "@/lib/env"

// Page de dev pour previewer les OG cards dynamiques.
// Bloque en production, sinon accessible sur /:locale/dev/og.
export const dynamic = "force-dynamic"

interface Sample {
  label: string
  pagePath: string
  ogPath: string
}

async function buildSamples(locale: string): Promise<Sample[]> {
  const [ranged, melee, traps, heroes, survivors, leads, changelog] = await Promise.all([
    fetchRangedWeapons({ limit: 1 }).catch(() => null),
    fetchMeleeWeapons({ limit: 1 }).catch(() => null),
    fetchTraps({ limit: 1 }).catch(() => null),
    fetchHeroes({ limit: 6 }).catch(() => null),
    fetchSurvivors({ limit: 1 }).catch(() => null),
    fetchSurvivorLeads({ limit: 1 }).catch(() => null),
    fetchChangelog({ limit: 1 }).catch(() => null),
  ])

  const samples: Sample[] = []

  // 6 heroes (un par rarete idealement, sinon les 6 premiers)
  const heroList = heroes?.data ?? []
  const seenRarity = new Set<string>()
  const heroesByRarity: typeof heroList = []
  for (const h of heroList) {
    if (!seenRarity.has(h.rarity)) {
      seenRarity.add(h.rarity)
      heroesByRarity.push(h)
      if (heroesByRarity.length >= 6) break
    }
  }
  for (const h of heroesByRarity.length ? heroesByRarity : heroList.slice(0, 3)) {
    samples.push({
      label: `Hero (${h.rarity}) — ${h.name}`,
      pagePath: `/${locale}/heroes/${h.slug}`,
      ogPath: `/${locale}/heroes/${h.slug}/opengraph-image`,
    })
  }

  const r = ranged?.data?.[0]
  if (r) {
    samples.push({
      label: `Ranged weapon — ${r.name}`,
      pagePath: `/${locale}/weapons/ranged/${r.slug}`,
      ogPath: `/${locale}/weapons/ranged/${r.slug}/opengraph-image`,
    })
  }

  const m = melee?.data?.[0]
  if (m) {
    samples.push({
      label: `Melee weapon — ${m.name}`,
      pagePath: `/${locale}/weapons/melee/${m.slug}`,
      ogPath: `/${locale}/weapons/melee/${m.slug}/opengraph-image`,
    })
  }

  const t = traps?.data?.[0]
  if (t) {
    samples.push({
      label: `Trap — ${t.name}`,
      pagePath: `/${locale}/traps/${t.slug}`,
      ogPath: `/${locale}/traps/${t.slug}/opengraph-image`,
    })
  }

  const s = survivors?.data?.[0]
  if (s) {
    samples.push({
      label: `Survivor — ${s.name}`,
      pagePath: `/${locale}/survivors/${s.slug}`,
      ogPath: `/${locale}/survivors/${s.slug}/opengraph-image`,
    })
  }

  const l = leads?.data?.[0]
  if (l) {
    samples.push({
      label: `Survivor lead — ${l.name}`,
      pagePath: `/${locale}/survivor-leads/${l.slug}`,
      ogPath: `/${locale}/survivor-leads/${l.slug}/opengraph-image`,
    })
  }

  const c = changelog?.data?.[0]
  if (c) {
    const slug = c.slug ?? c.releaseDate.split("T")[0]
    samples.push({
      label: `Changelog — v${c.version}`,
      pagePath: `/${locale}/changelog/${slug}`,
      ogPath: `/${locale}/changelog/${slug}/opengraph-image`,
    })
  }

  return samples
}

export default async function OgPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  if (isProduction()) notFound()
  const { locale } = await params

  const samples = await buildSamples(locale)
  const cacheBuster = Date.now()

  return (
    <div className="min-h-screen bg-background px-6 py-10 md:px-12">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Dev tools</p>
        <h1 className="font-burbank text-4xl uppercase text-foreground md:text-5xl">OG Cards preview</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Affiche les OG images dynamiques (1200x630) servies par chaque route <code>opengraph-image.tsx</code>.
          Reload pour casser le cache navigateur. Page bloquee en production.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {samples.map((s) => {
          const stagingUrl = `https://staging.founderbacon.com${s.pagePath}`
          const ogDebugUrl = `https://www.opengraph.xyz/url/${encodeURIComponent(stagingUrl)}`
          return (
            <div key={s.ogPath} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-foreground">{s.label}</p>
                <a
                  href={ogDebugUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open in OG debugger →
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- preview dev */}
              <img
                src={`${s.ogPath}?t=${cacheBuster}`}
                alt={s.label}
                width={1200}
                height={630}
                className="w-full border border-border bg-muted"
              />
              <div className="flex gap-3 text-xs">
                <a href={s.ogPath} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  Open raw image
                </a>
                <a href={s.pagePath} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  Open page
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
