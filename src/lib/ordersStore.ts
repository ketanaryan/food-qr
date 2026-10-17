// Resilient Hybrid Orders Storage (Supabase Primary + Local JSON Fallback)
import fs from 'fs';
import path from 'path';

export interface LocalOrder {
  id: number;
  created_at: string;
  order_number: string;
  table_number: string;
  status: string;
  items: string;
  total_amount: number;
  settled_at?: string;
  payment_method?: string;
  customer_phone?: string;
  split_cash?: number;
  split_upi?: number;
  subtotal?: number;
  gst?: number;
  service_charge?: number;
  grand_total?: number;
}

const filePath = path.join(process.cwd(), 'data', 'orders-store.json');
let memoryOrders: LocalOrder[] = [];

export function getLocalOrders(): LocalOrder[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryOrders = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryOrders;
}

export function saveLocalOrders(orders: LocalOrder[]) {
  memoryOrders = orders;
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch {}
}

export function insertLocalOrder(order: Omit<LocalOrder, 'id' | 'created_at'>): LocalOrder {
  const orders = getLocalOrders();
  const nextId = orders.length > 0 ? Math.max(...orders.map(o => o.id || 0)) + 1 : 101;
  const newOrder: LocalOrder = {
    ...order,
    id: nextId,
    created_at: new Date().toISOString()
  };
  orders.unshift(newOrder);
  saveLocalOrders(orders);
  return newOrder;
}

export function updateLocalOrder(id: number, update: Partial<LocalOrder>): boolean {
  const orders = getLocalOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...update };
    saveLocalOrders(orders);
    return true;
  }
  return false;
}
