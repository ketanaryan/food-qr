"use client"

import React from "react"
import MenuItem from "./MenuItem"
import { IMenu } from "@/types/menu"

function MenuSection({section,items}:{ section: string, items: IMenu[]}) {
  return (
    <section className="w-full py-4">
      
      <h2 className="mb-3 px-3 text-base font-semibold text-gray-900">
        {section}
      </h2>

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
