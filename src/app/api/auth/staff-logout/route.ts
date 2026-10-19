import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Staff session locked and logged out successfully.'
  });

  const isProd = process.env.NODE_ENV === 'production';

  // Clear staff_session cookie
  response.cookies.set('staff_session', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}
