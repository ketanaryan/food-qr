"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Receipt, CheckCircle, CreditCard, Clock, LayoutGrid, Search, X, Moon, AlertTriangle, CheckCircle2, ShieldAlert, Printer, Calculator } from "lucide-react"
import toast from "react-hot-toast"
import NavBar from "@/components/common/NavBar"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { TableSection, DEFAULT_TABLE_SECTIONS, extractAllTableNumbers } from "@/lib/tableConfig"

function escapeHtml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [sections, setSections] = useState<TableSection[]>(DEFAULT_TABLE_SECTIONS)
  const [activeTab, setActiveTab] = useState<'bills' | 'map'>('bills')
  const [audioEnabled, setAudioEnabled] = useState(false); // Must be false for mobile security policy
  const audioEnabledRef = React.useRef(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // WhatsApp & Settlement Modal State
  const [waModal, setWaModal] = useState<{isOpen: boolean, data: any, paymentMethod: 'CASH' | 'UPI' | 'SPLIT' | null}>({isOpen: false, data: null, paymentMethod: null});
  const [waPhone, setWaPhone] = useState('');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCashAmt, setSplitCashAmt] = useState<number>(0);
  const [tableServiceChargeDisabled, setTableServiceChargeDisabled] = useState<{ [table: string]: boolean }>({});
  const [tableFilterQuery, setTableFilterQuery] = useState('');

  // Day Close & Z-Report State
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [dayCloseLoading, setDayCloseLoading] = useState(false);
  const [dayCloseSaving, setDayCloseSaving] = useState(false);
  const [dayCloseData, setDayCloseData] = useState<any>(null);
  const [openingFloat, setOpeningFloat] = useState<number>(2000);
  const [cashDrops, setCashDrops] = useState<number>(0);
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, 'coins': 0
  });
  const [directPhysicalCash, setDirectPhysicalCash] = useState<number | null>(null);
  const [dayCloseNotes, setDayCloseNotes] = useState('');
  const [showDenomBreakdown, setShowDenomBreakdown] = useState(false);

  // Sync state to ref
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'archived')
      .neq('status', 'completed')
      .neq('status', 'rejected')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();

    fetch("/api/admin/tables")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections)
        }
      })
      .catch(() => {})

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

  // POS & Cashier Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDayCloseOpen) {
          setIsDayCloseOpen(false);
        } else if (waModal.isOpen) {
          setWaModal({ isOpen: false, data: null, paymentMethod: null });
          setWaPhone('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waModal.isOpen, isDayCloseOpen]);

  // Group by table
  const tableGroups = orders.reduce((acc: any, order: any) => {
    const t = order.table_number;
    if (!acc[t]) acc[t] = { table: t, orders: [], total: 0, requestedBill: false };
    acc[t].orders.push(order);
    acc[t].total += order.total_amount;
    if (order.status === 'billing') acc[t].requestedBill = true; // custom status for requesting bill
    return acc;
  }, {});

  // Dynamic Dine-in Tables across all configured floors
  const configuredTables = extractAllTableNumbers(sections);
  const activeOrderTables = Object.keys(tableGroups).filter(t => !t.match(/^(Swiggy|Zomato|Takeaway)/i));
  const tableNumbers = Array.from(new Set([...configuredTables, ...activeOrderTables])).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  
  const tableStatusList = tableNumbers.map(tNum => {
    const group = (tableGroups[tNum] || Object.values(tableGroups).find((g: any) => {
      const gTable = String(g.table || '').trim().toLowerCase();
      const target = String(tNum || '').trim().toLowerCase();
      if (gTable === target) return true;
      const cleanG = gTable.replace(/^(table\s*|t-?)/i, '').trim();
      const cleanT = target.replace(/^(table\s*|t-?)/i, '').trim();
      if (cleanG && cleanT && cleanG === cleanT) return true;
      const numG = gTable.replace(/[^0-9]/g, '');
      const numT = target.replace(/[^0-9]/g, '');
      return numG && numT && numG === numT && !/[a-z]/i.test(gTable) && !/[a-z]/i.test(target);
    })) as any;

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

  const markPaid = async (
    tableNumber: string, 
    orderIds: number[], 
    paymentMethod: 'CASH' | 'UPI' | 'SPLIT', 
    customerPhone?: string,
    financials?: { subtotal?: number; gst?: number; serviceCharge?: number; grandTotal?: number },
    splitDetails?: { cash: number; upi: number }
  ) => {
    const prevOrders = [...orders];
    // Optimistic UI
    setOrders(prev => prev.filter(o => o.table_number !== tableNumber));
    
    // Use secure backend API instead of direct Supabase access
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderIds, 
          status: 'completed', 
          paymentMethod, 
          customerPhone,
          ...(financials || {}),
          splitCash: splitDetails?.cash,
          splitUpi: splitDetails?.upi
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update orders");
      }
      toast.success(`Table ${tableNumber} cleared!`);
    } catch(e: any) {
      setOrders(prevOrders);
      fetchOrders();
      toast.error(e?.message || "Failed to mark as paid — Table restored");
    }
  }

  const printReceipt = (tableNumber: string, groupOrders: any[], subtotal: number, gst: number, serviceCharge: number, grandTotal: number, paymentMethod?: string, splitDetails?: { cash: number; upi: number }) => {
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
        <td style="padding: 3px 0; text-align: left; word-break: break-word;">${escapeHtml(it.name)}</td>
        <td style="padding: 3px 0; text-align: center;">${escapeHtml(it.qty)}</td>
        <td style="padding: 3px 0; text-align: right;">${escapeHtml(it.price)}</td>
        <td style="padding: 3px 0; text-align: right; font-weight: 600;">${Number(it.price) * Number(it.qty)}</td>
      </tr>
    `).join('');

    // Tax breakdown: CGST 2.5% + SGST 2.5%
    const cgst = (subtotal * 0.025).toFixed(2);
    const sgst = (subtotal * 0.025).toFixed(2);
    const exactTax = Number(cgst) + Number(sgst);
    const exactSum = subtotal + exactTax + (serviceCharge || 0);
    const roundOff = (grandTotal - exactSum).toFixed(2);

    // Payment display
    const paidLabel = (paymentMethod === 'SPLIT' && splitDetails)
      ? `PAID • SPLIT (Cash ₹${splitDetails.cash} + UPI ₹${splitDetails.upi})`
      : paymentMethod ? `PAID • ${paymentMethod}` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${escapeHtml(invoiceNo)} - ${escapeHtml(location)}</title>
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
          <div class="text-center bold" style="font-size: 12px; letter-spacing: 1.5px; margin: 2px 0;">TAX INVOICE</div>
          <div class="divider"></div>

          <!-- Metadata -->
          <table class="meta-grid">
            <tr>
              <td class="text-left" style="color:#555; width:35%;">Invoice No</td>
              <td class="text-right bold">${escapeHtml(invoiceNo)}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Date</td>
              <td class="text-right">${escapeHtml(formattedDate)}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Type</td>
              <td class="text-right">${escapeHtml(orderType)}</td>
            </tr>
            <tr>
              <td class="text-left" style="color:#555;">Location</td>
              <td class="text-right bold">${escapeHtml(location)}</td>
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

          <!-- Payment Status (shown only when settled) -->
          ${paymentMethod ? `
          <div class="text-center bold" style="font-size: 12px; margin: 4px 0 2px 0; letter-spacing: 0.5px; border: 1px solid #222; padding: 2px 4px; border-radius: 4px;">
            ${escapeHtml(paidLabel)}
          </div>
          ` : ''}
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
  };

  // Denomination Calculation Helper
  const denomTotal = 
    (Number(denominations['500']) || 0) * 500 +
    (Number(denominations['200']) || 0) * 200 +
    (Number(denominations['100']) || 0) * 100 +
    (Number(denominations['50']) || 0) * 50 +
    (Number(denominations['20']) || 0) * 20 +
    (Number(denominations['10']) || 0) * 10 +
    (Number(denominations['coins']) || 0);

  const physicalCashCounted = directPhysicalCash !== null ? directPhysicalCash : denomTotal;

  const handleOpenDayClose = async () => {
    setIsDayCloseOpen(true);
    setDayCloseLoading(true);
    try {
      const res = await fetch('/api/admin/day-close');
      const data = await res.json();
      if (data.success) {
        setDayCloseData(data);
        if (data.closedReport) {
          setOpeningFloat(data.closedReport.opening_float);
          setCashDrops(data.closedReport.cash_drops || 0);
          setDirectPhysicalCash(data.closedReport.physical_cash);
          setDenominations(data.closedReport.denominations || {});
          setDayCloseNotes(data.closedReport.notes || '');
        } else {
          setOpeningFloat(data.liveStats?.defaultFloat || 2000);
          setDirectPhysicalCash(null);
          setDenominations({ '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, 'coins': 0 });
          setCashDrops(0);
          setDayCloseNotes('');
        }
      } else {
        toast.error(data.message || 'Failed to load day stats');
      }
    } catch {
      toast.error('Network error loading day stats');
    } finally {
      setDayCloseLoading(false);
    }
  };

  const handleFinalizeDayClose = async () => {
    if (!dayCloseData?.liveStats) return;
    const stats = dayCloseData.liveStats;
    const expected = Number(openingFloat || 0) + Number(stats.systemCash || 0) - Number(cashDrops || 0);
    const variance = physicalCashCounted - expected;

    setDayCloseSaving(true);
    try {
      const res = await fetch('/api/admin/day-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dayCloseData.date,
          opening_float: openingFloat,
          system_cash: stats.systemCash,
          system_upi: stats.systemUpi,
          system_other: stats.systemOther,
          gross_sales: stats.grossSales,
          net_sales: stats.netSales,
          total_tax: stats.totalTax,
          service_charge: stats.serviceCharge,
          total_bills: stats.totalBills,
          cash_drops: cashDrops,
          physical_cash: physicalCashCounted,
          denominations,
          notes: dayCloseNotes
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setDayCloseData((prev: any) => ({ ...prev, closedReport: data.report }));
        toast.success(`Day Closed & Reconciled! Status: ${data.report.status} (Variance: ₹${data.report.variance})`, {
          icon: data.report.status === 'BALANCED' ? '🟢' : data.report.status === 'OVERAGE' ? '🟡' : '🔴',
          duration: 6000
        });
      } else {
        toast.error(data.message || 'Failed to save day close');
      }
    } catch {
      toast.error('Network error saving day close');
    } finally {
      setDayCloseSaving(false);
    }
  };

  const printZReport = (report: any) => {
    const printWindow = window.open('', '', 'width=420,height=750');
    if (!printWindow) return toast.error('Please allow popups to print Z-Report');

    const now = new Date(report.closed_at || Date.now());
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedDate = `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const statusText = report.variance === 0 
      ? 'BALANCED (EXACT MATCH)' 
      : report.variance > 0 
      ? `OVERAGE (+₹${report.variance})` 
      : `SHORTAGE (-₹${Math.abs(report.variance)})`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Z-Report - ${escapeHtml(report.date)}</title>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 74mm;
            margin: 0 auto;
            color: #000;
            font-size: 11px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          .title { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
          .badge {
            display: inline-block;
            border: 1.5px solid #000;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: bold;
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">HOTEL WHITE BLISS</div>
          <div>Near Pathardi Phata, Nashik</div>
          <div>GSTIN: 27AABCH1234F1Z5 • FSSAI: 11521034000123</div>
          <div class="divider"></div>
          <div class="badge">END-OF-DAY Z-REPORT</div>
          <div style="font-size: 9.5px; margin-top: 2px;">CASH DRAWER RECONCILIATION</div>
        </div>

        <div class="divider"></div>
        <div class="flex-between"><span>Report ID:</span><span class="bold">${escapeHtml(report.id)}</span></div>
        <div class="flex-between"><span>Shift Date:</span><span class="bold">${escapeHtml(report.date)}</span></div>
        <div class="flex-between"><span>Closed At:</span><span>${escapeHtml(formattedDate)}</span></div>
        <div class="flex-between"><span>Closed By:</span><span class="bold">${escapeHtml(report.closed_by || 'Cashier Counter')}</span></div>

        <div class="double-divider"></div>
        <div class="bold text-center" style="font-size: 11px; margin-bottom: 3px;">--- SALES AUDIT SUMMARY ---</div>
        <div class="flex-between"><span>Total Invoices Settled:</span><span class="bold">${report.total_bills}</span></div>
        <div class="flex-between"><span>Net Food Sales:</span><span>₹${report.net_sales}</span></div>
        <div class="flex-between"><span>Total GST (5%):</span><span>₹${report.total_tax}</span></div>
        <div class="flex-between"><span>Service Charge:</span><span>₹${report.service_charge || 0}</span></div>
        <div class="divider"></div>
        <div class="flex-between bold" style="font-size: 12px;"><span>GROSS REVENUE:</span><span>₹${report.gross_sales}</span></div>

        <div class="double-divider"></div>
        <div class="bold text-center" style="font-size: 11px; margin-bottom: 3px;">--- PAYMENT TENDER BREAKDOWN ---</div>
        <div class="flex-between"><span>📱 UPI Collections:</span><span class="bold">₹${report.system_upi}</span></div>
        <div class="flex-between"><span>💵 Cash Collections:</span><span class="bold">₹${report.system_cash}</span></div>
        ${report.system_other > 0 ? `<div class="flex-between"><span>Card / Aggregators:</span><span>₹${report.system_other}</span></div>` : ''}

        <div class="double-divider"></div>
        <div class="bold text-center" style="font-size: 11px; margin-bottom: 3px;">--- CASH DRAWER RECONCILIATION ---</div>
        <div class="flex-between"><span>Opening Float:</span><span>₹${report.opening_float}</span></div>
        <div class="flex-between"><span>(+) Cash Sales:</span><span>₹${report.system_cash}</span></div>
        <div class="flex-between"><span>(-) Cash Drops / Petty:</span><span>₹${report.cash_drops || 0}</span></div>
        <div class="divider"></div>
        <div class="flex-between bold"><span>EXPECTED IN DRAWER:</span><span>₹${report.expected_cash}</span></div>
        <div class="flex-between bold" style="font-size: 12px; margin-top: 2px;">
          <span>PHYSICAL COUNTED:</span>
          <span>₹${report.physical_cash}</span>
        </div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 12px; margin: 6px 0; border: 1.5px solid #000; padding: 4px;">
          VARIANCE: ${statusText}
        </div>

        ${report.denominations && Object.values(report.denominations).some((v: any) => v > 0) ? `
          <div class="divider"></div>
          <div style="font-size: 9.5px;">
            <div class="bold">Denominations Breakdown:</div>
            <div>500x${report.denominations['500'] || 0} | 200x${report.denominations['200'] || 0} | 100x${report.denominations['100'] || 0} | 50x${report.denominations['50'] || 0}</div>
            <div>20x${report.denominations['20'] || 0} | 10x${report.denominations['10'] || 0} | Coins: ₹${report.denominations['coins'] || 0}</div>
          </div>
        ` : ''}

        ${report.notes ? `
          <div class="divider"></div>
          <div style="font-size: 9.5px;"><span class="bold">Cashier Notes:</span> ${escapeHtml(report.notes)}</div>
        ` : ''}

        <div class="double-divider"></div>
        <div style="margin-top: 25px;">
          <div class="flex-between" style="font-size: 9.5px;">
            <span>______________________<br/>Cashier Signature</span>
            <span class="text-right">______________________<br/>Manager Signature</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 8.5px; color: #555; margin-top: 6px;">
          Powered by BlissPOS • Petpooja-Grade Z-Report
        </div>

        <script>
          window.onload = function() {
            window.focus();
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders, grandTotal, subtotal, gst, serviceCharge } = waModal.data;
    
    const cleanPhone = waPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error("Invalid phone number");

    const tableNameDisplay = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table ${tableNumber}`;
    
    const orderIds = groupOrders.map((o: any) => o.id).join('-');
    const cleanUrl = `${window.location.origin}/bill/${orderIds}`;

    const splitObj = waModal.paymentMethod === 'SPLIT' 
      ? { cash: splitCashAmt, upi: Math.max(0, grandTotal - splitCashAmt) } 
      : undefined;

    const paymentText = (waModal.paymentMethod === 'SPLIT' && splitObj)
      ? `PAID VIA SPLIT (Cash ₹${splitObj.cash} + UPI ₹${splitObj.upi})`
      : `PAID VIA ${waModal.paymentMethod}`;

    const text = `🧾 *HOTEL WHITE BLISS* 🧾\n------------------------\n${tableNameDisplay} | Date: ${new Date().toLocaleDateString()}\n------------------------\n*GRAND TOTAL: ₹${grandTotal}*\nPayment Status: ${paymentText}\n------------------------\n📄 *View & Download your Proper PDF Bill here:*\n${cleanUrl}\n------------------------\n⭐ *Rate your experience on Google:*\nhttps://www.google.com/search?q=Hotel+White+Bliss+Nashik\n------------------------\nThank you for dining with us! 🙏`;
    
    // Direct synchronous user action bypassing blockers
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Mark as Paid
    markPaid(
      tableNumber, 
      groupOrders.map((o:any)=>o.id), 
      waModal.paymentMethod, 
      cleanPhone,
      { subtotal, gst, serviceCharge, grandTotal },
      splitObj
    );
    
    setWaModal({ isOpen: false, data: null, paymentMethod: null });
    setWaPhone('');
  }

  const handleSkipWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders, grandTotal, subtotal, gst, serviceCharge } = waModal.data;
    const splitObj = waModal.paymentMethod === 'SPLIT' 
      ? { cash: splitCashAmt, upi: Math.max(0, grandTotal - splitCashAmt) } 
      : undefined;
    // Mark as Paid without WA
    markPaid(
      tableNumber, 
      groupOrders.map((o:any)=>o.id), 
      waModal.paymentMethod,
      undefined,
      { subtotal, gst, serviceCharge, grandTotal },
      splitObj
    );
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleOpenDayClose}
              id="btn-day-close"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold bg-[#1E1B16] hover:bg-[#2C2720] text-amber-400 border border-amber-500/40 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Moon size={15} className="text-amber-400" />
              <span>Day Close (Z-Report)</span>
            </button>
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
              <span>Floor Map ({tableNumbers.length})</span>
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
                  <span>🗺️</span> Live Floor Map ({tableNumbers.length} Tables across {sections.length} Floors)
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🧾</span> Active Bills To Settle ({Object.keys(tableGroups).length})
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter Table (e.g. 1, 3)..."
                  value={tableFilterQuery}
                  onChange={(e) => setTableFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                {tableFilterQuery && (
                  <button onClick={() => setTableFilterQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Object.values(tableGroups)
            .filter((group: any) => !tableFilterQuery.trim() || String(group.table).toLowerCase().includes(tableFilterQuery.toLowerCase().trim()))
            .map((group: any) => (
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
                const isScDisabled = !!tableServiceChargeDisabled[group.table];
                const subtotal = group.total;
                const gst = Math.round(subtotal * 0.05);
                const serviceCharge = isScDisabled ? 0 : Math.round(subtotal * 0.05);
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
                      <div className="flex items-center justify-between font-medium opacity-90 py-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!isScDisabled}
                            onChange={(e) => setTableServiceChargeDisabled(prev => ({ ...prev, [group.table]: !e.target.checked }))}
                            className="rounded text-blue-600 accent-blue-600 w-3.5 h-3.5"
                          />
                          <span>Service Charge (5%)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={isScDisabled ? "line-through text-gray-400" : ""}>₹{Math.round(subtotal * 0.05)}</span>
                          <button
                            type="button"
                            onClick={() => setTableServiceChargeDisabled(prev => ({ ...prev, [group.table]: !isScDisabled }))}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                              isScDisabled 
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {isScDisabled ? "+ Add SC" : "Remove SC"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-200">
                        <span className="font-bold text-blue-950">Grand Total</span>
                        <span className="text-2xl font-bold text-blue-700">₹{grandTotal}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => printReceipt(group.table, group.orders, subtotal, gst, serviceCharge, grandTotal)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition active:scale-95 text-xs shadow-xs"
                        >
                          🖨️ Print Slip
                        </button>
                        <button 
                          onClick={() => {
                            printReceipt(group.table, group.orders, subtotal, gst, serviceCharge, grandTotal, 'CASH');
                            markPaid(
                              group.table, 
                              group.orders.map((o:any)=>o.id), 
                              'CASH',
                              undefined,
                              { subtotal, gst, serviceCharge, grandTotal }
                            );
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition active:scale-95 text-xs shadow-xs"
                          title="1-Click Settle & Print Cash Receipt"
                        >
                          ⚡ Quick Settle (Cash)
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => {
                            setCashTendered(grandTotal);
                            setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal }, paymentMethod: 'CASH' });
                          }}
                          className="flex items-center justify-center gap-1 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition active:scale-95 text-xs shadow-xs"
                        >
                          💵 Cash
                        </button>
                        <button 
                          onClick={() => setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal }, paymentMethod: 'UPI' })}
                          className="flex items-center justify-center gap-1 bg-purple-600 text-white font-bold py-2 rounded-xl hover:bg-purple-700 transition active:scale-95 text-xs shadow-xs"
                        >
                          📱 UPI QR
                        </button>
                        <button 
                          onClick={() => {
                            setSplitCashAmt(Math.round(grandTotal / 2));
                            setWaModal({ isOpen: true, data: { tableNumber: group.table, groupOrders: group.orders, subtotal, gst, serviceCharge, grandTotal }, paymentMethod: 'SPLIT' });
                          }}
                          className="flex items-center justify-center gap-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 transition active:scale-95 text-xs shadow-xs"
                        >
                          ⚡ Split
                        </button>
                      </div>
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
              {/* Service Charge Toggle in Modal */}
              <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-blue-950">
                  <input
                    type="checkbox"
                    checked={(waModal.data?.serviceCharge || 0) > 0}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      const sub = waModal.data?.subtotal || 0;
                      const g = waModal.data?.gst || Math.round(sub * 0.05);
                      const sc = enabled ? Math.round(sub * 0.05) : 0;
                      const newGrand = sub + g + sc;
                      setWaModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          serviceCharge: sc,
                          grandTotal: newGrand
                        }
                      }));
                    }}
                    className="rounded text-blue-600 accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Service Charge (5% - ₹{Math.round((waModal.data?.subtotal || 0) * 0.05)})</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentlyOn = (waModal.data?.serviceCharge || 0) > 0;
                    const enabled = !currentlyOn;
                    const sub = waModal.data?.subtotal || 0;
                    const g = waModal.data?.gst || Math.round(sub * 0.05);
                    const sc = enabled ? Math.round(sub * 0.05) : 0;
                    const newGrand = sub + g + sc;
                    setWaModal(prev => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        serviceCharge: sc,
                        grandTotal: newGrand
                      }
                    }));
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                    (waModal.data?.serviceCharge || 0) > 0 
                      ? "bg-red-100 text-red-800" 
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {(waModal.data?.serviceCharge || 0) > 0 ? "Remove SC" : "+ Add SC"}
                </button>
              </div>

              {/* Cash Tender & Change Calculator (Cash Mode) */}
              {waModal.paymentMethod === 'CASH' && (
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span>💵 Cash Tendered by Guest:</span>
                    <span className="text-sm font-black text-gray-900 font-mono">₹{cashTendered || waModal.data?.grandTotal || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { label: "Exact", val: waModal.data?.grandTotal || 0 },
                      { label: "₹500", val: 500 },
                      { label: "₹1000", val: 1000 },
                      { label: "₹2000", val: 2000 }
                    ].map(pill => (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => setCashTendered(pill.val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 border ${
                          (cashTendered === pill.val || (!cashTendered && pill.label === "Exact"))
                            ? 'bg-amber-600 text-white border-amber-600' 
                            : 'bg-white text-gray-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                  <div id="cash-change-box" className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                    <span>Change to Return:</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      ₹{Math.max(0, (cashTendered || waModal.data?.grandTotal || 0) - (waModal.data?.grandTotal || 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Split Payment Inputs (Split Mode) */}
              {waModal.paymentMethod === 'SPLIT' && (
                <div className="bg-indigo-50/80 border border-indigo-200 p-3 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-indigo-950 flex items-center justify-between">
                    <span>⚡ Split Payment Breakdown</span>
                    <span className="text-[11px] font-mono text-indigo-800">Total: ₹{waModal.data?.grandTotal}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 block mb-1">Cash Part (₹)</label>
                      <input
                        type="number"
                        value={splitCashAmt}
                        onChange={(e) => setSplitCashAmt(Math.max(0, Math.min(waModal.data?.grandTotal || 0, Number(e.target.value) || 0)))}
                        className="w-full bg-white border border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 block mb-1">UPI Part (₹)</label>
                      <div className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono text-purple-700 flex items-center justify-between">
                        <span>₹{Math.max(0, (waModal.data?.grandTotal || 0) - splitCashAmt)}</span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded">UPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
              <div className="flex flex-col gap-2.5 pt-1">
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
                    const splitObj = waModal.paymentMethod === 'SPLIT' 
                      ? { cash: splitCashAmt, upi: Math.max(0, grandTotal - splitCashAmt) } 
                      : undefined;
                    printReceipt(tableNumber, groupOrders, subtotal, gst, serviceCharge, grandTotal, waModal.paymentMethod || undefined, splitObj);
                    markPaid(
                      tableNumber, 
                      groupOrders.map((o:any)=>o.id), 
                      waModal.paymentMethod || 'CASH',
                      undefined,
                      { subtotal, gst, serviceCharge, grandTotal },
                      splitObj
                    );
                    setWaModal({ isOpen: false, data: null, paymentMethod: null });
                    setWaPhone('');
                  }}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-sm text-sm"
                >
                  🖨️ Print Receipt & Clear Table
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!waModal.data) return;
                    const { tableNumber, groupOrders, subtotal, gst, serviceCharge, grandTotal } = waModal.data;
                    const splitObj = waModal.paymentMethod === 'SPLIT' 
                      ? { cash: splitCashAmt, upi: Math.max(0, grandTotal - splitCashAmt) } 
                      : undefined;
                    printReceipt(tableNumber, groupOrders, subtotal, gst, serviceCharge, grandTotal, waModal.paymentMethod || undefined, splitObj);
                    toast.success("Printed updated slip to show customer!", { icon: "🖨️" });
                  }}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold py-2.5 rounded-xl transition shadow-2xs text-xs"
                >
                  📄 Reprint Slip for Customer (Keep Open)
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

      {/* MODAL: END-OF-DAY CASH DRAWER RECONCILIATION & Z-REPORT */}
      {isDayCloseOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
                  <Moon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">
                      Day-End Cash Reconciliation (Z-Report)
                    </h3>
                    {dayCloseData?.closedReport && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                        ✓ CLOSED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hotel White Bliss • Shift Date: <span className="font-bold text-gray-800">{dayCloseData?.date || new Date().toISOString().slice(0, 10)}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDayCloseOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {dayCloseLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold">Calculating live sales & cash drawer stats...</span>
              </div>
            ) : (
              <>
                {/* Active Bills Warning */}
                {Object.keys(tableGroups).length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Pending Tables Warning:</span> {Object.keys(tableGroups).length} table(s) still have un-settled bills. It is standard operating procedure to settle or transfer remaining dining tables before closing the shift.
                    </div>
                  </div>
                )}

                {/* Sales & Tender Summary Cards */}
                {(() => {
                  const stats = dayCloseData?.liveStats || { grossSales: 0, systemCash: 0, systemUpi: 0, totalBills: 0 };
                  const expectedCash = Number(openingFloat || 0) + Number(stats.systemCash || 0) - Number(cashDrops || 0);
                  const variance = physicalCashCounted - expectedCash;

                  return (
                    <div className="space-y-4">
                      {/* Top 3 Metric Cards */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Gross Sales</span>
                          <span className="text-base sm:text-lg font-black text-gray-900 font-mono mt-0.5 block">₹{stats.grossSales}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{stats.totalBills} bills settled</span>
                        </div>
                        <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-2xl">
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">📱 UPI Received</span>
                          <span className="text-base sm:text-lg font-black text-purple-900 font-mono mt-0.5 block">₹{stats.systemUpi}</span>
                          <span className="text-[10px] text-purple-600 font-semibold">Direct to Bank</span>
                        </div>
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">💵 Cash Recorded</span>
                          <span className="text-base sm:text-lg font-black text-emerald-900 font-mono mt-0.5 block">₹{stats.systemCash}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">In Drawer</span>
                        </div>
                      </div>

                      {/* Cash Drawer Reconciliation Equation Box */}
                      <div className="bg-[#FAF8F5] border border-[#E8E1D5] p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 border-b border-gray-200/80 pb-2">
                          <span className="flex items-center gap-1.5 text-gray-900">
                            <Calculator size={15} className="text-amber-600" />
                            <span>Cash Drawer Reconciliation Formula</span>
                          </span>
                          <span className="text-[11px] text-gray-500">Float + Cash Sales - Drops</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Opening Float */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Opening Float (Shift Start):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                              <input 
                                type="number"
                                min="0"
                                value={openingFloat}
                                onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 font-mono focus:border-amber-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* 2. System Cash */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              (+) System Cash Sales:
                            </label>
                            <div className="py-2 px-3 bg-emerald-100/60 border border-emerald-300 rounded-xl text-sm font-black text-emerald-900 font-mono">
                              +₹{stats.systemCash}
                            </div>
                          </div>

                          {/* 3. Cash Drops */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              (-) Cash Drops / Petty Out:
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                              <input 
                                type="number"
                                min="0"
                                value={cashDrops}
                                onChange={(e) => setCashDrops(Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 font-mono focus:border-amber-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Expected Cash Callout */}
                        <div className="flex items-center justify-between p-3 bg-white border border-amber-300/80 rounded-xl shadow-xs">
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                              Expected Cash in Drawer
                            </span>
                            <span className="text-[10px] text-gray-500">Calculated target cash to balance</span>
                          </div>
                          <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
                            ₹{expectedCash}
                          </span>
                        </div>
                      </div>

                      {/* Physical Cash Count Section */}
                      <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span>Counted Physical Cash in Drawer:</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDirectPhysicalCash(expectedCash);
                                setShowDenomBreakdown(false);
                              }}
                              className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition"
                            >
                              ⚡ Match Expected (₹{expectedCash})
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDenomBreakdown(!showDenomBreakdown)}
                              className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                            >
                              {showDenomBreakdown ? "Hide Note Counter" : "🔢 Denomination Breakdown"}
                            </button>
                          </div>
                        </div>

                        {/* Direct Fast Input */}
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">₹</span>
                          <input 
                            type="number"
                            min="0"
                            value={physicalCashCounted}
                            onChange={(e) => setDirectPhysicalCash(Number(e.target.value) || 0)}
                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-300 focus:border-gray-900 rounded-xl text-xl font-black text-gray-900 font-mono outline-none transition"
                            placeholder="Enter counted cash..."
                          />
                        </div>

                        {/* Denomination Breakdown Accordion */}
                        {showDenomBreakdown && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Note Counter Multiplier
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { note: '500', val: 500 },
                                { note: '200', val: 200 },
                                { note: '100', val: 100 },
                                { note: '50',  val: 50 },
                                { note: '20',  val: 20 },
                                { note: '10',  val: 10 }
                              ].map(item => (
                                <div key={item.note} className="bg-white p-2 rounded-lg border border-gray-200 flex items-center justify-between gap-1 text-xs">
                                  <span className="font-bold text-gray-700">₹{item.note} ×</span>
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={denominations[item.note] || ''}
                                    onChange={(e) => {
                                      const count = Math.max(0, parseInt(e.target.value) || 0);
                                      setDenominations(prev => {
                                        const updated = { ...prev, [item.note]: count };
                                        const total = 
                                          (Number(updated['500']) || 0) * 500 +
                                          (Number(updated['200']) || 0) * 200 +
                                          (Number(updated['100']) || 0) * 100 +
                                          (Number(updated['50']) || 0) * 50 +
                                          (Number(updated['20']) || 0) * 20 +
                                          (Number(updated['10']) || 0) * 10 +
                                          (Number(updated['coins']) || 0);
                                        setDirectPhysicalCash(total);
                                        return updated;
                                      });
                                    }}
                                    className="w-14 px-1.5 py-1 bg-gray-50 border border-gray-300 rounded text-right font-mono font-bold"
                                  />
                                </div>
                              ))}
                              <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center justify-between gap-1 text-xs col-span-2">
                                <span className="font-bold text-gray-700">Coins / Change:</span>
                                <input 
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={denominations['coins'] || ''}
                                  onChange={(e) => {
                                    const coins = Math.max(0, parseInt(e.target.value) || 0);
                                    setDenominations(prev => {
                                      const updated = { ...prev, coins };
                                      const total = 
                                        (Number(updated['500']) || 0) * 500 +
                                        (Number(updated['200']) || 0) * 200 +
                                        (Number(updated['100']) || 0) * 100 +
                                        (Number(updated['50']) || 0) * 50 +
                                        (Number(updated['20']) || 0) * 20 +
                                        (Number(updated['10']) || 0) * 10 +
                                        coins;
                                      setDirectPhysicalCash(total);
                                      return updated;
                                    });
                                  }}
                                  className="w-20 px-1.5 py-1 bg-gray-50 border border-gray-300 rounded text-right font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Real-Time Live Variance Box */}
                        {variance === 0 ? (
                          <div id="z-report-status-box" className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center gap-3 text-emerald-950">
                            <CheckCircle2 size={26} className="text-emerald-600 shrink-0" />
                            <div>
                              <div className="font-black text-sm text-emerald-900">
                                🟢 DRAWER BALANCED (Exact ₹0 Variance)
                              </div>
                              <div className="text-xs text-emerald-700 mt-0.5">
                                Physical cash matches expected revenue to the rupee. Ready to finalize Z-Report.
                              </div>
                            </div>
                          </div>
                        ) : variance > 0 ? (
                          <div id="z-report-status-box" className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center gap-3 text-amber-950">
                            <AlertTriangle size={26} className="text-amber-600 shrink-0" />
                            <div>
                              <div className="font-black text-sm text-amber-900">
                                🟡 CASH OVERAGE (+₹{variance})
                              </div>
                              <div className="text-xs text-amber-800 mt-0.5">
                                You have ₹{variance} surplus cash in the drawer above the recorded system sales.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div id="z-report-status-box" className="p-3.5 bg-red-50 border-2 border-red-400 rounded-2xl flex items-center gap-3 text-red-950">
                            <ShieldAlert size={26} className="text-red-600 shrink-0" />
                            <div>
                              <div className="font-black text-sm text-red-900">
                                🔴 CASH SHORTAGE (-₹{Math.abs(variance)})
                              </div>
                              <div className="text-xs text-red-700 mt-0.5">
                                Warning: Physical cash is ₹{Math.abs(variance)} less than expected. Discrepancy will be documented for owner review.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Cashier Shift Remarks / Notes (Optional):
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Evening dinner shift closed smoothly. Float kept in safe."
                            value={dayCloseNotes}
                            onChange={(e) => setDayCloseNotes(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:border-gray-900 outline-none"
                          />
                        </div>
                      </div>

                      {/* Modal Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const reportObj = dayCloseData?.closedReport || {
                              id: `Z-${(dayCloseData?.date || 'TODAY').replace(/-/g, '')}`,
                              date: dayCloseData?.date || new Date().toISOString().slice(0, 10),
                              closed_at: new Date().toISOString(),
                              closed_by: 'Cashier Counter',
                              total_bills: stats.totalBills,
                              gross_sales: stats.grossSales,
                              net_sales: stats.netSales,
                              total_tax: stats.totalTax,
                              service_charge: stats.serviceCharge,
                              system_upi: stats.systemUpi,
                              system_cash: stats.systemCash,
                              system_other: stats.systemOther,
                              opening_float: openingFloat,
                              cash_drops: cashDrops,
                              expected_cash: expectedCash,
                              physical_cash: physicalCashCounted,
                              variance,
                              status: variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE',
                              denominations,
                              notes: dayCloseNotes
                            };
                            printZReport(reportObj);
                          }}
                          className="w-full sm:w-1/2 py-3 px-4 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                        >
                          <Printer size={16} />
                          <span>Print 80mm Z-Report Slip</span>
                        </button>

                        <button
                          type="button"
                          disabled={dayCloseSaving}
                          onClick={handleFinalizeDayClose}
                          className="w-full sm:w-1/2 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          {dayCloseSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Moon size={16} />
                          )}
                          <span>Save & Finalize Day Close</span>
                        </button>
                      </div>

                    </div>
                  );
                })()}
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
