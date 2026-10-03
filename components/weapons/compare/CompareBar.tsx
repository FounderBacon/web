"use client"

import { useParams, usePathname } from "next/navigation"
import { GitCompareArrows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompare } from "@/lib/compare/store"
import { useCompareT } from "@/lib/compare/i18n"
import { useCompareUi } from "@/lib/compare/ui"
import { CompareQuickEdit } from "./CompareQuickEdit"

export function CompareBar() {
  const t = useCompareT()
  const params = useParams<{ locale: string }>()
  const pathname = usePathname()
  const count = useCompare((s) => s.entries.length)
  const editOpen = useCompareUi((s) => s.quickOpen)
  const setEditOpen = useCompareUi((s) => s.setQuickOpen)

  // Rien a rappeler quand on est deja dans le comparateur.
  const onComparePage = pathname.includes("/weapons/compare")
  if (count === 0 || onComparePage) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <Button
          size="lg"
          className="pointer-events-auto h-11 gap-2 px-5 text-sm shadow-xl ring-2 ring-primary/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
          onClick={() => setEditOpen(true)}
        >
          <GitCompareArrows className="size-4" />
          {t.bar}
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
            {count}
          </span>
        </Button>
      </div>

      <CompareQuickEdit open={editOpen} onOpenChange={setEditOpen} locale={params.locale} />
    </>
  )
}
