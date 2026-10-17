"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { CheckCircle, Clock, Utensils, ReceiptText, ArrowLeft, Star } from "lucide-react"
import toast from "react-hot-toast"
import { useSearchParams } from "next/navigation"
import { QRCode } from "react-qrcode-logo"

export default function OrderTrackingClient({ tableId }: { tableId: string }) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
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
      } catch {
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    const channel = supabase
      .channel(`table-orders-${tableId}`)
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
    toast.success("Bill requested! Preparing your final bill...");
    
    // Optimistic UI for all active orders to show they are part of the bill request
    const activeOrderIds = orders.filter(o => o.status !== 'rejected').map(o => o.id);
    setOrders(prev => prev.map(o => activeOrderIds.includes(o.id) ? { ...o, status: 'billing' } : o));
    
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderIds: activeOrderIds, 
          status: 'billing',
          table: tableId,
          tableToken: token || undefined
        })
      });
    } catch {
      // realtime sync will update
    }
  }

  // 1. Payment Successful & Post-dining Review Screen
  if (showReview) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-sm">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold font-playfair text-[#1E1B16] mb-1">Payment Successful!</h1>
        <p className="text-sm text-[#6F624E] mb-8 font-light">Thank you for dining with Hotel White Bliss.</p>

        <div className="bg-white border border-[#e8dfd3] p-6 rounded-2xl w-full max-w-sm mb-6 shadow-sm">
          <h2 className="font-playfair font-bold text-[#1E1B16] mb-1.5 text-lg">How was your dining experience?</h2>
          <p className="text-[#6F624E] text-xs mb-5 font-light">Support us by leaving a 5-star review on Google!</p>
          <div className="flex justify-center gap-1.5 mb-5 text-amber-400 text-2xl">
             {'★'.repeat(5)}
          </div>
          <a 
            href="https://www.google.com/search?q=Hotel+White+Bliss+Nashik" 
            target="_blank" 
            rel="noreferrer"
            className="block w-full bg-[#1E1B16] text-[#F8F5F0] font-bold py-3.5 rounded-xl shadow-md hover:bg-black transition text-xs uppercase tracking-widest"
          >
            Review on Google
          </a>
        </div>
        
        <Link href={`/table/${tableId}?token=${token || ''}`} className="text-[#A18D6D] text-xs font-bold tracking-wider uppercase underline underline-offset-4">
          Return to Menu
        </Link>
      </div>
    );
  }

  // Calculations for bill
  const activeOrders = orders.filter(o => o.status !== 'rejected');

  // Check if cashier or captain has recorded SETTLEMENT_INFO
  let sInfo: any = null;
  activeOrders.forEach(order => {
    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch {
      items = [];
    }
    const found = items.find((i: any) => i && i.id === 'SETTLEMENT_INFO');
    if (found) sInfo = found;
  });

  const rawSubtotal = activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const subtotal = (sInfo && typeof sInfo.subtotal === 'number') ? sInfo.subtotal : rawSubtotal;
  const discount = (sInfo && typeof sInfo.discount === 'number') ? sInfo.discount : 0;
  const netFood = Math.max(0, subtotal - discount);
  const gst = (sInfo && typeof sInfo.gst === 'number') ? sInfo.gst : Math.round(netFood * 0.05);
  const serviceCharge = (sInfo && typeof sInfo.service_charge === 'number') 
    ? sInfo.service_charge 
    : (sInfo && sInfo.has_service_charge === false ? 0 : Math.round(netFood * 0.05));
  const grandTotal = (sInfo && typeof sInfo.grand_total === 'number') 
    ? sInfo.grand_total 
    : Math.max(0, netFood + gst + serviceCharge);

  // Flatten items for receipt breakdown, excluding system metadata
  const allReceiptItems: { name: string; qty: number; price: number; isNote?: boolean }[] = [];
  activeOrders.forEach(order => {
    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch {
      items = [];
    }
    items.forEach((it: any) => {
      if (!it || it.id === 'SETTLEMENT_INFO' || it.id === 'PAYMENT_METHOD' || it.id === 'CUSTOMER_INFO') return;
      if (it.id === 'NOTE') {
        allReceiptItems.push({ name: it.name, qty: 1, price: 0, isNote: true });
      } else {
        allReceiptItems.push({ name: it.name, qty: it.qty || 1, price: it.price || 0 });
      }
    });
  });

  const isBilling = orders.some(o => o.status === 'billing');
  const upiUrl = `upi://pay?pa=7499934257@okaxis&pn=Hotel%20White%20Bliss&am=${grandTotal}&cu=INR&tn=Table%20${tableId}%20Bill`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  // 2. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-3 border-zinc-200 border-t-[#A18D6D] animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-700">Connecting to Live Kitchen...</p>
        <p className="text-xs text-zinc-400 mt-1">Fetching live orders for Table #{tableId}</p>
      </div>
    );
  }

  // 3. No Active Orders
  if (orders.filter(o => o.status !== 'completed').length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5EFE6] border border-[#e8dfd3] flex items-center justify-center text-[#A18D6D] mb-4 shadow-2xs">
          <Utensils size={24} />
        </div>
        <h3 className="font-playfair font-bold text-xl text-[#1E1B16] mb-1">
          No Active Orders
        </h3>
        <p className="text-xs text-[#6F624E] max-w-xs mb-6 leading-relaxed font-light">
          Your table has no active orders right now. Ready to taste something delicious?
        </p>
        <Link
          href={`/table/${tableId}?token=${token || ''}`}
          className="rounded-full bg-[#1E1B16] text-[#F8F5F0] px-7 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black transition shadow-md active:scale-95"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  // 4. Billing / Payment View (Rendered as normal scrollable page so nothing is cut off)
  if (isBilling) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] px-4 sm:px-6 pt-6 pb-20 max-w-lg mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-5">
          <Link 
            href={`/table/${tableId}?token=${token || ''}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A18D6D] hover:text-[#1E1B16] transition"
          >
            <ArrowLeft size={14} /> Return to Menu
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F5EFE6] text-[#6F624E] border border-[#e8dfd3]">
            Table #{tableId}
          </span>
        </div>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold tracking-wide uppercase mb-2 border border-amber-200/70">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Bill Generated • Awaiting Payment
          </div>
          <h1 className="font-playfair text-2xl font-bold text-[#1E1B16]">
            Final Bill & Payment
          </h1>
          <p className="text-xs text-[#6F624E] mt-0.5 font-light">
            Hotel White Bliss • Please complete payment or inform your captain
          </p>
        </div>

        {/* UPI Payment Card (Hero) */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm mb-5 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-[#A18D6D] mb-1">
            Total Payable Amount
          </div>
          <div className="font-playfair text-3xl font-bold text-[#1E1B16] mb-1">
            ₹{grandTotal}
          </div>
          <div className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-4 border border-emerald-200/60">
            Amount Auto-Filled in UPI
          </div>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl border-2 border-[#e8dfd3] shadow-sm flex items-center justify-center">
              <QRCode 
                value={upiUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#1E1B16"
                qrStyle="squares"
                eyeRadius={6}
              />
            </div>
          </div>

          <p className="text-xs text-[#6F624E] mb-4 font-medium">
            Scan using Google Pay, PhonePe, Paytm, BHIM or any UPI App
          </p>

          <a 
            href={upiUrl}
            className="flex items-center justify-center gap-2 w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white py-3.5 px-6 rounded-xl font-bold shadow-md transition active:scale-95 text-base mb-3"
          >
            Pay ₹{grandTotal} via UPI App
          </a>

          <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#ede3d5] text-[11px] text-[#6F624E] leading-relaxed">
            💵 <strong>Cash or Card?</strong> Inform your table captain or waiter to collect payment at your table.
          </div>
        </div>

        {/* Itemized Order Receipt Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm mb-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <ReceiptText size={18} className="text-[#A18D6D]" />
              <h2 className="font-playfair font-bold text-base text-[#1E1B16]">
                Itemized Bill Summary
              </h2>
            </div>
            <span className="text-xs text-[#6F624E]">
              {allReceiptItems.filter(i => !i.isNote).length} item(s)
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {allReceiptItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex justify-between items-center text-xs ${item.isNote ? 'text-amber-600 italic' : 'text-[#1E1B16]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {!item.isNote && (
                    <span className="text-[11px] font-bold text-[#A18D6D] bg-[#F5EFE6] px-1.5 py-0.5 rounded">
                      x{item.qty}
                    </span>
                  )}
                </div>
                {!item.isNote && (
                  <span className="font-semibold text-zinc-800">
                    ₹{item.price * item.qty}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5 text-xs text-[#6F624E]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span>₹{gst}</span>
            </div>
            {serviceCharge > 0 ? (
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span>₹{serviceCharge}</span>
              </div>
            ) : (
              <div className="flex justify-between text-zinc-400">
                <span>Service Charge</span>
                <span>Waived (₹0)</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#1E1B16] pt-2 border-t border-gray-100">
              <span>Grand Total</span>
              <span className="text-base text-emerald-700">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Google Review Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm mb-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#A18D6D] mb-1">
            We value your feedback
          </p>
          <h3 className="font-playfair font-bold text-lg text-[#1E1B16] mb-2">
            How was your dining experience?
          </h3>
          <div className="flex justify-center gap-1.5 text-amber-400 text-xl mb-4">
            {'★'.repeat(5)}
          </div>
          <a 
            href="https://www.google.com/search?q=Hotel+White+Bliss+Nashik" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#FAF7F2] border border-[#e8dfd3] hover:border-amber-400 text-[#1E1B16] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-2xs transition active:scale-95"
          >
            Rate Hotel White Bliss on Google
          </a>
        </div>

        {/* Add more items option */}
        <div className="text-center pt-2">
          <Link
            href={`/table/${tableId}?token=${token || ''}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A18D6D] hover:text-[#1E1B16] tracking-wider uppercase underline underline-offset-4"
          >
            + Craving dessert or drinks? Order more items
          </Link>
        </div>
      </div>
    );
  }

  // 5. Active Orders Tracking View (Food in progress)
  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 sm:px-6 pt-6 pb-28 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[#1E1B16]">Your Orders</h1>
          <p className="text-xs text-[#6F624E]">Table #{tableId} • Live Kitchen Status</p>
        </div>
        <Link 
          href={`/table/${tableId}?token=${token || ''}`} 
          className="text-xs font-bold tracking-wider uppercase text-[#A18D6D] hover:text-[#1E1B16] py-1.5 px-3.5 rounded-full border border-[#A18D6D]/40 bg-white shadow-2xs transition"
        >
          + Add Items
        </Link>
      </div>

      <div className="space-y-4 mb-8">
        {orders.map(order => {
          let items = [];
          try { 
            items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
          } catch(e) {}
          
          return (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-xs border border-[#e8dfd3]">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                <span className="font-mono text-xs font-bold text-gray-500">#{order.order_number}</span>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="space-y-2 mb-3">
                {items.filter((it: any) => it && !['SETTLEMENT_INFO', 'PAYMENT_METHOD', 'CUSTOMER_INFO'].includes(it.id)).map((it: any, idx: number) => (
                  <div key={idx} className={`flex justify-between text-xs ${it.id === 'NOTE' ? 'text-amber-600 italic' : 'text-zinc-800'}`}>
                    <span className="font-medium">{it.name} {it.id !== 'NOTE' && <span className="text-gray-400">x{it.qty}</span>}</span>
                    {it.id !== 'NOTE' && <span className="font-semibold">₹{(it.price || 0) * (it.qty || 1)}</span>}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs font-bold text-[#1E1B16]">
                <span>Order Total</span>
                <span className={order.status === 'rejected' ? 'line-through text-gray-400' : ''}>₹{order.total_amount}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent z-20 pointer-events-none">
        <div className="pointer-events-auto max-w-lg mx-auto bg-[#1E1B16] text-[#F8F5F0] p-4 rounded-2xl shadow-xl flex items-center justify-between border border-white/10">
          <div>
            <div className="text-[10px] text-[#A18D6D] font-bold uppercase tracking-wider">
              Total Due (incl. taxes)
            </div>
            <div className="text-xl font-bold font-playfair text-white">
              ₹{grandTotal}
            </div>
          </div>
          <button 
            onClick={handleRequestBill}
            className="bg-[#A18D6D] hover:bg-[#8e7a5c] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <span>Request Bill</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'received') return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><Clock size={12}/> Received</span>
  if (status === 'preparing') return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full"><Utensils size={12}/> Preparing</span>
  if (status === 'ready') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={12}/> Ready</span>
  if (status === 'served') return <span className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Served</span>
  if (status === 'billing') return <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">Bill Requested</span>
  if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Cancelled</span>
  return null;
}
