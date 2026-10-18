"use client"

import React from "react"
import Link from "next/link"
import { 
  Receipt, ChefHat, Utensils, ShieldCheck, 
  ArrowRight, Smartphone, Monitor, Download, 
  HelpCircle, Sparkles, Building2, Store
} from "lucide-react"

export default function StaffHubPage() {
  const stations = [
    {
      title: "POS & Billing Desk",
      href: "/pos",
      badge: "Counter & Billing",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/60",
      icon: Monitor,
      iconBg: "bg-blue-600 text-white",
      description: "Fast touchscreen order punching, 80mm KOT & bill printing, UPI QR & split bill settlements.",
      target: "Cashier / Counter Staff",
      shortcut: "food-qr-gilt.vercel.app/pos"
    },
    {
      title: "Captain / Waiter App",
      href: "/captain",
      badge: "Floor Ordering",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200/60",
      icon: Smartphone,
      iconBg: "bg-[#A18D6D] text-white",
      description: "Mobile handheld table ordering for stewards. Instantly send dishes to kitchen from table side.",
      target: "Waiters & Floor Captains",
      shortcut: "food-qr-gilt.vercel.app/captain"
    },
    {
      title: "Kitchen Display (KDS)",
      href: "/kitchen",
      badge: "Kitchen Crew",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
      icon: Utensils,
      iconBg: "bg-emerald-600 text-white",
      description: "Live kitchen ticket queue with auto audio bell (Ding 🔔). Chef taps to mark dishes ready.",
      target: "Head Chef & Kitchen Staff",
      shortcut: "food-qr-gilt.vercel.app/kitchen"
    },
    {
      title: "Owner Admin Portal",
      href: "/admin/dashboard",
      badge: "Back Office",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200/60",
      icon: ShieldCheck,
      iconBg: "bg-zinc-900 text-white",
      description: "Live revenue dashboards, daily staff attendance register, inventory, table QR printer & menu pricing.",
      target: "Restaurant Owner & Manager",
      shortcut: "food-qr-gilt.vercel.app/admin/dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E1B16] flex flex-col justify-between selection:bg-[#A18D6D] selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-[#e8dfd3] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-playfair font-bold text-lg sm:text-xl text-[#1E1B16]">
              Hotel <span className="text-[#A18D6D]">White Bliss</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#F5EFE6] text-[#6F624E] border border-[#e8dfd3]">
              Staff Hub
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-[#6F624E] hover:text-[#1E1B16] transition"
          >
            ← View Guest Website
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE6] text-[#6F624E] text-xs font-bold tracking-wide uppercase mb-3 border border-[#e8dfd3]">
            <Store size={13} className="text-[#A18D6D]" />
            Restaurant Station Switchboard
          </div>
          <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1B16] mb-3">
            Select Your Workstation
          </h1>
          <p className="text-sm sm:text-base text-[#6F624E] font-light leading-relaxed">
            One-tap direct access to your department. No need to scroll through the guest website.
          </p>
        </div>

        {/* 4 Station Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-12">
          {stations.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group bg-white rounded-2xl p-6 sm:p-7 border border-[#e8dfd3] shadow-xs hover:shadow-xl hover:border-[#A18D6D] transition-all duration-300 flex flex-col justify-between active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs transition group-hover:scale-110 ${s.iconBg}`}>
                      <Icon size={24} />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>

                  <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1E1B16] mb-1.5 group-hover:text-[#A18D6D] transition-colors">
                    {s.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6F624E] leading-relaxed mb-4 font-light">
                    {s.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-zinc-400 font-medium">
                    For: <strong className="text-zinc-700">{s.target}</strong>
                  </div>
                  <span className="font-bold text-[#A18D6D] group-hover:text-[#1E1B16] flex items-center gap-1 group-hover:translate-x-1 transition-all">
                    Launch Station <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pro Setup Guide: How to Add App Icon to Home Screen */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8dfd3] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-playfair font-bold text-base sm:text-lg text-[#1E1B16]">
                  Pro Tip: Install as App on Tablet & Phone (Zero Browser Friction)
                </h3>
                <p className="text-xs text-[#6F624E]">
                  Create direct 1-tap app icons on your Tablet or Mobile desktop like a native app.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6F624E]">
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#ede3d5]">
              <div className="font-bold text-[#1E1B16] mb-1">1. Cashier Tablet</div>
              <p className="leading-relaxed">
                Open <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">/pos</code> in Chrome ➡️ Tap 3 dots (⋮) ➡️ Tap <strong>&quot;Add to Home screen&quot;</strong>. A <strong>&quot;Bliss POS&quot;</strong> app icon will appear on desktop!
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#ede3d5]">
              <div className="font-bold text-[#1E1B16] mb-1">2. Captains / Waiters</div>
              <p className="leading-relaxed">
                Open <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">/captain</code> on phone ➡️ Tap <strong>&quot;Add to Home screen&quot;</strong>. Waiters can take orders directly without typing any URL.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#ede3d5]">
              <div className="font-bold text-[#1E1B16] mb-1">3. Kitchen Tablet</div>
              <p className="leading-relaxed">
                Open <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">/kitchen</code> on chef screen ➡️ Add to Home screen. Chef gets live orders with sound bell alert.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8dfd3] bg-white py-6 text-center text-xs text-[#6F624E]">
        <p>© {new Date().getFullYear()} Hotel White Bliss • Restaurant Management System</p>
      </footer>

    </div>
  )
}
