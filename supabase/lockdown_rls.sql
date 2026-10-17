-- ====================================================================
-- HOTEL WHITE BLISS - PRODUCTION SUPABASE ROW-LEVEL SECURITY LOCKDOWN
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/gockswbtqqltmnazsyae/sql
-- ====================================================================

-- 1. LOCK DOWN hotel_settings (Contains Owner Auth & Day Close Reports)
-- Enforce RLS so anonymous web clients CANNOT read owner credentials or financial Z-reports
ALTER TABLE IF EXISTS hotel_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read hotel_settings" ON hotel_settings;
DROP POLICY IF EXISTS "Deny public access on hotel_settings" ON hotel_settings;
DROP POLICY IF EXISTS "Service role full access on hotel_settings" ON hotel_settings;

-- Allow access exclusively to the backend service_role key (bypasses RLS)
CREATE POLICY "Deny public access on hotel_settings"
ON hotel_settings FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. LOCK DOWN orders TABLE (Prevent client-side order tampering)
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;

-- Allow reading active orders for live floor display (KDS, POS, Waiter)
DROP POLICY IF EXISTS "Allow public read orders" ON orders;
CREATE POLICY "Allow public read orders"
ON orders FOR SELECT
TO anon, authenticated
USING (true);

-- Allow inserting orders (Guest QR dining orders and Captain KOT orders)
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
CREATE POLICY "Allow public insert orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Disallow anonymous clients from executing direct UPDATE queries
DROP POLICY IF EXISTS "Deny direct anon updates on orders" ON orders;
CREATE POLICY "Deny direct anon updates on orders"
ON orders FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Disallow anonymous clients from deleting orders
DROP POLICY IF EXISTS "Deny direct anon deletes on orders" ON orders;
CREATE POLICY "Deny direct anon deletes on orders"
ON orders FOR DELETE
TO anon
USING (false);

-- 3. LOCK DOWN menu TABLE (Prevent menu tampering)
ALTER TABLE IF EXISTS menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read menu" ON menu;
CREATE POLICY "Allow public read menu"
ON menu FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Deny anon mutations on menu" ON menu;
CREATE POLICY "Deny anon mutations on menu"
ON menu FOR INSERT
TO anon
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anon updates on menu" ON menu;
CREATE POLICY "Deny anon updates on menu"
ON menu FOR UPDATE
TO anon
USING (false);

DROP POLICY IF EXISTS "Deny anon deletes on menu" ON menu;
CREATE POLICY "Deny anon deletes on menu"
ON menu FOR DELETE
TO anon
USING (false);
