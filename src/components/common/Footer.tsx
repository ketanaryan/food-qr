"use client"
import Link from "next/link"
import React from "react"
import { usePathname } from "next/navigation"
import { Icon } from "@iconify/react"
import Tooltip from "./Tooltip"

function Footer() {
    const pathname = usePathname()
    const isCustomerTable = pathname?.startsWith('/table')

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id)
        el?.scrollIntoView({ behavior: "smooth" })
    }
    return (
        <footer className="bg-[#F8F5F0] border-t border-[#e8e1d6]">
            <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">

                {/* Brand */}
                <div className="flex flex-col gap-4">
                    <Link href="/" className="font-playfair text-2xl font-bold tracking-tight text-[#1E1B16]">
                        Hotel <span className="text-[#A18D6D]">White Bliss</span>
                    </Link>

                    <p className="text-[#5e5240] text-sm leading-relaxed">
                        Smart QR menus for modern restaurants. Update menus instantly,
                        reduce costs, and give customers a seamless dining experience.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                        <Tooltip content="GitHub">
                            <a href="https://github.com/ketanaryan" className="text-[#5e5240] hover:text-[#A18D6D] transition">
                                <Icon icon="ri:github-line" width="22" />
                            </a>
                        </Tooltip>
                    </div>
                    <a href="mailto:iamketan3@gmail.com" className="italic from-accent-foreground">iamketan3@gmail.com</a>
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-sm font-semibold text-[#3f3629] uppercase tracking-wider mb-4">
                        Quick Links
                    </h3>
                    <ul className="space-y-2 text-sm text-[#5e5240]">
                        <li className="hover:text-[#A18D6D] cursor-pointer">Menu</li>
                        <li className="hover:text-[#A18D6D] cursor-pointer">Reservations</li>
                        <li className="hover:text-[#A18D6D] cursor-pointer">About Us</li>
                        <li className="hover:text-[#A18D6D] cursor-pointer">Contact</li>
                    </ul>
                </div>

                {/* Info */}
                <div>
                    <h3 className="text-sm font-semibold text-[#3f3629] uppercase tracking-wider mb-4">
                        Visit Us
                    </h3>
                    <ul className="space-y-2 text-sm text-[#5e5240]">
                        <li className="font-semibold text-stone-900">Hotel White Bliss</li>
                        <li>Sula Vineyard Road, opp. Podar International School</li>
                        <li>off Gangapur Road, Govardhan</li>
                        <li>Nashik, Maharashtra 422012</li>
                        <li className="pt-1.5 font-bold text-stone-800">📞 +91 7499934257</li>
                        <li className="font-medium text-stone-600">Open: 11:00 AM - 11:00 PM</li>
                    </ul>
                </div>

                {/* Staff or Dining Experience */}
                <div>
                    {isCustomerTable ? (
                        <>
                            <h3 className="text-sm font-semibold text-[#3f3629] uppercase tracking-wider mb-4">
                                Guest Amenities
                            </h3>
                            <ul className="space-y-2 text-sm text-[#5e5240]">
                                <li className="flex items-center gap-1.5 font-medium"><span>⚡</span> Fast Table-Side Service</li>
                                <li className="flex items-center gap-1.5 font-medium"><span>📱</span> 1-Tap UPI Digital Billing</li>
                                <li className="flex items-center gap-1.5 font-medium"><span>🥗</span> Pure Veg Multicuisine Kitchen & Banquets</li>
                                <li className="flex items-center gap-1.5 font-medium"><span>📶</span> High-Speed Guest Wi-Fi</li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-[#3f3629] uppercase tracking-wider mb-4">
                                Staff Only
                            </h3>
                            <ul className="space-y-2 text-sm text-[#5e5240]">
                                <a href="/staff" className="block hover:text-[#A18D6D] cursor-pointer font-bold text-[#1E1B16]">Staff Hub / Launchpad</a>
                                <a href="/pos" className="block hover:text-[#A18D6D] cursor-pointer font-semibold opacity-70 hover:opacity-100">POS Billing Desk</a>
                                <a href="/captain" className="block hover:text-[#A18D6D] cursor-pointer font-semibold opacity-50 hover:opacity-100">Captain Portal</a>
                                <a href="/kitchen" className="block hover:text-[#A18D6D] cursor-pointer font-semibold opacity-50 hover:opacity-100">Kitchen Display (KDS)</a>
                                <a href="/admin/dashboard" className="block hover:text-[#A18D6D] cursor-pointer font-semibold opacity-50 hover:opacity-100">Admin Portal</a>
                            </ul>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#e8e1d6] py-4 px-6 flex justify-between items-center text-xs text-[#7a6f5b]">
                <span>© {new Date().getFullYear()} Hotel White Bliss. All rights reserved.</span>
            </div>
        </footer>
    )
}

export default Footer
