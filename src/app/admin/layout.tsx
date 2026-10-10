"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu as MenuIcon, QrCode, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Menu Builder", href: "/admin/menu", icon: MenuIcon },
    { name: "Print QRs", href: "/admin/qr", icon: QrCode },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-[#1E1B16] text-white z-50 flex items-center justify-between p-4 print:hidden">
        <Link href="/" className="font-playfair font-bold text-xl tracking-widest text-[#A18D6D]">
          ADMIN PORTAL
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#1E1B16] text-white
          ${collapsed ? "w-20" : "w-64"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          print:hidden flex flex-col
        `}
      >
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
          {!collapsed && (
            <Link href="/" className="font-playfair font-bold text-xl tracking-widest text-[#A18D6D]">
              ADMIN
            </Link>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-4 px-3 py-3 rounded-lg transition-colors font-medium
                  ${isActive ? "bg-[#A18D6D] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}
                  ${collapsed ? "justify-center" : ""}
                `}
                title={collapsed ? link.name : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className={`
              flex items-center gap-4 px-3 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors
              ${collapsed ? "justify-center" : ""}
            `}
            title={collapsed ? "Exit to Site" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Exit to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`
          flex-1 transition-all duration-300
          ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
          pt-16 lg:pt-0
          min-h-screen
        `}
      >
        {children}
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
