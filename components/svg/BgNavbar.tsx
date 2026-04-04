interface BgNavbarProps {
  fill?: string
  className?: string
}

export function BgNavbar({ fill = "currentColor", className }: BgNavbarProps) {
  return (
    <svg width="1920" height="37" viewBox="0 0 1920 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path d="M0 0L1920 -9.63211e-05L996.122 36.3712L1049.32 0H0Z" fill={fill} />
    </svg>
  )
}
