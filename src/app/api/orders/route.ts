import { NextResponse } from 'next/server';
import { MENU_DATA } from '@/data/menu';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// A simple in-memory rate limiter (Not recommended for distributed edge, but works for MVP)
const rateLimitMap = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table_number, items } = body;

    if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ success: false, message: 'Too many items in a single order' }, { status: 400 });
    }

    const idempotencyKey = req.headers.get('idempotency-key');
    const rateLimitKey = idempotencyKey || table_number;
    
    // Very basic rate limiting based on table_number or idempotency key
    const now = Date.now();
    const lastOrderTime = rateLimitMap.get(rateLimitKey);
    if (lastOrderTime && now - lastOrderTime < 10000) { // 10 seconds cooldown
      return NextResponse.json({ success: false, message: 'Request already processed or rate limited. Please wait.' }, { status: 429 });
    }
    rateLimitMap.set(rateLimitKey, now);

    // Calculate secure total amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (typeof item !== 'object' || !item.id || typeof item.qty !== 'number' || item.qty <= 0 || item.qty > 100) {
        continue; // Skip malicious items
      }

      if (item.id === "NOTE") {
        const safeNote = String(item.name).substring(0, 500); // Prevent 50MB strings
        validatedItems.push({
          id: item.id,
          name: safeNote,
          qty: 1,
          image: null,
          price: 0,
        });
        continue;
      }
      
      const menuDbItem = MENU_DATA.find((m) => String(m._id) === String(item.id));
      if (menuDbItem) {
        totalAmount += menuDbItem.price * item.qty;
        validatedItems.push({
          id: item.id,
          name: menuDbItem.title,
          qty: item.qty,
          image: menuDbItem.image,
          price: menuDbItem.price,
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Empty or invalid cart' }, { status: 400 });
    }

    // Use admin client to bypass RLS for inserts
    const { data, error } = await supabaseAdmin.from('orders').insert({
      table_number,
      status: 'received',
      items: JSON.stringify(validatedItems),
      total_amount: totalAmount,
      order_number: Math.floor(Math.random() * 10000).toString(),
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, message: 'Failed to place order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Order placed' }, { status: 200 });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
