import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  isOwnerAuthorized, 
  verifyOwnerCredentialsAsync, 
  saveDynamicOwnerCredentials, 
  createOwnerToken,
  getExpectedOwnerCredentials
} from '@/lib/ownerAuth';

export async function POST(req: NextRequest) {
  // 1. Verify owner authorization
  if (!(await isOwnerAuthorized(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: You must be logged in as Owner to change credentials.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { currentPassword, newEmail, newPassword } = body;

    if (!currentPassword || !newEmail || !newPassword) {
      return NextResponse.json(
        { error: 'Current password, new email, and new password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = newEmail.toLowerCase().trim();
    const cleanNewPassword = newPassword.trim();

    if (cleanEmail.length < 5 || !cleanEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (cleanNewPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Verify current password against dynamic scrypt hash or allowed owner passwords
    const dynamicCreds = await fetchDynamicOwnerCredentials();
    const currentOwnerEmail = dynamicCreds?.email || 'owner@hotelwhitebliss.com';
    const isCurrentPasswordCorrect = await verifyOwnerCredentialsAsync(currentOwnerEmail, currentPassword.trim());

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        { error: 'Current password is incorrect. Credential update denied.' },
        { status: 403 }
      );
    }

    // Save dynamic credentials
    await saveDynamicOwnerCredentials(cleanEmail, cleanNewPassword);

    const token = await createOwnerToken(cleanEmail);
    const response = NextResponse.json({
      success: true,
      message: 'Owner credentials successfully updated.',
      email: cleanEmail
    });

    const isSecure = process.env.NODE_ENV === 'production' && !req.url.includes('localhost') && !req.url.includes('127.0.0.1');
    // 30 days session
    const maxAgeSeconds = 30 * 24 * 60 * 60;

    response.cookies.set('owner_session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error updating credentials.' },
      { status: 500 }
    );
  }
}
