import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.TABLE_SECRET_KEY || 'default-secret-do-not-use-in-prod';

export function generateTableToken(tableNumber: string) {
  return crypto.createHmac('sha256', SECRET_KEY).update(tableNumber).digest('hex').substring(0, 10);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  const countStr = searchParams.get('count');

  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';

  if (countStr) {
    const count = parseInt(countStr);
    const tables = [];
    for (let i = 1; i <= count; i++) {
      const token = generateTableToken(i.toString());
      tables.push({
        table: i,
        qrUrl: `${protocol}://${host}/table/${i}?token=${token}`
      });
    }
    return NextResponse.json({ success: true, tables });
  }

  if (!table) {
    return NextResponse.json({ success: false, message: 'Table number required' }, { status: 400 });
  }

  const token = generateTableToken(table);
  const qrUrl = `${protocol}://${host}/table/${table}?token=${token}`;

  return NextResponse.json({ success: true, table, token, qrUrl });
}
