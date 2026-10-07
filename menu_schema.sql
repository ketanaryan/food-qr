-- 1. Create the Menu Table
CREATE TABLE IF NOT EXISTS public.menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image_url TEXT,
  section TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable RLS for MVP
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;

-- 3. Create Storage Bucket for Menu Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up Storage Policies (Allow public uploads for admin MVP)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images');

-- 5. Insert some sample data for the demo
INSERT INTO public.menu (name, description, price, original_price, section, is_available) VALUES 
('Classic Paneer Tikka', 'Tandoori marinated paneer with mint chutney', 250, 280, 'Starters', true),
('Crispy Corn', 'Fried sweet corn tossed in spicy peri peri', 180, 200, 'Starters', true),
('Butter Chicken', 'Rich & creamy tomato gravy with tender chicken', 350, 400, 'Main Course', true),
('Garlic Naan', 'Soft Indian bread with burnt garlic and butter', 60, null, 'Main Course', true),
('Oreo Shake', 'Thick chocolate milkshake with crushed oreos', 150, 180, 'Beverages', true);
