"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { SearchDialog } from "@/components/ui/search-dialog"
import type { Locale } from "@/lib/i18n"

interface SearchBarProps {
  locale: Locale
  variant?: "desktop" | "mobile"
  onNavigate?: () => void
}

export function SearchBar({ locale, variant = "desktop", onNavigate }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  // Raccourci Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  function handleOpen() {
    onNavigate?.()
    setOpen(true)
  }

  if (variant === "mobile") {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full items-center gap-2 rounded-lg border border-king-700 bg-king-800/60 px-3 py-2 text-left"
        >
          <Search className="size-4 shrink-0 text-king-400" />
          <span className="flex-1 text-sm text-king-500">Search...</span>
        </button>
        <SearchDialog locale={locale} open={open} onOpenChange={setOpen} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open search"
        className="mx-4 hidden max-w-md flex-1 items-center gap-3 rounded-lg border border-king-700 bg-king-900 px-3 py-2 text-king-400 transition-colors hover:border-primary hover:text-king-200 md:flex lg:max-w-xl"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd className="rounded border border-king-700 bg-king-800 px-1.5 py-0.5 text-[10px] font-medium">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
      <SearchDialog locale={locale} open={open} onOpenChange={setOpen} />
    </>
  )
}
