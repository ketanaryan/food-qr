import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { name, phone, email, guests, date, time } = await req.json();

    if (!name || !phone || !guests || !date || !time) {
      return NextResponse.json({ success: false, message: 'Invalid reservation data' }, { status: 400 });
    }

    const orderNumber = Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabaseAdmin.from('orders').insert([{
      table_number: 'RESERVATION',
      status: 'pending_reservation',
      total_amount: 0,
      order_number: orderNumber,
      items: [
        { id: 'RESERVATION_DETAILS', name, phone, email, guests, date, time }
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
