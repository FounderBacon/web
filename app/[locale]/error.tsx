"use client"

import { FbcnLogo } from "@/components/svg/FbcnLogo"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <FbcnLogo className="size-24 opacity-20" fill="currentColor" />
      <h1 className="font-burbank text-4xl uppercase text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-king-500 hover:text-foreground"
      >
        Try again
      </button>
    </div>
  )
}
