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

  const sendWhatsAppBill = async (tableNumber: string, groupOrders: any[], subtotal: number, gst: number, serviceCharge: number, grandTotal: number) => {
    // 1. Generate the PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HOTEL WHITE BLISS", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Fine Dining", 105, 28, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 34, { align: "center" });
    const formattedTableName = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table No: ${tableNumber}`;
    doc.text(formattedTableName, 105, 40, { align: "center" });

    // Table Data
    const tableBody = groupOrders.flatMap(order => {
      const items = JSON.parse(order.items || '[]').filter((i:any)=>i.id!=='NOTE');
      return items.map((it:any) => [
        `${it.name}`,
        it.qty.toString(),
        `Rs. ${it.price}`,
        `Rs. ${it.price * it.qty}`
      ]);
    });

    autoTable(doc, {
      startY: 50,
      head: [['Item', 'Qty', 'Rate', 'Amount']],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals
    doc.setFontSize(10);
    doc.text("Subtotal:", 140, finalY);
    doc.text(`Rs. ${subtotal}`, 190, finalY, { align: 'right' });
    
    doc.text("GST (5%):", 140, finalY + 7);
    doc.text(`Rs. ${gst}`, 190, finalY + 7, { align: 'right' });
    
    doc.text("Service Charge (5%):", 140, finalY + 14);
    doc.text(`Rs. ${serviceCharge}`, 190, finalY + 14, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 130, finalY + 24);
    doc.text(`Rs. ${grandTotal}`, 190, finalY + 24, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for dining with us!", 105, finalY + 40, { align: "center" });

    const phone = window.prompt("Enter customer WhatsApp number (e.g. 9876543210):");
    if (!phone) return;
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error("Invalid phone number");

    const tableNameDisplay = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table ${tableNumber}`;
    
    // 1. Download locally as backup
    const fileName = `Hotel_White_Bliss_Bill_${tableNameDisplay.replace(' ', '_')}.pdf`;
    doc.save(fileName);
    
    // 2. Upload to Supabase using Backend API (to bypass RLS)
    const toastId = toast.loading("Generating secure PDF link...");
    try {
      const pdfBlob = doc.output('blob');
      const storageFileName = `${Date.now()}_${fileName}`;
      
      const formData = new FormData();
      formData.append('file', pdfBlob);
      formData.append('fileName', storageFileName);

      const authHeader = `Basic ${btoa("admin:aryan123")}`;
      const res = await fetch('/api/admin/upload-bill', {
        method: 'POST',
        headers: { 'Authorization': authHeader },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");

      const publicUrl = data.publicUrl;

      const text = `🧾 *HOTEL WHITE BLISS* 🧾%0A------------------------%0A${tableNameDisplay} | Date: ${new Date().toLocaleDateString()}%0A------------------------%0A*GRAND TOTAL: ₹${grandTotal}*%0A------------------------%0A📄 *View & Download your Proper PDF Bill here:*%0A${publicUrl}%0A------------------------%0AThank you for dining with us! 🙏`;
      
      toast.dismiss(toastId);
      window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
      
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF link. Sending text bill instead.");
      
      // Fallback to purely text bill if upload fails
      let itemsText = groupOrders.map(order => {
        const items = JSON.parse(order.items || '[]').filter((i:any)=>i.id!=='NOTE');
        return items.map((it:any) => `${it.qty} x ${it.name} = ₹${it.price * it.qty}`).join('%0A');
      }).join('%0A');

      const fallbackText = `🧾 *HOTEL WHITE BLISS* 🧾%0A------------------------%0A${tableNameDisplay} | Date: ${new Date().toLocaleDateString()}%0A------------------------%0A${itemsText}%0A------------------------%0ASubtotal: ₹${subtotal}%0AGST (5%): ₹${gst}%0AService (5%): ₹${serviceCharge}%0A------------------------%0A*GRAND TOTAL: ₹${grandTotal}*%0A------------------------%0AThank you for dining with us! 🙏`;
      
      window.open(`https://wa.me/91${cleanPhone}?text=${fallbackText}`, '_blank');
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
                        onClick={() => sendWhatsAppBill(group.table, group.orders, subtotal, gst, serviceCharge, grandTotal)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd5b] transition active:scale-95 text-sm"
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                    <button 
                      onClick={() => markPaid(group.table, group.orders.map((o:any)=>o.id))}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95"
                    >
                      <CheckCircle size={20}/> Mark as Paid & Clear
                    </button>
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
    </>
  )
}
