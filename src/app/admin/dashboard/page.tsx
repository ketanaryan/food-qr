"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Users, DollarSign, Activity, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    topItem: "-",
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
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

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['completed', 'billing'])
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (orders) {
      // 1. Calculate Today's Stats
      const todaysOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
      
      let sales = 0;
      let itemsCount: Record<string, number> = {};

      todaysOrders.forEach(o => {
        sales += Number(o.total_amount);
        
        if (o.items) {
          try {
            const itemsArray = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
            if (Array.isArray(itemsArray)) {
              itemsArray.forEach((item: any) => {
                if (item.name && item.id !== 'NOTE') {
                  itemsCount[item.name] = (itemsCount[item.name] || 0) + item.qty;
                }
              });
            }
          } catch(e) {}
        }
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
        totalOrders: todaysOrders.length,
        topItem: top,
        avgOrderValue: todaysOrders.length > 0 ? Math.round(sales / todaysOrders.length) : 0
      });

      // 2. Generate Real 7-Day Chart Data
      const daysMap: Record<string, number> = {};
      
      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        daysMap[dateStr] = 0;
      }

      orders.forEach(o => {
        const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        if (daysMap[dateStr] !== undefined) {
          daysMap[dateStr] += Number(o.total_amount);
        }
      });

      const finalChartData = Object.keys(daysMap).map(key => ({
        time: key,
        sales: daysMap[key]
      }));

      setChartData(finalChartData);
      
      // 3. Recent Orders
      setRecentOrders(orders.slice(0, 5));
    }
    setLoading(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500">Live sales and performance metrics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<DollarSign/>} title="Today's Sales" value={`₹${stats.totalSales}`} color="bg-green-500" />
            <StatCard icon={<Activity/>} title="Today's Orders" value={stats.totalOrders.toString()} color="bg-blue-500" />
            <StatCard icon={<TrendingUp/>} title="Avg. Order Value" value={`₹${stats.avgOrderValue}`} color="bg-purple-500" />
            <StatCard icon={<Users/>} title="Top Dish (Today)" value={stats.topItem} color="bg-orange-500" />
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
                {recentOrders.map((order, idx) => {
                   const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                   const formattedTable = order.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? order.table_number : `Table ${order.table_number}`;
                   
                   return (
                     <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                       <div>
                         <p className="font-bold text-gray-900">{formattedTable}</p>
                         <p className="text-xs text-gray-500">{timeStr}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-green-600">₹{order.total_amount}</p>
                         <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-gray-200 text-gray-600 rounded-md">
                           {order.status}
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

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 rounded-xl text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-semibold">{title}</p>
        <p className="text-2xl font-black text-gray-900 line-clamp-1">{value}</p>
      </div>
    </div>
  )
}
