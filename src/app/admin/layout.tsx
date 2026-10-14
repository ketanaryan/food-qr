"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Menu as MenuIcon, QrCode, LogOut, ChevronLeft, ChevronRight, 
  Menu, BarChart, CalendarDays, Users, Boxes, UserCheck, ShieldCheck, Lock, 
  Mail, Eye, EyeOff, Crown, ArrowLeft, AlertCircle, KeyRound, CheckCircle2, X 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Owner Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Change Credentials Modal State
  const [isChangeModalOpen, setIsChangeModalOpen] = useState<boolean>(false);
  const [currentPwd, setCurrentPwd] = useState<string>("");
  const [newEmailVal, setNewEmailVal] = useState<string>("");
  const [newPwdVal, setNewPwdVal] = useState<string>("");
  const [confirmPwdVal, setConfirmPwdVal] = useState<string>("");
  const [changeLoading, setChangeLoading] = useState<boolean>(false);
  const [changeError, setChangeError] = useState<string>("");
  const [changeSuccess, setChangeSuccess] = useState<string>("");

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/owner-status");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
            return;
          }
        }
      } catch (err) {
        // network issue or offline
      }
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
    };

    verifySession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/owner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          rememberMe
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("wb_owner_authenticated", "true");
        }
        setIsAuthenticated(true);
        setPasswordInput("");
        setErrorMessage("");
      } else {
        setErrorMessage(data.error || "Authentication failed. Invalid credentials.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to verification server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLockPortal = async () => {
    try {
      await fetch("/api/auth/owner-logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wb_owner_authenticated");
    }
    setIsAuthenticated(false);
    setPasswordInput("");
    setErrorMessage("");
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");

    if (!currentPwd.trim() || !newEmailVal.trim() || !newPwdVal.trim()) {
      setChangeError("All fields are required.");
      return;
    }

    if (newPwdVal !== confirmPwdVal) {
      setChangeError("New password and confirm password do not match.");
      return;
    }

    if (newPwdVal.length < 6) {
      setChangeError("New password must be at least 6 characters.");
      return;
    }

    setChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newEmail: newEmailVal,
          newPassword: newPwdVal
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChangeSuccess("Owner credentials updated! Use your new details next time you log in.");
        setCurrentPwd("");
        setNewPwdVal("");
        setConfirmPwdVal("");
        setTimeout(() => {
          setIsChangeModalOpen(false);
          setChangeSuccess("");
        }, 2200);
      } else {
        setChangeError(data.error || "Failed to update credentials.");
      }
    } catch {
      setChangeError("Network error. Please try again.");
    } finally {
      setChangeLoading(false);
    }
  };

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Sales Report", href: "/admin/sales", icon: BarChart },
    { name: "Guest CRM", href: "/admin/crm", icon: Users },
    { name: "Staff & Attendo", href: "/admin/attendo", icon: UserCheck },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Reservations", href: "/admin/reservations", icon: CalendarDays },
    { name: "Menu Builder", href: "/admin/menu", icon: MenuIcon },
    { name: "Tables & Floors", href: "/admin/qr", icon: QrCode },
  ];

  // If still hydrating/checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#1E1B16] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // IF NOT AUTHENTICATED: RENDER LUXURY OWNER SECURITY LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <>
        <head>
          <title>Bliss Owner App</title>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Bliss Owner" />
          <meta name="application-name" content="Bliss Owner" />
          <meta name="theme-color" content="#14120E" />
          <link rel="manifest" href="/manifest-owner.json" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon-owner.png" />
        </head>
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

          {/* Secure Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Owner Email / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="owner@hotelwhitebliss.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full text-sm py-3 pl-11 pr-4 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300">
                  Master Security Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full text-sm py-3 pl-11 pr-11 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-mono"
                />
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Device Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-400 bg-[#14120E] accent-amber-500"
                />
                <span className="text-xs text-gray-300 font-medium">
                  Remember this device (30 Days)
                </span>
              </label>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span className="leading-snug font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link (No Default PIN) */}
          <div className="text-center pt-2 border-t border-white/10">
            <Link 
              href="/staff" 
              className="text-xs text-gray-400 hover:text-amber-300 transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back to Staff Workstations</span>
            </Link>
          </div>
        </div>
      </div>
    </>
    );
  }

  return (
    <>
      <head>
        <title>Bliss Owner App</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bliss Owner" />
        <meta name="application-name" content="Bliss Owner" />
        <meta name="theme-color" content="#14120E" />
        <link rel="manifest" href="/manifest-owner.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-owner.png" />
      </head>
      <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-[#1E1B16] text-white z-50 flex items-center justify-between p-4 print:hidden border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-amber-400" />
          <Link href="/admin/dashboard" className="font-playfair font-bold text-lg tracking-wider text-[#A18D6D]">
            OWNER PORTAL
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsChangeModalOpen(true);
              setChangeError("");
              setChangeSuccess("");
            }}
            className="p-1.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1"
            title="Change Credentials"
          >
            <KeyRound size={14} />
            <span>Security</span>
          </button>
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
            onClick={() => {
              setIsChangeModalOpen(true);
              setChangeError("");
              setChangeSuccess("");
            }}
            className={`
              w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-amber-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium
              ${collapsed ? "justify-center" : ""}
            `}
            title={collapsed ? "Security Settings" : undefined}
          >
            <KeyRound size={18} className="text-amber-400" />
            {!collapsed && <span>Security / Password</span>}
          </button>

          <button
            onClick={handleLockPortal}
            className={`
              w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-red-300 hover:text-white hover:bg-red-500/20 transition-colors text-xs font-bold
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

      {/* MODAL: CHANGE OWNER CREDENTIALS */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E1B16] text-white border border-[#3A3328] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Owner Security Settings</h3>
                  <p className="text-xs text-gray-400">Update login email and master password</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChangeModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangeCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  New Owner Email / Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. owner@hotelwhitebliss.com"
                  value={newEmailVal}
                  onChange={(e) => setNewEmailVal(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  New Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPwdVal}
                  onChange={(e) => setNewPwdVal(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPwdVal}
                  onChange={(e) => setConfirmPwdVal(e.target.value)}
                  className="w-full text-sm py-2.5 px-3.5 bg-[#14120E] border border-[#4D4335] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition font-mono"
                />
              </div>

              {changeError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{changeError}</span>
                </div>
              )}

              {changeSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span>{changeSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangeModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold uppercase rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {changeLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
