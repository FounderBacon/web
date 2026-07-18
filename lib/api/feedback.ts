import { api, ApiError } from "./client"
import {
  type CreateFeedbackPayload,
  type FeedbackCreated,
  type FeedbackPublicCount,
} from "@/lib/types/feedback"

// Erreurs metier mappees aux codes HTTP fournis par le back.
// Le caller affiche un message localise selon le `kind`.
export type FeedbackErrorKind =
  | "validation" // 400
  | "tooLarge" // 413 (image > 10MB ou > 50M px)
  | "unsupportedMedia" // 415 (mimetype non autorise ou fichier corrompu)
  | "rateLimited" // 429 (>5/h par IP)
  | "server" // 500+
  | "unknown"

export class FeedbackError extends Error {
  constructor(
    public kind: FeedbackErrorKind,
    message: string,
  ) {
    super(message)
    this.name = "FeedbackError"
  }
}

function classify(status: number): FeedbackErrorKind {
  if (status === 400) return "validation"
  if (status === 413) return "tooLarge"
  if (status === 415) return "unsupportedMedia"
  if (status === 429) return "rateLimited"
  if (status >= 500) return "server"
  return "unknown"
}

// POST /v1/bacon/feedback (multipart). Auth optionnelle : le client envoie
// le token si l'user est logged, sinon l'API traite en anonyme.
export async function submitFeedback(
  payload: CreateFeedbackPayload,
  images: File[] = [],
): Promise<FeedbackCreated> {
  const form = new FormData()
  form.set("type", payload.type)
  form.set("subject", payload.subject)
  form.set("message", payload.message)
  if (payload.rating !== undefined) form.set("rating", String(payload.rating))
  if (payload.pseudo) form.set("pseudo", payload.pseudo)
  if (payload.contactEmail) form.set("contactEmail", payload.contactEmail)
  if (payload.pageUrl) form.set("pageUrl", payload.pageUrl)
  if (payload.resourceType) form.set("resourceType", payload.resourceType)
  if (payload.resourceId) form.set("resourceId", payload.resourceId)
  for (const file of images) form.append("images", file)

  try {
    // axios detecte FormData et set Content-Type avec le bon boundary
    return await api.post<FeedbackCreated>("/v1/bacon/feedback", form)
  } catch (err) {
    if (err instanceof ApiError) {
      throw new FeedbackError(classify(err.status), err.message)
    }
    throw new FeedbackError("unknown", err instanceof Error ? err.message : "Unknown error")
  }
}

// GET /v1/bacon/feedback/count — public, pas d'auth.
export function fetchFeedbackCount(): Promise<FeedbackPublicCount> {
  return api.get<FeedbackPublicCount>("/v1/bacon/feedback/count", { skipAuth: true })
}
