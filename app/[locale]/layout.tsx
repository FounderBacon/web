import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/providers"
import { locales, isValidLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const headingNow = localFont({
  src: "../fonts/Heading_Now.ttf",
  variable: "--font-heading",
})

const burbank = localFont({
  src: "../fonts/burbankbigcondensed_black.otf",
  variable: "--font-burbank",
})

const akkordeonEight = localFont({
  src: "../fonts/akkordeon/Akkordeon Eight.otf",
  variable: "--font-akkordeon-8",
})

const akkordeonNine = localFont({
  src: "../fonts/akkordeon/Akkordeon Nine.otf",
  variable: "--font-akkordeon-9",
})

const akkordeonTen = localFont({
  src: "../fonts/akkordeon/Akkordeon Ten.otf",
  variable: "--font-akkordeon-10",
})

const akkordeonEleven = localFont({
  src: "../fonts/akkordeon/Akkordeon Eleven.otf",
  variable: "--font-akkordeon-11",
})

const akkordeonTwelve = localFont({
  src: "../fonts/akkordeon/Akkordeon Twelve.otf",
  variable: "--font-akkordeon-12",
})

const akkordeonThirteen = localFont({
  src: "../fonts/akkordeon/Akkordeon Thirteen.otf",
  variable: "--font-akkordeon-13",
})

const DOMAIN = "https://founderbacon.com"

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "FounderBacon",
    template: "%s | FounderBacon",
  },
  description: "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe — structured and ready to use.",
  keywords: ["Fortnite", "Save the World", "STW", "API", "REST", "weapons", "schematics", "perks", "crafting", "stats", "damage calculator", "builds", "game data"],
  authors: [{ name: "FounderBacon" }],
  creator: "FounderBacon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: DOMAIN,
    siteName: "FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description: "Every weapon. Every stat. Every perk. One API. Comprehensive game data for players and developers.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FounderBacon — Free REST API for Fortnite: Save the World" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@FounderBacon",
    creator: "@FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description: "Every weapon. Every stat. Every perk. One API.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: DOMAIN,
    languages: {
      en: `${DOMAIN}/en`,
      fr: `${DOMAIN}/fr`,
    },
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params

  if (!isValidLocale(locale)) notFound()

  return (
    <html lang={locale} className={`${poppins.variable} ${headingNow.variable} ${burbank.variable} ${akkordeonEight.variable} ${akkordeonNine.variable} ${akkordeonTen.variable} ${akkordeonEleven.variable} ${akkordeonTwelve.variable} ${akkordeonThirteen.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="m-0 p-0 overflow-x-hidden container">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
