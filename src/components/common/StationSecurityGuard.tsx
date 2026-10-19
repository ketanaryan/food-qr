"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Lock, ShieldCheck, AlertCircle, KeyRound, 
  Crown, ArrowLeft, LogOut, CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";

export function lockCurrentStation() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("wb_station_unlocked");
    window.dispatchEvent(new Event("wb_lock_station"));
  }
}

export function isCurrentStationUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("wb_station_unlocked") === "true";
}

interface StationSecurityGuardProps {
  stationName: string;
  stationRole: string;
  children: React.ReactNode;
}

export default function StationSecurityGuard({
  stationName,
  stationRole,
  children
}: StationSecurityGuardProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleLock = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wb_station_unlocked");
    }
    setIsUnlocked(false);
    setPinInput("");
    setErrorMsg("");
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("wb_station_unlocked") === "true") {
        setIsUnlocked(true);
      }
    }

    const onLockEvent = () => handleLock();
    window.addEventListener("wb_lock_station", onLockEvent);
    return () => window.removeEventListener("wb_lock_station", onLockEvent);
  }, [handleLock]);

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride !== undefined ? codeOverride : pinInput;
    if (!code.trim()) {
      setErrorMsg("Please enter 4-digit Staff PIN.");
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
        if (typeof window !== "undefined") {
          sessionStorage.setItem("wb_station_unlocked", "true");
        }
        setIsUnlocked(true);
        toast.success(`${stationName} Unlocked`, { icon: "🔓" });
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

  // Keyboard numeric listener when locked
  useEffect(() => {
    if (isUnlocked || !mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setPinInput(prev => {
          if (prev.length >= 4) return prev;
          const next = prev + e.key;
          if (next.length === 4) {
            setTimeout(() => handleVerify(next), 50);
          }
          return next;
        });
        setErrorMsg("");
      } else if (e.key === "Backspace") {
        setPinInput(prev => prev.slice(0, -1));
        setErrorMsg("");
      } else if (e.key === "Escape") {
        setPinInput("");
        setErrorMsg("");
      } else if (e.key === "Enter" && pinInput.length > 0) {
        handleVerify();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnlocked, mounted, pinInput]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#14120E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  // Full-screen high-security Station Lock Screen
  return (
    <div className="fixed inset-0 z-50 bg-[#14120E] text-white flex flex-col justify-between items-center p-4 selection:bg-[#A18D6D] selection:text-white overflow-y-auto">
      
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <a
          href="/staff"
          className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition py-1 px-2.5 rounded-lg bg-white/5 border border-white/10"
        >
          <ArrowLeft size={14} />
          <span>Staff Hub</span>
        </a>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <Lock size={12} />
          <span>Station Locked</span>
        </div>
      </div>

      {/* Main Lock Card */}
      <div className="w-full max-w-sm bg-[#1E1B16] border border-[#3A3328] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Branding & Station Info */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#A18D6D] to-[#6F624E] border border-amber-300/30 flex items-center justify-center text-white shadow-xl">
            <Crown size={28} className="text-amber-200" />
          </div>

          <div>
            <h1 className="text-lg font-bold font-serif text-white">
              Hotel White Bliss
            </h1>
            <div className="mt-1 inline-block px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-300 text-xs font-bold tracking-wide">
              {stationName}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Authorized for: <strong className="text-gray-300">{stationRole}</strong>
            </p>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="space-y-3">
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    filled
                      ? "bg-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                      : "bg-white/10 border border-white/20"
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold animate-shake">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <p className="text-center text-[11px] text-gray-400">
              Enter 4-digit staff PIN to unlock this screen
            </p>
          )}
        </div>

        {/* Touch / Click Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              disabled={loading}
              onClick={() => {
                if (pinInput.length < 4) {
                  const next = pinInput + String(n);
                  setPinInput(next);
                  setErrorMsg("");
                  if (next.length === 4) handleVerify(next);
                }
              }}
              className="py-3 bg-white/5 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-xl rounded-xl transition border border-white/5 disabled:opacity-50"
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setPinInput("");
              setErrorMsg("");
            }}
            className="py-3 bg-red-950/40 hover:bg-red-900/60 active:scale-95 text-red-300 text-xs font-bold rounded-xl transition border border-red-500/20 disabled:opacity-50"
          >
            CLEAR
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (pinInput.length < 4) {
                const next = pinInput + "0";
                setPinInput(next);
                setErrorMsg("");
                if (next.length === 4) handleVerify(next);
              }
            }}
            className="py-3 bg-white/5 hover:bg-white/15 active:scale-95 text-white font-mono font-bold text-xl rounded-xl transition border border-white/5 disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setPinInput((prev) => prev.slice(0, -1));
              setErrorMsg("");
            }}
            className="py-3 bg-white/5 hover:bg-white/15 active:scale-95 text-gray-300 text-base font-bold rounded-xl transition border border-white/5 disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        {/* Unlock Action Button */}
        <button
          type="button"
          disabled={loading || pinInput.length === 0}
          onClick={() => handleVerify()}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Unlock Workstation</span>
            </>
          )}
        </button>

      </div>

      {/* Footer info */}
      <div className="text-center py-2 text-[11px] text-gray-500">
        <span>Default Staff PIN: </span>
        <code className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded font-mono">1234</code>
        <span className="mx-2">•</span>
        <a href="/" className="hover:text-gray-300 underline">Guest Site</a>
      </div>

    </div>
  );
}
