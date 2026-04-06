"use client"

import * as React from "react"

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

type CountdownLabels = {
  days: string
  hours: string
  minutes: string
  seconds: string
}

type CountdownProps = {
  targetDate: Date
  labels: CountdownLabels
  className?: string
}

export function Countdown({ targetDate, labels, className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  )
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!mounted) {
    return (
      <div className={className}>
        --{labels.days} --{labels.hours} --{labels.minutes} --{labels.seconds}
      </div>
    )
  }

  return (
    <div className={className}>
      <span>{timeLeft.days}{labels.days} </span>
      <span>{timeLeft.hours}{labels.hours} </span>
      <span>{timeLeft.minutes}{labels.minutes} </span>
      <span>{timeLeft.seconds}{labels.seconds}</span>
    </div>
  )
}
