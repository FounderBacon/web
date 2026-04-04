interface SelectorProps {
  fill?: string
  stroke?: string
  className?: string
}

export function Selector({ fill = "#4A2376", stroke = "#31174F", className }: SelectorProps) {
  return (
    <svg width="159" height="66" viewBox="0 0 159 66" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path d="M4.35962 63L27.3122 3H32.2451L40.1622 11.9675L39.1846 3H154.36L133.993 63H128.088L120.79 53.9817L117.476 63L4.35962 63Z" fill={fill} stroke={stroke} strokeWidth="6" />
    </svg>
  )
}
