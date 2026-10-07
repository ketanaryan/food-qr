import React from 'react'
import MenuInterface from "@/components/MenuInterface"
import { verifyTableToken } from '@/lib/security';

async function page({params, searchParams}: {params: Promise<{id: string}>, searchParams: Promise<{token?: string}>}) {
    const param = await params;
    const id = param.id;
    const search = await searchParams;
    
    if (!verifyTableToken(id, search.token || null)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-4">
          <div className="p-6 bg-white rounded-xl shadow-md text-center max-w-sm">
            <h1 className="text-xl font-bold text-red-600 mb-2">Invalid Table QR Code</h1>
            <p className="text-gray-500 text-sm">This QR code is invalid or expired. Please ask the staff for a new code.</p>
          </div>
        </div>
      )
    }

  return (
    <MenuInterface merchantId={id} token={search.token} />
  )
}

export default page