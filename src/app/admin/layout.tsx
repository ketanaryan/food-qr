"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Menu as MenuIcon, QrCode, LogOut, ChevronLeft, ChevronRight, 
  Menu, BarChart, CalendarDays, Users, Boxes, UserCheck, ShieldCheck, Lock, 
  KeyRound, Crown, ArrowLeft, AlertCircle 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Owner Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  useEffect(() => {
    // Check if session is already unlocked
    const sessionAuth = typeof window !== "undefined" ? sessionStorage.getItem("wb_owner_authenticated") : null;
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleVerifyPin = (overridePin?: string) => {
    const pinToTest = overridePin ?? pinInput;
    const savedPin = typeof window !== "undefined" ? localStorage.getItem("wb_manager_pin") || "1234" : "1234";

    if (pinToTest === savedPin) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("wb_owner_authenticated", "true");
      }
      setIsAuthenticated(true);
      setPinError("");
      setPinInput("");
    } else {
      setPinError("Incorrect Owner PIN! Access Denied.");
      setPinInput("");
    }
  };

  const handleLockPortal = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wb_owner_authenticated");
    }
    setIsAuthenticated(false);
    setPinInput("");
    setPinError("");
  };

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Sales Report", href: "/admin/sales", icon: BarChart },
    { name: "Guest CRM", href: "/admin/crm", icon: Users },
    { name: "Staff & Attendo", href: "/admin/attendo", icon: UserCheck },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Reservations", href: "/admin/reservations", icon: CalendarDays },
    { name: "Menu Builder", href: "/admin/menu", icon: MenuIcon },
    { name: "Print QRs", href: "/admin/qr", icon: QrCode },
  ];

  // If still hydrating/checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#1E1B16] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // IF NOT AUTHENTICATED: RENDER SEPARATE OWNER SECURITY LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#14120E] text-white flex flex-col justify-center items-center p-4 selection:bg-[#A18D6D] selection:text-white">
        <div className="w-full max-w-sm bg-[#1E1B16] border border-[#3A3328] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header & Badge */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#A18D6D] to-[#6F624E] border border-amber-300/30 flex items-center justify-center text-white shadow-xl">
              <Crown size={32} className="text-amber-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                <Lock size={12} />
                <span>Restricted Owner App</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white mt-2">
                Hotel White Bliss
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Backoffice Executive Management Portal
              </p>
            </div>
          </div>

          {/* PIN Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 text-center">
                Enter 4-Digit Owner Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError("");
                  }}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 bg-[#14120E] border border-[#4D4335] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold mt-2 animate-shake">
                  <AlertCircle size={14} />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            {/* Quick Numpad Preview / Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm tracking-wide uppercase rounded-2xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          {/* Keypad Quick Numbers (for touch devices) */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) {
                    const next = pinInput + String(n);
                    setPinInput(next);
                    if (next.length === 4) handleVerifyPin(next);
                  }
                }}
                className="py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-mono font-bold text-lg rounded-xl transition border border-white/5"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput("")}
              className="py-3 bg-red-950/40 hover:bg-red-900/60 active:scale-95 text-red-300 text-xs font-bold rounded-xl transition border border-red-500/20"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => {
                if (pinInput.length < 6) {
                  const next = pinInput + "0";
                  setPinInput(next);
                  if (next.length === 4) handleVerifyPin(next);
                }
              }}
              className="py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-mono font-bold text-lg rounded-xl transition border border-white/5"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPinInput(pinInput.slice(0, -1))}
              className="py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 text-xs font-bold rounded-xl transition border border-white/5"
            >
              ⌫
            </button>
          </div>

          {/* Footer Back Link */}
          <div className="text-center pt-2 border-t border-white/10">
            <Link 
              href="/staff" 
              className="text-xs text-gray-400 hover:text-amber-300 transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back to Staff Workstations</span>
            </Link>
            <p className="text-[10px] text-gray-500 mt-2 font-mono">
              Default Manager PIN: 1234
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-[#1E1B16] text-white z-50 flex items-center justify-between p-4 print:hidden border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-amber-400" />
          <Link href="/admin/dashboard" className="font-playfair font-bold text-lg tracking-wider text-[#A18D6D]">
            OWNER PORTAL
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLockPortal}
            className="p-1.5 bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg flex items-center gap-1"
            title="Lock Portal"
          >
            <Lock size={14} />
            <span>Lock</span>
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>
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

        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={handleLockPortal}
            className={`
              w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors text-xs font-bold
              ${collapsed ? "justify-center" : ""}
            `}
            title={collapsed ? "Lock Portal" : undefined}
          >
            <Lock size={18} />
            {!collapsed && <span>Lock Portal</span>}
          </button>

          <Link
            href="/staff"
            className={`
              flex items-center gap-4 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium
              ${collapsed ? "justify-center" : ""}
            `}
            title={collapsed ? "Staff Hub" : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Staff Hub</span>}
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
          w-full max-w-full overflow-x-hidden
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
