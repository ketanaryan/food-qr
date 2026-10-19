"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Receipt, ChefHat, Utensils, ShieldCheck, 
  ArrowRight, Smartphone, Monitor, Download, 
  HelpCircle, Sparkles, Building2, Store,
  Lock, KeyRound, AlertCircle, LogOut, CheckCircle2, X
} from "lucide-react";
import toast from "react-hot-toast";

interface Station {
  title: string;
  href: string;
  badge: string;
  badgeColor: string;
  securityNote: string;
  icon: any;
  iconBg: string;
  description: string;
  target: string;
  requiresPin: boolean;
}

export default function StaffHubPage() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUnlocked(sessionStorage.getItem("wb_station_unlocked") === "true");
    }
  }, []);

  const stations: Station[] = [
    {
      title: "POS & Billing Desk",
      href: "/pos",
      badge: "Counter & Billing",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/60",
      securityNote: "🔒 4-Digit Staff PIN",
      icon: Monitor,
      iconBg: "bg-blue-600 text-white",
      description: "Fast touchscreen order punching, 80mm KOT & bill printing, UPI QR & split bill settlements.",
      target: "Cashier / Counter Staff",
      requiresPin: true
    },
    {
      title: "Captain / Waiter App",
      href: "/captain",
      badge: "Floor Ordering",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200/60",
      securityNote: "🔒 4-Digit Staff PIN",
      icon: Smartphone,
      iconBg: "bg-[#A18D6D] text-white",
      description: "Mobile handheld table ordering for stewards. Instantly send dishes to kitchen from table side.",
      target: "Waiters & Floor Captains",
      requiresPin: true
    },
    {
      title: "Kitchen Display (KDS)",
      href: "/kitchen",
      badge: "Kitchen Crew",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
      securityNote: "🔒 4-Digit Staff PIN",
      icon: Utensils,
      iconBg: "bg-emerald-600 text-white",
      description: "Live kitchen ticket queue with auto audio bell (Ding 🔔). Chef taps to mark dishes ready.",
      target: "Head Chef & Kitchen Staff",
      requiresPin: true
    },
    {
      title: "Owner Admin Portal",
      href: "/admin/dashboard",
      badge: "Back Office",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200/60",
      securityNote: "🛡️ Owner Password",
      icon: ShieldCheck,
      iconBg: "bg-zinc-900 text-white",
      description: "Live revenue dashboards, daily staff attendance register, inventory, table QR printer & menu pricing.",
      target: "Restaurant Owner & Manager",
      requiresPin: false
    }
  ];

  const handleLaunchStation = (s: Station) => {
    // Owner portal always redirects to admin auth flow
    if (!s.requiresPin) {
      window.location.href = s.href;
      return;
    }

    // Check if station is already unlocked in this session
    if (typeof window !== "undefined" && sessionStorage.getItem("wb_station_unlocked") === "true") {
      window.location.href = s.href;
      return;
    }

    // Require PIN before entering
    setSelectedStation(s);
    setPinInput("");
    setPinError("");
  };

  const handleVerifyPin = async (codeOverride?: string) => {
    const code = codeOverride !== undefined ? codeOverride : pinInput;
    if (!code.trim()) {
      setPinError("Please enter 4-digit Staff PIN.");
      return;
    }

    setPinLoading(true);
    setPinError("");

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("wb_station_unlocked", "true");
        }
        setIsUnlocked(true);
        toast.success("Station unlocked!", { icon: "🔓" });
        const targetUrl = selectedStation?.href || "/pos";
        setSelectedStation(null);
        window.location.href = targetUrl;
      } else {
        setPinError(data.error || "Incorrect Staff PIN. Please try again.");
        setPinInput("");
      }
    } catch {
      setPinError("Connection error. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await fetch("/api/auth/staff-logout", { method: "POST" });
    } catch {}
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wb_station_unlocked");
    }
    setIsUnlocked(false);
    toast.success("All staff sessions locked");
    window.location.href = "/staff/login";
  };

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

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoutAll}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition flex items-center gap-1.5"
              title="Lock all stations and logout"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Lock / Logout</span>
            </button>

            <Link
              href="/"
              className="text-xs font-semibold text-[#6F624E] hover:text-[#1E1B16] transition"
            >
              ← Guest Site
            </Link>
          </div>
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
            Direct operational access for authorized hotel staff. Each station requires security verification before order punching.
          </p>
        </div>

        {/* 4 Station Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-12">
          {stations.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.href}
                onClick={() => handleLaunchStation(s)}
                className="group cursor-pointer bg-white rounded-2xl p-6 sm:p-7 border border-[#e8dfd3] shadow-xs hover:shadow-xl hover:border-[#A18D6D] transition-all duration-300 flex flex-col justify-between active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs transition group-hover:scale-110 ${s.iconBg}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {s.securityNote}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                    </div>
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
              </div>
            );
          })}
        </div>

        {/* Security Notice Box */}
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-5 mb-10 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div className="text-xs text-amber-900 leading-relaxed">
            <div className="font-bold text-amber-950 mb-0.5">🔒 Restaurant Station Security Active</div>
            <p className="text-amber-800/90 font-light">
              Guest users on the website cannot punch orders or view sales. Waiters and cashiers must enter the 4-digit Staff PIN (<strong>1234</strong>) to unlock floor terminals. Stations can be locked anytime from their top header.
            </p>
          </div>
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

      {/* MODAL: SECURITY PIN FOR LAUNCHING A STATION */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1E1B16] text-white border border-[#3A3328] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Security Lock
                </span>
                <h3 className="font-serif font-bold text-lg text-white mt-1">
                  {selectedStation.title}
                </h3>
                <p className="text-xs text-gray-400">
                  Enter 4-Digit Staff PIN to unlock workstation
                </p>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* PIN Dots */}
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-3 py-2 bg-[#14120E] rounded-2xl border border-white/10">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        filled
                          ? "bg-amber-400 scale-110 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "bg-white/10 border border-white/20"
                      }`}
                    />
                  );
                })}
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold animate-shake">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={pinLoading}
                  onClick={() => {
                    if (pinInput.length < 4) {
                      const next = pinInput + String(n);
                      setPinInput(next);
                      setPinError("");
                      if (next.length === 4) handleVerifyPin(next);
                    }
                  }}
                  className="py-2.5 bg-white/5 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-lg rounded-xl transition border border-white/5"
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                disabled={pinLoading}
                onClick={() => {
                  setPinInput("");
                  setPinError("");
                }}
                className="py-2.5 bg-red-950/40 hover:bg-red-900/60 active:scale-95 text-red-300 text-xs font-bold rounded-xl transition border border-red-500/20"
              >
                CLEAR
              </button>

              <button
                type="button"
                disabled={pinLoading}
                onClick={() => {
                  if (pinInput.length < 4) {
                    const next = pinInput + "0";
                    setPinInput(next);
                    setPinError("");
                    if (next.length === 4) handleVerifyPin(next);
                  }
                }}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-lg rounded-xl transition border border-white/5"
              >
                0
              </button>

              <button
                type="button"
                disabled={pinLoading}
                onClick={() => {
                  setPinInput((prev) => prev.slice(0, -1));
                  setPinError("");
                }}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:scale-95 text-gray-300 text-base font-bold rounded-xl transition border border-white/5"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="button"
              disabled={pinLoading || pinInput.length === 0}
              onClick={() => handleVerifyPin()}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {pinLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Unlock Station</span>
                </>
              )}
            </button>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#e8dfd3] bg-white py-6 text-center text-xs text-[#6F624E]">
        <p>© {new Date().getFullYear()} Hotel White Bliss • Restaurant Management System</p>
      </footer>

    </div>
  );
}
