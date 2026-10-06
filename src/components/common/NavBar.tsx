"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function NavBar() {
  const [open, setOpen] = useState(false)

  const links = [
    { name: "Home", href: "/" },
    { name: "Kitchen", href: "/kitchen" },
    { name: "Cashier", href: "/cashier" }
  ]

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#A18D6D]">Aryan</span> Food App
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          open ? "max-h-60 border-t" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-4 gap-3 bg-white">
          {links.map(link => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default NavBar
