"use client"

import React from "react"
import MenuItem from "./MenuItem"
import { IMenu } from "@/types/menu"

function MenuSection({section,items}:{ section: string, items: IMenu[]}) {
  return (
    <section className="w-full py-8 md:py-12 border-b border-[#e8e1d6] last:border-none">
      
      <div className="mb-8 px-3 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[#1E1B16] tracking-wide">
          {section}
        </h2>
        <div className="mt-3 w-12 h-[2px] bg-[#A18D6D]"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-3 pb-2">
        {Array.isArray(items) && items?.map((item, idx) => (
          <div key={idx} className="w-full">
            <MenuItem item={item} />
          </div>
        ))}
      </div>

    </section>
  )
}

export default MenuSection
