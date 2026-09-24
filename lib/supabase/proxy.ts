import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from '@/lib/env'

export async function updateSession(request: NextRequest) {
  const { url, key, isConfigured } = getSupabaseConfig()

  if (!isConfigured) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const creatorWorkspaceRoute = pathname === '/creator/workspace' || pathname.startsWith('/creator/workspace/')
  const creatorLegacyRoutes: Record<string, string> = {
    '/dashboard': '/creator/workspace/dashboard',
    '/requests': '/creator/workspace/requests',
    '/messages': '/creator/workspace/messages',
    '/post-gig': '/creator/workspace/post-gig',
    '/profile': '/creator/workspace/profile',
    '/history': '/creator/workspace/history',
    '/settings': '/creator/workspace/settings',
  }
  const publicRoute =
    pathname === '/' ||
    pathname === '/how-it-works' ||
    pathname === '/categories' ||
    pathname === '/for-creators' ||
    pathname === '/for-clients' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  const protectedRoute = !publicRoute

  if (protectedRoute && !user) {
    const target = `${pathname}${request.nextUrl.search}${request.nextUrl.hash}`
    const redirect = new URL('/login', request.url)
    redirect.searchParams.set('next', target)
    return NextResponse.redirect(redirect)
  }

  if (user && (creatorWorkspaceRoute || creatorLegacyRoutes[pathname])) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role === 'client') return NextResponse.redirect(new URL('/find-creators', request.url))
    if (profile?.role === 'creator' && creatorLegacyRoutes[pathname]) return NextResponse.redirect(new URL(creatorLegacyRoutes[pathname], request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    return NextResponse.redirect(new URL(profile?.role === 'creator' ? '/creator/workspace/dashboard' : '/find-creators', request.url))
  }

  return response
}
