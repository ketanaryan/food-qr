import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.TABLE_SECRET_KEY || 'default-secret-do-not-use-in-prod';

export function generateTableToken(tableNumber: string) {
  return crypto.createHmac('sha256', SECRET_KEY).update(tableNumber).digest('hex').substring(0, 10);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json({ success: false, message: 'Table number required' }, { status: 400 });
  }

  const token = generateTableToken(table);
  // Generate the full URL for the QR code
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  const qrUrl = `${protocol}://${host}/table/${table}?token=${token}`;

  return NextResponse.json({ success: true, table, token, qrUrl });
}
