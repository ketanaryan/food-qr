-- ============================================================================
-- HOTEL WHITE BLISS - ENTERPRISE INVENTORY & PROCUREMENT SYSTEM SCHEMA
-- ============================================================================

-- 1. Raw Materials & Inventory Catalog Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Dairy', 'Grocery', 'Poultry & Meat', 'Vegetables', 'Beverages', 'Packaging', 'Spices', 'Bakery')),
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'L', 'Pcs', 'Packets', 'Grams')),
    min_alert_stock NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vendor_name TEXT NOT NULL,
    vendor_phone TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vendor Accounts & Payables (Khata Book) Table
CREATE TABLE IF NOT EXISTS public.inventory_vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    phone TEXT NOT NULL,
    total_purchased NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pending_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_payment_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inward Purchases & Delivery Invoices Table
CREATE TABLE IF NOT EXISTS public.inventory_purchases (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    vendor_phone TEXT,
    date TEXT NOT NULL,
    items_summary TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('PAID', 'PENDING_CREDIT')),
    payment_method TEXT CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Recipe Bill of Materials (BOM) Table
CREATE TABLE IF NOT EXISTS public.inventory_recipes (
    id TEXT PRIMARY KEY,
    menu_item TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stock Movement Logs (Audit Trail) Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INWARD', 'WASTAGE', 'CONSUMPTION', 'ADJUSTMENT')),
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Daily Closing Reconciliation Audit Table
CREATE TABLE IF NOT EXISTS public.inventory_reconciliations (
    id TEXT PRIMARY KEY,
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    opening_stock NUMERIC(10, 2) NOT NULL,
    inward_today NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    consumed_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    wastage NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_closing NUMERIC(10, 2) NOT NULL,
    physical_closing NUMERIC(10, 2) NOT NULL,
    variance NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('MATCHED', 'LEAKAGE_THEFT', 'SURPLUS', 'HIGH_VARIANCE_THEFT_ALERT')),
    cost_loss NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) LOCKDOWN POLICIES
-- ============================================================================

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reconciliations ENABLE ROW LEVEL SECURITY;

-- Public anon read for kitchen display & menu checking if needed
CREATE POLICY "Allow authenticated and service_role on inventory_items" 
ON public.inventory_items FOR ALL USING (true);

CREATE POLICY "Allow authenticated and service_role on inventory_vendors" 
ON public.inventory_vendors FOR ALL USING (true);

CREATE POLICY "Allow authenticated and service_role on inventory_purchases" 
ON public.inventory_purchases FOR ALL USING (true);

CREATE POLICY "Allow authenticated and service_role on inventory_recipes" 
ON public.inventory_recipes FOR ALL USING (true);

CREATE POLICY "Allow authenticated and service_role on inventory_logs" 
ON public.inventory_logs FOR ALL USING (true);

CREATE POLICY "Allow authenticated and service_role on inventory_reconciliations" 
ON public.inventory_reconciliations FOR ALL USING (true);

-- Indexes for high-speed lookup
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items (category);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_invoice ON public.inventory_purchases (invoice_no);
