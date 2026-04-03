import { AuthGuard } from "@/components/providers/auth-guard"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AuthGuard>{children}</AuthGuard>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
