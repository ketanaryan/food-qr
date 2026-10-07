"use client";

import React, { useEffect, useState } from "react";
import NavBar from "@/components/common/NavBar";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    topItem: "-",
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    // Fetch all completed orders for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', today.toISOString());

    if (orders) {
      let sales = 0;
      let itemsCount: Record<string, number> = {};

      orders.forEach(o => {
        sales += Number(o.total_amount);
        
        // Count items
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            if (item.name && item.id !== 'NOTE') {
              itemsCount[item.name] = (itemsCount[item.name] || 0) + item.qty;
            }
          });
        }
      });

      // Find top item
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
        totalOrders: orders.length,
        topItem: top,
        avgOrderValue: orders.length > 0 ? Math.round(sales / orders.length) : 0
      });

      // Mock chart data for MVP (would normally group by hour/day)
      const data = [
        { time: '10 AM', sales: Math.round(sales * 0.1) },
        { time: '12 PM', sales: Math.round(sales * 0.3) },
        { time: '2 PM', sales: Math.round(sales * 0.5) },
        { time: '4 PM', sales: Math.round(sales * 0.2) },
        { time: '6 PM', sales: Math.round(sales * 0.8) },
        { time: '8 PM', sales: sales },
      ];
      setChartData(data);
    }
    setLoading(false);
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500">Live sales and performance metrics for today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<DollarSign/>} title="Today's Sales" value={`₹${stats.totalSales}`} color="bg-green-500" />
            <StatCard icon={<Activity/>} title="Total Orders" value={stats.totalOrders.toString()} color="bg-blue-500" />
            <StatCard icon={<TrendingUp/>} title="Avg. Order Value" value={`₹${stats.avgOrderValue}`} color="bg-purple-500" />
            <StatCard icon={<Users/>} title="Top Dish" value={stats.topItem} color="bg-orange-500" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Sales Trend (Today)</h2>
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
                    <XAxis dataKey="time" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
              )}
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
