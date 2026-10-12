import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isStaffAuthorized } from '@/lib/staffAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const ALLOWED_STATUSES = [
  'billing',
  'completed',
  'received',
  'pending',
  'preparing',
  'ready',
  'served',
  'archived',
  'rejected'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderIds, status, paymentMethod, customerPhone, newTableNumber } = body;

    // 1. Validate orderIds
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or empty order IDs' }, { status: 400 });
    }

    if (orderIds.length > 100) {
      return NextResponse.json({ success: false, message: 'Too many order IDs in single request' }, { status: 400 });
    }

    // Sanitize order IDs
    const cleanOrderIds = orderIds
      .map(id => parseInt(String(id), 10))
      .filter(id => !isNaN(id) && id > 0);

    if (cleanOrderIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid numeric order IDs provided' }, { status: 400 });
    }

    // 2. Validate Status
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status: ${status}` }, { status: 400 });
    }

    // 3. Authorization Enforcement
    const isCustomerBillRequest = status === 'billing' && !newTableNumber;
    const isAuthorizedStaff = isStaffAuthorized(req);

    if (!isCustomerBillRequest && !isAuthorizedStaff) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Staff credentials required to perform this action.' },
        { status: 403 }
      );
    }

    // 4. Handle Table Shift / Transfer (Staff Only)
    if (newTableNumber) {
      const cleanTargetTable = String(newTableNumber).trim().slice(0, 30);
      if (!cleanTargetTable) {
        return NextResponse.json({ success: false, message: 'Invalid target table number' }, { status: 400 });
      }

      const { error: shiftError } = await supabaseAdmin
        .from('orders')
        .update({ table_number: cleanTargetTable })
        .in('id', cleanOrderIds);

      if (shiftError) {
        console.error('Table shift error:', shiftError);
        return NextResponse.json({ success: false, message: 'Failed to shift table' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Table shifted to ${cleanTargetTable}` }, { status: 200 });
    }

    // 5. Handle Status Update & Payment Recording
    const cleanPaymentMethod = paymentMethod === 'UPI' ? 'UPI' : paymentMethod === 'CASH' ? 'CASH' : null;
    const cleanPhone = customerPhone ? String(customerPhone).replace(/\D/g, '').slice(-15) : null;

    if (cleanPaymentMethod || cleanPhone) {
      for (const id of cleanOrderIds) {
        const { data: orderData } = await supabaseAdmin
          .from('orders')
          .select('items')
          .eq('id', id)
          .single();

        if (orderData) {
          let items: any[] = [];
          try {
            items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
          } catch (e) {}
          if (!Array.isArray(items)) items = [];

          if (cleanPaymentMethod) {
            items.push({ id: 'PAYMENT_METHOD', method: cleanPaymentMethod });
          }
          if (cleanPhone) {
            items.push({ id: 'CUSTOMER_INFO', phone: cleanPhone });
          }

          const { error } = await supabaseAdmin
            .from('orders')
            .update({ status: status || 'completed', items })
            .eq('id', id);

          if (error) throw error;
        }
      }
    } else {
      const updatePayload: Record<string, any> = {};
      if (status) updatePayload.status = status;

      const { error } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .in('id', cleanOrderIds);

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update orders' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Orders updated securely' }, { status: 200 });
  } catch (error: any) {
    console.error('Orders update API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
