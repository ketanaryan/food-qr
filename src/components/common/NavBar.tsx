"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function NavBar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isCustomerTable = pathname?.startsWith('/table')
  const tableIdMatch = pathname?.match(/\/table\/([^/?#]+)/)?.[1]

  const links = [
    { name: "HOME", href: "/" },
    { name: "ABOUT US", href: "/#about" },
    { name: "OUR MENU", href: "/menu" },
    { name: "CONTACT US", href: "/#contact" }
  ]

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#e8e1d6] bg-white print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">

          <Link href="/" className="text-2xl font-playfair font-bold tracking-tight text-[#1E1B16]">
            Hotel <span className="text-[#A18D6D]">White Bliss</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {links.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-semibold text-[#6F624E] hover:text-[#A18D6D] transition-colors tracking-widest"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {isCustomerTable ? (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#e8dfd3] text-xs font-bold text-[#6F624E]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Table #{tableIdMatch} • Seated Guest</span>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-3">
              <Link 
                href="/staff" 
                className="text-xs font-bold text-[#1E1B16] hover:text-[#A18D6D] px-4 py-2 rounded-lg border border-[#e8dfd3] bg-[#FAF7F2] hover:bg-[#F2ECE1] transition tracking-wider uppercase flex items-center gap-1.5"
              >
                <span>Staff Login</span>
              </Link>
              <Link href="/#reservation" className="border border-[#A18D6D] bg-[#A18D6D] text-white px-6 py-2 text-xs font-semibold hover:bg-black hover:border-black transition-colors tracking-widest uppercase">
                Book A Table
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 lg:hidden">
            {isCustomerTable ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#e8dfd3] text-[#6F624E]">
                Table #{tableIdMatch}
              </span>
            ) : (
              <Link
                href="/staff"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#e8dfd3] text-[#1E1B16] active:scale-95 transition"
              >
                Staff
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          open ? "max-h-96 border-t border-[#e8e1d6]" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-6 gap-5 bg-white">
          {links.map(link => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold tracking-widest text-[#6F624E] hover:text-[#A18D6D]"
            >
              {link.name}
            </Link>
          ))}
          {!isCustomerTable && (
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/staff"
                onClick={() => setOpen(false)}
                className="bg-[#1E1B16] text-[#F8F5F0] px-6 py-3 text-center text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-black transition"
              >
                Staff Portal / POS Desk
              </Link>
              <Link 
                href="/#reservation" 
                onClick={() => setOpen(false)}
                className="border border-[#A18D6D] text-[#A18D6D] px-6 py-3 text-center text-xs font-semibold hover:bg-[#A18D6D] hover:text-white transition-colors tracking-widest uppercase rounded-lg"
              >
                Book A Table
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default NavBar
