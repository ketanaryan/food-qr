import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  verifyOwnerCredentials, 
  createOwnerToken, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetLoginAttempts 
} from '@/lib/ownerAuth';
import { getStaffSessionToken } from '@/lib/staffAuth';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Rate Limiting Check
  const rateLimitStatus = checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    const minutesLeft = Math.ceil((rateLimitStatus.retryAfterSeconds || 60) / 60);
    return NextResponse.json(
      { 
        error: `Security Lockout: Too many failed login attempts from this device. Please wait ${minutesLeft} minute(s) before trying again.` 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitStatus.retryAfterSeconds || 900)
        }
      }
    );
  }

  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const isValid = verifyOwnerCredentials(email, password);

    if (!isValid) {
      const failure = recordFailedAttempt(ip);
      if (failure.locked) {
        return NextResponse.json(
          { error: 'Security Lockout: 5 failed attempts reached. Portal locked for 15 minutes.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { 
          error: `Invalid Owner credentials. ${failure.remainingAttempts} attempt(s) remaining before security lockout.` 
        },
        { status: 401 }
      );
    }

    // Login Succeeded: Reset attempts
    resetLoginAttempts(ip);

    const token = createOwnerToken(email);
    const response = NextResponse.json({
      success: true,
      message: 'Owner authentication successful.',
      email: email.toLowerCase().trim()
    });

    const isProd = process.env.NODE_ENV === 'production';
    // 30 days if rememberMe, otherwise 12 hours
    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60;

    // Set HttpOnly owner session cookie
    response.cookies.set('owner_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/'
    });

    // Also set staff session cookie so owner can view staff data seamlessly
    response.cookies.set('staff_session', getStaffSessionToken(), {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error processing owner authentication.' },
      { status: 500 }
    );
  }
}
