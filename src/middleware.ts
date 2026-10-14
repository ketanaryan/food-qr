import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isStaffAuthorized, getStaffSessionToken } from '@/lib/staffAuth';
import { isOwnerAuthorized } from '@/lib/ownerAuth';

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

  // Allow public auth endpoints unconditionally
  if (url.startsWith('/api/auth')) {
    return applySecurityHeaders(NextResponse.next());
  }

  const isStaff = isStaffAuthorized(req);
  const isOwner = isOwnerAuthorized(req);
  const isAuthorized = isStaff || isOwner;

  // 1. Strict protection for Admin API endpoints
  if (url.startsWith('/api/admin')) {
    if (!isAuthorized) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Unauthorized: Hotel White Bliss administrative credentials required.' },
          { status: 401 }
        )
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Owner & Admin UI Pages (/admin, /owner)
  // Allowed to proceed so src/app/admin/layout.tsx renders the Executive Owner Login Screen when unauthorized
  if (url.startsWith('/admin') || url.startsWith('/owner')) {
    const response = NextResponse.next();
    if (isStaff && !isOwner) {
      response.cookies.set('staff_session', getStaffSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
    }
    return applySecurityHeaders(response);
  }

  // 3. Operational Staff Workstations (/kitchen, /cashier, /pos, /captain, /staff)
  const isStaffPath = 
    url.startsWith('/kitchen') || 
    url.startsWith('/cashier') || 
    url.startsWith('/pos') || 
    url.startsWith('/captain') || 
    url.startsWith('/staff');

  if (isStaffPath) {
    if (isAuthorized) {
      const response = NextResponse.next();
      response.cookies.set('staff_session', getStaffSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      return applySecurityHeaders(response);
    }

    // Prompt for Staff Basic Auth
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
