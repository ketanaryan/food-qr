import { NextResponse } from 'next/server';
import { DEFAULT_MENU_ITEMS } from '@/lib/defaultMenu';
import { runWithFastTimeout } from '@/lib/supabaseBreaker';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const menu = await runWithFastTimeout(
    async () => {
      const { data, error } = await supabaseAdmin.from('menu').select('*').eq('is_available', true);
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
      return DEFAULT_MENU_ITEMS;
    },
    () => DEFAULT_MENU_ITEMS,
    600
  );

  return NextResponse.json(
    { success: true, count: menu.length, menu },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
