import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const headingNow = localFont({
  src: "./fonts/Heading_Now.ttf",
  variable: "--font-heading",
});

const DOMAIN = "https://founderbacon.com"

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "FounderBacon",
    template: "%s | FounderBacon",
  },
  description:
    "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe — structured and ready to use.",
  keywords: [
    "Fortnite",
    "Save the World",
    "STW",
    "API",
    "REST",
    "weapons",
    "schematics",
    "perks",
    "crafting",
    "stats",
    "damage calculator",
    "builds",
    "game data",
  ],
  authors: [{ name: "FounderBacon" }],
  creator: "FounderBacon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: DOMAIN,
    siteName: "FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description:
      "Every weapon. Every stat. Every perk. One API. Comprehensive game data for players and developers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FounderBacon — Free REST API for Fortnite: Save the World",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@FounderBacon",
    creator: "@FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description:
      "Every weapon. Every stat. Every perk. One API.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: DOMAIN,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${headingNow.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="m-0 p-0 overflow-x-hidden container">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
