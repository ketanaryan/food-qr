"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Calendar, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { consolidateOrders, ConsolidatedBill } from "@/lib/orderConsolidation";

export default function SalesReport() {
  const [orders, setOrders] = useState<ConsolidatedBill[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchSales();
    }
  }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    
    // We need to fetch up to the end of the selected end date
    const startObj = new Date(startDate);
    startObj.setHours(0, 0, 0, 0);
    
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

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
    link.setAttribute("download", `Hotel_White_Bliss_GST_Sales_${startDate}_to_${endDate}.csv`);
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
                        <td className="p-4 font-mono font-medium text-gray-700">₹{o.subtotal}</td>
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
        
      </div>
    </div>
  );
}
