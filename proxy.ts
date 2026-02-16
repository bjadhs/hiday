import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Clear duplicate Supabase auth cookies to prevent 431 errors
function deduplicateCookies(request: NextRequest, response: NextResponse) {
  const cookies = request.cookies.getAll()
  const seen = new Set<string>()
  
  for (const cookie of cookies) {
    if (cookie.name.startsWith('sb-')) {
      if (seen.has(cookie.name)) {
        // Duplicate found - clear it
        response.cookies.delete(cookie.name)
      } else {
        seen.add(cookie.name)
      }
    }
  }
  
  return response
}

export async function proxy(request: NextRequest) {
  // Update the session and get the response
  const { response: originalResponse, user } = await updateSession(request)
  
  // Deduplicate cookies to prevent header overflow
  const response = deduplicateCookies(request, originalResponse)

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/track', '/analyze', '/settings', '/tasks', '/history']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/signup', '/auth']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

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
