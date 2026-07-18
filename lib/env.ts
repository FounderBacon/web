// Helpers centralises pour identifier l'environnement de build.
//
// Source primaire : NEXT_PUBLIC_ENVIRONMENT (defini par nous dans Vercel
// par environnement). Fallback sur NEXT_PUBLIC_VERCEL_ENV (auto-injecte
// par Vercel) si la var custom est absente. Valeur par defaut : "development".
//
// Distinction des trois valeurs :
//   - production  : deploiement sur main, domaine prod (founderbacon.com)
//   - staging     : deploiement sur development, staging.founderbacon.com
//   - development : dev local (npm run dev) ou previews non-staging

export type Environment = "production" | "staging" | "development"

function readEnvironment(): Environment {
  const custom = process.env.NEXT_PUBLIC_ENVIRONMENT
  if (custom === "production" || custom === "staging" || custom === "development") {
    return custom
  }

  // Fallback : mapper NEXT_PUBLIC_VERCEL_ENV (auto Vercel) sur nos 3 valeurs
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
  if (vercelEnv === "production") return "production"
  if (vercelEnv === "preview") return "staging"
  return "development"
}

export const ENVIRONMENT: Environment = readEnvironment()

export const isProduction = (): boolean => ENVIRONMENT === "production"
export const isStaging = (): boolean => ENVIRONMENT === "staging"
export const isDevelopment = (): boolean => ENVIRONMENT === "development"

// True hors production : utile pour bloquer SEO, afficher des badges debug,
// activer des features beta visibles uniquement en staging/dev.
export const isNonProduction = (): boolean => ENVIRONMENT !== "production"
