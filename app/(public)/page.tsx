import { Countdown } from "@/components/ui/countdown"

const TARGET_DATE = new Date("2026-04-16T00:00:00")
const isLanding = process.env.NEXT_PUBLIC_ENABLE_LANDING === "true"

function LandingPage() {
  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(to top right, #28253E 2%, #28253E 5%, #EAE0FF 70%, #EAE0FF 100%)" }}>
      <div className="absolute inset-0 z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/svg/pattern_1.svg')" }} />
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <img src="/svg/fbcn_logo.svg" alt="" className="size-[480px] opacity-25" />
      </div>
      <div className="relative z-30 flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl text-black-king">
          FOUNDERBACON
        </h1>
        <Countdown targetDate={TARGET_DATE} className="font-[family-name:var(--font-heading)] text-6xl text-black-king" />
        <p className="font-[family-name:var(--font-heading)] text-2xl text-black-king">
          SAVE THE WORLD
        </p>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-24">
      <img src="/svg/fbcn_logo.svg" alt="FounderBacon" className="size-32 opacity-80" />
      <h1 className="font-[family-name:var(--font-heading)] text-5xl text-foreground">
        FOUNDERBACON
      </h1>
      <p className="max-w-lg text-center text-lg text-muted-foreground">
        Save the world.
      </p>
    </div>
  )
}

export default function Home() {
  if (isLanding) return <LandingPage />
  return <HomePage />
}
