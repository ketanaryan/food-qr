import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the service_role key here to bypass RLS, ensuring only the backend can update orders
// Fallback to anon_key if service_role is not provided (for dev/testing only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { orderIds, status, paymentMethod } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || !status) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    if (paymentMethod) {
      for (const id of orderIds) {
        const { data: orderData } = await supabaseAdmin.from('orders').select('items').eq('id', id).single();
        if (orderData) {
          let items: any[] = [];
          try {
             items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
          } catch(e) {}
          if (!Array.isArray(items)) items = [];
          items.push({ id: 'PAYMENT_METHOD', method: paymentMethod });
          
          const { error } = await supabaseAdmin.from('orders').update({ status, items }).eq('id', id);
          if (error) throw error;
        }
      }
    } else {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .in('id', orderIds);

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update orders' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Orders updated' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
