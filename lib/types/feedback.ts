// Types alignes sur l'API backend (POST /v1/bacon/feedback).
// Source de verite : doc back fournie le 2026-05-17.

export const FEEDBACK_TYPES = ["bug", "feature", "data-correction", "general", "praise"] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

// ── Limites cote API (mirroir des contraintes Zod backend) ──────
export const FEEDBACK_LIMITS = {
  subjectMax: 120,
  messageMax: 2000,
  pseudoMax: 40,
  contactEmailMax: 200,
  imageMaxBytes: 10 * 1024 * 1024,
  imageMaxCount: 4,
  imageMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const

// ── Payload soumission (multipart) ──────────────────────────────
export interface CreateFeedbackPayload {
  type: FeedbackType
  subject: string
  message: string
  rating?: 1 | 2 | 3 | 4 | 5
  pseudo?: string
  contactEmail?: string
  pageUrl?: string
  resourceType?: string
  resourceId?: string
  // Honeypot anti-bot : ne pas afficher, ne pas remplir
  website?: never
  // Fichiers geres a part dans le FormData (champ "images", max 4)
}

// ── Reponses ────────────────────────────────────────────────────
export interface FeedbackCreated {
  id: string
  createdAt: string
  images: string[]
}

export interface FeedbackPublicCount {
  total: number
  byType: Partial<Record<FeedbackType, number>>
}
