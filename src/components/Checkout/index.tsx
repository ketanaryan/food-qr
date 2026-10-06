"use client"

import React, { useState } from "react"
import CheckOutItem from "./CheckOutItem"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

function CheckoutPage({ merchantId }: { merchantId: string }) {
  const checkout = useCartStore(state => state.items)
  const clearCheckout = useCartStore(state => state.clearCart)
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [idempotencyKey] = useState(uuidv4()); 

  const handlePay = async () => {
    if (isSubmitting) return;
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

      toast.success("Order placed successfully!");
      clearCheckout();
      router.push(`/table/${merchantId}/orders`); // Go to new tracking page
    } catch (e) {
      toast.error("Network error");
      setIsSubmitting(false);
    }
  }

  if (checkout.length === 0) {
    return (
      <div className="px-6 pt-20 text-center text-gray-500">
        Your cart is empty
      </div>
    )
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
    <div className="relative min-h-screen bg-gray-50 px-6 pt-20">

      <h1 className="mb-4 font-mono text-2xl text-zinc-950">
        Checkout
      </h1>

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

        <button disabled={isSubmitting} onClick={handlePay} className="w-full cursor-pointer rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50">
          {isSubmitting ? "Processing..." : `Place Order • ₹${discountedTotal}`}
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage
