"use client"
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Clock, CheckCircle } from "lucide-react";

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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We'll create an audio element dynamically or use a ref to an existing one.
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
  }, []);

  const fetchOrders = async () => {
    // Fetch active orders
    const { data: activeData, error: activeError } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["received", "preparing", "ready"])
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
            setOrders((prev) => [payload.new as Order, ...prev]);
            if (audioEnabled && audioRef.current) {
              audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-gray-50 p-6 pt-24 font-sans relative">
      
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold z-40 shadow-md">
          Connection lost. Retrying... (Check your internet)
        </div>
      )}

      <div className={`mb-6 flex items-center justify-between ${!isOnline ? 'mt-8' : ''}`}>
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
        <button
          onClick={() => {
            setAudioEnabled(!audioEnabled);
            if (!audioEnabled && audioRef.current) {
              audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
            }
          }}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-lg font-bold text-white transition ${
            audioEnabled ? "bg-green-600 hover:bg-green-700 shadow-[0_0_15px_rgba(22,163,74,0.5)]" : "bg-red-500 hover:bg-red-600 animate-pulse"
          }`}
        >
          <Bell size={24} />
          {audioEnabled ? "Audio On" : "Enable Audio"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {columns.map((status) => {
          const colOrders = orders
            .filter((o) => o.status === status)
            .sort((a, b) => {
              if (status === "served") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });

          return (
            <div key={status} className="flex flex-col gap-4 rounded-xl bg-gray-200/50 p-4">
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
                  let items = [];
                  try {
                    items = JSON.parse(order.items);
                  } catch (e) {
                    items = [];
                  }

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between border-b pb-3">
                        <div>
                          <span className="font-mono text-sm font-bold text-gray-500">
                            #{order.order_number}
                          </span>
                          <div className="mt-1 font-bold text-gray-900 text-xl">
                            Table {order.table_number}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
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
  );
}
