// Card QR utilisee dans les screenshots 1920x1080 (weapons + loadout).
// Hauteur fixe (h-100 = 400px) pour garder une taille stable peu importe
// le contenu autour (calibree sur le pire cas : weapons avec 4 perks remplies).

interface Props {
  // SVG data URL pre-chargee — null = QR pas encore pret, on ne rend rien
  qrSrc: string | null
  title?: string
  subtitle?: string
}

export function ScreenshotQrCard({
  qrSrc,
  title = "Share Build",
  subtitle = "Scan with your phone",
}: Props) {
  if (!qrSrc) return null
  return (
    <div
      className="flex h-100 shrink-0 flex-col overflow-hidden rounded-lg"
      style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}
      >
        <div className="flex flex-col">
          <p className="text-base font-semibold leading-tight">{title}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#CAB0E8" }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-3">
        <div
          className="flex size-56 items-center justify-center rounded-lg bg-white p-2.5"
          style={{ boxShadow: "0 4px 24px rgba(149, 98, 208, 0.3)" }}
        >
          <img src={qrSrc} alt="" className="size-full" />
        </div>
      </div>
    </div>
  )
}
