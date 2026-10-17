"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Users, DollarSign, Activity, Clock, Receipt, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { consolidateOrders, ConsolidatedBill } from "@/lib/orderConsolidation";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    netSales: 0,
    todayGst: 0,
    todayServiceCharge: 0,
    todayTaxAndCharges: 0,
    totalOrders: 0,
    topItem: "-",
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<ConsolidatedBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: rawOrders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['completed', 'billing'])
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (rawOrders) {
      // Consolidate individual KOTs of same table session into single Bills
      const consolidatedBills = consolidateOrders(rawOrders);

      // 1. Calculate Today's Stats based on payment/order time
      const todaysBills = consolidatedBills.filter(b => {
        const timeToCompare = new Date(b.settled_at || b.created_at);
        return timeToCompare >= todayStart;
      });
      
      let sales = 0;
      let netSales = 0;
      let gstAmt = 0;
      let scAmt = 0;
      let itemsCount: Record<string, number> = {};

      todaysBills.forEach(b => {
        sales += b.grand_total;
        netSales += Math.max(0, b.subtotal - (b.discount || 0));
        gstAmt += b.gst;
        scAmt += (b.service_charge || 0);
        b.items.forEach(item => {
          itemsCount[item.name] = (itemsCount[item.name] || 0) + item.qty;
        });
      });

      let top = "-";
      let maxQty = 0;
      Object.entries(itemsCount).forEach(([name, qty]) => {
        if (qty > maxQty) {
          maxQty = qty;
          top = name;
        }
      });

      setStats({
        totalSales: sales,
        netSales: netSales,
        todayGst: gstAmt,
        todayServiceCharge: scAmt,
        todayTaxAndCharges: gstAmt + scAmt,
        totalOrders: todaysBills.length,
        topItem: maxQty > 0 ? `${top} (${maxQty} sold)` : "-",
        avgOrderValue: todaysBills.length > 0 ? Math.round(sales / todaysBills.length) : 0
      });

      // 2. Generate Real 7-Day Chart Data using settled_at / created_at
      const daysMap: Record<string, number> = {};
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        daysMap[dateStr] = 0;
      }

      consolidatedBills.forEach(b => {
        const dateStr = new Date(b.settled_at || b.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        if (daysMap[dateStr] !== undefined) {
          daysMap[dateStr] += b.grand_total;
        }
      });

      const finalChartData = Object.keys(daysMap).map(key => ({
        time: key,
        sales: daysMap[key]
      }));

      setChartData(finalChartData);
      
      // 3. Recent Orders: Top 5 Consolidated Bills
      setRecentOrders(consolidatedBills.slice(0, 5));
    }
    setLoading(false);
  };

  const exportTodayCsv = () => {
    if (recentOrders.length === 0) return;
    const headers = ["Invoice No", "Table", "Gross Subtotal", "Discount", "Net Food", "CGST", "SGST", "Service Charge", "Grand Total", "Payment Method", "Timestamp"];
    const rows = recentOrders.map(b => [
      b.invoice_no,
      `Table ${b.table_number}`,
      b.subtotal,
      b.discount || 0,
      b.net_food_sales,
      (b.gst / 2).toFixed(2),
      (b.gst / 2).toFixed(2),
      b.service_charge || 0,
      b.grand_total,
      b.payment_method || 'CASH',
      `"${new Date(b.settled_at || b.created_at).toLocaleString('en-IN')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HWB_Sales_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500">Live sales and performance metrics • Hotel White Bliss</p>
            </div>
            <button
              onClick={exportTodayCsv}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95"
            >
              <Download size={14} className="text-[#A18D6D]" />
              Export Summary (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard 
              icon={<DollarSign/>} 
              title="Today's Sales (Gross)" 
              value={`₹${stats.totalSales}`} 
              subtext={`Net Food: ₹${stats.netSales}`}
              color="bg-emerald-600" 
            />
            <StatCard 
              icon={<Receipt/>} 
              title="Today's Taxes & Charges" 
              value={`₹${stats.todayTaxAndCharges}`} 
              subtext={`GST: ₹${stats.todayGst} • SC: ₹${stats.todayServiceCharge}`}
              color="bg-amber-600" 
            />
            <StatCard 
              icon={<Activity/>} 
              title="Today's Orders" 
              value={stats.totalOrders.toString()} 
              subtext="Settled Bills"
              color="bg-blue-500" 
            />
            <StatCard 
              icon={<TrendingUp/>} 
              title="Avg. Order Value" 
              value={`₹${stats.avgOrderValue}`} 
              subtext="Per Table"
              color="bg-purple-500" 
            />
            <StatCard 
              icon={<Users/>} 
              title="Top Dish (Today)" 
              value={stats.topItem} 
              subtext="Most Ordered"
              color="bg-orange-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">Sales Trend (Last 7 Days)</h2>
              <div className="h-72 w-full">
                {!loading ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Sales']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Orders</h2>
                <Clock size={20} className="text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentOrders.map((bill, idx) => {
                   const paidTimeStr = new Date(bill.settled_at || bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                   const formattedTable = bill.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? bill.table_number : `Table ${bill.table_number}`;
                   
                   return (
                     <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition">
                       <div>
                         <div className="flex items-center gap-1.5 flex-wrap">
                           <p className="font-bold text-gray-900 text-sm">{formattedTable}</p>
                           {bill.kot_count > 1 && (
                             <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">
                               {bill.kot_count} KOTs
                             </span>
                           )}
                           {bill.payment_method && bill.payment_method !== 'UNKNOWN' && (
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                               bill.payment_method === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                             }`}>
                               {bill.payment_method}
                             </span>
                           )}
                         </div>
                         <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                           <span className="text-emerald-600 font-semibold">✓ Paid {paidTimeStr}</span>
                           {bill.created_at !== bill.settled_at && (
                             <span className="text-[10px] text-gray-400">
                               (Ordered {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                             </span>
                           )}
                         </p>
                       </div>
                       <div className="text-right shrink-0">
                         <p className="font-bold text-green-600 text-base">₹{bill.grand_total}</p>
                         <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-200 text-gray-600 rounded-md">
                           {bill.status}
                         </span>
                       </div>
                     </div>
                   );
                })}
                {recentOrders.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-10">No recent orders.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  subtext,
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  subtext?: string;
  color: string; 
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3.5">
      <div className={`p-3.5 rounded-xl text-white shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 truncate">{value}</p>
        {subtext && <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
