"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { isAuthenticated, removeToken } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

interface NavbarAuthProps {
  locale: string
  loginLabel: string
  className: string
  onNavigate?: () => void
}

export function NavbarAuth({ locale, loginLabel, className, onNavigate }: NavbarAuthProps) {
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  function handleLogout() {
    removeToken()
    setAuthed(false)
    onNavigate?.()
    router.push(`/${locale}`)
  }

  if (!authed) {
    return (
      <Link href={`/${locale}/login`} className={className} onClick={onNavigate}>
        {loginLabel}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/${locale}/dashboard`} className={className} onClick={onNavigate}>
        <User className="inline-block size-4 mr-1" />
        Dashboard
      </Link>
      <button type="button" onClick={handleLogout} className={className}>
        <LogOut className="inline-block size-4" />
      </button>
    </div>
  )
}
