import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStaffSessionToken, getExpectedCredentials } from '@/lib/staffAuth';
import { getExpectedOwnerCredentials } from '@/lib/ownerAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, password } = body;
    const input = String(pin || password || '').trim();

    if (!input) {
      return NextResponse.json(
        { error: 'Staff PIN or password is required.' },
        { status: 400 }
      );
    }

    const { pwd: staffPwd } = getExpectedCredentials();
    const { allowedPasswords } = getExpectedOwnerCredentials();

    // Accepted staff passcodes: '1234', default staff password 'aryan123', or owner passwords
    const validCodes = [
      '1234',
      staffPwd,
      ...allowedPasswords
    ];

    const isMatch = validCodes.includes(input);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect Staff PIN or Password. Access Denied.' },
        { status: 401 }
      );
    }

    const token = getStaffSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Staff access granted.'
    });

    const isProd = process.env.NODE_ENV === 'production';
    // 365 days persistent cookie for staff handheld APKs and tablets
    const maxAgeSeconds = 365 * 24 * 60 * 60;

    response.cookies.set('staff_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error processing staff login.' },
      { status: 500 }
    );
  }
}
