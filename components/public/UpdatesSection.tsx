import Link from "next/link";
import { SocialLink } from "@/components/public/SocialLink";
import { entrySlug, fetchChangelog, type ChangelogCategory, type ChangelogEntry } from "@/lib/api/changelog";
import type { Locale } from "@/lib/i18n";

const SOCIALS = [{ href: "https://x.com/FounderBacon", label: "Twitter" }] as const;

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

export async function UpdatesSection({ locale }: { locale: Locale }) {
  let entries: ChangelogEntry[] = [];
  try {
    const res = await fetchChangelog({ limit: 5 });
    entries = res.data;
  } catch {
    return null;
  }

  if (entries.length === 0) return null;
  const latest = entries[0];

  return (
    <section className="px-8 py-16 md:px-48 md:py-24">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
        {/* Colonne gauche : liste des changelogs (3/4) */}
        <div className="md:col-span-3">
          <h2 className="mb-6 font-burbank text-3xl uppercase text-primary-foreground md:text-4xl">Changelog</h2>
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li key={entry._id}>
                <Link
                  href={`/${locale}/changelog/${entrySlug(entry)}`}
                  className="block border border-king-700/50 bg-king-800/40 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-king-800/60"
                >
                  <header className="mb-2 flex flex-wrap items-baseline gap-3">
                    <span className="font-burbank text-xl uppercase text-primary">v{entry.version}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.releaseDate, locale)}</span>
                    {entry.breaking && <span className="rounded bg-malus/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-malus">Breaking</span>}
                  </header>
                  <h3 className="mb-1 text-base font-semibold text-foreground">{entry.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categoryCounts(entry).map(({ category, count }) => (
                      <span key={category} className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${CATEGORY_CLASS[category]}`}>
                        {count} {category}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/changelog`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
            View full changelog →
          </Link>
        </div>

        {/* Colonne droite : last update + socials (1/4) */}
        <aside className="md:col-span-1">
          <div className="flex flex-col gap-2 border-l-2 border-primary/40 pl-4">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Last update</span>
            <span className="font-burbank text-5xl uppercase leading-none text-primary-foreground md:text-6xl">v{latest.version}</span>
            <span className="text-sm text-muted-foreground">{formatDate(latest.releaseDate, locale)}</span>
            <p className="mt-2 text-sm font-medium text-foreground">{latest.title}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 pl-4">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Follow</span>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map(({ href, label }) => (
                <SocialLink key={label} href={href} label={label} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
