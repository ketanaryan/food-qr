import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Simple in-memory rate limiting map for reservations
const reserveRateLimit = new Map<string, number>();

export async function POST(req: Request) {
  try {
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

    // Rate limiting: 1 reservation per phone number every 30 seconds
    const now = Date.now();
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
