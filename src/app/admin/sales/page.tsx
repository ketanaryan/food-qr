"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Calendar, Search, Filter, Moon, Receipt, Printer, AlertTriangle, CheckCircle2, ShieldAlert, FileText, ChevronRight, Calculator, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { consolidateOrders, ConsolidatedBill } from "@/lib/orderConsolidation";

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SalesReport() {
  const [orders, setOrders] = useState<ConsolidatedBill[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tabs: 'orders' | 'zreports'
  const [salesTab, setSalesTab] = useState<'orders' | 'zreports'>('orders');
  const [zReports, setZReports] = useState<any[]>([]);
  const [zReportsLoading, setZReportsLoading] = useState(false);
  const [selectedZReportModal, setSelectedZReportModal] = useState<any>(null);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalNetSales, setTotalNetSales] = useState(0);
  const [totalGst, setTotalGst] = useState(0);
  const [totalServiceCharge, setTotalServiceCharge] = useState(0);
  const [totalTaxAndCharges, setTotalTaxAndCharges] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalUpi, setTotalUpi] = useState(0);
  const [totalOther, setTotalOther] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    // Default to current month using local date representation
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(toLocalDateString(firstDay));
    setEndDate(toLocalDateString(lastDay));
  }, []);

  useEffect(() => {
    if (salesTab === 'zreports') {
      fetchZReports();
    }
  }, [salesTab]);

  const fetchZReports = async () => {
    setZReportsLoading(true);
    try {
      const res = await fetch('/api/admin/day-close');
      const data = await res.json();
      if (data.success && Array.isArray(data.allReports)) {
        setZReports(data.allReports);
      }
    } catch {
      toast.error("Failed to load Z-Reports");
    } finally {
      setZReportsLoading(false);
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
        <title>Z-Report - ${report.date}</title>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          body { font-family: 'Courier New', monospace; width: 74mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.35; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          .title { font-size: 14px; font-weight: bold; }
          .badge { display: inline-block; border: 1.5px solid #000; padding: 2px 6px; font-size: 11px; font-weight: bold; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">HOTEL MARQUIS</div>
          <div>Near Pathardi Phata, Nashik</div>
          <div>GSTIN: 27AABCH1234F1Z5 • FSSAI: 11521034000123</div>
          <div class="divider"></div>
          <div class="badge">END-OF-DAY Z-REPORT</div>
          <div style="font-size: 9.5px;">CASH DRAWER RECONCILIATION</div>
        </div>
        <div class="divider"></div>
        <div class="flex-between"><span>Report ID:</span><span class="bold">${report.id}</span></div>
        <div class="flex-between"><span>Shift Date:</span><span class="bold">${report.date}</span></div>
        <div class="flex-between"><span>Closed At:</span><span>${formattedDate}</span></div>
        <div class="flex-between"><span>Closed By:</span><span class="bold">${report.closed_by || 'Cashier Counter'}</span></div>
        <div class="double-divider"></div>
        <div class="bold text-center">--- SALES AUDIT SUMMARY ---</div>
        <div class="flex-between"><span>Total Invoices Settled:</span><span class="bold">${report.total_bills}</span></div>
        <div class="flex-between"><span>Net Food Sales:</span><span>₹${report.net_sales}</span></div>
        <div class="flex-between"><span>Total GST (5%):</span><span>₹${report.total_tax}</span></div>
        <div class="flex-between"><span>Service Charge:</span><span>₹${report.service_charge || 0}</span></div>
        <div class="divider"></div>
        <div class="flex-between bold" style="font-size: 12px;"><span>GROSS REVENUE:</span><span>₹${report.gross_sales}</span></div>
        <div class="double-divider"></div>
        <div class="bold text-center">--- PAYMENT TENDERS ---</div>
        <div class="flex-between"><span>📱 UPI Collections:</span><span class="bold">₹${report.system_upi}</span></div>
        <div class="flex-between"><span>💵 Cash Collections:</span><span class="bold">₹${report.system_cash}</span></div>
        <div class="double-divider"></div>
        <div class="bold text-center">--- DRAWER RECONCILIATION ---</div>
        <div class="flex-between"><span>Opening Float:</span><span>₹${report.opening_float}</span></div>
        <div class="flex-between"><span>(+) Cash Sales:</span><span>₹${report.system_cash}</span></div>
        <div class="flex-between"><span>(-) Cash Drops / Petty:</span><span>₹${report.cash_drops || 0}</span></div>
        <div class="divider"></div>
        <div class="flex-between bold"><span>EXPECTED IN DRAWER:</span><span>₹${report.expected_cash}</span></div>
        <div class="flex-between bold" style="font-size: 12px;"><span>PHYSICAL COUNTED:</span><span>₹${report.physical_cash}</span></div>
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 12px; margin: 6px 0; border: 1.5px solid #000; padding: 4px;">
          VARIANCE: ${statusText}
        </div>
        ${report.notes ? `<div class="divider"></div><div style="font-size: 9.5px;"><span class="bold">Notes:</span> ${report.notes}</div>` : ''}
        <div class="double-divider"></div>
        <div style="margin-top: 25px;">
          <div class="flex-between" style="font-size: 9.5px;">
            <span>______________________<br/>Cashier Signature</span>
            <span style="text-align: right;">______________________<br/>Manager Signature</span>
          </div>
        </div>
        <script>
          window.onload = function() { window.focus(); setTimeout(function() { window.print(); }, 300); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchSales();
    }
  }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    
    // We need to fetch up to the end of the selected end date
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const startObj = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
    
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const endObj = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['completed', 'billing'])
      .gte('created_at', startObj.toISOString())
      .lte('created_at', endObj.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load sales data");
    } else if (data) {
      const consolidated = consolidateOrders(data);
      setOrders(consolidated);
      
      const rev = consolidated.reduce((acc, b) => acc + b.grand_total, 0);
      const net = consolidated.reduce((acc, b) => acc + Math.max(0, b.subtotal - (b.discount || 0)), 0);
      const gst = consolidated.reduce((acc, b) => acc + b.gst, 0);
      const sc = consolidated.reduce((acc, b) => acc + (b.service_charge || 0), 0);
      
      let cash = 0;
      let upi = 0;
      let other = 0;

      consolidated.forEach(b => {
        if (b.payment_method === 'CASH') {
          cash += b.grand_total;
        } else if (b.payment_method === 'UPI') {
          upi += b.grand_total;
        } else if (b.payment_method === 'SPLIT') {
          const splitCash = typeof b.split_cash === 'number' ? b.split_cash : Math.round(b.grand_total / 2);
          const splitUpi = typeof b.split_upi === 'number' ? b.split_upi : (b.grand_total - splitCash);
          cash += splitCash;
          upi += splitUpi;
        } else {
          other += b.grand_total;
        }
      });

      setTotalRevenue(rev);
      setTotalNetSales(net);
      setTotalGst(gst);
      setTotalServiceCharge(sc);
      setTotalTaxAndCharges(gst + sc);
      setTotalCash(cash);
      setTotalUpi(upi);
      setTotalOther(other);
      setTotalOrders(consolidated.length);
    }
    
    setLoading(false);
  };

  const exportCSV = () => {
    if (orders.length === 0) return toast.error("No data to export");
    
    let csvContent = "Bill ID,Table,KOTs,Payment Mode,Paid Time,Order Time,Gross Subtotal (Rs),Discount (Rs),Net Food (Rs),GST 5% (Rs),CGST 2.5% (Rs),SGST 2.5% (Rs),Service Charge (Rs),Grand Total (Rs),Status,Items\n";
    
    orders.forEach(o => {
      const paidDate = new Date(o.settled_at || o.created_at);
      const orderDate = new Date(o.created_at);
      const paidStr = `${paidDate.toLocaleDateString()} ${paidDate.toLocaleTimeString()}`;
      const orderStr = `${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`;
      
      const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join(' | ').replace(/"/g, '""');
      const netFood = Math.max(0, o.subtotal - (o.discount || 0));
      const cgst = (netFood * 0.025).toFixed(2);
      const sgst = (netFood * 0.025).toFixed(2);

      csvContent += `"${o.id}","${o.table_number}","${o.kot_count}","${o.payment_method}","${paidStr}","${orderStr}","${o.subtotal}","${o.discount || 0}","${netFood}","${o.gst}","${cgst}","${sgst}","${o.service_charge}","${o.grand_total}","${o.status}","${itemsStr}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hotel_Marquis_GST_Sales_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("GST Sales CSV Exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-10 font-sans w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Detailed Sales Report</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Track and tally your end-of-month sales perfectly.</p>
          </div>
          
          <button 
            onClick={exportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-sm text-sm"
          >
            <Download size={18} /> Export to CSV
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => setSalesTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              salesTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Receipt size={17} />
            Invoices & Orders Audit
          </button>
          <button
            onClick={() => setSalesTab('zreports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              salesTab === 'zreports'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Moon size={17} />
            Cash Drawer Z-Reports (Day Close)
          </button>
        </div>

        {salesTab === 'orders' ? (
          <>
            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-300 font-bold hidden md:block">→</span>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border border-gray-200 rounded-lg p-2 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1 sm:pt-4">
                <button
                  onClick={() => {
                    const today = toLocalDateString(new Date());
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    const yestStr = toLocalDateString(yest);
                    setStartDate(yestStr);
                    setEndDate(yestStr);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
                >
                  Yesterday
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    setStartDate(toLocalDateString(firstDay));
                    setEndDate(toLocalDateString(lastDay));
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Gross Collections</p>
                <p className="text-2xl lg:text-3xl font-black text-emerald-600">₹{totalRevenue}</p>
                <p className="text-[11px] text-gray-400 mt-1">Total revenue collected</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Net Food Sales</p>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">₹{totalNetSales}</p>
                <p className="text-[11px] text-gray-400 mt-1">Taxable kitchen revenue</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Taxes & Charges</p>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Tax + SC</span>
                </div>
                <p className="text-2xl lg:text-3xl font-black text-amber-700">₹{totalTaxAndCharges}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-1">
                  GST: ₹{totalGst} {totalServiceCharge > 0 ? `| SC: ₹${totalServiceCharge}` : ''}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Mode Breakdown</p>
                <div className="space-y-1 mt-1 font-mono text-xs">
                  <div className="flex justify-between font-bold text-blue-700">
                    <span>💵 Cash:</span> <span>₹{totalCash}</span>
                  </div>
                  <div className="flex justify-between font-bold text-purple-700">
                    <span>📱 UPI:</span> <span>₹{totalUpi}</span>
                  </div>
                  {totalOther > 0 && (
                    <div className="flex justify-between font-bold text-amber-700">
                      <span>🛵 Online / Other:</span> <span>₹{totalOther}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Settled Bills</p>
                <p className="text-2xl lg:text-3xl font-black text-blue-600">{totalOrders}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Avg Bill: ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
                </p>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                      <th className="p-4 font-bold">Settled / Paid Time</th>
                      <th className="p-4 font-bold">Bill ID</th>
                      <th className="p-4 font-bold">Table / Channel</th>
                      <th className="p-4 font-bold">KOTs</th>
                      <th className="p-4 font-bold">Net Food (₹)</th>
                      <th className="p-4 font-bold">Tax & Charges (₹)</th>
                      <th className="p-4 font-bold">Grand Total (₹)</th>
                      <th className="p-4 font-bold">Payment</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={9} className="p-8 text-center text-gray-400">Loading sales data...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-gray-400 font-medium">No sales found in this date range.</td></tr>
                    ) : (
                      orders.map((o) => {
                        const paidDate = new Date(o.settled_at || o.created_at);
                        const orderDate = new Date(o.created_at);

                        return (
                          <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="p-4">
                              <div className="font-bold text-gray-800">{paidDate.toLocaleDateString()}</div>
                              <div className="text-xs text-emerald-600 font-semibold">
                                ✓ Paid: {paidDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {o.created_at !== o.settled_at && (
                                <div className="text-[11px] text-gray-400">
                                  Order: {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-xs">#{o.id}</td>
                            <td className="p-4 font-bold">{o.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? o.table_number : `Table ${o.table_number}`}</td>
                            <td className="p-4">
                              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                {o.kot_count} {o.kot_count === 1 ? 'KOT' : 'KOTs'}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-medium text-gray-700">
                              <div>₹{Math.max(0, o.subtotal - (o.discount || 0))}</div>
                              {Boolean(o.discount && o.discount > 0) && <div className="text-[10px] text-emerald-600">Disc: -₹{o.discount}</div>}
                            </td>
                            <td className="p-4 font-mono">
                              <div className="font-bold text-amber-700">₹{o.gst + (o.service_charge || 0)}</div>
                              <div className="text-[10px] text-gray-400">
                                GST: ₹{o.gst} {o.service_charge > 0 ? `• SC: ₹${o.service_charge}` : ''}
                              </div>
                            </td>
                            <td className="p-4 font-bold text-gray-900 font-mono text-base">₹{o.grand_total}</td>
                            <td className="p-4">
                              {o.payment_method === 'UPI' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">📱 UPI</span>}
                              {o.payment_method === 'CASH' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">💵 CASH</span>}
                              {o.payment_method === 'SWIGGY' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">🟠 Swiggy</span>}
                              {o.payment_method === 'ZOMATO' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">🔴 Zomato</span>}
                              {(o.payment_method === 'UNKNOWN' || !o.payment_method) && <span className="text-gray-400 text-xs font-bold">-</span>}
                            </td>
                            <td className="p-4">
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Z-Reports Audit Tab */
          <div>
            {/* Z-Reports KPI summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Closed Shifts</p>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{zReports.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">End-of-Day Z-Reports filed</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Physical Cash</p>
                <p className="text-2xl lg:text-3xl font-black text-emerald-600">
                  ₹{zReports.reduce((s, r) => s + (Number(r.physical_cash) || 0), 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Tendered cash counted</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Balanced Shifts</p>
                <p className="text-2xl lg:text-3xl font-black text-blue-600">
                  {zReports.filter(r => (Number(r.variance) || 0) === 0).length} / {zReports.length}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Exact drawer reconciliation</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Net Variance</p>
                  {(() => {
                    const net = zReports.reduce((s, r) => s + (Number(r.variance) || 0), 0);
                    return (
                      <p className={`text-2xl font-black ${net === 0 ? 'text-emerald-600' : net > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        {net === 0 ? '₹0 Balanced' : net > 0 ? `+₹${net} Overage` : `-₹${Math.abs(net)} Shortage`}
                      </p>
                    );
                  })()}
                </div>
                <button
                  onClick={fetchZReports}
                  disabled={zReportsLoading}
                  className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-1.5 px-3 rounded-lg transition"
                >
                  <RefreshCw size={13} className={zReportsLoading ? 'animate-spin' : ''} />
                  Refresh Z-Reports
                </button>
              </div>
            </div>

            {/* Z-Reports Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                      <th className="p-4 font-bold">Shift Date & Time</th>
                      <th className="p-4 font-bold">Report ID</th>
                      <th className="p-4 font-bold">Closed By</th>
                      <th className="p-4 font-bold">Bills</th>
                      <th className="p-4 font-bold">Gross Sales</th>
                      <th className="p-4 font-bold">Tenders (UPI / Cash)</th>
                      <th className="p-4 font-bold">Opening Float</th>
                      <th className="p-4 font-bold">Expected Cash</th>
                      <th className="p-4 font-bold">Counted Cash</th>
                      <th className="p-4 font-bold">Variance Status</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {zReportsLoading ? (
                      <tr><td colSpan={11} className="p-8 text-center text-gray-400">Loading Day Close Z-Reports...</td></tr>
                    ) : zReports.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-12 text-center">
                          <Moon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 font-bold text-base">No Day Close Z-Reports Filed Yet</p>
                          <p className="text-gray-400 text-xs mt-1">Cashier clicks &quot;Day Close (Z-Report)&quot; at closing time to balance the drawer.</p>
                        </td>
                      </tr>
                    ) : (
                      zReports.map((r) => {
                        const closedDate = new Date(r.closed_at || Date.now());
                        const variance = Number(r.variance) || 0;
                        const isBalanced = variance === 0;
                        const isOverage = variance > 0;

                        return (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition">
                            <td className="p-4">
                              <div className="font-bold text-gray-900">{r.date}</div>
                              <div className="text-xs text-gray-500">
                                {closedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-xs text-purple-700 font-bold">
                              #{r.id}
                            </td>
                            <td className="p-4 font-semibold text-gray-700">
                              {r.closed_by || 'Cashier Counter'}
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                {r.total_bills} bills
                              </span>
                            </td>
                            <td className="p-4 font-bold text-gray-900 font-mono">
                              ₹{r.gross_sales?.toLocaleString('en-IN') || 0}
                            </td>
                            <td className="p-4 font-mono text-xs">
                              <div className="text-purple-700 font-semibold">📱 UPI: ₹{r.system_upi?.toLocaleString('en-IN') || 0}</div>
                              <div className="text-emerald-700 font-semibold">💵 Cash: ₹{r.system_cash?.toLocaleString('en-IN') || 0}</div>
                            </td>
                            <td className="p-4 font-mono text-gray-600">
                              ₹{r.opening_float?.toLocaleString('en-IN') || 0}
                            </td>
                            <td className="p-4 font-mono font-bold text-gray-800">
                              ₹{r.expected_cash?.toLocaleString('en-IN') || 0}
                            </td>
                            <td className="p-4 font-mono font-bold text-gray-900 text-base">
                              ₹{r.physical_cash?.toLocaleString('en-IN') || 0}
                            </td>
                            <td className="p-4">
                              {isBalanced ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-full">
                                  <CheckCircle2 size={13} /> BALANCED (₹0)
                                </span>
                              ) : isOverage ? (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-black text-xs px-2.5 py-1 rounded-full">
                                  <AlertTriangle size={13} /> +₹{variance} OVERAGE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-black text-xs px-2.5 py-1 rounded-full">
                                  <AlertTriangle size={13} /> -₹{Math.abs(variance)} SHORTAGE
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => printZReport(r)}
                                  title="Reprint 80mm Thermal Z-Report Slip"
                                  className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                                >
                                  <Printer size={13} />
                                  Slip
                                </button>
                                <button
                                  onClick={() => setSelectedZReportModal(r)}
                                  title="View Full Shift Breakdown"
                                  className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                                >
                                  <FileText size={13} />
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Z-Report Modal */}
        {selectedZReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                      Z-Report Audit
                    </span>
                    <span className="text-gray-400 font-mono text-xs">#{selectedZReportModal.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Shift Close: {selectedZReportModal.date}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Closed by {selectedZReportModal.closed_by || 'Cashier Counter'} • {new Date(selectedZReportModal.closed_at || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedZReportModal(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {/* Status Alert Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  Number(selectedZReportModal.variance) === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : Number(selectedZReportModal.variance) > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Drawer Status</p>
                    <p className="text-lg font-black mt-0.5">
                      {Number(selectedZReportModal.variance) === 0
                        ? 'BALANCED (Exact Match)'
                        : Number(selectedZReportModal.variance) > 0
                        ? `OVERAGE (+₹${selectedZReportModal.variance})`
                        : `SHORTAGE (-₹${Math.abs(Number(selectedZReportModal.variance))})`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">Physical vs Expected</p>
                    <p className="font-mono font-bold text-base">
                      ₹{selectedZReportModal.physical_cash} / ₹{selectedZReportModal.expected_cash}
                    </p>
                  </div>
                </div>

                {/* Sales & Tenders Matrix */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shift Sales & Tenders</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Settled Invoices:</span>
                    <span className="font-bold text-gray-900">{selectedZReportModal.total_bills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Food Sales:</span>
                    <span className="font-mono font-bold text-gray-900">₹{selectedZReportModal.net_sales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST Collected (5%):</span>
                    <span className="font-mono text-gray-700">₹{selectedZReportModal.total_tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge (5%):</span>
                    <span className="font-mono text-gray-700">₹{selectedZReportModal.service_charge || 0}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
                    <span>Gross Sales:</span>
                    <span className="font-mono text-emerald-700">₹{selectedZReportModal.gross_sales}</span>
                  </div>
                  <div className="flex justify-between text-xs text-purple-700 pt-1">
                    <span>📱 Digital UPI:</span>
                    <span className="font-mono font-bold">₹{selectedZReportModal.system_upi}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>💵 Drawer Cash:</span>
                    <span className="font-mono font-bold">₹{selectedZReportModal.system_cash}</span>
                  </div>
                </div>

                {/* Cash Reconciliation Formula */}
                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-2 font-mono text-xs">
                  <p className="text-[11px] font-sans font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Drawer Equation Breakdown
                  </p>
                  <div className="flex justify-between text-gray-700">
                    <span>Opening Float:</span>
                    <span className="font-bold">₹{selectedZReportModal.opening_float}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>(+) System Cash Sales:</span>
                    <span className="font-bold">+₹{selectedZReportModal.system_cash}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>(-) Cash Drops / Petty:</span>
                    <span className="font-bold">-₹{selectedZReportModal.cash_drops || 0}</span>
                  </div>
                  <div className="border-t border-purple-200 pt-1.5 flex justify-between font-bold text-purple-900">
                    <span>(=) Expected Total:</span>
                    <span>₹{selectedZReportModal.expected_cash}</span>
                  </div>
                  <div className="flex justify-between font-black text-gray-900 text-sm pt-1">
                    <span>Physical Cash Counted:</span>
                    <span>₹{selectedZReportModal.physical_cash}</span>
                  </div>
                </div>

                {/* Denomination Breakdown (if provided) */}
                {selectedZReportModal.denominations && Object.keys(selectedZReportModal.denominations).some(k => Number(selectedZReportModal.denominations[k]) > 0) && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Counted Denominations</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {Object.entries(selectedZReportModal.denominations).map(([denom, count]) => {
                        const countNum = Number(count) || 0;
                        if (countNum <= 0) return null;
                        const dVal = denom === 'coins' ? 1 : Number(denom);
                        return (
                          <div key={denom} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">{denom === 'coins' ? 'Coins' : `₹${denom}`}</span>
                            <span className="font-mono font-bold text-gray-900">×{countNum}</span>
                            <span className="text-[10px] text-gray-500 block font-mono">₹{countNum * dVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedZReportModal.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-700 mb-1">Cashier Notes:</span>
                    {selectedZReportModal.notes}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => printZReport(selectedZReportModal)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Printer size={15} />
                  Print 80mm Z-Report Slip
                </button>
                <button
                  onClick={() => setSelectedZReportModal(null)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
