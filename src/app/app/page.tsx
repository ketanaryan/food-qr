"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Download, Smartphone, Apple, ShieldCheck, Zap, 
  ArrowRight, QrCode, CheckCircle2, ChevronRight, Layers,
  ExternalLink, Sparkles
} from "lucide-react";
import { QRCode } from "react-qrcode-logo";

export default function AppDownloadPage() {
  const [mounted, setMounted] = useState(false);
  const [isDeferredReady, setIsDeferredReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsDeferredReady(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsDeferredReady(false);
      }
    } else {
      alert("PWA is already installed or your browser supports installing via the browser menu (⋮) -> 'Install App' / 'Add to Home Screen'.");
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://food-qr-gilt.vercel.app";
  const githubReleasesUrl = "https://github.com/ketanaryan/food-qr/releases/latest";
  const githubActionsUrl = "https://github.com/ketanaryan/food-qr/actions";

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-black font-sans antialiased">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-400 text-sm">
              HM
            </div>
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-zinc-100">Hotel Marquis</h1>
            <p className="text-[11px] text-zinc-400">Official Mobile App & POS Client</p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 font-medium"
        >
          <span>Website</span>
          <ChevronRight size={14} />
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Sparkles size={12} />
            <span>Zero Play Store Delay · 100% Native Experience</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-zinc-100">
            Hotel Marquis <br />
            <span className="italic font-light text-amber-400">Mobile App Suite</span>
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed font-light">
            Designed for floor captains, kitchen display, cashier billing & owner attendance. Install in 5 seconds on Android or iOS without app store fees or verification waiting.
          </p>
        </div>

        {/* Dual Options Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option 1: PWA Direct Install (Recommended) */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/30 transition shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Zap size={20} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Instant (No APK needed)
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-100">PWA Web App (Android & iOS)</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Adds full-screen Hotel Marquis app icon directly to your home screen. Opens with 0 browser bars, full offline caching, and instantaneous loading.
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <span>Works on both iPhone (iOS) and Android</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <span>0 MB storage footprint · Instant cloud sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <span>Automatic background updates on every publish</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2">
              {isIOS ? (
                <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl text-xs space-y-1.5 text-zinc-300">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Apple size={14} /> iPhone Installation Guide:
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    1. Open this page in Safari browser. <br />
                    2. Tap the <strong>Share</strong> button (box with arrow ↑) at the bottom. <br />
                    3. Tap <strong>"Add to Home Screen"</strong> (⊞).
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleInstallPWA}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span>1-Tap Install on Home Screen</span>
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Capacitor Native APK */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/30 transition shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Smartphone size={20} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Android APK (.apk)
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Standalone Android APK</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Generated automatically in GitHub cloud via Capacitor & Gradle. Direct installer file for restaurant floor tablets and Android phones.
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
                  <span>Hardware Bluetooth & USB Thermal Printing ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
                  <span>Direct side-load without Google Play Store fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
                  <span>Cloud runner compiles in GitHub without heating laptop</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <a
                href={githubReleasesUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Download size={15} />
                <span>Download Latest APK from GitHub</span>
                <ExternalLink size={13} className="text-zinc-400" />
              </a>

              <a
                href={githubActionsUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-[11px] text-zinc-500 hover:text-zinc-300 transition"
              >
                View GitHub Cloud Build Pipeline →
              </a>
            </div>
          </div>

        </div>

        {/* Scan to Install on Phone QR Section */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Floor Staff Onboarding
            </span>
            <h3 className="text-xl font-semibold text-zinc-100">
              Scan with Waiter / Captain Phone
            </h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              Scan this QR code from any smartphone camera to open this portal and install the app in 5 seconds.
            </p>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xl flex-shrink-0 min-h-[140px] min-w-[140px] flex items-center justify-center">
            {mounted ? (
              <QRCode value={`${currentUrl}/app`} size={130} />
            ) : (
              <div className="w-[130px] h-[130px] bg-zinc-100 rounded-xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Quick App Shortcut Directory */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
            App Modules Quick Launch
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Captain Portal", href: "/captain", role: "Waiters & Floor" },
              { title: "Attendo Engine", href: "/admin/attendo", role: "Owner Attendance" },
              { title: "Cashier Desk", href: "/cashier", role: "Billing & Thermal" },
              { title: "Kitchen Display", href: "/kitchen", role: "Chef Screen (KDS)" },
            ].map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-4 rounded-xl text-center transition group"
              >
                <div className="font-semibold text-xs text-zinc-200 group-hover:text-amber-400 transition">
                  {m.title}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">{m.role}</div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        Hotel Marquis · Complete Digital Restaurant Platform · Built for High-Performance Floor Operations
      </footer>
    </div>
  );
}
