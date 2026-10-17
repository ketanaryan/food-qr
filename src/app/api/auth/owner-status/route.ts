import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isOwnerAuthorized } from '@/lib/ownerAuth';
import { isStaffAuthorized } from '@/lib/staffAuth';

export async function GET(req: NextRequest) {
  const isOwner = await isOwnerAuthorized(req);
  const isStaff = await isStaffAuthorized(req);

  return NextResponse.json({
    authenticated: isOwner,
    isOwner,
    isStaff
  });
}
