import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isStaffAuthorized, getStaffSessionToken } from '@/lib/staffAuth';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Security Headers Helper
  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    return res;
  };

  // Protect sensitive staff and admin routes
  const isProtectedPath = 
    url.startsWith('/kitchen') || 
    url.startsWith('/cashier') || 
    url.startsWith('/admin') || 
    url.startsWith('/pos') || 
    url.startsWith('/captain') || 
    url.startsWith('/owner') || 
    url.startsWith('/staff') || 
    url.startsWith('/api/admin');

  if (isProtectedPath) {
    if (isStaffAuthorized(req)) {
      const response = NextResponse.next();
      
      // Ensure staff session cookie is active for seamless API fetch calls
      response.cookies.set('staff_session', getStaffSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return applySecurityHeaders(response);
    }

    // If not authenticated, prompt browser for basic auth
    const unauthorizedResponse = new NextResponse('Authentication required for Hotel White Bliss Staff Area.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Hotel White Bliss Staff Area"'
      }
    });

    return applySecurityHeaders(unauthorizedResponse);
  }

  const defaultResponse = NextResponse.next();
  return applySecurityHeaders(defaultResponse);
}

export const config = {
  matcher: [
    '/kitchen/:path*',
    '/cashier/:path*',
    '/admin/:path*',
    '/pos/:path*',
    '/captain/:path*',
    '/owner/:path*',
    '/staff/:path*',
    '/api/admin/:path*'
  ],
};
