"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, X, Check, Share2, PlusSquare } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] ServiceWorker registered with scope:", registration.scope);
        })
        .catch((err) => {
          console.warn("[PWA] ServiceWorker registration failed:", err);
        });
    }

    // Detect standalone mode
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return; // Already installed and running as standalone app
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatically show install hint after 3 seconds if not dismissed
      const dismissed = localStorage.getItem("hwb_pwa_dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsStandalone(true);
      setShowPrompt(false);
      setInstalledSuccess(true);
      console.log("[PWA] Hotel White Bliss App was installed successfully!");
    });

    // Check if dismissed before on iOS
    if (isAppleDevice) {
      const dismissed = localStorage.getItem("hwb_pwa_dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3500);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("hwb_pwa_dismissed", "true");
  };

  if (isStandalone) {
    return null; // Silent in standalone native mode
  }

  return (
    <>
      {/* Floating Discrete App Banner for Mobile Diners/Captains */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-zinc-950 text-white rounded-2xl border border-zinc-800 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center font-serif font-bold text-amber-400 text-sm tracking-wider">
                  HM
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-100 text-sm tracking-tight flex items-center gap-1.5">
                  Hotel White Bliss App
                </h4>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Install native app for instant orders & floor management
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-zinc-800/80">
            {isIOS ? (
              <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl text-xs space-y-1.5 text-zinc-300">
                <div className="flex items-center gap-1.5 font-medium text-amber-400">
                  <Smartphone size={13} />
                  <span>iPhone / iPad Installation:</span>
                </div>
                <div className="text-[11px] leading-relaxed text-zinc-400 flex items-center gap-1.5">
                  <span>1. Tap Safari Share</span>
                  <Share2 size={12} className="inline text-zinc-200" />
                  <span>at bottom</span>
                </div>
                <div className="text-[11px] leading-relaxed text-zinc-400 flex items-center gap-1.5">
                  <span>2. Tap "Add to Home Screen"</span>
                  <PlusSquare size={12} className="inline text-zinc-200" />
                </div>
              </div>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Install App on Home Screen</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px]">Tap browser menu (⋮) → "Install app"</span>
                <button
                  onClick={handleDismiss}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] rounded-lg transition"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
