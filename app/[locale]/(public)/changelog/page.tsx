import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DecoFrame } from "@/components/svg/DecoFrame";
import { entrySlug, fetchChangelog, type ChangelogCategory, type ChangelogEntry } from "@/lib/api/changelog";
import { RARITY_DECO } from "@/lib/constants";
import { isValidLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Changelog",
  description: "FounderBacon changelog — every update, fix, and new feature.",
};

const CATEGORY_CLASS: Record<ChangelogCategory, string> = {
  added: "bg-uncommon/10 text-uncommon",
  changed: "bg-rare/10 text-rare",
  fixed: "bg-epic/10 text-epic",
  deprecated: "bg-legendary/10 text-legendary",
  removed: "bg-malus/10 text-malus",
  security: "bg-mythic/10 text-mythic",
};

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function categoryCounts(entry: ChangelogEntry): Array<{ category: ChangelogCategory; count: number }> {
  const counts = new Map<ChangelogCategory, number>();
  for (const it of entry.items) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  }
  return Array.from(counts, ([category, count]) => ({ category, count }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ChangelogPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  let entries: ChangelogEntry[] = [];
  try {
    const res = await fetchChangelog({ limit: 50 });
    entries = res.data;
  } catch {
    entries = [];
  }

  return (
    <article className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <header className="mb-14">
        <h1 className="mb-3 font-burbank text-5xl uppercase text-primary-foreground md:text-7xl">Changelog</h1>
        <p className="text-base text-muted-foreground md:text-lg">Every update, fix, and new feature shipped.</p>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No releases yet.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {entries.map((entry) => (
            <li key={entry._id}>
              <Link href={`/${locale}/changelog/${entrySlug(entry)}`} className={`relative block bg-king-800/40 p-5 backdrop-blur-sm transition-colors hover:bg-king-800/60 ${(entry.rarity && RARITY_DECO[entry.rarity]) ?? "text-primary"}`}>
                <DecoFrame className="pointer-events-none absolute" />
                <div className="relative">
                  <header className="mb-2 flex flex-wrap items-baseline gap-3">
                    <span className={`font-burbank text-2xl uppercase ${(entry.rarity && RARITY_DECO[entry.rarity]) ?? "text-primary"}`}>v{entry.version}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.releaseDate, locale)}</span>
                    {entry.breaking && <span className="rounded bg-malus/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-malus">Breaking</span>}
                    {entry.scope.map((s) => (
                      <span key={s} className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </header>
                  <h2 className="mb-1 text-lg font-semibold text-foreground">{entry.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categoryCounts(entry).map(({ category, count }) => (
                      <span key={category} className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${CATEGORY_CLASS[category]}`}>
                        {count} {category}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
