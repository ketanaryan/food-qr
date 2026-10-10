"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Receipt, CheckCircle, CreditCard, Clock } from "lucide-react"
import toast from "react-hot-toast"
import NavBar from "@/components/common/NavBar"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function CashierDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [audioEnabled, setAudioEnabled] = useState(true); // Enabled by default
  const audioEnabledRef = React.useRef(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // WhatsApp Modal State
  const [waModal, setWaModal] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null});
  const [waPhone, setWaPhone] = useState('');

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

  const markPaid = async (tableNumber: string, orderIds: number[], paymentMethod: 'CASH' | 'UPI') => {
    // Optimistic UI
    setOrders(prev => prev.filter(o => o.table_number !== tableNumber))
    
    // Use secure backend API instead of direct Supabase access
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, status: 'completed', paymentMethod })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      toast.success(`Table ${tableNumber} cleared!`);
    } catch(e) {
      toast.error("Failed to mark as paid");
    }
  }

  const printReceipt = (tableNumber: string, groupOrders: any[], subtotal: number, gst: number, serviceCharge: number, grandTotal: number) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return toast.error('Please allow popups to print receipts');
    
    const itemsHtml = groupOrders.map(order => {
      const items = JSON.parse(order.items || '[]').filter((i:any)=>i.id!=='NOTE');
      return items.map((it:any) => `
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
          <span>${it.qty}x ${it.name}</span>
          <span>Rs. ${it.price * it.qty}</span>
        </div>
      `).join('');
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Table ${tableNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
            .text-center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin:0;">HOTEL WHITE BLISS</h2>
            <p style="margin:5px 0; font-size:12px;">Premium Fine Dining</p>
            <p style="margin:5px 0 15px; font-size:12px;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>
          <h3 class="text-center">${tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table ${tableNumber}`}</h3>
          <div class="divider"></div>
          
          ${itemsHtml}
          
          <div class="divider"></div>
          <div class="flex-between"><span>Subtotal</span><span>Rs. ${subtotal}</span></div>
          <div class="flex-between"><span>GST (5%)</span><span>Rs. ${gst}</span></div>
          <div class="flex-between"><span>Service Charge (5%)</span><span>Rs. ${serviceCharge}</span></div>
          <div class="divider"></div>
          <div class="flex-between" style="font-weight:bold; font-size:18px;">
            <span>TOTAL</span><span>Rs. ${grandTotal}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="font-size:12px;">Thank you for dining with us!</div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  const handleSendWa = () => {
    if (!waModal.data) return;
    const { tableNumber, groupOrders, grandTotal } = waModal.data;
    
    const cleanPhone = waPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error("Invalid phone number");

    const tableNameDisplay = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table ${tableNumber}`;
    
    const orderIds = groupOrders.map((o: any) => o.id).join('-');
    const cleanUrl = `${window.location.origin}/bill/${orderIds}`;

    const text = `🧾 *HOTEL WHITE BLISS* 🧾\n------------------------\n${tableNameDisplay} | Date: ${new Date().toLocaleDateString()}\n------------------------\n*GRAND TOTAL: ₹${grandTotal}*\n------------------------\n📄 *View & Download your Proper PDF Bill here:*\n${cleanUrl}\n------------------------\n⭐ *Rate your experience on Google:*\nhttps://www.google.com/search?q=Hotel+White+Bliss+Nashik\n------------------------\nThank you for dining with us! 🙏`;
    
    // Direct synchronous user action bypassing blockers
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    setWaModal({ isOpen: false, data: null });
    setWaPhone('');
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
                <h2 className="text-2xl font-bold">
                  {group.table.match(/^(Swiggy|Zomato|Takeaway)/i) ? group.table : `Table ${group.table}`}
                </h2>
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
                  <>
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
                    
                    <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => printReceipt(group.table, group.orders, subtotal, gst, serviceCharge, grandTotal)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition active:scale-95 text-sm"
                      >
                        🖨️ Print
                      </button>
                      <button 
                        onClick={() => setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal } })}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd5b] transition active:scale-95 text-sm"
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => markPaid(group.table, group.orders.map((o:any)=>o.id), 'CASH')}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 text-sm"
                      >
                        💵 Cash
                      </button>
                      <button 
                        onClick={() => markPaid(group.table, group.orders.map((o:any)=>o.id), 'UPI')}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition active:scale-95 text-sm"
                      >
                        📱 UPI
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
          {Object.keys(tableGroups).length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500 font-medium">
              No active tables to bill.
            </div>
          )}
        </div>
      </div>

      {waModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#25D366] p-4 text-white text-center">
              <h3 className="font-bold text-lg">Send WhatsApp Bill</h3>
              <p className="text-white/80 text-sm">Table {waModal.data?.tableNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Customer Phone Number</label>
                <input 
                  type="tel" 
                  autoFocus
                  placeholder="e.g. 9876543210"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-[#25D366] focus:ring-0 outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWa()}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setWaModal({ isOpen: false, data: null }); setWaPhone(''); }}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendWa}
                  className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd5b] transition"
                >
                  Send Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
