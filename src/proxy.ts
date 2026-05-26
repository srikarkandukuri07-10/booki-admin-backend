import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'admin_session'
const PROTECTED_ROUTES = ['/dashboard', '/orders', '/kitchen', '/menu']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(COOKIE_NAME)

  // 1. Root "/" → redirect to /dashboard (which will then check auth below)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // 2. Redirect unauthenticated users trying to access protected routes to /login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Redirect authenticated users trying to access the login page to /dashboard
  if (pathname.startsWith('/login') && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded food images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}
