import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Staff session locked and logged out successfully.'
  });

  const isSecure = process.env.NODE_ENV === 'production' && !req.url.includes('localhost') && !req.url.includes('127.0.0.1');

  // Clear staff_session cookie
  response.cookies.set('staff_session', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}
