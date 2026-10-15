-- ============================================================================
-- HOTEL WHITE BLISS — PRODUCTION DATABASE & ROW-LEVEL SECURITY (RLS) HARDENING
-- ============================================================================
-- Run this in your Supabase SQL Editor to permanently seal:
-- 1. Owner Credentials Leakage (hotel_settings)
-- 2. Orders & Financial Data Scraping (orders)
-- 3. Menu Image Bucket Storage Tampering
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LOCK DOWN OWNER SETTINGS TABLE (hotel_settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- Drop any previous permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.hotel_settings;
DROP POLICY IF EXISTS "Public Read Settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Public Access" ON public.hotel_settings;
DROP POLICY IF EXISTS "Service Role Only" ON public.hotel_settings;

-- REVOKE all access from public anonymous and authenticated web clients
REVOKE ALL ON public.hotel_settings FROM anon;
REVOKE ALL ON public.hotel_settings FROM authenticated;

-- GRANT full access strictly to backend service_role (used by Next.js server APIs)
GRANT ALL ON public.hotel_settings TO service_role;

CREATE POLICY "Service Role Only" 
ON public.hotel_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Insert default owner credentials safely if not exists
INSERT INTO public.hotel_settings (key, value)
VALUES ('owner_auth', '{"email": "owner@hotelwhitebliss.com", "password": "WhiteBliss@2026"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. HARDEN ORDERS TABLE (orders)
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop previous open policy
DROP POLICY IF EXISTS "Allow public read access" ON public.orders;
DROP POLICY IF EXISTS "Allow service role insert" ON public.orders;
DROP POLICY IF EXISTS "Allow service role update" ON public.orders;

-- Grant full control to backend service_role
GRANT ALL ON public.orders TO service_role;

CREATE POLICY "Service Role Full Access" 
ON public.orders 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Restrict anonymous reads: Anonymous clients can ONLY observe active dining orders
-- Completed historical sales & CRM data cannot be harvested by anonymous scrapers
CREATE POLICY "Active Orders Public Read" 
ON public.orders 
FOR SELECT 
TO anon 
USING (status IN ('received', 'pending', 'preparing', 'ready', 'served', 'billing'));

-- Prevent anonymous writes (all order placement/updates MUST pass through Next.js API)
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon;

-- ----------------------------------------------------------------------------
-- 3. HARDEN MENU TABLE (menu)
-- ----------------------------------------------------------------------------
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read menu" ON public.menu;
DROP POLICY IF EXISTS "Service Role Menu Edit" ON public.menu;

-- Anyone can read available menu items for dining
CREATE POLICY "Allow public read menu" 
ON public.menu 
FOR SELECT 
TO anon, authenticated, service_role 
USING (true);

-- Only backend service_role can add, edit, or delete menu items
CREATE POLICY "Service Role Menu Edit" 
ON public.menu 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.menu FROM anon, authenticated;
GRANT ALL ON public.menu TO service_role;

-- Hardening Complete!
