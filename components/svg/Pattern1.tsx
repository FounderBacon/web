import type { CSSProperties } from "react"

interface Pattern1Props {
  fill?: string
  className?: string
  style?: CSSProperties
  // cover = slice (remplit, peut cropper) — idéal landscape
  // contain = meet (fit entier, peut laisser du vide) — idéal portrait
  fit?: "cover" | "contain"
}

type Group = "spike" | "cadre" | "bord"

type PathDef = {
  d: string
  group: Group
  // Vecteur de départ du push (en px). Si absent, utilise la valeur par défaut du groupe.
  push?: { x: number; y: number }
}

const DESKTOP_PATHS: PathDef[] = [
  { d: "M1644.34 46.66L1613.24 7.7L826.21 34.77L848.69 74.02L1644.34 46.66Z", group: "cadre" },
  { d: "M783.26 0H731.33L855.01 125.32L783.26 0Z", group: "spike", push: { x: -90, y: -120 } },
  { d: "M1920 0H1632.68L1920 359.9V267.92L1807.78 151.69L1920 244.88V0Z", group: "bord", push: { x: 120, y: -100 } },
  { d: "M1920 395.04V367.72L1832.68 277.14L1920 395.04Z", group: "bord", push: { x: 120, y: 0 } },
  { d: "M126.06 752.09L159.58 800.87L171.26 717.99L109.11 99.46L778.66 76.43L740.46 37.72L65.05 60.95L130.98 717.19L126.06 752.09Z", group: "cadre" },
  { d: "M1700.99 117.62L1828 854.88L1653.85 876.9L1543.01 800.4L1529.4 887.08L276.62 971.18L302.95 1009.5L1563.96 924.85L1572.65 869.46L1643.71 918.5L1874.53 889.32L1752.75 182.46L1700.99 117.62Z", group: "cadre" },
  { d: "M0 723.14L226.62 1048.01L0 811.09V1080H63.1L48.14 1042.4L72.93 1080H327.13L0 603.96V723.14Z", group: "bord", push: { x: -100, y: 120 } },
  { d: "M1471.83 1080H1534.38L1386.96 999.82L1471.83 1080Z", group: "spike", push: { x: 120, y: 85 } },
]

// Pattern mobile (portrait, viewBox 344×882) — paths distincts du desktop
const MOBILE_PATHS: PathDef[] = [
  // Cadre central avec ses 3 sous-shapes (corps principal + 2 pièces sur le bord gauche)
  {
    d: "M272.296 32.2059L37.4652 76.6705L58.1167 58.5504L283.264 15.9197L292.561 96.7249L276.94 121.599L294.582 124.644L321.408 775.943L309.202 785.163L282.551 136.742L254.942 131.977L279.31 93.1735L272.296 32.2059ZM23.578 375.044L14.8612 96.5038L2.45365 107.391L11.0761 382.911L23.578 375.044ZM12.0156 412.933L19.2776 859.23L228.3 836.148L239.417 837.87L254.956 826.134L228.557 822.046L31.5428 843.802L24.3451 399.559L12.0156 412.933Z",
    group: "cadre",
  },
  // Petit triangle bord droit
  {
    d: "M344 156.894L318.462 186.607L344 134.996V156.894Z",
    group: "spike",
    push: { x: 120, y: 0 },
  },
  // Coin bas-droit
  {
    d: "M192.234 882.001L230.197 882.001L333.673 802.668L258.211 882.001L343.999 882.001V859.911L331.886 865.147L343.999 856.471L343.999 767.48L192.234 882.001Z",
    group: "bord",
    push: { x: 120, y: 120 },
  },
  // Petit triangle bord gauche
  {
    d: "M0 416.129L39.917 372.831L0 397.949L0 416.129Z",
    group: "spike",
    push: { x: -120, y: 0 },
  },
  // Coin haut-gauche
  {
    d: "M114.636 0H85.3378L48.3161 39.2868L77.9972 0H0L0 100.584L114.636 0ZM125.829 0H117.126L88.2759 30.5676L125.829 0Z",
    group: "bord",
    push: { x: -100, y: -120 },
  },
]

const GROUP_CLASS: Record<Group, string> = {
  spike: "pattern1-path pattern1-path--spike",
  cadre: "pattern1-path pattern1-path--cadre",
  bord: "pattern1-path pattern1-path--bord",
}

function renderPaths(paths: PathDef[]) {
  return paths.map(({ d, group, push }) => {
    const style = push
      ? ({ "--push-x": `${push.x}px`, "--push-y": `${push.y}px` } as CSSProperties)
      : undefined
    return (
      <path
        key={d}
        d={d}
        fillRule="evenodd"
        clipRule="evenodd"
        className={GROUP_CLASS[group]}
        style={style}
      />
    )
  })
}

export function Pattern1({ fill = "#11081B", className, style, fit = "cover" }: Pattern1Props) {
  const preserveAspectRatio = fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"
  return (
    <svg
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
      style={{ color: fill, ...style }}
    >
      {renderPaths(DESKTOP_PATHS)}
    </svg>
  )
}

export function Pattern1Mobile({ fill = "#11081B", className, style, fit = "cover" }: Pattern1Props) {
  const preserveAspectRatio = fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"
  return (
    <svg
      width="344"
      height="882"
      viewBox="0 0 344 882"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
      style={{ color: fill, ...style }}
    >
      {renderPaths(MOBILE_PATHS)}
    </svg>
  )
}
