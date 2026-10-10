"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function NavBar() {
  const [open, setOpen] = useState(false)

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

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/#reservation" className="border border-[#A18D6D] text-[#A18D6D] px-6 py-2 text-xs font-semibold hover:bg-[#A18D6D] hover:text-white transition-colors tracking-widest uppercase">
              Book A Table
            </Link>
          </div>

          <div className="flex items-center gap-4 lg:hidden">
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
        <nav className="flex flex-col px-4 py-6 gap-6 bg-white">
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
          <Link 
            href="/#reservation" 
            onClick={() => setOpen(false)}
            className="border border-[#A18D6D] text-[#A18D6D] px-6 py-3 text-center text-sm font-semibold hover:bg-[#A18D6D] hover:text-white transition-colors tracking-widest uppercase mt-4"
          >
            Book A Table
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default NavBar
