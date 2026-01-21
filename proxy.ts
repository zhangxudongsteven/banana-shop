import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy to protect routes that require authentication
 */
export function proxy(request: NextRequest) {
  // Parse the request URL
  const url = new URL(request.url)
  const pathname = url.pathname

  // Get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value

  // Define protected routes
  const protectedRoutes = ['/editor']
  const authRoutes = ['/login']

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url)
    // Add redirect parameter to return after login
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to editor if already authenticated and trying to access auth routes
  if (isAuthRoute && authToken) {
    const editorUrl = new URL('/editor', request.url)
    return NextResponse.redirect(editorUrl)
  }

  return NextResponse.next()
}

/**
 * Configure which routes the proxy should run on
 */
export const config = {
  filter: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
