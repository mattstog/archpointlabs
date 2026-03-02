import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Allow the login page through so we don't redirect loop
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    const auth = req.cookies.get('admin_auth')
    const secret = process.env.ADMIN_PASSWORD

    if (!secret || auth?.value !== secret) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('from', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
