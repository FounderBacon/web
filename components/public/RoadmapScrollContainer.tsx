"use client"

import { useEffect, useRef } from "react"

// Container scrollable qui :
// - convertit la molette verticale en scroll horizontal (UX desktop)
// - bloque le scroll vertical de la page tant qu'on est sur la timeline
// - listener attache en natif avec { passive: false } pour pouvoir preventDefault
//   (React onWheel est passive par defaut donc preventDefault ne marche pas)
export function RoadmapScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // Bloque le scroll vertical global tant que la roadmap est montee.
  // - html/body : overflow hidden + height 100dvh
  // - le wrapper layout (`<div class="flex min-h-screen flex-col">`) reset min-h en h-dvh + overflow hidden
  // - le footer est masque (sinon il pousse le contenu et cree du scroll vertical)
  useEffect(() => {
    const style = document.createElement("style")
    style.setAttribute("data-roadmap-lock", "true")
    style.textContent = `
      html, body {
        overflow: hidden !important;
        height: 100dvh !important;
      }
      body > div.flex.min-h-screen.flex-col {
        min-height: 0 !important;
        height: 100dvh !important;
        overflow: hidden !important;
      }
      body > div.flex.min-h-screen.flex-col > footer {
        display: none !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      if (!el) return
      const overflowing = el.scrollWidth > el.clientWidth
      if (!overflowing) return
      if (e.shiftKey) return // Shift => scroll horizontal natif, on laisse passer
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // Si principalement horizontal deja, on laisse
      // Vertical wheel => convertit en scroll horizontal
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <div
      ref={ref}
      className="roadmap-scroll -mx-4 flex h-full overflow-x-auto overscroll-x-contain px-4 pb-8 md:-mx-10 md:px-10"
    >
      {children}
    </div>
  )
}
