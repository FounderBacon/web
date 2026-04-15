"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ExternalLink, ClipboardPaste, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { SectionContainer } from "@/components/public/SectionContainer"

const CODE_REGEX = /^[a-f0-9]{32}$/i
const REDIRECT_DELAY = 5

function SuccessScreen({ locale }: { locale: string }) {
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const router = useRouter()

  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/${locale}/profile/stw`)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router, locale])

  return (
    <SectionContainer className="flex flex-col items-center justify-center gap-6 py-40">
      <CheckCircle className="size-16 text-uncommon" />
      <h1 className="font-burbank text-4xl uppercase text-foreground md:text-5xl">Compte lie !</h1>
      <p className="text-lg text-muted-foreground">Ton compte Epic Games a ete lie avec succes.</p>
      <div className="flex flex-col items-center gap-2">
        <span className="font-burbank text-6xl text-primary">{countdown}</span>
        <p className="text-sm text-muted-foreground">Redirection vers ton profil STW...</p>
      </div>
      <Link
        href={`/${locale}/profile/stw`}
        className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Aller au profil maintenant
      </Link>
    </SectionContainer>
  )
}

function StwLinkForm() {
  const params = useParams<{ locale: string }>()
  const [authorizeUrl, setAuthorizeUrl] = useState<string>("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<{ url: string }>("/v1/stw/authorize-url", { skipAuth: true })
      .then((data) => setAuthorizeUrl(data.url))
      .catch(() => setError("Impossible de charger l'URL d'autorisation"))
  }, [])

  const tryAutoPaste = useCallback(async () => {
    if (code) return
    try {
      const clipText = await navigator.clipboard.readText()
      const trimmed = clipText.trim()
      if (CODE_REGEX.test(trimmed)) {
        setCode(trimmed)
        inputRef.current?.focus()
      }
    } catch {
      // Permission refusee ou non supporte
    }
  }, [code])

  useEffect(() => {
    window.addEventListener("focus", tryAutoPaste)
    return () => window.removeEventListener("focus", tryAutoPaste)
  }, [tryAutoPaste])

  function openEpicPopup() {
    if (!authorizeUrl) return
    const w = 600
    const h = 500
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2
    window.open(authorizeUrl, "epic-authorize", `width=${w},height=${h},left=${left},top=${top}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const token = getToken()
    if (!token) {
      setError("Tu dois etre connecte pour lier ton compte STW")
      setLoading(false)
      return
    }

    try {
      await api.post("/v1/bacon/me/stw/link", { code: code.trim() })
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du lien"
      setError(msg)
      setLoading(false)
    }
  }

  if (success) return <SuccessScreen locale={params.locale} />

  return (
    <SectionContainer className="mx-auto max-w-2xl px-4 py-16 md:px-10">
      <h1 className="mb-2 font-burbank text-4xl uppercase text-foreground md:text-5xl">Lier ton compte STW</h1>
      <p className="mb-10 text-muted-foreground">Connecte ton compte Epic Games pour acceder a tes donnees Save the World.</p>

      <div className="flex flex-col gap-6">
        <div className="flex gap-4 border border-border/50 bg-card p-5">
          <span className="flex size-10 shrink-0 items-center justify-center bg-primary font-burbank text-xl text-primary-foreground">1</span>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-base font-semibold text-foreground">Genere ton code d&apos;autorisation</p>
              <p className="text-sm text-muted-foreground">Connecte-toi avec ton compte Epic Games pour obtenir un code.</p>
            </div>
            <button
              type="button"
              onClick={openEpicPopup}
              disabled={!authorizeUrl}
              className="flex w-fit items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              <ExternalLink className="size-4" />
              Ouvrir la page Epic
            </button>
          </div>
        </div>

        <div className="flex gap-4 border border-border/50 bg-card p-5">
          <span className="flex size-10 shrink-0 items-center justify-center bg-primary font-burbank text-xl text-primary-foreground">2</span>
          <div>
            <p className="text-base font-semibold text-foreground">Copie le code</p>
            <p className="text-sm text-muted-foreground">
              Dans la page qui s&apos;ouvre, copie le champ <code className="bg-muted px-1.5 py-0.5 text-xs text-foreground">authorizationCode</code>
            </p>
          </div>
        </div>

        <div className="flex gap-4 border border-border/50 bg-card p-5">
          <span className="flex size-10 shrink-0 items-center justify-center bg-primary font-burbank text-xl text-primary-foreground">3</span>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-base font-semibold text-foreground">Colle-le ici</p>
              <p className="text-sm text-muted-foreground">Reviens sur cette fenetre, il sera auto-rempli si possible.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <ClipboardPaste className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e6f9b5a92ff64bc3a300d93aead81b15"
                  className="w-full border border-border bg-background py-2.5 pl-10 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  autoComplete="off"
                />
              </div>
              {code && !CODE_REGEX.test(code.trim()) && (
                <p className="flex items-center gap-1.5 text-sm text-legendary">
                  <AlertTriangle className="size-3.5" />
                  Format attendu : 32 caracteres hexadecimaux
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !CODE_REGEX.test(code.trim())}
                className="flex w-fit items-center gap-2 bg-uncommon px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-uncommon/80 disabled:opacity-50"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Lien en cours..." : "Lier mon compte STW"}
              </button>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-malus">
                  <AlertTriangle className="size-3.5" />
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-legendary/20 bg-legendary/5 p-4">
        <p className="text-sm text-foreground">
          <strong>Note :</strong> Le code expire rapidement (~30 secondes). Si tu vois une erreur, regenere un nouveau code et recolle-le immediatement.
        </p>
      </div>
    </SectionContainer>
  )
}

export default function StwLinkPage() {
  return <StwLinkForm />
}
