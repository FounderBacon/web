"use client"

import {
  AtSign,
  Bug,
  CheckCircle2,
  FileText,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  MessageSquare,
  Pencil,
  Send,
  Star,
  Tag,
  Upload,
  User,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { submitFeedback, FeedbackError } from "@/lib/api/feedback"
import { ENVIRONMENT } from "@/lib/env"
import {
  FEEDBACK_LIMITS,
  type CreateFeedbackPayload,
  type FeedbackType,
} from "@/lib/types/feedback"
import type en from "@/lang/en.json"

interface Props {
  t: typeof en.feedback
  scope?: string
}

interface TypeOption {
  value: FeedbackType
  Icon: typeof Bug
  label: string
  accentClass: string
}

export function FeedbackForm({ t, scope }: Props) {
  const [type, setType] = useState<FeedbackType>("bug")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [pseudo, setPseudo] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Honeypot : doit rester vide. Si rempli -> bot -> on jette silencieusement.
  const [honeypot, setHoneypot] = useState("")

  const [pageUrl, setPageUrl] = useState<string>("")
  useEffect(() => {
    if (typeof window === "undefined") return
    setPageUrl(window.location.pathname)
  }, [])

  const typeOptions: TypeOption[] = useMemo(
    () => [
      { value: "bug", Icon: Bug, label: t.typeBug, accentClass: "text-rare" },
      { value: "feature", Icon: Lightbulb, label: t.typeFeature, accentClass: "text-legendary" },
      { value: "data-correction", Icon: Pencil, label: t.typeDataCorrection, accentClass: "text-epic" },
      { value: "general", Icon: MessageSquare, label: t.typeGeneral, accentClass: "text-muted-foreground" },
      { value: "praise", Icon: Heart, label: t.typePraise, accentClass: "text-uncommon" },
    ],
    [t],
  )

  const subjectValid = subject.trim().length > 0 && subject.length <= FEEDBACK_LIMITS.subjectMax
  const messageValid = message.trim().length >= 5 && message.length <= FEEDBACK_LIMITS.messageMax
  const canSubmit = subjectValid && messageValid && !submitting

  const fileInputRef = useRef<HTMLInputElement>(null)
  function handleFiles(files: FileList | null) {
    if (!files) return
    const accepted: File[] = []
    let localError: string | null = null
    for (const file of Array.from(files)) {
      if (
        !FEEDBACK_LIMITS.imageMimeTypes.includes(
          file.type as (typeof FEEDBACK_LIMITS.imageMimeTypes)[number],
        )
      ) {
        localError = t.errorUnsupportedMedia
        continue
      }
      if (file.size > FEEDBACK_LIMITS.imageMaxBytes) {
        localError = t.errorTooLarge
        continue
      }
      accepted.push(file)
    }
    setImages((prev) => [...prev, ...accepted].slice(0, FEEDBACK_LIMITS.imageMaxCount))
    if (localError) setError(localError)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (honeypot) return
    setSubmitting(true)
    setError(null)
    const payload: CreateFeedbackPayload = {
      type,
      subject: subject.trim(),
      message: message.trim(),
    }
    if (rating > 0) payload.rating = rating as 1 | 2 | 3 | 4 | 5
    if (pseudo.trim()) payload.pseudo = pseudo.trim()
    if (contactEmail.trim()) payload.contactEmail = contactEmail.trim()
    if (pageUrl) payload.pageUrl = pageUrl
    if (scope) {
      // Convention: "type" ou "type/id" (ex: "hero/jonesy")
      const [resourceType, ...rest] = scope.split("/")
      payload.resourceType = resourceType
      if (rest.length > 0) payload.resourceId = rest.join("/")
    }
    try {
      await submitFeedback(payload, images)
      setSubmitted(true)
    } catch (err) {
      setError(messageForError(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 border border-uncommon/50 bg-card/40 p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-uncommon/15">
          <CheckCircle2 className="size-8 text-uncommon" strokeWidth={2.5} />
        </div>
        <h2 className="font-burbank text-3xl uppercase leading-none text-foreground">
          {t.successTitle}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t.successBody}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] size-0 opacity-0"
        aria-hidden="true"
      />

      {/* ── Type ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Tag className="size-3" />
          {t.typeLabel}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {typeOptions.map((opt) => {
            const active = type === opt.value
            return (
              <label
                key={opt.value}
                className={`group flex cursor-pointer flex-col items-center justify-center gap-2 border p-4 text-center transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={active}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                <opt.Icon
                  className={`size-6 transition-colors ${active ? opt.accentClass : "text-muted-foreground group-hover:text-foreground"}`}
                />
                <span className="text-xs font-semibold uppercase tracking-wide">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </section>

      {/* ── Message ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <FileText className="size-3" />
          {t.messageLabel}
        </h2>
        <div className="flex flex-col gap-4 border border-border/50 bg-card/40 p-5">
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feedback-subject"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.subjectLabel}
            </label>
            <input
              id="feedback-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.subjectPlaceholder}
              required
              maxLength={FEEDBACK_LIMITS.subjectMax}
              className="border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-primary/10"
            />
            <p className="text-right text-[10px] tabular-nums text-muted-foreground">
              {subject.length} / {FEEDBACK_LIMITS.subjectMax}
            </p>
          </div>

          {/* Message body */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feedback-message"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.messageLabel}
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              required
              minLength={5}
              maxLength={FEEDBACK_LIMITS.messageMax}
              rows={7}
              className="resize-y border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-primary/10"
            />
            <p className="text-right text-[10px] tabular-nums text-muted-foreground">
              {message.length} / {FEEDBACK_LIMITS.messageMax}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.ratingLabel}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setRating((prev) => (prev === n ? 0 : (n as 1 | 2 | 3 | 4 | 5)))
                  }
                  aria-label={`${n} / 5`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-5 transition-colors ${
                      n <= rating
                        ? "fill-legendary text-legendary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About you (optional) ─────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <User className="size-3" />
          {t.aboutYouLabel}{" "}
          <span className="font-normal normal-case tracking-normal">{t.aboutYouOptional}</span>
        </h2>
        <div className="grid gap-4 border border-border/50 bg-card/40 p-5 md:grid-cols-2">
          {/* Pseudo */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feedback-pseudo"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.pseudoLabel}
            </label>
            <input
              id="feedback-pseudo"
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t.pseudoPlaceholder}
              maxLength={FEEDBACK_LIMITS.pseudoMax}
              className="border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-primary/10"
            />
            <p className="text-[10px] text-muted-foreground">{t.pseudoHint}</p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="feedback-email"
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <AtSign className="size-3" />
              {t.emailLabel}
            </label>
            <input
              id="feedback-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              maxLength={FEEDBACK_LIMITS.contactEmailMax}
              className="border border-border/50 bg-muted/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-primary/10"
            />
            <p className="text-[10px] text-muted-foreground">{t.emailHint}</p>
          </div>
        </div>
      </section>

      {/* ── Attachments ──────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <ImageIcon className="size-3" />
          {t.imagesLabel}
        </h2>
        <div className="flex flex-col gap-3 border border-border/50 bg-card/40 p-5">
          <p className="text-[11px] text-muted-foreground">{t.imagesHint}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.map((file, i) => (
              <ImageThumb
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => removeImage(i)}
                removeLabel={t.imagesRemove}
              />
            ))}
            {images.length < FEEDBACK_LIMITS.imageMaxCount && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-border/50 bg-card/30 p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground"
              >
                <Upload className="size-5" />
                {t.imagesAdd}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={FEEDBACK_LIMITS.imageMimeTypes.join(",")}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </section>

      {/* ── Auto context (collapsible) ───────────────────────── */}
      <details className="border border-border/40 bg-card/30 p-4">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t.contextLabel}
        </summary>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.contextHint}</p>
        <dl className="mt-3 grid grid-cols-[100px_1fr] gap-y-1.5 text-[11px]">
          {scope && (
            <>
              <dt className="font-semibold uppercase tracking-wider text-muted-foreground">
                {t.contextScope}
              </dt>
              <dd className="truncate text-foreground">{scope}</dd>
            </>
          )}
          <dt className="font-semibold uppercase tracking-wider text-muted-foreground">
            {t.contextUrl}
          </dt>
          <dd className="truncate text-foreground">{pageUrl || "—"}</dd>
          <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Env</dt>
          <dd className="truncate text-foreground">{ENVIRONMENT}</dd>
        </dl>
      </details>

      {/* ── Submit ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {error && (
          <p
            role="alert"
            className="border border-rare/50 bg-rare/10 p-3 text-sm text-rare"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 border border-primary/60 bg-primary/20 px-5 py-4 font-burbank text-base uppercase tracking-widest text-foreground transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:border-border/50 disabled:bg-card/40 disabled:text-muted-foreground"
        >
          <Send className="size-4" />
          {submitting ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function ImageThumb({
  file,
  onRemove,
  removeLabel,
}: {
  file: File
  onRemove: () => void
  removeLabel: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <div className="group relative aspect-square overflow-hidden border border-border/50 bg-muted/30">
      {url && (
        <img src={url} alt={file.name} className="size-full object-cover transition-transform group-hover:scale-105" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-king-900/80 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-rare hover:text-king-900"
      >
        <X className="size-3.5" />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-king-900/90 to-transparent px-2 py-1 text-[9px] uppercase tracking-wider text-white">
        {file.name}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function messageForError(err: unknown, t: typeof en.feedback): string {
  if (err instanceof FeedbackError) {
    switch (err.kind) {
      case "validation":
        return t.errorValidation
      case "tooLarge":
        return t.errorTooLarge
      case "unsupportedMedia":
        return t.errorUnsupportedMedia
      case "rateLimited":
        return t.errorRateLimited
      case "server":
        return t.errorServer
      default:
        return t.errorGeneric
    }
  }
  return t.errorGeneric
}
