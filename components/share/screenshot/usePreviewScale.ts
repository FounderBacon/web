import { useEffect, useState } from "react"

interface Options {
  // Largeur cible du template (1920 par defaut)
  targetWidth?: number
  // Hauteur cible du template (1080 par defaut)
  targetHeight?: number
  // Largeur max absolue (px) au-dela duquel on ne grandit pas la preview
  maxWidthPx?: number
  // Ratio de viewport reserve a la preview en largeur (0.92 = 92vw)
  viewportWidthRatio?: number
  // Marge verticale a soustraire de window.innerHeight pour reserver le chrome
  // du dialog (header + paddings + marge de securite)
  chromeHeightPx?: number
}

// Calcule un scale qui garantit que la preview tient dans le viewport
// en largeur ET en hauteur. Recalcule a chaque resize.
// Retourne 0 si le dialog n'est pas ouvert (evite calculs inutiles).
export function usePreviewScale(open: boolean, options: Options = {}): number {
  const {
    targetWidth = 1920,
    targetHeight = 1080,
    maxWidthPx = 1600,
    viewportWidthRatio = 0.92,
    chromeHeightPx = 180,
  } = options

  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    if (!open) return
    function update() {
      const maxWidth = Math.min(window.innerWidth * viewportWidthRatio, maxWidthPx)
      const maxHeight = Math.max(0, window.innerHeight - chromeHeightPx)
      const scaleByWidth = maxWidth / targetWidth
      const scaleByHeight = maxHeight / targetHeight
      setScale(Math.min(scaleByWidth, scaleByHeight))
    }
    // Delai court pour laisser le dialog finir son animation d'ouverture
    const timer = setTimeout(update, 50)
    window.addEventListener("resize", update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", update)
    }
  }, [open, targetWidth, targetHeight, maxWidthPx, viewportWidthRatio, chromeHeightPx])

  return scale
}
