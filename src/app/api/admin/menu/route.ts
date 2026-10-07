import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, data } = body;

    // VERY BASIC security check (In production, use JWT or sessions)
    const basicAuth = req.headers.get('authorization');
    if (!basicAuth || !basicAuth.includes('YWRtaW46YXJ5YW4xMjM=')) { // base64 for admin:aryan123
      return NextResponse.json({ success: false }, { status: 401 });
    }

    if (action === 'insert') {
      const { error } = await supabaseAdmin.from('menu').insert([data]);
      if (error) throw error;
    } else if (action === 'update') {
      const { error } = await supabaseAdmin.from('menu').update(data).eq('id', id);
      if (error) throw error;
    } else if (action === 'delete') {
      const { error } = await supabaseAdmin.from('menu').delete().eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
