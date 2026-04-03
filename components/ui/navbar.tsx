import Link from "next/link"

export function Navbar() {
  const authEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true"

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
      <Link href="/" className="font-[family-name:var(--font-heading)] text-xl text-foreground">
        FOUNDERBACON
      </Link>
      <div className="flex items-center gap-6">
        {authEnabled && (
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
