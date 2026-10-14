import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  const cleanFilename = String(filename || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 100);
  if (!cleanFilename || cleanFilename.includes('..')) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  // Generate the public URL from Supabase
  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(`bills/${cleanFilename}`);

  // Redirect the user directly to the PDF URL
  return NextResponse.redirect(publicUrl);
}
