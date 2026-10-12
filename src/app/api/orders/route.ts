import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// In-memory rate limiting map (IP and Table based)
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const tableRateLimitMap = new Map<string, number>();

function sanitizeText(str: string): string {
  return String(str || '')
    .replace(/[<>'"`;()]/g, '')
    .trim()
    .slice(0, 500);
}

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1';
    
    const now = Date.now();
    const ipLimit = ipRateLimitMap.get(clientIp);
    if (ipLimit && ipLimit.resetAt > now) {
      if (ipLimit.count >= 6) { // Max 6 orders per minute per IP
        return NextResponse.json(
          { success: false, message: 'Too many order attempts. Please wait 60 seconds.' },
          { status: 429 }
        );
      }
      ipLimit.count += 1;
    } else {
      ipRateLimitMap.set(clientIp, { count: 1, resetAt: now + 60000 });
    }

    const body = await req.json();
    const { table_number, items } = body;

    // 2. Table Number Validation & Sanitization
    const cleanTableNumber = sanitizeText(table_number).slice(0, 30);
    if (!cleanTableNumber) {
      return NextResponse.json({ success: false, message: 'Valid table identifier required' }, { status: 400 });
    }

    // 3. Table Cooldown (10 seconds between orders from the same table)
    const idempotencyKey = req.headers.get('idempotency-key');
    const rateLimitKey = idempotencyKey || cleanTableNumber;
    const lastOrderTime = tableRateLimitMap.get(rateLimitKey);
    if (lastOrderTime && now - lastOrderTime < 8000) { // 8 seconds cooldown
      return NextResponse.json(
        { success: false, message: 'An order was just submitted. Please wait a moment.' },
        { status: 429 }
      );
    }
    tableRateLimitMap.set(rateLimitKey, now);

    // 4. Cart Payload Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart cannot be empty' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ success: false, message: 'Too many items in a single order' }, { status: 400 });
    }

    // 5. Server-Side Price Verification (Fetch legitimate prices directly from DB)
    const { data: menuData } = await supabaseAdmin.from('menu').select('*');
    const menuItemsList = menuData || [];

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (typeof item !== 'object' || !item.id) continue;

      if (item.id === "NOTE") {
        const safeNote = sanitizeText(item.name);
        if (safeNote) {
          validatedItems.push({
            id: 'NOTE',
            name: safeNote,
            qty: 1,
            image: null,
            price: 0,
          });
        }
        continue;
      }

      const qty = parseInt(String(item.qty), 10);
      if (isNaN(qty) || qty <= 0 || qty > 100) continue;

      // Always match against DB prices to prevent client-side price tampering
      const menuDbItem = menuItemsList.find((m) => String(m.id) === String(item.id));
      if (menuDbItem) {
        totalAmount += Number(menuDbItem.price) * qty;
        validatedItems.push({
          id: String(item.id),
          name: menuDbItem.name,
          qty,
          image: menuDbItem.image_url,
          price: Number(menuDbItem.price),
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid items found in order' }, { status: 400 });
    }

    // 6. Secure Database Insert
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const { error } = await supabaseAdmin.from('orders').insert({
      table_number: cleanTableNumber,
      status: 'received',
      items: JSON.stringify(validatedItems),
      total_amount: totalAmount,
      order_number: orderNumber,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, message: 'Failed to place order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Order placed securely', orderNumber }, { status: 200 });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
