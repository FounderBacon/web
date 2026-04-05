import Link from "next/link"
import { FbcnLogo } from "@/components/svg/FbcnLogo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <FbcnLogo className="size-24 opacity-20" fill="currentColor" />
      <h1 className="font-burbank text-5xl uppercase text-foreground">404</h1>
      <p className="font-akkordeon-11 text-xl uppercase text-muted-foreground">Page not found</p>
      <Link href="/" className="border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-king-500 hover:text-foreground">
        Back to home
      </Link>
    </div>
  )
}
