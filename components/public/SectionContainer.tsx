import { cn } from "@/lib/utils"

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
  fullScreen?: boolean
}

export function SectionContainer({ children, className, fullScreen = false }: SectionContainerProps) {
  return (
    <section className={cn("relative w-full", fullScreen && "h-dvh", className)}>
      {children}
    </section>
  )
}
