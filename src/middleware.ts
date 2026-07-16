import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/report"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API auth routes (NextAuth internals)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
