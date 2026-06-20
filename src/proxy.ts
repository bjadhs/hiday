import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = ['/track', '/analyze', '/settings', '/projects', '/history', '/timeline', '/todos', '/kanban']

// Protected routes that have a public `/explore/<key>` preview. Unauthenticated
// visitors are sent to the preview instead of a bare login. (Settings has no
// preview, so it falls through to /login.)
const previewRoutes = ['/track', '/analyze', '/projects', '/history', '/timeline', '/todos', '/kanban']

// Routes that should not be accessed when logged in
const authRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  // Refresh the session and get the user
  const { response, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users away from protected routes. Where a public
  // preview exists, send them to it (sidebar visible + feature explained);
  // otherwise fall back to the login screen.
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    const canPreview = previewRoutes.some((route) => pathname.startsWith(route))
    url.pathname = canPreview ? `/explore/${pathname.split('/')[1]}` : '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/track'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}