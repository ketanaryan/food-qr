"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Receipt, CheckCircle, CreditCard, Clock, LayoutGrid } from "lucide-react"
import toast from "react-hot-toast"
import NavBar from "@/components/common/NavBar"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function CashierDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'bills' | 'map'>('bills')
  const [audioEnabled, setAudioEnabled] = useState(false); // Must be false for mobile security policy
  const audioEnabledRef = React.useRef(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // WhatsApp Modal State
  const [waModal, setWaModal] = useState<{isOpen: boolean, data: any, paymentMethod: 'CASH' | 'UPI' | null}>({isOpen: false, data: null, paymentMethod: null});
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
  }, {});

  // Live Floor Map: 15 Dine-in Tables
  const TOTAL_TABLES = 15;
  const tableNumbers = Array.from({ length: TOTAL_TABLES }, (_, i) => String(i + 1));
  
  const tableStatusList = tableNumbers.map(tNum => {
    const group = Object.values(tableGroups).find((g: any) => {
      const cleanG = String(g.table).replace(/[^0-9]/g, '');
      return cleanG === tNum;
    }) as any;

    if (group) {
      return {
        tableNumber: tNum,
        status: group.requestedBill ? 'BILLING' : 'OCCUPIED',
        total: group.total,
        orderCount: group.orders.length,
        group
      };
    }
    return {
      tableNumber: tNum,
      status: 'FREE',
      total: 0,
      orderCount: 0,
      group: null
    };
  });

  const freeCount = tableStatusList.filter(t => t.status === 'FREE').length;
  const occupiedCount = tableStatusList.filter(t => t.status === 'OCCUPIED').length;
  const billingCount = tableStatusList.filter(t => t.status === 'BILLING').length;
  const deliveryGroups = Object.values(tableGroups).filter((g: any) => g.table.match(/^(Swiggy|Zomato|Takeaway)/i));

  const markPaid = async (tableNumber: string, orderIds: number[], paymentMethod: 'CASH' | 'UPI', customerPhone?: string) => {
    // Optimistic UI
    setOrders(prev => prev.filter(o => o.table_number !== tableNumber))
    
    // Use secure backend API instead of direct Supabase access
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, status: 'completed', paymentMethod, customerPhone })
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      toast.success(`Table ${tableNumber} cleared!`);
    } catch(e) {
      toast.error("Failed to mark as paid");
    }
  }

  const printReceipt = (tableNumber: string, groupOrders: any[], subtotal: number, gst: number, serviceCharge: number, grandTotal: number, paymentMethod?: string) => {
    const printWindow = window.open('', '', 'width=420,height=700');
    if (!printWindow) return toast.error('Please allow popups to print receipts');

    // Date formatting: DD/MM/YY hh:mm A (e.g. 17/08/26 01:12 PM)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedDate = `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    // Invoice No
    const firstOrder = groupOrders[0];
    const orderNum = firstOrder?.order_number || firstOrder?.id || 101;
    const invoiceNo = `HWB-${String(orderNum).padStart(4, '0')}`;

    // Order type & Location
    const isDelivery = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i);
    const orderType = isDelivery ? tableNumber : 'Dine-in';
    const location = isDelivery ? 'Counter' : (tableNumber.toLowerCase().includes('table') ? tableNumber : `Table ${tableNumber}`);

    // Items table rows
    const itemsRows = groupOrders.flatMap(order => {
      let parsed: any[] = [];
      try { parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e) {}
      if (!Array.isArray(parsed)) parsed = [];
      return parsed.filter((it: any) => it.id !== 'NOTE');
    }).map((it: any) => `
      <tr>
        <td style="padding: 3px 0; text-align: left; word-break: break-word;">${it.name}</td>
        <td style="padding: 3px 0; text-align: center;">${it.qty}</td>
        <td style="padding: 3px 0; text-align: right;">${it.price}</td>
        <td style="padding: 3px 0; text-align: right; font-weight: 600;">${it.price * it.qty}</td>
      </tr>
    `).join('');

    // Tax breakdown: CGST 2.5% + SGST 2.5%
    const cgst = (subtotal * 0.025).toFixed(2);
    const sgst = (subtotal * 0.025).toFixed(2);
    const exactTax = Number(cgst) + Number(sgst);
    const exactSum = subtotal + exactTax + (serviceCharge || 0);
    const roundOff = (grandTotal - exactSum).toFixed(2);

    // Payment display
    const paidLabel = paymentMethod ? `PAID • ${paymentMethod}` : 'DUE / PENDING';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNo} - ${location}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
              color: #000;
              width: 76mm;
              max-width: 320px;
              margin: 0 auto;
              padding: 12px 8px;
              font-size: 12px;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .divider {
              border-bottom: 1px dashed #222;
              margin: 7px 0;
            }
            .header-title {
              font-size: 17px;
              font-weight: 800;
              letter-spacing: 0.5px;
              margin: 0 0 3px 0;
            }
            .header-sub {
              font-size: 10.5px;
              color: #333;
              margin: 1.5px 0;
              line-height: 1.25;
            }
            .meta-grid {
              width: 100%;
              font-size: 11px;
              margin: 4px 0;
            }
            .meta-grid td {
              padding: 1.5px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11.5px;
              margin: 3px 0;
            }
            .items-table th {
              font-size: 10.5px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 4px 0;
              border-top: 1px dashed #222;
              border-bottom: 1px dashed #222;
            }
            .calc-row {
              display: flex;
              justify-content: space-between;
              font-size: 11.5px;
              padding: 1.5px 0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 15px;
              font-weight: 900;
              padding: 3px 0;
            }
            .footer-text {
              font-size: 11.5px;
              font-weight: bold;
              margin: 6px 0 2px 0;
            }
            .powered-by {
              font-size: 9.5px;
              color: #666;
              margin-top: 2px;
            }
            .qr-box {
              text-align: center;
              margin: 8px 0;
              padding: 6px;
              border: 1px dashed #999;
              border-radius: 6px;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: sticky; top: 0; background: #1E1B16; padding: 10px 8px; margin: -12px -8px 12px -8px; display: flex; gap: 8px; justify-content: space-between; align-items: center; z-index: 9999; border-bottom: 2px solid #A18D6D; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <button onclick="handleBackOrClose()" style="background: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              ⬅ Back to Counter
            </button>
            <button onclick="window.print()" style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🖨️ Print Receipt (80mm)
            </button>
          </div>
          <!-- Brand Header -->
          <div class="text-center">
            <div class="header-title">Hotel White Bliss</div>
            <div class="header-sub">Dnyaneshwar Nagar, Pathardi Phata, Nashik, Maharashtra 422009</div>
            <div class="header-sub">GSTIN: 27AABCH1234F1Z5 • FSSAI: 11521045000123</div>
            <div class="header-sub">Contact: 7499934257</div>
          </div>

          <div class="divider"></div>

          <!-- Metadata -->
          <table class="meta-grid">
            <tr>
              <td class="text-left" style="color:#555; width:35%;">Invoice No</td>
              <td class="text-right bold">${invoiceNo}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Date</td>
              <td class="text-right">${formattedDate}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Type</td>
              <td class="text-right">${orderType}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Location</td>
              <td class="text-right bold">${location}</td>
            </tr>
          </table>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left" style="width: 48%;">Item</th>
                <th class="text-center" style="width: 14%;">Qty</th>
                <th class="text-right" style="width: 18%;">Rate</th>
                <th class="text-right" style="width: 20%;">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="divider"></div>

          <!-- Financial Breakdown -->
          <div class="calc-row">
            <span>Subtotal</span>
            <span>₹${subtotal}</span>
          </div>
          <div class="calc-row">
            <span>CGST (2.5%)</span>
            <span>₹${cgst}</span>
          </div>
          <div class="calc-row">
            <span>SGST (2.5%)</span>
            <span>₹${sgst}</span>
          </div>
          ${serviceCharge > 0 ? `
          <div class="calc-row">
            <span>Service Charge (5%)</span>
            <span>₹${serviceCharge}</span>
          </div>` : ''}
          ${Number(roundOff) !== 0 ? `
          <div class="calc-row" style="color:#666;">
            <span>Round Off</span>
            <span>${roundOff}</span>
          </div>` : ''}

          <div class="divider"></div>

          <!-- Total -->
          <div class="total-row">
            <span>TOTAL</span>
            <span>₹${grandTotal}</span>
          </div>

          <div class="divider"></div>

          <!-- Payment Status (from OrderSeva layout) -->
          <div class="text-center bold" style="font-size: 13px; margin: 4px 0 1px 0; letter-spacing: 0.5px;">
            ${paidLabel}
          </div>
          <div class="text-center" style="font-size: 9.5px; color: #666; margin-bottom: 6px;">
            Taxes as applicable
          </div>

          <!-- Dynamic UPI QR -->
          ${paymentMethod !== 'CASH' ? `
          <div class="qr-box">
            <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px;">SCAN TO PAY VIA UPI</div>
            <img 
              id="qrImg"
              src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=7499934257@okaxis&pn=Hotel%20White%20Bliss&am=${grandTotal}&cu=INR&tn=${invoiceNo}%20${location}`)}" 
              width="130" 
              height="130" 
              style="margin: 0 auto; display: block;" 
              alt="UPI QR Code" 
            />
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px;">Exact Amount: ₹${grandTotal}</div>
            <div style="font-size: 9px; color: #666;">Google Pay / PhonePe / Paytm</div>
          </div>
          <div class="divider"></div>
          ` : ''}

          <!-- Footer -->
          <div class="text-center">
            <div class="footer-text">Thank you! Please visit again!</div>
            <div class="powered-by">powered by BlissPOS</div>
          </div>

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
                  window.location.href = '/pos';
                }
              }, 100);
            }

            const img = document.getElementById('qrImg');
            let printed = false;
            const doPrint = () => {
              if (printed) return;
              printed = true;
              window.focus();
              try { window.print(); } catch(e){}
            };
            if (img && !img.complete) {
              img.onload = doPrint;
              img.onerror = doPrint;
              setTimeout(doPrint, 1500);
            } else {
              window.onload = doPrint;
              setTimeout(doPrint, 400);
            }

            window.onafterprint = function() {
              if (window.opener) {
                setTimeout(function() {
                  try { window.close(); } catch(e){}
                }, 500);
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  const handleSendWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders, grandTotal } = waModal.data;
    
    const cleanPhone = waPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error("Invalid phone number");

    const tableNameDisplay = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table ${tableNumber}`;
    
    const orderIds = groupOrders.map((o: any) => o.id).join('-');
    const cleanUrl = `${window.location.origin}/bill/${orderIds}`;

    const text = `🧾 *HOTEL WHITE BLISS* 🧾\n------------------------\n${tableNameDisplay} | Date: ${new Date().toLocaleDateString()}\n------------------------\n*GRAND TOTAL: ₹${grandTotal}*\nPayment Status: PAID VIA ${waModal.paymentMethod}\n------------------------\n📄 *View & Download your Proper PDF Bill here:*\n${cleanUrl}\n------------------------\n⭐ *Rate your experience on Google:*\nhttps://www.google.com/search?q=Hotel+White+Bliss+Nashik\n------------------------\nThank you for dining with us! 🙏`;
    
    // Direct synchronous user action bypassing blockers
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Mark as Paid
    markPaid(tableNumber, groupOrders.map((o:any)=>o.id), waModal.paymentMethod, cleanPhone);
    
    setWaModal({ isOpen: false, data: null, paymentMethod: null });
    setWaPhone('');
  }

  const handleSkipWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders } = waModal.data;
    // Mark as Paid without WA
    markPaid(tableNumber, groupOrders.map((o:any)=>o.id), waModal.paymentMethod);
    setWaModal({ isOpen: false, data: null, paymentMethod: null });
    setWaPhone('');
  }

  return (
    <>
      <NavBar />
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=service-bell-ring-14610.mp3" preload="auto" />
      <div className="min-h-screen bg-gray-50 p-3 pt-20 sm:p-6 sm:pt-24 md:p-8 md:pt-28">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <Receipt className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8"/> Cashier / Billing
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage payments and clear tables</p>
          </div>
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
              }
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-white transition ${
              audioEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600 animate-pulse"
            }`}
          >
            {audioEnabled ? "🔔 Alerts On" : "🔕 Enable Alerts"}
          </button>
        </div>

        {/* Top View Selector & Quick Glance */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="inline-flex p-1 bg-gray-200/90 rounded-2xl max-w-md w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'bills'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt size={17} className={activeTab === 'bills' ? 'text-blue-600' : 'text-gray-500'} />
              <span>Active Bills ({Object.keys(tableGroups).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid size={17} className={activeTab === 'map' ? 'text-emerald-600' : 'text-gray-500'} />
              <span>Floor Map (15)</span>
            </button>
          </div>

          {/* Quick Table Status Summary */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold shadow-sm overflow-x-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> {freeCount} Free
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1.5 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> {occupiedCount} Dining
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> {billingCount} Ready
              </span>
            </div>
            {activeTab === 'bills' && (
              <button
                onClick={() => setActiveTab('map')}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold pl-2 flex items-center gap-0.5 underline sm:no-underline"
              >
                View Map ➜
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Live Floor Status & Table Map */}
        {activeTab === 'map' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>🗺️</span> Live Floor Map (All 15 Tables)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Real-time table occupancy & billing overview. Tap any table to jump to its bill.</p>
              </div>

              {/* Status Legend Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> {freeCount} Free
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> {occupiedCount} Dining
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {billingCount} Bill Ready
                </span>
                {deliveryGroups.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> {deliveryGroups.length} Delivery
                  </span>
                )}
              </div>
            </div>

            {/* 15 Table Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {tableStatusList.map(t => {
                const isOccupied = t.status === 'OCCUPIED';
                const isBilling = t.status === 'BILLING';
                const isFree = t.status === 'FREE';

                return (
                  <button
                    key={t.tableNumber}
                    onClick={() => {
                      if (t.group) {
                        setActiveTab('bills');
                        setTimeout(() => {
                          const el = document.getElementById(`table-card-${t.group.table}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 120);
                        toast(`Viewing Table ${t.tableNumber}`, { icon: '📍' });
                      } else {
                        toast(`Table ${t.tableNumber} is Free & Ready for Guests`, { icon: '🟢' });
                      }
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition active:scale-95 flex flex-col items-center justify-between min-h-[74px] ${
                      isBilling
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 shadow-sm animate-pulse'
                        : isOccupied
                        ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                        : 'bg-green-50/50 border-green-200 hover:bg-green-100/60'
                    }`}
                  >
                    <span className="font-extrabold text-sm text-gray-900">
                      Table {t.tableNumber}
                    </span>
                    
                    {isFree && (
                      <span className="text-[10px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded">
                        🟢 Free
                      </span>
                    )}
                    {isOccupied && (
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[11px] font-black text-blue-700">₹{t.total}</span>
                        <span className="text-[9px] text-blue-600 font-semibold">Dining</span>
                      </div>
                    )}
                    {isBilling && (
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[11px] font-black text-amber-800">₹{t.total}</span>
                        <span className="text-[9px] font-bold text-amber-700">Bill Ready</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Active Billing Section */}
        {activeTab === 'bills' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🧾</span> Active Bills To Settle ({Object.keys(tableGroups).length})
              </h2>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Object.values(tableGroups).map((group: any) => (
            <div id={`table-card-${group.table}`} key={group.table} className={`bg-white rounded-2xl shadow-sm border p-4 sm:p-6 transition-all ${group.requestedBill ? 'ring-2 ring-orange-400 shadow-orange-100' : 'border-gray-200'}`}>
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
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition active:scale-95 text-sm"
                      >
                        🖨️ Print KOT / Bill
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal }, paymentMethod: 'CASH' })}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 text-sm shadow-sm"
                      >
                        💵 Paid via Cash
                      </button>
                      <button 
                        onClick={() => setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal }, paymentMethod: 'UPI' })}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition active:scale-95 text-sm shadow-sm"
                      >
                        📱 Paid via UPI
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
          {Object.keys(tableGroups).length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">All Bills Settled!</h3>
              <p className="text-xs text-gray-500 mb-4">No active dining or pending billing requests right now.</p>
              <button
                onClick={() => setActiveTab('map')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                <LayoutGrid size={15} /> Open Floor Map ({freeCount} Free Tables)
              </button>
            </div>
          )}
        </div>
          </div>
        )}
      </div>

      {waModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#25D366] p-4 text-white text-center">
              <h3 className="font-bold text-lg">Send WhatsApp Bill</h3>
              <p className="text-white/80 text-sm">Table {waModal.data?.tableNumber} • Paid via {waModal.paymentMethod}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Customer Phone Number (Optional)</label>
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
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={handleSendWa}
                  className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd5b] transition shadow-md"
                >
                  💬 Send Bill on WA & Clear Table
                </button>
                <button 
                  onClick={() => {
                    if (!waModal.data) return;
                    const { tableNumber, groupOrders, subtotal, gst, serviceCharge, grandTotal } = waModal.data;
                    printReceipt(tableNumber, groupOrders, subtotal, gst, serviceCharge, grandTotal, waModal.paymentMethod || undefined);
                    markPaid(tableNumber, groupOrders.map((o:any)=>o.id), waModal.paymentMethod || 'CASH');
                    setWaModal({ isOpen: false, data: null, paymentMethod: null });
                    setWaPhone('');
                  }}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-sm text-sm"
                >
                  🖨️ Print Receipt & Clear Table
                </button>
                <button 
                  onClick={handleSkipWa}
                  className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Skip WA & Clear Table
                </button>
                <button 
                  onClick={() => { setWaModal({ isOpen: false, data: null, paymentMethod: null }); setWaPhone(''); }}
                  className="w-full bg-transparent text-gray-400 font-bold py-2 rounded-xl hover:text-gray-600 transition text-sm underline"
                >
                  Cancel (Go Back)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
