export interface ConsolidatedBill {
  id: string;
  order_ids: number[];
  table_number: string;
  status: string;
  created_at: string; // Earliest order punch time
  settled_at: string; // Actual payment / settlement time
  subtotal: number;
  discount?: number;
  gst: number;
  service_charge: number;
  grand_total: number;
  kot_count: number;
  payment_method: 'UPI' | 'CASH' | 'SWIGGY' | 'ZOMATO' | 'SPLIT' | 'UNKNOWN';
  split_cash?: number;
  split_upi?: number;
  customer_phone?: string;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    price: number;
  }>;
}

/**
 * Consolidates individual kitchen orders (KOTs) into unified Dining Bills / Invoices.
 * Multiple KOTs belonging to the same table session or sharing a bill_session_id
 * are merged into a single consolidated Bill with combined totals and payment time.
 */
export function consolidateOrders(rawOrders: any[]): ConsolidatedBill[] {
  if (!Array.isArray(rawOrders) || rawOrders.length === 0) return [];

  // Map to hold groups
  const groups: { [key: string]: any[] } = {};

  rawOrders.forEach(order => {
    let itemsArray: any[] = [];
    try {
      itemsArray = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch {
      itemsArray = [];
    }
    if (!Array.isArray(itemsArray)) itemsArray = [];

    const settlementInfo = itemsArray.find(i => i && i.id === 'SETTLEMENT_INFO');
    const billSessionId = settlementInfo?.bill_session_id;

    if (billSessionId) {
      // 1. Explicitly tagged to a bill session
      const key = `SESSION_${billSessionId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...order, parsedItems: itemsArray, settlementInfo });
    } else if (order.status !== 'completed') {
      // 2. Active running table (unsettled)
      const key = `ACTIVE_${order.table_number}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...order, parsedItems: itemsArray, settlementInfo });
    } else {
      // 3. Completed legacy order without session tag
      // Group by table_number + temporal proximity (within 60 minutes)
      const tableKey = `LEGACY_${order.table_number}`;
      let matchedGroupKey: string | null = null;

      for (const existingKey of Object.keys(groups)) {
        if (existingKey.startsWith(tableKey)) {
          const groupOrders = groups[existingKey];
          const orderTime = new Date(order.created_at).getTime();
          // Check if orderTime is within 60 mins of any order in this group
          const isClose = groupOrders.some((go: any) => {
            const goTime = new Date(go.created_at).getTime();
            return Math.abs(orderTime - goTime) <= 60 * 60 * 1000;
          });
          if (isClose) {
            matchedGroupKey = existingKey;
            break;
          }
        }
      }

      if (matchedGroupKey) {
        groups[matchedGroupKey].push({ ...order, parsedItems: itemsArray, settlementInfo });
      } else {
        const newKey = `${tableKey}_${order.id}`;
        groups[newKey] = [{ ...order, parsedItems: itemsArray, settlementInfo }];
      }
    }
  });

  const consolidated: ConsolidatedBill[] = [];

  Object.values(groups).forEach(orderGroup => {
    if (orderGroup.length === 0) return;

    // Sort orders by created_at ascending
    orderGroup.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const firstOrder = orderGroup[0];
    const lastOrder = orderGroup[orderGroup.length - 1];

    // Find settlement info or payment method
    let paymentMethod: ConsolidatedBill['payment_method'] = 'UNKNOWN';
    let customerPhone: string | undefined = undefined;
    let settledAt: string = lastOrder.created_at;

    let storedSubtotal: number | undefined = undefined;
    let storedDiscount: number | undefined = undefined;
    let storedGst: number | undefined = undefined;
    let storedServiceCharge: number | undefined = undefined;
    let storedGrandTotal: number | undefined = undefined;
    let storedSplitCash: number | undefined = undefined;
    let storedSplitUpi: number | undefined = undefined;

    for (const ord of orderGroup) {
      const sInfo = ord.settlementInfo || ord.parsedItems?.find((i: any) => i && i.id === 'SETTLEMENT_INFO');
      if (sInfo) {
        if (sInfo.settled_at) settledAt = sInfo.settled_at;
        if (sInfo.payment_method) paymentMethod = sInfo.payment_method;
        if (typeof sInfo.subtotal === 'number') storedSubtotal = sInfo.subtotal;
        if (typeof sInfo.discount === 'number') storedDiscount = sInfo.discount;
        if (typeof sInfo.gst === 'number') storedGst = sInfo.gst;
        if (typeof sInfo.service_charge === 'number') storedServiceCharge = sInfo.service_charge;
        if (typeof sInfo.grand_total === 'number') storedGrandTotal = sInfo.grand_total;
        if (typeof sInfo.split_cash === 'number') storedSplitCash = sInfo.split_cash;
        if (typeof sInfo.split_upi === 'number') storedSplitUpi = sInfo.split_upi;
      }
      const payObj = ord.parsedItems?.find((i: any) => i && i.id === 'PAYMENT_METHOD');
      if (payObj && payObj.method) {
        paymentMethod = payObj.method;
      }
      const custObj = ord.parsedItems?.find((i: any) => i && i.id === 'CUSTOMER_INFO');
      if (custObj && custObj.phone) {
        customerPhone = custObj.phone;
      }
    }

    // Combine food items & compute subtotal
    const foodItemsMap: { [name: string]: { id: string; name: string; qty: number; price: number } } = {};
    let subtotal = 0;

    orderGroup.forEach(ord => {
      subtotal += Number(ord.total_amount || 0);
      ord.parsedItems.forEach((item: any) => {
        if (item && item.name && item.id !== 'NOTE' && !item.id?.startsWith('PAYMENT_') && !item.id?.startsWith('CUSTOMER_') && !item.id?.startsWith('SETTLEMENT_')) {
          const qty = Number(item.qty || 1);
          const price = Number(item.price || 0);
          if (!foodItemsMap[item.name]) {
            foodItemsMap[item.name] = { id: String(item.id || item.name), name: item.name, qty, price };
          } else {
            foodItemsMap[item.name].qty += qty;
          }
        }
      });
    });

    const finalSubtotal = storedSubtotal !== undefined ? storedSubtotal : subtotal;
    const netFood = Math.max(0, finalSubtotal - (storedDiscount || 0));
    const gst = storedGst !== undefined ? storedGst : Math.round(netFood * 0.05);
    const serviceCharge = storedServiceCharge !== undefined ? storedServiceCharge : Math.round(netFood * 0.05);
    const grandTotal = storedGrandTotal !== undefined ? storedGrandTotal : (netFood + gst + serviceCharge);

    const orderIds = orderGroup.map(o => o.id);
    const billId = orderGroup[0].settlementInfo?.bill_session_id || `BILL-${orderIds.join('-')}`;

    consolidated.push({
      id: billId,
      order_ids: orderIds,
      table_number: firstOrder.table_number,
      status: orderGroup.every(o => o.status === 'completed') ? 'completed' : firstOrder.status,
      created_at: firstOrder.created_at,
      settled_at: settledAt,
      subtotal: finalSubtotal,
      discount: storedDiscount || 0,
      gst,
      service_charge: serviceCharge,
      grand_total: grandTotal,
      kot_count: orderGroup.length,
      payment_method: paymentMethod,
      split_cash: storedSplitCash,
      split_upi: storedSplitUpi,
      customer_phone: customerPhone,
      items: Object.values(foodItemsMap)
    });
  });

  // Sort by settled_at / created_at descending (newest first)
  consolidated.sort((a, b) => new Date(b.settled_at || b.created_at).getTime() - new Date(a.settled_at || a.created_at).getTime());

  return consolidated;
}
