import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

const isLanding = process.env.NEXT_PUBLIC_ENABLE_LANDING === "true"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (isLanding) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
