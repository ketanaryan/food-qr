"use client"

import React from "react"
import Image from "next/image"
import NavBar from "../common/NavBar"
import Footer from "../common/Footer"
import { ReactLenis } from "lenis/react"
import MenuSection from "./MenuSection"
import ItemNotch from "./ItemNotch"
import Link from "next/link"
import toast from "react-hot-toast"
import { Bell, ScrollText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { IMenu } from "@/types/menu"

function MerchantPage({ merchantId, token }: { merchantId: string, token?: string }) {
  const [menu, setMenu] = React.useState<IMenu[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase.from('menu').select('*').eq('is_available', true);
      if (data) {
        // Map database fields to IMenu interface if needed, or just use it directly
        // IMenu has { id, name, description, price, originalPrice, image, section, isVeg }
        const formattedMenu: IMenu[] = data.map(item => ({
          _id: item.id,
          merchantId: merchantId,
          title: item.name,
          description: item.description || '', // might be used by UI despite interface missing it
          price: item.price,
          quantity: 0,
          originalPrice: item.original_price,
          image: item.image_url || '/menu/default-food.jpg',
          section: item.section,
          createdAt: new Date(),
          updatedAt: new Date()
        } as unknown as IMenu));
        setMenu(formattedMenu);
      }
      setLoading(false);
    };
    fetchMenu();
  }, []);

  const handleCallWaiter = async () => {
    toast.success("Waiter has been notified! They will be at your table shortly.");
    const channel = supabase.channel('cashier-alerts');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'waiter_called',
          payload: { table: merchantId },
        });
      }
    });
    // Remove the channel after sending so we don't leak memory
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 2000);
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


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A18D6D]"></div>
        <p className="mt-4 text-[#A18D6D] font-bold">Loading Menu...</p>
      </div>
    );
  }

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
