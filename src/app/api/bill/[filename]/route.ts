import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  if (!filename) {
    return new NextResponse('File not found', { status: 404 });
  }

  // Generate the public URL from Supabase
  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(`bills/${filename}`);

  // Redirect the user directly to the PDF URL
  return NextResponse.redirect(publicUrl);
}
