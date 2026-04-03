import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_ROUTES = ["/dashboard", "/settings", "/profile", "/login"]

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function proxy(request: NextRequest) {
  const authEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true"

  if (!authEnabled && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/profile/:path*", "/login"],
}
