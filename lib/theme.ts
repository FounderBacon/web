export type ThemeColors = {
  primary: string
  primaryForeground: string
  accent: string
  accentForeground: string
}

export const defaultLightColors: ThemeColors = {
  primary: "oklch(0.205 0 0)",
  primaryForeground: "oklch(0.985 0 0)",
  accent: "oklch(0.97 0 0)",
  accentForeground: "oklch(0.205 0 0)",
}

export const defaultDarkColors: ThemeColors = {
  primary: "oklch(0.922 0 0)",
  primaryForeground: "oklch(0.205 0 0)",
  accent: "oklch(0.269 0 0)",
  accentForeground: "oklch(0.985 0 0)",
}

export function buildCssVariables(colors: ThemeColors): Record<string, string> {
  return {
    "--primary": colors.primary,
    "--primary-foreground": colors.primaryForeground,
    "--accent": colors.accent,
    "--accent-foreground": colors.accentForeground,
  }
}
