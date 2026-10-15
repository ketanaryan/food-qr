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
  if (url.startsWith('/admin') || url.startsWith('/owner')) {
    if (!isOwner) {
      // Allow /admin or /owner root so the Executive Owner Login Screen can render
      if (url === '/admin' || url === '/admin/' || url === '/owner' || url === '/owner/') {
        return applySecurityHeaders(NextResponse.next());
      }

      // If user tries to access any deep sub-route (/admin/sales, /admin/dashboard, /admin/crm, etc.) without owner session:
      // Instantly redirect them to /admin root login screen!
      const loginUrl = new URL('/admin', req.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // Allow /staff/login unconditionally so staff can authenticate
  if (url.startsWith('/staff/login')) {
    return applySecurityHeaders(NextResponse.next());
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
        maxAge: 60 * 60 * 24 * 365, // 1 year persistence for staff APKs
        path: '/'
      });
      return applySecurityHeaders(response);
    }

    // Redirect to mobile-friendly staff login page (works 100% on Android APKs, WebViews & phones)
    const loginUrl = new URL('/staff/login', req.url);
    loginUrl.searchParams.set('redirect', url);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
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
