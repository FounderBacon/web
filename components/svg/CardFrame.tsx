interface CardFrameProps {
  className?: string
  fill?: string
  preserveAspectRatio?: string
}

export function CardFrame({ className, fill = "currentColor", preserveAspectRatio }: CardFrameProps) {
  return (
    <svg
      width="250"
      height="400"
      viewBox="0 0 250 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M69.1469 0H78.8493L29.9156 47.2464L69.1469 0ZM0 89.7096L112.373 0H113.204L73.0846 38.6761L125.307 0H250V287.625L86.4708 400H0V301.591L43.2585 264.339L0 285.347V89.7096ZM127.668 400H161.282L250 315.14V314.666L127.668 400Z"
        fill={fill}
      />
    </svg>
  )
}
