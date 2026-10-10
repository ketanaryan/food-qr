"use client"

import { useCartStore } from "@/lib/store"
import { IMenu } from "@/types/menu"
import Image from "next/image"
import React from "react"

function MenuItem({ item }: { item: IMenu }) {
  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const incrementItem = useCartStore((state) => state.incrementItem)
  const decrementItem = useCartStore((state) => state.decrementItem)

  const checkoutItem = cartItems.find(_i => _i._id === item._id)
  const qty = checkoutItem?.itemCount ?? 0

  const discount =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(
          ((item.originalPrice - item.price) / item.originalPrice) * 100
        )
      : null

  const handleUpdate = (newQty: number) => {
    if (qty === 0 && newQty === 1) {
      addItem(item)
    } else if (newQty > qty) {
      incrementItem(String(item._id))
    } else {
      decrementItem(String(item._id))
    }
  }

  return (
    <div className="w-full rounded-[24px] bg-white p-3 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-[#e8e1d6] flex flex-col h-full group">
      
      <div className="relative h-40 md:h-48 w-full rounded-xl overflow-hidden">
        <Image
          alt={item.title}
          fill
          crossOrigin="anonymous"
          src={item.image}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {discount && discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-medium tracking-widest text-[#F8F5F0] uppercase">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col flex-grow px-2 pb-2 space-y-2">
        <h3 className="text-lg md:text-xl font-playfair font-bold text-[#1E1B16] leading-tight">
          {item.title}
        </h3>

        {item.description ? (
          <p className="text-sm text-[#6F624E] line-clamp-2 leading-relaxed font-light">
            {item.description}
          </p>
        ) : (
          <p className="text-sm text-[#6F624E] font-light italic opacity-70">
            Fresh & Delicious
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {item.originalPrice && (
              <span className="text-xs line-through text-[#a39784] font-medium">
                ₹{item.originalPrice}
              </span>
            )}
            <span className="text-lg font-semibold text-[#1E1B16]">
              ₹{item.price}
            </span>
          </div>

          {qty === 0 ? (
            <button
              onClick={() => handleUpdate(1)}
              className="rounded-full border border-[#A18D6D] px-6 py-2 text-xs font-bold tracking-widest text-[#A18D6D] hover:bg-[#A18D6D] hover:text-white transition-colors"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-4 rounded-full border border-[#A18D6D] bg-[#F8F5F0] px-3 py-1.5 text-[#1E1B16] shadow-sm">
              <button
                onClick={() => handleUpdate(qty-1)}
                className="text-lg font-medium w-5 h-5 flex items-center justify-center hover:text-[#A18D6D]"
              >
                −
              </button>
              <span className="text-sm font-semibold w-4 text-center">{qty}</span>
              <button
                onClick={() => handleUpdate(qty+1)}
                className="text-lg font-medium w-5 h-5 flex items-center justify-center hover:text-[#A18D6D]"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuItem
