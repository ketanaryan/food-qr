import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return NextResponse.json({ success: false, message: 'Missing file or filename' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload using service role key (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('menu-images')
      .upload(`bills/${fileName}`, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('menu-images')
      .getPublicUrl(`bills/${fileName}`);

    return NextResponse.json({ success: true, publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
