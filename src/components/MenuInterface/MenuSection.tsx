"use client"

import React from "react"
import MenuItem from "./MenuItem"
import { IMenu } from "@/types/menu"

function MenuSection({section,items}:{ section: string, items: IMenu[]}) {
  const sectionId = `sec-${section.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

  return (
    <section id={sectionId} className="w-full py-8 md:py-12 border-b border-[#e8e1d6] last:border-none scroll-mt-36">
      
      <div className="mb-8 px-3 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-4xl font-playfair font-bold text-[#1E1B16] tracking-wide text-center">
            {section}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A18D6D]/15 text-[#8b795d]">
            {items.length}
          </span>
        </div>
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
