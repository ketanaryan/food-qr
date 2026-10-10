"use client"

import React, { Suspense } from 'react'
import CheckOut from "@/components/Checkout"
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, LogOut } from 'lucide-react'

function POSCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const table = searchParams.get('table')

  if (!table) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-red-600 mb-4">No table selected</h1>
        <button onClick={() => router.push('/pos')} className="bg-[#A18D6D] text-white px-4 py-2 rounded-full font-bold">
          Go Back to POS
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F8F5F0]">
      {/* Admin overriding banner */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-[#1E1B16] text-white px-4 py-2 flex items-center justify-between text-sm shadow-md">
        <div className="flex items-center gap-2 font-medium tracking-widest text-[#A18D6D]">
          <CheckCircle2 size={16} /> 
          <span>WAITRESS MODE CHECKOUT - TABLE {table}</span>
        </div>
        <button 
          onClick={() => router.push('/pos')}
          className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 px-3 py-1 rounded"
        >
          <LogOut size={14} /> Cancel
        </button>
      </div>

      <div className="pt-10">
        <CheckOut merchantId={table} isPosMode={true} />
      </div>
    </div>
  )
}

export default function POSCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <POSCheckoutContent />
    </Suspense>
  )
}
