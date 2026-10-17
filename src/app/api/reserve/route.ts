import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// In-memory rate limiting maps for reservations
const reserveRateLimit = new Map<string, number>();
const ipReserveRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    // 1. IP-Based Rate Limiting (Defense against automated reservation flooding)
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1';

    const now = Date.now();
    const ipLimit = ipReserveRateLimit.get(clientIp);
    if (ipLimit && ipLimit.resetAt > now) {
      if (ipLimit.count >= 5) { // Max 5 reservations per 10 minutes per IP
        return NextResponse.json(
          { success: false, message: 'Too many reservation requests. Please wait a few minutes before trying again.' },
          { status: 429 }
        );
      }
      ipLimit.count += 1;
    } else {
      ipReserveRateLimit.set(clientIp, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    const body = await req.json();
    const { name, phone, email, guests, date, time } = body;

    // Input sanitization
    const cleanName = String(name || '').trim().slice(0, 80);
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = String(email || '').trim().slice(0, 100);
    const cleanDate = String(date || '').trim().slice(0, 25);
    const cleanTime = String(time || '').trim().slice(0, 25);
    const cleanGuests = Math.min(50, Math.max(1, parseInt(String(guests)) || 1));

    if (!cleanName || cleanPhone.length !== 10 || !cleanDate || !cleanTime) {
      return NextResponse.json({ success: false, message: 'Please provide a valid name, 10-digit phone number, date, and time.' }, { status: 400 });
    }

    // 2. Phone-Based Rate Limiting: 1 reservation per phone number every 30 seconds
    const lastRequest = reserveRateLimit.get(cleanPhone);
    if (lastRequest && now - lastRequest < 30000) {
      return NextResponse.json({ success: false, message: 'A reservation request was recently received. Please wait a moment.' }, { status: 429 });
    }
    reserveRateLimit.set(cleanPhone, now);

    const orderNumber = Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabaseAdmin.from('orders').insert([{
      table_number: 'RESERVATION',
      status: 'pending_reservation',
      total_amount: 0,
      order_number: orderNumber,
      items: [
        { id: 'RESERVATION_DETAILS', name: cleanName, phone: cleanPhone, email: cleanEmail, guests: cleanGuests, date: cleanDate, time: cleanTime }
      ]
    }]);

    if (error) {
      console.error('Reservation error:', error);
      return NextResponse.json({ success: false, message: 'Failed to create reservation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reservation created' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
