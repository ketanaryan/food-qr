-- Run this when you are ready to secure your database for production
-- IMPORTANT: Once you run this, your Next.js API routes MUST use the SUPABASE_SERVICE_ROLE_KEY 
-- to insert or update orders, otherwise they will be blocked.

-- 1. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone (anon) to read orders 
-- (Necessary for the Kitchen Dashboard and Customer tracking to work in realtime)
CREATE POLICY "Allow public read access" 
ON public.orders 
FOR SELECT 
USING (true);

-- 3. Allow only the backend (Service Role) to insert or update orders
CREATE POLICY "Allow service role insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update" 
ON public.orders 
FOR UPDATE 
USING (auth.role() = 'service_role');
