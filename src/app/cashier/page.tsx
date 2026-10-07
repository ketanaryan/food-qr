"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Receipt, CheckCircle, CreditCard, Clock } from "lucide-react"
import toast from "react-hot-toast"
import NavBar from "@/components/common/NavBar"

export default function CashierDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = React.useRef(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Sync state to ref
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'archived')
        .neq('status', 'completed')
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })
      if (data) setOrders(data)
    }
    fetchOrders()

    const channel = supabase
      .channel('cashier-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'billing') {
           if (audioEnabledRef.current && audioRef.current) {
             audioRef.current.play().catch(()=>console.log("Audio play failed"));
             toast.error(`Table ${payload.new.table_number} requested the bill!`, {
               duration: 6000,
               icon: '🔔',
               style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
             });
           }
        }
        fetchOrders()
      })
      .subscribe()

    const alertChannel = supabase
      .channel('cashier-alerts')
      .on('broadcast', { event: 'waiter_called' }, (payload) => {
        if (audioEnabledRef.current && audioRef.current) {
           audioRef.current.play().catch(()=>console.log("Audio play failed"));
        }
        toast.success(`Table ${payload.payload.table} is calling a Waiter!`, {
           duration: 8000,
           icon: '🙋‍♂️',
           style: { background: '#3b82f6', color: '#fff', fontWeight: 'bold' }
        });
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(channel)
      supabase.removeChannel(alertChannel)
    }
  }, [])

  // Group by table
  const tableGroups = orders.reduce((acc: any, order: any) => {
    const t = order.table_number;
    if (!acc[t]) acc[t] = { table: t, orders: [], total: 0, requestedBill: false };
    acc[t].orders.push(order);
    acc[t].total += order.total_amount;
    if (order.status === 'billing') acc[t].requestedBill = true; // custom status for requesting bill
    return acc;
  }, {})

  const markPaid = async (tableNumber: string, orderIds: number[]) => {
    // Optimistic UI
    setOrders(prev => prev.filter(o => o.table_number !== tableNumber))
    
    // Use secure backend API instead of direct Supabase access
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, status: 'completed' })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      toast.success(`Table ${tableNumber} cleared!`);
    } catch(e) {
      toast.error("Failed to mark as paid");
    }
  }

  return (
    <>
      <NavBar />
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=service-bell-ring-14610.mp3" preload="auto" />
      <div className="min-h-screen bg-gray-50 p-6 pt-24 md:p-12 md:pt-28">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Receipt size={32} className="text-blue-600"/> Cashier / Billing
            </h1>
            <p className="text-gray-500 mt-2">Manage payments and clear tables</p>
          </div>
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
              }
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition ${
              audioEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600 animate-pulse"
            }`}
          >
            {audioEnabled ? "🔔 Alerts On" : "🔕 Enable Alerts"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(tableGroups).map((group: any) => (
            <div key={group.table} className={`bg-white rounded-2xl shadow-sm border p-6 ${group.requestedBill ? 'ring-2 ring-orange-400 shadow-orange-100' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold">Table {group.table}</h2>
                {group.requestedBill && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Bill Requested</span>}
              </div>
              
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {group.orders.map((order: any) => (
                  <div key={order.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between text-gray-500 text-xs mb-2">
                      <span>#{order.order_number}</span>
                      <span className="uppercase font-bold">{order.status}</span>
                    </div>
                    {JSON.parse(order.items || '[]').filter((i:any)=>i.id!=='NOTE').map((it:any, idx:number) => (
                       <div key={idx} className="flex justify-between">
                         <span>{it.qty}x {it.name}</span>
                         <span>₹{it.price * it.qty}</span>
                       </div>
                    ))}
                    <div className="text-right font-bold mt-2 pt-2 border-t text-gray-700">₹{order.total_amount}</div>
                  </div>
                ))}
              </div>

              {(() => {
                const subtotal = group.total;
                const gst = Math.round(subtotal * 0.05);
                const serviceCharge = Math.round(subtotal * 0.05);
                const grandTotal = subtotal + gst + serviceCharge;

                return (
                  <div className="bg-blue-50 p-4 rounded-xl mb-4 space-y-2 text-sm text-blue-900">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between font-medium opacity-80">
                      <span>GST (5%)</span>
                      <span>₹{gst}</span>
                    </div>
                    <div className="flex justify-between font-medium opacity-80">
                      <span>Service Charge (5%)</span>
                      <span>₹{serviceCharge}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-200">
                      <span className="font-bold text-blue-950">Grand Total</span>
                      <span className="text-2xl font-bold text-blue-700">₹{grandTotal}</span>
                    </div>
                  </div>
                );
              })()}

              <button 
                onClick={() => markPaid(group.table, group.orders.map((o:any)=>o.id))}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition active:scale-95"
              >
                <CheckCircle size={20}/> Mark as Paid & Clear
              </button>
            </div>
          ))}
          {Object.keys(tableGroups).length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500 font-medium">
              No active tables to bill.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
