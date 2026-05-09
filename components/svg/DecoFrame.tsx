"use client"

import { useEffect, useRef, useState } from "react"

export type DecoFrameVariant = "default" | "marked" | "pointed"

interface DecoFrameProps {
  className?: string
  thicknessX?: number
  thicknessY?: number
  variant?: DecoFrameVariant
}

// Defaults par variante (thicknessX, thicknessY peuvent override)
const VARIANT_DEFAULTS: Record<DecoFrameVariant, { tx: number; ty: number }> = {
  default: { tx: 5, ty: 4 },
  marked: { tx: 10, ty: 9 },
  pointed: { tx: 16, ty: 14 },
}

// Cadre decoratif a placer en absolute sur un parent relative.
// Mesure la taille via ResizeObserver et regenere le path pour garder
// une epaisseur constante peu importe le ratio du parent.
// Couleur via la classe text-X passee sur le className (currentColor).
export function DecoFrame({ className, thicknessX, thicknessY, variant = "default" }: DecoFrameProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const { w, h } = size
  const defaults = VARIANT_DEFAULTS[variant]
  const tx = thicknessX ?? defaults.tx
  const ty = thicknessY ?? defaults.ty
  const ready = w > 0 && h > 0

  // Path 1 : quadrilatere exterieur oblique (touche top-left et bottom-right)
  // Path 2 : rectangle interieur (avec evenodd -> remplit l'anneau)
  const d = ready
    ? `M${w - tx} ${ty}L0 0L${tx} ${h - ty}L${w} ${h}ZM${w - tx} ${ty}V${h - ty}H${tx}V${ty}H${w - tx}Z`
    : ""

  return (
    <div
      ref={ref}
      className={className}
      style={{ top: -ty, right: -tx, bottom: -ty, left: -tx }}
    >
      {ready && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="block size-full"
        >
          <path fillRule="evenodd" clipRule="evenodd" d={d} fill="currentColor" />
        </svg>
      )}
    </div>
  )
}
