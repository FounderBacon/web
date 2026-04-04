interface BgFooterProps {
  fill?: string
  className?: string
}

export function BgFooter({ fill = "currentColor", className }: BgFooterProps) {
  return (
    <svg width="1920" height="54" viewBox="0 0 1920 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path d="M0 53.4995L929.963 0L862.231 53.4995H1920H0Z" fill={fill} />
    </svg>
  )
}
