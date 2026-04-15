import Link from "next/link"
import { Shield, Link as LinkIcon, Key } from "lucide-react"
import { getDictionary, isValidLocale } from "@/lib/i18n"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  const links = [
    {
      href: `/${locale}/profile/stw`,
      icon: <Shield className="size-5" />,
      title: "Profil STW",
      desc: "Voir ta progression, tes stats et ton inventaire Save the World.",
    },
    {
      href: `/${locale}/profile/stw/link`,
      icon: <LinkIcon className="size-5" />,
      title: "Lier ton compte STW",
      desc: "Connecte ton compte Epic Games pour synchroniser tes donnees.",
    },
    {
      href: `/${locale}/search/weapons`,
      icon: <Key className="size-5" />,
      title: "API & Weapons",
      desc: "Explorer la base de donnees d'armes et la documentation API.",
    },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-10">
      <h1 className="mb-2 font-burbank text-4xl uppercase text-foreground md:text-5xl">{dict.dashboard.title}</h1>
      <p className="mb-10 text-muted-foreground">Bienvenue sur ton espace FounderBacon.</p>

      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-4 border border-border/50 bg-card p-5 transition-colors hover:bg-muted"
          >
            <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
              {link.icon}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground group-hover:text-primary">{link.title}</p>
              <p className="text-sm text-muted-foreground">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
