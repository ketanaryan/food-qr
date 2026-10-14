-- Run this in your Supabase SQL Editor to enable self-service Owner credentials update
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow backend and owner portal to read and update settings
ALTER TABLE public.hotel_settings DISABLE ROW LEVEL SECURITY;

-- Insert initial default owner credentials
INSERT INTO public.hotel_settings (key, value)
VALUES ('owner_auth', '{"email": "owner@hotelwhitebliss.com", "password": "WhiteBliss@2026"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
