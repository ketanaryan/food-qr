"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { CheckCircle, Clock, Utensils } from "lucide-react"
import toast from "react-hot-toast"
import { useSearchParams } from "next/navigation"

export default function OrderTrackingClient({ tableId }: { tableId: string }) {
  const [orders, setOrders] = useState<any[]>([])
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('table_number', tableId)
        .in('status', ['received', 'preparing', 'ready', 'served', 'rejected', 'billing'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setOrders(data)
      }
    }

    fetchOrders()

    const channel = supabase
      .channel('table-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_number=eq.${tableId}` }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
           setShowReview(true);
        }
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableId])

  const handleRequestBill = async () => {
    toast.success("Bill requested! The waiter will be with you shortly.");
    
    // Optimistic UI for all active orders to show they are part of the bill request
    const activeOrderIds = orders.filter(o => o.status !== 'rejected').map(o => o.id);
    
    await fetch('/api/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: activeOrderIds, status: 'billing' })
    });
  }

  if (showReview) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-10 text-lg">Thank you for dining with Hotel White Bliss.</p>

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl w-full max-w-sm mb-6 shadow-sm">
          <h2 className="font-bold text-blue-900 mb-2 text-xl">How was your food?</h2>
          <p className="text-blue-700 text-sm mb-6">Support us by leaving a 5-star review on Google!</p>
          <div className="flex justify-center gap-2 mb-6">
             {[1,2,3,4,5].map(i => <span key={i} className="text-4xl text-yellow-400">★</span>)}
          </div>
          <a 
            href="https://maps.app.goo.gl/1" 
            target="_blank"
            className="block w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition"
          >
            Review on Google
          </a>
        </div>
        
        <Link href={`/table/${tableId}?token=${token}`} className="text-gray-400 font-semibold underline underline-offset-4">
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-20 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-mono">Your Orders</h1>
        <Link href={`/table/${tableId}?token=${token}`} className="text-sm font-semibold text-blue-600">Back to Menu</Link>
      </div>

      {orders.filter(o => o.status !== 'completed').length === 0 ? (
        <div className="text-center text-gray-500 mt-20">No active orders found.</div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {orders.map(order => {
            let items = [];
            try { items = JSON.parse(order.items) } catch(e) {}
            
            return (
              <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                  <span className="font-mono text-sm font-bold text-gray-500">#{order.order_number}</span>
                  <StatusBadge status={order.status} />
                </div>
                
                <div className="space-y-2 mb-3">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className={`flex justify-between text-sm ${it.id === 'NOTE' ? 'text-orange-500 italic' : ''}`}>
                      <span className="text-gray-700">{it.name} {it.id !== 'NOTE' && <span className="text-gray-400">x{it.qty}</span>}</span>
                      {it.id !== 'NOTE' && <span className="font-semibold">₹{it.price * it.qty}</span>}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-50 font-bold">
                  <span>Total</span>
                  <span className={order.status === 'rejected' ? 'line-through text-gray-400' : ''}>₹{order.total_amount}</span>
                </div>
              </div>
            )
          })}
          </div>
          
          {(() => {
            const subtotal = orders.filter(o=>o.status!=='rejected').reduce((sum, o)=>sum+o.total_amount, 0);
            const gst = Math.round(subtotal * 0.05);
            const serviceCharge = Math.round(subtotal * 0.05);
            const grandTotal = subtotal + gst + serviceCharge;

            return (
              <div className="fixed bottom-0 left-0 right-0 bg-white p-6 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 rounded-t-3xl">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (5%)</span>
                    <span>₹{gst}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Service Charge (5%)</span>
                    <span>₹{serviceCharge}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t pt-4">
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Due</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{grandTotal}
                    </div>
                  </div>
                  {!orders.some(o => o.status === 'billing') && (
                    <button 
                      onClick={handleRequestBill}
                      className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 transition active:scale-95"
                    >
                      Request Bill
                    </button>
                  )}
                </div>

                {orders.some(o => o.status === 'billing') && (
                  <div className="mt-6 border-t pt-6 text-center animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Pay Securely via UPI</h3>
                    <div className="flex justify-center mb-6">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=restaurant@upi&pn=Hotel%20White%20Bliss&am=${grandTotal}&cu=INR`)}`} 
                        alt="UPI QR Code" 
                        className="rounded-xl border-4 border-gray-100 shadow-sm"
                      />
                    </div>
                    <a 
                      href={`upi://pay?pa=restaurant@upi&pn=Hotel%20White%20Bliss&am=${grandTotal}&cu=INR`}
                      className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-blue-700 transition active:scale-95 text-lg"
                    >
                      Pay via UPI App (Zero Fee)
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'received') return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><Clock size={12}/> Received</span>
  if (status === 'preparing') return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full"><Utensils size={12}/> Preparing</span>
  if (status === 'ready') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={12}/> Ready</span>
  if (status === 'served') return <span className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Served</span>
  if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Cancelled</span>
  return null;
}
