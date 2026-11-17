import { NextResponse } from 'next/server';
import { syncLocalOrders, getLocalOrders } from '@/lib/ordersStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orders } = body;
    if (Array.isArray(orders) && orders.length > 0) {
      const synced = syncLocalOrders(orders);
      return NextResponse.json({ success: true, count: synced.length, orders: synced });
    }
    const current = getLocalOrders();
    return NextResponse.json({ success: true, count: current.length, orders: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
