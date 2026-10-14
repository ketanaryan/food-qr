"use client"
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Clock, CheckCircle, Printer, ChefHat, ArrowLeft } from "lucide-react";

function escapeHtml(str: any): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type Order = {
  id: number;
  order_number: string;
  table_number: string;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'rejected' | 'archived';
  items: string; // JSON string
  total_amount: number;
  created_at: string;
};

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileColumn, setActiveMobileColumn] = useState<'received' | 'preparing' | 'ready' | 'served'>('received');
  
  // Default to ON for live commercial restaurant operations
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioEnabledRef = useRef(true);
  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const autoPrintKOTRef = useRef(true);
  const [isOnline, setIsOnline] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Read persisted kitchen staff preferences
    const savedAudio = typeof window !== 'undefined' ? localStorage.getItem('wb_kitchen_audio') : null;
    const savedPrint = typeof window !== 'undefined' ? localStorage.getItem('wb_kitchen_auto_kot') : null;

    if (savedAudio !== null) {
      setAudioEnabled(savedAudio === 'true');
    }
    if (savedPrint !== null) {
      setAutoPrintKOT(savedPrint === 'true');
    }
  }, []);

  useEffect(() => {
    autoPrintKOTRef.current = autoPrintKOT;
  }, [autoPrintKOT]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");

    // Auto-unlock audio context on first screen touch/click
    const unlockAudio = () => {
      if (audioRef.current && audioEnabledRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        }).catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const printKOT = (order: Order) => {
    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {}
    if (!Array.isArray(items)) items = [];

    const notes = items.find((i: any) => i.id === 'NOTE')?.name || '';
    const foodItems = items.filter((i: any) => i.id !== 'NOTE');

    const printWindow = window.open('', '', 'width=380,height=520');
    if (!printWindow) return;

    const now = new Date(order.created_at || Date.now());
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rows = foodItems.map((c: any) => `
      <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:bold; padding:5px 0; border-bottom:1px dashed #bbb;">
        <span>${escapeHtml(c.qty)}x ${escapeHtml(c.name)}</span>
      </div>
    `).join('');

    const tableName = order.table_number?.match(/^(Swiggy|Zomato|Takeaway)/i)
      ? order.table_number.toUpperCase()
      : `TABLE ${order.table_number}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT #${escapeHtml(order.order_number || order.id)} - ${escapeHtml(tableName)}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            @media print {
              .no-print { display: none !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 13px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 2px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: sticky; top: 0; background: #000; padding: 10px 8px; margin: -10px -10px 10px -10px; display: flex; gap: 8px; justify-content: space-between; align-items: center; z-index: 9999; border-bottom: 2px solid #555;">
            <button onclick="handleBackOrClose()" style="background: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              ⬅ Back to Kitchen
            </button>
            <button onclick="window.print()" style="background: #ea580c; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🖨️ Print KOT
            </button>
          </div>
          <div class="center bold" style="font-size:18px; letter-spacing: 1px;">*** KITCHEN TICKET (KOT) ***</div>
          <div class="center bold" style="font-size:14px; margin-top:2px;">HOTEL WHITE BLISS</div>
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between; font-weight:900; font-size:16px;">
            <span>${escapeHtml(tableName)}</span>
            <span>KOT #${escapeHtml(order.order_number || order.id)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:4px; color:#444;">
            <span>Time: ${escapeHtml(timeStr)}</span>
            <span>Station: MAIN KITCHEN</span>
          </div>
          <div class="divider"></div>
          <div style="margin: 8px 0;">${rows}</div>
          ${notes ? `
          <div class="divider"></div>
          <div style="font-weight:bold; font-size:12px; padding: 5px; background: #eee; border-left: 3px solid #000;">
            SPECIAL INSTRUCTION: <span style="font-weight:900;">${escapeHtml(notes.toUpperCase())}</span>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="center" style="font-size:11px; font-weight:bold;">Bliss KDS • Kitchen Dispatch</div>
          <script>
            function handleBackOrClose() {
              try {
                if (window.opener && !window.opener.closed) {
                  window.close();
                  return;
                }
              } catch(e) {}
              try {
                window.close();
              } catch(e) {}
              setTimeout(function() {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/kitchen';
                }
              }, 100);
            }

            window.onload = function() {
              window.focus();
              setTimeout(function() {
                try { window.print(); } catch(e) {}
              }, 300);
            };

            window.onafterprint = function() {
              if (window.opener) {
                setTimeout(function() {
                  try { window.close(); } catch(e) {}
                }, 500);
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    try {
      // Fetch active orders
      const { data: activeData, error: activeError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["received", "pending", "preparing", "ready"])
        .order("created_at", { ascending: false });

      // Fetch limited served orders to prevent memory leak
      const { data: servedData, error: servedError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "served")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!activeError && !servedError && activeData && servedData) {
        setOrders([...activeData, ...servedData]);
      }
    } catch (e) {
      console.error("fetchOrders error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);

            // Auto-Print KOT slip if enabled
            if (autoPrintKOTRef.current) {
              try {
                printKOT(newOrder);
              } catch (err) {
                console.error("Auto KOT print error:", err);
              }
            }
            if (audioEnabledRef.current) {
              try {
                const newOrder = payload.new as Order;
                let itemsArray: any[] = [];
                try { 
                  itemsArray = typeof newOrder.items === 'string' 
                    ? JSON.parse(newOrder.items) 
                    : newOrder.items;
                } catch(e) {}
                
                if (!Array.isArray(itemsArray)) itemsArray = [];

                const dishCounts = itemsArray
                  .filter((i:any) => i.id !== 'NOTE')
                  .map((i:any) => `${i.qty} ${i.name}`)
                  .join(", ");
                  
                const tableNameMatch = newOrder.table_number.match(/^(Swiggy|Zomato|Takeaway)/i);
                const tableNameStr = tableNameMatch ? newOrder.table_number : `Table ${newOrder.table_number}`;
                
                const textToSpeak = `New order. ${tableNameStr}. ${dishCounts}.`;
                
                // Clear any stuck speech
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.volume = 1.0; // Max Volume
                utterance.rate = 0.9; 
                utterance.pitch = 1.2; // Slightly higher pitch for a more pleasant female tone
                
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                  const femaleVoices = voices.filter(v => 
                    v.name.toLowerCase().includes('female') || 
                    v.name.includes('Zira') || 
                    v.name.includes('Samantha') || 
                    v.name.includes('Google UK English Female') || 
                    v.name.includes('Google US English') ||
                    v.name.includes('Rishi') === false // Avoid common male voices
                  );
                  
                  const indianFemale = femaleVoices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
                  
                  if (indianFemale) {
                    utterance.voice = indianFemale;
                  } else if (femaleVoices.length > 0) {
                    utterance.voice = femaleVoices[0];
                  } else {
                    const fallback = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
                    if (fallback) utterance.voice = fallback;
                  }
                }
                
                if (audioRef.current) {
                   audioRef.current.volume = 1.0;
                   audioRef.current.play().then(() => {
                     // Wait a bit for the beep to finish
                     setTimeout(() => window.speechSynthesis.speak(utterance), 1200);
                   }).catch(() => {
                     window.speechSynthesis.speak(utterance);
                   });
                } else {
                   window.speechSynthesis.speak(utterance);
                }
              } catch (err) {
                console.error("Speech error", err);
                if (audioRef.current) {
                  audioRef.current.volume = 1.0;
                  audioRef.current.play().catch(()=>{});
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsOnline(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsOnline(false);
      });

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [audioEnabled]);

  const updateStatus = async (id: number, newStatus: string) => {
    // Optimistic Update
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));

    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-staff-access': 'pos_secure_override'
        },
        body: JSON.stringify({ orderIds: [id], status: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert on failure
      setOrders(previousOrders);
    }
  };

  const clearServed = async (ordersToClear: Order[]) => {
    const previousOrders = [...orders];
    const ids = ordersToClear.map(o => o.id);
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'archived' } : o));
    
    try {
      await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-staff-access': 'pos_secure_override'
        },
        body: JSON.stringify({ orderIds: ids, status: 'archived' })
      });
    } catch (error) {
      setOrders(previousOrders);
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return diff < 1 ? "Just now" : `${diff}m ago`;
  };

  const columns = ["received", "preparing", "ready", "served"] as const;

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-3 pt-3 sm:p-6 sm:pt-6 font-sans relative">
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold z-50 shadow-md">
          Connection lost. Retrying... (Check your internet)
        </div>
      )}

      {/* DEDICATED KITCHEN DISPLAY TOP BAR */}
      <header className="mb-4 sm:mb-6 bg-[#1E1B16] text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ChefHat size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">Kitchen Display (KDS)</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-amber-200/70 font-medium">Hotel White Bliss • Chef Station</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto Print KOT Toggle */}
          <button
            onClick={() => {
              const next = !autoPrintKOT;
              setAutoPrintKOT(next);
              if (typeof window !== 'undefined') localStorage.setItem('wb_kitchen_auto_kot', String(next));
            }}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold transition shadow-sm ${
              autoPrintKOT
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)] ring-2 ring-amber-400"
                : "bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20"
            }`}
            title="Automatically trigger print dialog whenever a new KOT lands"
          >
            <Printer size={16} />
            <span>{autoPrintKOT ? "Auto-KOT: ON" : "Auto-KOT: OFF"}</span>
          </button>

          {/* Voice Announcement / Sound Toggle */}
          <button
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              if (typeof window !== 'undefined') localStorage.setItem('wb_kitchen_audio', String(next));
              if (next && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition ${
              audioEnabled 
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400" 
                : "bg-red-500/30 text-red-300 border border-red-500/40"
            }`}
            title="Voice speech and alert chime on new orders"
          >
            <Bell size={16} />
            <span>{audioEnabled ? "Voice Alerts: ON" : "Muted"}</span>
          </button>

          {/* Back to POS Counter */}
          <a
            href="/pos"
            className="p-2 sm:px-3 sm:py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition border border-white/10 flex items-center gap-1.5"
            title="Go to POS Billing Counter"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">POS Counter</span>
          </a>
        </div>
      </header>

      {/* MOBILE STATUS SWITCHER TABS (< 768px) */}
      <div className="md:hidden flex p-1 bg-gray-200/90 rounded-2xl mb-4 overflow-x-auto shadow-inner text-xs font-bold gap-1">
        {columns.map((st) => {
          const count = orders.filter(o => o.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setActiveMobileColumn(st)}
              className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl text-center capitalize transition flex flex-col items-center gap-0.5 ${
                activeMobileColumn === st
                  ? 'bg-white text-gray-900 shadow-xs font-black'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-[11px] truncate">{st}</span>
              <span className="text-[10px] px-1.5 rounded-full bg-gray-300/80 font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {columns.map((status) => {
          const colOrders = orders
            .filter((o) => o.status === status)
            .sort((a, b) => {
              if (status === "served") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });

          return (
            <div key={status} className={`flex-col gap-3 rounded-2xl bg-gray-200/60 p-3 sm:p-4 ${activeMobileColumn === status ? 'flex' : 'hidden md:flex'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold capitalize text-gray-700">{status}</h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-300 px-3 py-1 text-sm font-semibold text-gray-800">
                    {colOrders.length}
                  </span>
                  {status === "served" && colOrders.length > 0 && (
                    <button 
                      onClick={() => clearServed(colOrders)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md font-bold hover:bg-red-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {colOrders.map((order) => {
                  let items: any[] = [];
                  try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                  } catch (e) {}
                  if (!Array.isArray(items)) items = [];

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between border-b border-gray-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-900 text-amber-400">
                              KOT #{order.order_number || order.id}
                            </span>
                            <button
                              onClick={() => printKOT(order)}
                              className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 active:scale-95 transition"
                              title="Print 80mm Physical Kitchen Ticket"
                            >
                              <Printer size={12} />
                              <span>Print KOT</span>
                            </button>
                          </div>
                          <div className="font-black text-gray-900 text-xl tracking-tight">
                            {order.table_number?.match(/^(Swiggy|Zomato|Takeaway)/i) ? (
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                {order.table_number.toLowerCase().includes("swiggy") && (
                                  <span className="bg-[#FC8019] text-white text-[11px] px-2 py-0.5 rounded font-black tracking-wider">SWIGGY</span>
                                )}
                                {order.table_number.toLowerCase().includes("zomato") && (
                                  <span className="bg-[#E23744] text-white text-[11px] px-2 py-0.5 rounded font-black tracking-wider">ZOMATO</span>
                                )}
                                {order.table_number.toLowerCase().includes("takeaway") && (
                                  <span className="bg-amber-600 text-white text-[11px] px-2 py-0.5 rounded font-black tracking-wider">PARCEL</span>
                                )}
                                <span>{order.table_number}</span>
                              </div>
                            ) : (
                              `Table ${order.table_number}`
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded-md">
                          <Clock size={12} className="mr-1 text-gray-400" />
                          {getTimeElapsed(order.created_at)}
                        </div>
                      </div>

                      <div className="mb-4 space-y-2">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className={`flex justify-between text-base ${item.id === 'NOTE' ? 'text-orange-600 font-bold bg-orange-50 p-2 rounded-md mt-2' : ''}`}>
                            <span className="font-medium text-gray-700">{item.name}</span>
                            {item.id !== 'NOTE' && <span className="font-bold text-gray-900">x{item.qty}</span>}
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-3 flex gap-2">
                        {status === "received" && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, "rejected")}
                              className="w-1/3 rounded-xl bg-red-100 py-4 text-sm font-bold text-red-600 hover:bg-red-200 active:scale-95 transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => updateStatus(order.id, "preparing")}
                              className="w-2/3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700 active:scale-95 transition"
                            >
                              Cook
                            </button>
                          </>
                        )}
                        {status === "preparing" && (
                          <button
                            onClick={() => updateStatus(order.id, "ready")}
                            className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white hover:bg-orange-600 active:scale-95 transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {status === "ready" && (
                          <button
                            onClick={() => updateStatus(order.id, "served")}
                            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white hover:bg-green-700 active:scale-95 transition"
                          >
                            Serve
                          </button>
                        )}
                        {status === "served" && (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-4 text-lg font-bold text-gray-500">
                            <CheckCircle size={20} /> Served
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
