"use client"

import { useState, useEffect, type ImgHTMLAttributes } from "react"
import { UNKNOWN_ICON } from "@/lib/cdn"

interface AssetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> {
  src: string
  fallback?: string
}

// Image CDN avec fallback automatique sur 404 (UNKNOWN_ICON par defaut)
// Quand on tombe sur le fallback, on reduit sa taille (scale-50 + opacity) pour qu'il
// soit clairement distinct d'une vraie image.
export function AssetImage({ src, fallback = UNKNOWN_ICON, alt = "", className = "", style, ...rest }: AssetImageProps) {
  const [current, setCurrent] = useState(src)
  const isFallback = current === fallback

  // Reset si le src change (ex: changement d'arme/piege)
  useEffect(() => {
    setCurrent(src)
  }, [src])

  // Fallback : taille reduite via transform inline (prime sur les classes) + opacite reduite
  const mergedStyle = isFallback
    ? { ...style, transform: "scale(0.5)", opacity: 0.5 }
    : style

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      className={className}
      style={mergedStyle}
      onError={() => {
        if (current !== fallback) setCurrent(fallback)
      }}
    />
  )
}
