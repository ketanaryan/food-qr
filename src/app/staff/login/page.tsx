"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Lock, ShieldCheck, AlertCircle, KeyRound, 
  Crown, Smartphone, Utensils, Monitor, Store, ArrowRight
} from "lucide-react";

function StaffLoginContent() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/staff";

  const [pinInput, setPinInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride !== undefined ? codeOverride : pinInput;
    if (!code.trim()) {
      setErrorMsg("Please enter Staff PIN or password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Redirect to intended workstation (Captain, POS, Kitchen, etc.)
        window.location.href = redirectTarget;
      } else {
        setErrorMsg(data.error || "Incorrect Staff PIN. Please try again.");
        setPinInput("");
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14120E] text-white flex flex-col justify-center items-center p-4 selection:bg-[#A18D6D] selection:text-white">
      <div className="w-full max-w-sm bg-[#1E1B16] border border-[#3A3328] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#A18D6D] to-[#6F624E] border border-amber-300/30 flex items-center justify-center text-white shadow-xl">
            <Crown size={28} className="text-amber-200" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <Lock size={12} />
              <span>Staff Workstation Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1.5">
              Hotel White Bliss
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              POS • Captain App • Kitchen KDS
            </p>
          </div>
        </div>

        {/* PIN Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 text-center">
              Enter 4-Digit Staff PIN or Password
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={20}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full text-center tracking-[0.4em] text-2xl font-mono py-3 px-4 bg-[#14120E] border border-[#4D4335] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold mt-2 animate-shake">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Unlocking Device...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Unlock Workstation</span>
              </>
            )}
          </button>
        </form>

        {/* Touch Screen Keypad (For Waiter Mobiles & Tablets) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                const next = pinInput + String(n);
                setPinInput(next);
                if (next.length === 4) handleVerify(next);
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
              const next = pinInput + "0";
              setPinInput(next);
              if (next.length === 4) handleVerify(next);
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

        {/* Helpful Station Destination Note */}
        <div className="text-center pt-2 border-t border-white/10 text-gray-400 text-[11px]">
          <span>Unlocking workstation for </span>
          <span className="text-amber-300 font-bold font-mono">{redirectTarget}</span>
        </div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#14120E] text-white flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <StaffLoginContent />
    </Suspense>
  );
}

