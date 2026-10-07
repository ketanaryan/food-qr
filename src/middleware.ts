import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Protect sensitive routes
  if (url.startsWith('/kitchen') || url.startsWith('/cashier') || url.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization')
    
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      // Basic auth string is base64 encoded "username:password"
      const [user, pwd] = atob(authValue).split(':')

      const expectedUser = process.env.ADMIN_USERNAME || 'admin';
      const expectedPwd = process.env.ADMIN_PASSWORD || 'aryan123';

      if (user === expectedUser && pwd === expectedPwd) {
        return NextResponse.next()
      }
    }
    
    // If not authenticated, prompt for password
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Area"' }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/kitchen/:path*',
    '/cashier/:path*',
    '/admin/:path*',
  ],
}
