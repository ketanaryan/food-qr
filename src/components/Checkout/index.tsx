"use client"

import React, { useState } from "react"
import CheckOutItem from "./CheckOutItem"
import toast from "react-hot-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useCartStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

function CheckoutPage({ merchantId, isPosMode = false }: { merchantId: string, isPosMode?: boolean }) {
  const checkout = useCartStore(state => state.items)
  const clearCheckout = useCartStore(state => state.clearCart)
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaced, setIsPlaced] = useState(false);
  const [notes, setNotes] = useState("");
  const [idempotencyKey] = useState(uuidv4()); 

  const handlePay = async () => {
    if (isSubmitting || isPlaced) return;
    setIsSubmitting(true);

    const items = checkout.map(c => ({
        id: c._id,
        qty: c.itemCount,
    }))
    
    if (notes.trim()) {
      items.push({ id: "NOTE", qty: 1, name: `📝 Note: ${notes}` } as any)
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey 
        },
        body: JSON.stringify({ table_number: merchantId, items }),
      });
      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.message || "Failed to place order");
        setIsSubmitting(false);
        return;
      }

      // Show beautiful order confirmation screen first
      setIsPlaced(true);
      toast.success("Order placed successfully!", { icon: "🎉" });
      clearCheckout();
      
      setTimeout(() => {
        if (isPosMode) {
          router.push('/pos');
        } else {
          router.push(`/table/${merchantId}/orders?token=${token || ''}`);
        }
      }, 1400);
    } catch {
      toast.error("Network error");
      setIsSubmitting(false);
    }
  }

  // 1. Order Successfully Placed Celebration State
  if (isPlaced) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-sm animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold font-playfair text-[#1E1B16] mb-1">
          Order Sent to Kitchen!
        </h1>
        <p className="text-sm text-[#6F624E] mb-6 font-medium">
          Table #{merchantId} • Preparing your fresh delicacies
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-zinc-500 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Opening Live Order Tracking...</span>
        </div>
      </div>
    );
  }

  // 2. Empty Cart State
  if (checkout.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#F5EFE6] border border-[#e8dfd3] flex items-center justify-center text-[#A18D6D] mb-5 shadow-2xs">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold font-playfair text-[#1E1B16] mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-sm text-[#6F624E] max-w-xs mb-8 leading-relaxed font-light">
          Looks like you haven&apos;t added any delicacies yet. Explore our freshly prepared menu!
        </p>
        <button
          onClick={() => {
            if (isPosMode) {
              router.push('/pos')
            } else {
              router.push(`/table/${merchantId}?token=${token || ''}`)
            }
          }}
          className="rounded-full bg-[#1E1B16] text-[#F8F5F0] px-8 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors shadow-md active:scale-95"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const originalTotal = checkout.reduce(
    (sum, item) =>
      sum +
      (item.originalPrice ?? item.price) * item.itemCount,
    0
  )

  const discountedTotal = checkout.reduce(
    (sum, item) => sum + item.price * item.itemCount,
    0
  )

  const savings = originalTotal - discountedTotal

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] px-4 sm:px-6 pt-16 pb-36">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-playfair font-bold text-2xl text-[#1E1B16]">
            Review Order
          </h1>
          <p className="text-xs text-[#6F624E]">Table #{merchantId}</p>
        </div>
        <button 
          onClick={() => {
            if (isPosMode) {
              router.push('/pos')
            } else {
              router.push(`/table/${merchantId}?token=${token || ''}`)
            }
          }}
          className="text-xs font-bold tracking-wider uppercase text-[#A18D6D] hover:text-[#1E1B16] py-1.5 px-3 rounded-full border border-[#A18D6D]/40 transition"
        >
          + Add More
        </button>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {checkout.map((item) => (
          <CheckOutItem key={String(item._id)} item={item} />
        ))}
      </div>
      
      {/* Notes */}
      <div className="mt-6 mb-32">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cooking Instructions (Optional)</label>
        <textarea 
          placeholder="e.g. Make it extra spicy, no onions..."
          className="w-full rounded-xl border border-gray-200 p-4 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white px-6 py-4 shadow-lg">

        <div className="mb-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Item total</span>
            <span className="line-through">₹{originalTotal}</span>
          </div>

          <div className="flex justify-between font-medium text-green-600">
            <span>Just for you</span>
            <span>₹{discountedTotal}</span>
          </div>

          {savings > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>You saved</span>
              <span>₹{savings}</span>
            </div>
          )}
        </div>

        <button disabled={isSubmitting} onClick={handlePay} className="w-full cursor-pointer rounded-xl bg-gray-900 py-4 text-base font-bold text-white hover:bg-gray-800 transition shadow-lg active:scale-95 disabled:opacity-50">
          {isSubmitting ? "Sending to Kitchen..." : `Place Order • ₹${discountedTotal}`}
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage
