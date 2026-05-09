import "./globals.css"
import { Poppins } from "next/font/google"
import localFont from "next/font/local"
import { ThemeProvider, FeatureProvider, RouteGuard } from "@/components/providers"
import { fetchFeatures } from "@/lib/features"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const headingNow = localFont({
  src: "./fonts/Heading_Now.ttf",
  variable: "--font-heading",
})

const burbank = localFont({
  src: "./fonts/burbankbigcondensed_black.otf",
  variable: "--font-burbank",
})

const akkordeonEight = localFont({
  src: "./fonts/akkordeon/Akkordeon Eight.otf",
  variable: "--font-akkordeon-8",
})

const akkordeonNine = localFont({
  src: "./fonts/akkordeon/Akkordeon Nine.otf",
  variable: "--font-akkordeon-9",
})

const akkordeonTen = localFont({
  src: "./fonts/akkordeon/Akkordeon Ten.otf",
  variable: "--font-akkordeon-10",
})

const akkordeonEleven = localFont({
  src: "./fonts/akkordeon/Akkordeon Eleven.otf",
  variable: "--font-akkordeon-11",
})

const akkordeonTwelve = localFont({
  src: "./fonts/akkordeon/Akkordeon Twelve.otf",
  variable: "--font-akkordeon-12",
})

const akkordeonThirteen = localFont({
  src: "./fonts/akkordeon/Akkordeon Thirteen.otf",
  variable: "--font-akkordeon-13",
})

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const features = await fetchFeatures()

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${headingNow.variable} ${burbank.variable} ${akkordeonEight.variable} ${akkordeonNine.variable} ${akkordeonTen.variable} ${akkordeonEleven.variable} ${akkordeonTwelve.variable} ${akkordeonThirteen.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="m-0 p-0 overflow-x-hidden container bg-background text-foreground">
        <FeatureProvider initial={features}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <RouteGuard>
              {children}
            </RouteGuard>
          </ThemeProvider>
        </FeatureProvider>
      </body>
    </html>
  )
}
