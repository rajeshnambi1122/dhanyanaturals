import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      const supabase = createMiddlewareClient({ req, res })
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.log('[Middleware] No authenticated user, redirecting to login')
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
        loginUrl.searchParams.set('message', 'Please log in to access this page')
        return NextResponse.redirect(loginUrl)
      }
      
      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('user_data')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (profileError || !profile) {
        console.log('[Middleware] Failed to fetch user profile')
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      if (profile.role !== 'admin') {
        console.log('[Middleware] User is not admin, redirecting to home')
        const homeUrl = new URL('/', req.url)
        homeUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(homeUrl)
      }
      
      // User is admin, allow access
      console.log('[Middleware] Admin access granted')
      return res
    } catch (error) {
      console.error('[Middleware] Error checking admin access:', error)
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Add more protected routes here if needed
    // '/api/admin/:path*', // Future: protect admin API routes
  ]
}

