import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LOCALES = ["en", "fr"]
const DEFAULT_LOCALE = "en"

const AUTH_ROUTES = ["/dashboard", "/settings", "/profile", "/login"]

function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1)
    if (pathname === `/${locale}`) return "/"
  }
  return pathname
}

function hasLocale(pathname: string): boolean {
  return LOCALES.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
}

function isAuthRoute(pathname: string): boolean {
  const clean = stripLocale(pathname)
  return AUTH_ROUTES.some((route) => clean === route || clean.startsWith(`${route}/`))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!hasLocale(pathname)) {
    request.nextUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  const authEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true"

  if (!authEnabled && isAuthRoute(pathname)) {
    const locale = pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|svg|card|bg_plan.jpg|og-image.png|manifest.webmanifest|robots.txt|sitemap.xml).*)"],
}
