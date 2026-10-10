"use client"

import React, { useState } from "react"
import MenuInterface from "@/components/MenuInterface"
import { Users, LogOut, CheckCircle2 } from "lucide-react"
import { useCartStore } from "@/lib/store"

export default function POSPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const clearCart = useCartStore((state) => state.clearCart)
  
  if (!selectedTable) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-[#e8e1d6]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-playfair font-bold text-[#1E1B16] mb-2">Staff POS</h1>
            <p className="text-sm text-[#6F624E]">Select a table to punch in an order for walk-in customers.</p>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {Array.from({length: 20}, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => {
                  clearCart();
                  setSelectedTable(String(num));
                }}
                className="h-16 rounded-xl border-2 border-[#e8e1d6] flex flex-col items-center justify-center hover:border-[#A18D6D] hover:bg-[#F8F5F0] hover:text-[#1E1B16] transition-colors text-[#6F624E] font-bold text-lg"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Admin overriding banner */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-[#1E1B16] text-white px-4 py-2 flex items-center justify-between text-sm shadow-md">
        <div className="flex items-center gap-2 font-medium tracking-widest text-[#A18D6D]">
          <CheckCircle2 size={16} /> 
          <span>WAITRESS MODE - TABLE {selectedTable}</span>
        </div>
        <button 
          onClick={() => {
            clearCart();
            setSelectedTable(null);
          }}
          className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 px-3 py-1 rounded"
        >
          <LogOut size={14} /> Exit POS
        </button>
      </div>

      <div className="pt-10">
        <MenuInterface merchantId={selectedTable} isPosMode={true} />
      </div>
    </div>
  )
}
