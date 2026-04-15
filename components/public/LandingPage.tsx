"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Pattern1, Pattern1Mobile } from "@/components/svg/Pattern1"
import { Countdown } from "@/components/ui/countdown"
import { TARGET_DATE } from "@/lib/landing"

interface LandingPageProps {
  title: string
  subtitle: string
  countdown: { days: string; hours: string; minutes: string; seconds: string }
}

export function LandingPage({ title, subtitle, countdown }: LandingPageProps) {
  const router = useRouter()

  // Quand le countdown atteint 0 : refresh la page pour que le serveur
  // re-evalue isBeforeLaunch() et rende la home complete
  const handleComplete = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(to top right, #11081B -25%, #E5D8F3 65%)" }}>
      <Pattern1 className="absolute inset-0 z-10 hidden h-full w-full md:block" fit="cover" />
      <Pattern1Mobile className="absolute inset-0 z-10 block h-full w-full md:hidden" fit="cover" />
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <img src="/svg/fbcn_logo.svg" alt="" className="size-120 opacity-25" />
      </div>
      <div className="relative z-30 flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="font-burbank uppercase text-3xl text-king-950 md:text-8xl">{title}</h1>
        <Countdown targetDate={TARGET_DATE} labels={countdown} className="font-burbank uppercase text-4xl text-king-950 md:text-9xl" onComplete={handleComplete} />
        <p className="font-burbank uppercase text-xl text-king-950 md:text-5xl">{subtitle}</p>
      </div>
    </div>
  )
}
