import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isStaffAuthorized } from '@/lib/staffAuth';
import { isOwnerAuthorized } from '@/lib/ownerAuth';
import { verifyTableToken } from '@/lib/security';
import { getLocalOrders, updateLocalOrder } from '@/lib/ordersStore';

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
  'rejected',
  'confirmed_reservation'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      orderIds, 
      status, 
      paymentMethod, 
      customerPhone, 
      newTableNumber,
      subtotal,
      discount,
      gst,
      serviceCharge,
      grandTotal,
      splitCash,
      splitUpi,
      table,
      tableToken
    } = body;

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

    // 3. Authorization Enforcement & IDOR Hardening
    const isAuthorizedStaff = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    const isCustomerBillRequest = status === 'billing' && !newTableNumber && !paymentMethod;

    if (!isAuthorizedStaff) {
      if (!isCustomerBillRequest) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Staff credentials required to perform this action.' },
          { status: 403 }
        );
      }

      // Customer Bill Request Security: Verify Table Token & Ownership
      const cleanTable = String(table || '').trim().slice(0, 30);
      if (!cleanTable) {
        return NextResponse.json(
          { success: false, message: 'Table identifier required to request bill.' },
          { status: 400 }
        );
      }

      if (!verifyTableToken(cleanTable, tableToken || null)) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired table session. Please scan table QR code.' },
          { status: 403 }
        );
      }

      // IDOR Verification: Ensure all requested order IDs belong strictly to this customer's table
      const { data: dbOrders } = await supabaseAdmin
        .from('orders')
        .select('id, table_number, status')
        .in('id', cleanOrderIds);

      let verifiedOrders = dbOrders || [];
      if (verifiedOrders.length < cleanOrderIds.length) {
        const local = getLocalOrders().filter(o => cleanOrderIds.includes(o.id));
        const combined = [...verifiedOrders];
        for (const lo of local) {
          if (!combined.some(c => c.id === lo.id)) combined.push(lo);
        }
        verifiedOrders = combined;
      }

      if (verifiedOrders.length !== cleanOrderIds.length) {
        return NextResponse.json(
          { success: false, message: 'Access denied: One or more orders could not be verified.' },
          { status: 403 }
        );
      }

      for (const ord of verifiedOrders) {
        if (String(ord.table_number) !== cleanTable) {
          return NextResponse.json(
            { success: false, message: 'Security Alert: Cannot request bill for orders belonging to another table.' },
            { status: 403 }
          );
        }
        if (!['received', 'pending', 'preparing', 'ready', 'served', 'billing'].includes(ord.status)) {
          return NextResponse.json(
            { success: false, message: 'Cannot request bill for completed or archived orders.' },
            { status: 400 }
          );
        }
      }
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
    const validMethods = ['UPI', 'CASH', 'SWIGGY', 'ZOMATO', 'SPLIT'];
    const cleanPaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : null;
    const cleanPhone = customerPhone ? String(customerPhone).replace(/\D/g, '').slice(-15) : null;
    const isCompleting = status === 'completed';
    const settledAt = new Date().toISOString();
    const billSessionId = `BILL-${Date.now().toString().slice(-6)}`;

    if (cleanPaymentMethod || cleanPhone || isCompleting) {
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
          } catch {
            items = [];
          }
          if (!Array.isArray(items)) items = [];

          // Clean previous metadata entries
          items = items.filter(
            (i: any) => i && i.id !== 'SETTLEMENT_INFO' && i.id !== 'PAYMENT_METHOD' && i.id !== 'CUSTOMER_INFO'
          );

          if (isCompleting || cleanPaymentMethod) {
            items.push({
              id: 'SETTLEMENT_INFO',
              settled_at: settledAt,
              bill_session_id: billSessionId,
              payment_method: cleanPaymentMethod || 'CASH',
              subtotal: typeof subtotal === 'number' ? Math.round(subtotal) : undefined,
              discount: typeof discount === 'number' ? Math.round(discount) : undefined,
              gst: typeof gst === 'number' ? Math.round(gst) : undefined,
              service_charge: typeof serviceCharge === 'number' ? Math.round(serviceCharge) : undefined,
              grand_total: typeof grandTotal === 'number' ? Math.round(grandTotal) : undefined,
              split_cash: typeof splitCash === 'number' ? Math.round(splitCash) : undefined,
              split_upi: typeof splitUpi === 'number' ? Math.round(splitUpi) : undefined
            });
          }

          if (cleanPaymentMethod) {
            items.push({ id: 'PAYMENT_METHOD', method: cleanPaymentMethod });
          }
          if (cleanPhone) {
            items.push({ id: 'CUSTOMER_INFO', phone: cleanPhone });
          }

          try {
            await supabaseAdmin
              .from('orders')
              .update({ status: status || 'completed', items: JSON.stringify(items) })
              .eq('id', id);
          } catch {}

          updateLocalOrder(id, {
            status: status || 'completed',
            items: JSON.stringify(items),
            settled_at: new Date().toISOString(),
            payment_method: cleanPaymentMethod || 'CASH',
            customer_phone: cleanPhone || undefined
          });
        }
      }
    } else {
      const updatePayload: Record<string, any> = {};
      if (status) updatePayload.status = status;

      try {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .in('id', cleanOrderIds);
      } catch {}

      for (const id of cleanOrderIds) {
        updateLocalOrder(id, updatePayload);
      }
    }

    return NextResponse.json({ success: true, message: 'Orders updated securely' }, { status: 200 });
  } catch (error: any) {
    console.error('Orders update API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
