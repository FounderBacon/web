// Construit l'URL du QR code servi par le back. Utilisable directement dans <img src>.
// Le back retourne du SVG (default) ou PNG avec Cache-Control immutable.
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

export function qrUrl(path: string, size = 256, format: "svg" | "png" = "svg"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const params = new URLSearchParams({
    path: normalizedPath,
    size: String(size),
  })
  if (format === "png") params.set("format", "png")
  return `${API_BASE}/v1/bacon/qr?${params.toString()}`
}
