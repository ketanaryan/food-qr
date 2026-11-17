// Resilient Hybrid Orders Storage (Supabase Primary + Serverless /tmp Fallback)
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// On Vercel / serverless Linux, process.cwd() is read-only (/var/task).
// The only writable directory on AWS Lambda / Vercel is os.tmpdir() (/tmp).
function getWritableFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'orders-store.json');
  }
  return path.join(process.cwd(), 'data', 'orders-store.json');
}

const staticSeedPath = path.join(process.cwd(), 'data', 'orders-store.json');
let memoryOrders: LocalOrder[] = [];
let isInitialized = false;

function initOrders(): LocalOrder[] {
  const targetPath = getWritableFilePath();
  try {
    // 1. Try reading from writable store path first (/tmp in Vercel)
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryOrders = parsed;
        isInitialized = true;
        return parsed;
      }
    }

    // 2. Fall back to static build-time seed file
    if (fs.existsSync(staticSeedPath)) {
      const content = fs.readFileSync(staticSeedPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryOrders = parsed;
        // Copy to writable path so future writes succeed
        try {
          fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
        } catch {}
        isInitialized = true;
        return parsed;
      }
    }
  } catch {}
  isInitialized = true;
  return memoryOrders;
}

export function getLocalOrders(): LocalOrder[] {
  if (!isInitialized || memoryOrders.length === 0) {
    return initOrders();
  }
  return memoryOrders;
}

export function saveLocalOrders(orders: LocalOrder[]) {
  memoryOrders = orders;
  const targetPath = getWritableFilePath();
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ordersStore] Could not write to disk:', err);
  }
}

export function syncLocalOrders(incomingOrders: LocalOrder[]): LocalOrder[] {
  if (!Array.isArray(incomingOrders) || incomingOrders.length === 0) {
    return getLocalOrders();
  }
  const current = getLocalOrders();
  const mergedMap = new Map<string, LocalOrder>();

  // Add existing
  for (const o of current) {
    const key = String(o.id || o.order_number);
    mergedMap.set(key, o);
  }

  // Merge incoming
  for (const o of incomingOrders) {
    if (!o.id && !o.order_number) continue;
    const key = String(o.id || o.order_number);
    const existing = mergedMap.get(key);
    if (!existing) {
      mergedMap.set(key, o);
    } else {
      if (o.status === 'completed' || o.settled_at || (o.status && o.status !== 'received')) {
        mergedMap.set(key, { ...existing, ...o });
      }
    }
  }

  const mergedList = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  saveLocalOrders(mergedList);
  return mergedList;
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
