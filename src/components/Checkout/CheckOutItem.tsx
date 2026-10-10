"use client"

import { CartItem, useCartStore } from "@/lib/store"
import Image from "next/image"
import React from "react"
import { Trash2 } from "lucide-react"

function CheckOutItem({ item }: { item: CartItem }) {
  const removeItem = useCartStore(s => s.removeItem)
  const incrementItem = useCartStore(s => s.incrementItem)
  const decrementItem = useCartStore(s => s.decrementItem)
  const qty = item.itemCount

  const handleUpdate = (newQty: number) => {
    if (newQty < 1) {
      removeItem(String(item._id))
      return
    }

    if (newQty > qty) {
      incrementItem(String(item._id))
    } else {
      decrementItem(String(item._id))
    }
  }

  return (
    <div className="flex w-full gap-4 rounded-2xl bg-white p-3 shadow-sm hover:shadow-md transition">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <Image
          alt={item.title}
          fill
          src={item.image}
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              1 pc • {item.quantity} g
            </p>
          </div>
          <button 
            onClick={() => removeItem(String(item._id))}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
            title="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-gray-900">
            ₹{item.price * qty}
          </span>

          {/* Quantity Control */}
          <div className="flex items-center gap-3 rounded-lg border border-green-600 px-2 py-1 text-green-600">
            <button
              onClick={() => handleUpdate(qty - 1)}
              className="text-sm font-bold"
            >
              −
            </button>

            <span className="text-xs font-semibold">{qty}</span>

            <button
              onClick={() => handleUpdate(qty + 1)}
              className="text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckOutItem
