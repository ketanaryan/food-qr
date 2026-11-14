import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Owner logged out successfully.'
  });

  const isSecure = process.env.NODE_ENV === 'production' && !req.url.includes('localhost') && !req.url.includes('127.0.0.1');

  // Clear owner_session and staff_session cookies
  response.cookies.set('owner_session', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  response.cookies.set('staff_session', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}
