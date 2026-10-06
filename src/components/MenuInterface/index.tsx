"use client"

import React from "react"
import Image from "next/image"
import NavBar from "../common/NavBar"
import Footer from "../common/Footer"
import { ReactLenis } from "lenis/react"
import MenuSection from "./MenuSection"
import ItemNotch from "./ItemNotch"
import { getApi } from "@/utils/common"
import { IMenu } from "@/types/menu"
import { MENU_DATA } from "@/data/menu"
import Link from "next/link"
import toast from "react-hot-toast"
import { Bell, ScrollText } from "lucide-react"

function MerchantPage({ merchantId }: { merchantId: string }) {
  const menu: IMenu[] = MENU_DATA;

  const handleCallWaiter = () => {
    toast.success("Waiter has been notified! They will be at your table shortly.");
    // In a real app, this would ping Supabase Realtime to alert the kitchen/waiter dashboard
  }

  const menuItem = React.useMemo(() => {
    const map = new Map<string, IMenu[]>()

    for (const item of menu) {
      if (!map.has(item.section)) {
        map.set(item.section, [])
      }
      map.get(item.section)!.push(item)
    }

    return map
  }, [menu])

  // Removed syncCartToCheckOut API call to keep cart local
  React.useEffect(() => {
    // local cart init if needed
  },[])


  return (
    <>
      <ReactLenis root>
        <div className="min-h-screen bg-[#F8F5F0]">
          <NavBar />

          {/* HERO */}
          <div className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Image
                src="https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768652991/2148200773_slxpzw.jpg"
                alt="Hero background"
                fill
                priority
                className="object-cover scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/80" />
            </div>

            {/* Quick Actions */}
            <div className="absolute top-24 left-6 right-6 z-20 flex justify-between">
              <button 
                onClick={handleCallWaiter}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition"
              >
                <Bell size={16} /> Waiter
              </button>
              
              <Link 
                href={`/table/${merchantId}/orders`}
                className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-gray-100 transition"
              >
                <ScrollText size={16} /> Orders
              </Link>
            </div>

            <div className="relative z-10 text-center px-6 max-w-3xl">
              <p className="mb-4 inline-block rounded-full bg-white/10 px-5 py-2 text-sm tracking-wide text-white backdrop-blur-md">
                Curated • Fresh • Crafted
              </p>

              <h1 className="text-4xl md:text-6xl font-playfair font-bold text-white">
                Explore Our Menus
              </h1>

              <p className="mt-3 text-lg text-white/80">
                Discover handcrafted dishes made with premium ingredients and bold flavors.
              </p>
            </div>
          </div>

          {/* MENU */}
          <div className="relative -top-12 rounded-t-4xl bg-[#F8F5F0] p-8">
            <h1 className="mb-6 text-center text-3xl md:text-6xl font-serif font-bold text-slate-950">
              What's your Mood
            </h1>

            {Array.from(menuItem.entries()).map(([section, items]) => (
              <MenuSection
                key={section}
                section={section}
                items={items}
              />
            ))}
          </div>

          <Footer />
        </div>
      </ReactLenis>

      <ItemNotch />
    </>
  )
}

export default MerchantPage
