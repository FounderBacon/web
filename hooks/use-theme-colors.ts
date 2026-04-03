"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import type { ThemeColors } from "@/lib/theme"
import {
  defaultLightColors,
  defaultDarkColors,
  buildCssVariables,
} from "@/lib/theme"

const STORAGE_KEY = "theme-colors"

export function useThemeColors() {
  const { resolvedTheme } = useTheme()
  const [colors, setColorsState] = React.useState<{
    light: ThemeColors
    dark: ThemeColors
  }>({
    light: defaultLightColors,
    dark: defaultDarkColors,
  })

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as {
          light: ThemeColors
          dark: ThemeColors
        }
        setColorsState(parsed)
      }
    } catch {
      // Erreur de parsing ignorée
    }
  }, [])

  const setColors = React.useCallback(
    (
      newColors: Partial<{
        light: Partial<ThemeColors>
        dark: Partial<ThemeColors>
      }>
    ) => {
      setColorsState((prev) => {
        const updated = {
          light: { ...prev.light, ...newColors.light },
          dark: { ...prev.dark, ...newColors.dark },
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {
          // Erreur de stockage ignorée
        }
        return updated
      })
    },
    []
  )

  const currentColors = resolvedTheme === "dark" ? colors.dark : colors.light
  const cssVariables = buildCssVariables(currentColors)

  const resetColors = React.useCallback(() => {
    setColorsState({ light: defaultLightColors, dark: defaultDarkColors })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Erreur ignorée
    }
  }, [])

  return {
    colors,
    currentColors,
    cssVariables,
    setColors,
    resetColors,
  }
}
