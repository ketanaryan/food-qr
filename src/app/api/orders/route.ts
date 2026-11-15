import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isStaffAuthorized } from '@/lib/staffAuth';
import { isOwnerAuthorized } from '@/lib/ownerAuth';
import { verifyTableToken } from '@/lib/security';
import { insertLocalOrder, getLocalOrders } from '@/lib/ordersStore';
import { depleteStockForOrderItems } from '@/lib/inventoryStore';
import { DEFAULT_MENU_ITEMS } from '@/lib/defaultMenu';
import { runWithFastTimeout } from '@/lib/supabaseBreaker';

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
    const isStaff = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));

    // 1. IP Rate Limiting (Skipped for authenticated POS/Captain staff)
    if (!isStaff) {
      const forwarded = req.headers.get('x-forwarded-for');
      const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')) || '127.0.0.1';
      
      const now = Date.now();
      const ipLimit = ipRateLimitMap.get(clientIp);
      if (ipLimit && ipLimit.resetAt > now) {
        if (ipLimit.count >= 15) { // Max 15 orders per minute per IP
          return NextResponse.json(
            { success: false, message: 'Too many order attempts. Please wait 60 seconds.' },
            { status: 429 }
          );
        }
        ipLimit.count += 1;
      } else {
        ipRateLimitMap.set(clientIp, { count: 1, resetAt: now + 60000 });
      }
    }

    const body = await req.json();
    const { table_number, items, token } = body;

    // 2. Table Number Validation & Sanitization
    const cleanTableNumber = sanitizeText(table_number).slice(0, 30);
    if (!cleanTableNumber) {
      return NextResponse.json({ success: false, message: 'Valid table identifier required' }, { status: 400 });
    }

    // 2.1 Table Token Validation for Non-Staff Guests
    if (!isStaff) {
      const isTokenValid = verifyTableToken(cleanTableNumber, token || null);
      if (!isTokenValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired table session. Please scan table QR code.' },
          { status: 403 }
        );
      }
    }

    // 3. Table Cooldown (Skipped for staff)
    const now = Date.now();
    if (!isStaff) {
      const idempotencyKey = req.headers.get('idempotency-key');
      const rateLimitKey = idempotencyKey || cleanTableNumber;
      const lastOrderTime = tableRateLimitMap.get(rateLimitKey);
      if (lastOrderTime && now - lastOrderTime < 6000) { // 6 seconds cooldown
        return NextResponse.json(
          { success: false, message: 'An order was just submitted. Please wait a moment.' },
          { status: 429 }
        );
      }
      tableRateLimitMap.set(rateLimitKey, now);
    }

    // 4. Cart Payload Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart cannot be empty' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ success: false, message: 'Too many items in a single order' }, { status: 400 });
    }

    // 5. Server-Side Price Verification (Fetch legitimate prices directly from DB or fallback)
    const menuItemsList = await runWithFastTimeout(
      async () => {
        const { data: menuData } = await supabaseAdmin.from('menu').select('*');
        if (menuData && menuData.length > 0) return menuData;
        return DEFAULT_MENU_ITEMS;
      },
      () => DEFAULT_MENU_ITEMS,
      600
    );

    let totalAmount = 0;
    const validatedItems: any[] = [];

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

      const qty = parseInt(String(item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1)), 10);
      if (isNaN(qty) || qty <= 0 || qty > 100) continue;

      // Match against DB prices to prevent tampering, with fallback for custom staff items
      const menuDbItem = menuItemsList.find((m) => 
        String(m.id) === String(item.id) || 
        (item.name && String(m.name || '').toLowerCase().trim() === String(item.name).toLowerCase().trim())
      );
      if (menuDbItem) {
        totalAmount += Number(menuDbItem.price) * qty;
        validatedItems.push({
          id: String(item.id),
          name: menuDbItem.name,
          qty,
          image: menuDbItem.image_url,
          price: Number(menuDbItem.price),
        });
      } else if (isStaff && item.name && item.price !== undefined) {
        // Authenticated Staff Only (POS & Captain can enter custom off-menu items)
        const customPrice = Math.max(0, Number(item.price) || 0);
        totalAmount += customPrice * qty;
        validatedItems.push({
          id: String(item.id),
          name: sanitizeText(item.name),
          qty,
          image: null,
          price: customPrice,
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid items found in order' }, { status: 400 });
    }

    // 6. Secure Database Insert with High-Speed Timeout Fallback
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    let createdOrder: any = await runWithFastTimeout(
      async () => {
        const { data, error } = await supabaseAdmin.from('orders').insert({
          table_number: cleanTableNumber,
          status: 'received',
          items: JSON.stringify(validatedItems),
          total_amount: totalAmount,
          order_number: orderNumber,
        }).select().single();

        if (!error && data) return data;
        return null;
      },
      () => null,
      600
    );

    if (!createdOrder) {
      createdOrder = insertLocalOrder({
        table_number: cleanTableNumber,
        status: 'received',
        items: JSON.stringify(validatedItems),
        total_amount: totalAmount,
        order_number: orderNumber,
      });
    }

    // 7. Auto-Deplete Raw Ingredients from Kitchen Inventory via Recipe BOM
    try {
      depleteStockForOrderItems(orderNumber, validatedItems);
    } catch (invErr: any) {
      console.warn('Inventory auto-depletion notice:', invErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed securely',
      orderNumber,
      order: createdOrder
    }, { status: 200 });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const isStaff = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const statusParam = url.searchParams.get('status');
    const orderIdParam = url.searchParams.get('id');

    const getLocalFilteredOrders = () => {
      const localOrders = getLocalOrders();
      let filtered = [...localOrders];
      if (orderIdParam) {
        filtered = filtered.filter(o => String(o.id) === String(orderIdParam));
      }
      if (table) {
        filtered = filtered.filter(o => String(o.table_number) === String(table));
      }
      if (statusParam) {
        const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length > 0) {
          filtered = filtered.filter(o => statuses.includes(o.status));
        }
      }
      return filtered;
    };

    // 1. High-Speed Hybrid Orders Fetch (Circuit Breaker Protected)
    const orders = await runWithFastTimeout(
      async () => {
        let query = supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (orderIdParam) {
          query = query.eq('id', orderIdParam);
        }
        if (table) {
          query = query.eq('table_number', table);
        }
        if (statusParam) {
          const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean);
          if (statuses.length > 0) {
            query = query.in('status', statuses);
          }
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
        return getLocalFilteredOrders();
      },
      getLocalFilteredOrders,
      500
    );

    // Deduplicate uniquely by id and order_number
    const seenIds = new Set<string>();
    const seenNums = new Set<string>();
    const uniqueOrders: any[] = [];
    for (const o of orders) {
      const idKey = String(o.id);
      const numKey = o.order_number ? String(o.order_number) : '';
      if (seenIds.has(idKey) || (numKey && seenNums.has(numKey))) {
        continue;
      }
      seenIds.add(idKey);
      if (numKey) seenNums.add(numKey);
      uniqueOrders.push(o);
    }

    return NextResponse.json({
      success: true,
      orders: uniqueOrders
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ success: false, orders: [], error: 'Failed to fetch orders' }, { status: 500 });
  }
}
