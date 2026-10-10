"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Calendar, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function SalesReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
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
      .in('status', ['completed', 'billing']) // Assume billed/completed are sales
      .gte('created_at', startObj.toISOString())
      .lte('created_at', endObj.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load sales data");
    } else if (data) {
      setOrders(data);
      
      let rev = 0;
      data.forEach(o => rev += Number(o.total_amount || 0));
      setTotalRevenue(rev);
      setTotalOrders(data.length);
    }
    
    setLoading(false);
  };

  const exportCSV = () => {
    if (orders.length === 0) return toast.error("No data to export");
    
    let csvContent = "Date,Time,Table,Order ID,Amount,Status,Items\n";
    
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const dateStr = d.toLocaleDateString();
      const timeStr = d.toLocaleTimeString();
      
      let itemsStr = "";
      try {
        const parsed = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        itemsStr = parsed.filter((i:any)=>i.id!=='NOTE').map((i:any) => `${i.qty}x ${i.name}`).join(' | ');
      } catch(e) {}
      
      // Escape quotes for CSV
      itemsStr = `"${itemsStr.replace(/"/g, '""')}"`;
      
      csvContent += `${dateStr},${timeStr},${o.table_number},${o.id},${o.total_amount},${o.status},${itemsStr}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV Exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detailed Sales Report</h1>
            <p className="text-gray-500">Track and tally your end-of-month sales perfectly.</p>
          </div>
          
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-sm"
          >
            <Download size={20} /> Export to CSV
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold mb-1">Total Revenue (Selected Period)</p>
            <p className="text-3xl font-black text-green-600">₹{totalRevenue}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold mb-1">Total Orders</p>
            <p className="text-3xl font-black text-blue-600">{totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold mb-1">Average Order Value</p>
            <p className="text-3xl font-black text-purple-600">
              ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-bold">Date & Time</th>
                  <th className="p-4 font-bold">Order ID</th>
                  <th className="p-4 font-bold">Table</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading sales data...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium">No sales found in this date range.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{new Date(o.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs">#{o.id}</td>
                      <td className="p-4 font-bold">{o.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? o.table_number : `Table ${o.table_number}`}</td>
                      <td className="p-4 font-bold text-gray-900">₹{o.total_amount}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
