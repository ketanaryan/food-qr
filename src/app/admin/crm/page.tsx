"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Phone, Calendar, Download, Search, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { consolidateOrders } from "@/lib/orderConsolidation";
import { openWhatsApp } from "@/lib/whatsapp";

interface Customer {
  phone: string;
  name: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  tag: "VIP" | "Loyal" | "New";
}

export default function GuestCRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("ALL");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all orders
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const customerMap = new Map<string, {
        phone: string;
        name: string;
        email?: string;
        visits: number;
        spent: number;
        lastVisit: string;
      }>();

      const consolidatedBills = consolidateOrders(orders || []);

      consolidatedBills.forEach((bill) => {
        const phone = bill.customer_phone ? String(bill.customer_phone).replace(/\D/g, "") : "";
        const name = bill.customer_name || "";
        const email = bill.customer_email || "";

        if (phone && phone.length >= 10) {
          const cleanPhone = phone.slice(-10);
          const grandTotal = Number(bill.grand_total) || 0;
          const visitTime = bill.settled_at || bill.created_at;

          const existing = customerMap.get(cleanPhone);
          if (existing) {
            existing.visits += 1;
            existing.spent += grandTotal;
            if ((!existing.name || existing.name === "Valued Guest") && name) {
              existing.name = name;
            }
            if (!existing.email && email) existing.email = email;
            if (new Date(visitTime) > new Date(existing.lastVisit)) {
              existing.lastVisit = visitTime;
            }
          } else {
            customerMap.set(cleanPhone, {
              phone: cleanPhone,
              name: name || "Valued Guest",
              email: email || "",
              visits: 1,
              spent: grandTotal,
              lastVisit: visitTime,
            });
          }
        }
      });

      const customerList: Customer[] = Array.from(customerMap.values()).map((c) => {
        let tag: "VIP" | "Loyal" | "New" = "New";
        if (c.spent >= 1500 || c.visits >= 4) {
          tag = "VIP";
        } else if (c.visits >= 2) {
          tag = "Loyal";
        }

        return {
          phone: c.phone,
          name: c.name,
          email: c.email,
          totalVisits: c.visits,
          totalSpent: c.spent,
          lastVisit: c.lastVisit,
          tag,
        };
      });

      // Sort by total visits & spend descending
      customerList.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(customerList);
    } catch (e) {
      console.error("Error fetching CRM data:", e);
      toast.error("Failed to load customer records");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.phone.includes(search) ||
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchesTag = filterTag === "ALL" || c.tag === filterTag;
    return matchesSearch && matchesTag;
  });

  const exportCSV = () => {
    if (customers.length === 0) return toast.error("No customers to export");
    const headers = "Phone Number,Name,Total Visits,Total Spent (INR),Last Visit,Guest Tier\n";
    const rows = customers
      .map(
        (c) =>
          `"${c.phone}","${c.name}",${c.totalVisits},${c.totalSpent},"${new Date(c.lastVisit).toLocaleDateString()}","${c.tag}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Hotel_Marquis_Customer_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer list exported successfully!");
  };

  const sendWhatsAppOffer = (customer: Customer) => {
    const text = `🎉 *Special Greetings from Hotel Marquis!* 🎉\n━━━━━━━━━━━━━━━━━━━━\nHello *${customer.name}*,\nWe love having you as our guest! As a token of appreciation, we'd like to offer you an exclusive *10% OFF* on your next dining experience with us.\n\n🍽️ Come enjoy your favorite dishes!\n📍 Hotel Marquis, Pathardi Phata, Nashik\n📞 Table Booking: +91 7499934257\n━━━━━━━━━━━━━━━━━━━━\nWe look forward to hosting you again soon! 🙏`;
    openWhatsApp(customer.phone, text);
  };

  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const repeatGuests = customers.filter((c) => c.totalVisits > 1).length;
  const repeatRate = customers.length > 0 ? Math.round((repeatGuests / customers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-10 font-sans w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
              <span className="p-1.5 sm:p-2 bg-blue-100 text-blue-700 rounded-xl text-lg sm:text-xl">👥</span> Guest CRM & Loyalty
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Customer Directory, Repeat Guest Tracking & Direct WhatsApp Marketing
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 sm:py-3 rounded-xl hover:bg-gray-800 transition active:scale-95 shadow-sm text-sm"
          >
            <span>📥 Export to Excel (CSV)</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold mb-1">Total Unique Guests</p>
            <p className="text-3xl font-black text-gray-900">{customers.length}</p>
            <p className="text-xs text-gray-400 mt-2">Captured via bills & reservations</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold mb-1">Repeat Guest Rate</p>
            <p className="text-3xl font-black text-blue-600">{repeatRate}%</p>
            <p className="text-xs text-gray-400 mt-2">{repeatGuests} guests visited 2+ times</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold mb-1">Tracked Guest Revenue</p>
            <p className="text-3xl font-black text-green-600">₹{totalRevenue}</p>
            <p className="text-xs text-gray-400 mt-2">Lifetime revenue from captured guests</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold mb-1">VIP Guests</p>
            <p className="text-3xl font-black text-purple-600">
              {customers.filter((c) => c.tag === "VIP").length}
            </p>
            <p className="text-xs text-gray-400 mt-2">High-spending regular diners</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by phone number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {["ALL", "VIP", "Loyal", "New"].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  filterTag === tag
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag === "ALL" ? "All Guests" : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-bold">Guest Details</th>
                  <th className="p-4 font-bold">Visits</th>
                  <th className="p-4 font-bold">Total Spent</th>
                  <th className="p-4 font-bold">Last Visit</th>
                  <th className="p-4 font-bold">Loyalty Tier</th>
                  <th className="p-4 font-bold text-right">Marketing Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                      Loading guest records...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                      No guests found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.phone} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{cust.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">📞 +91 {cust.phone}</div>
                        {cust.email && <div className="text-xs text-gray-400 mt-0.5">{cust.email}</div>}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-800">{cust.totalVisits}</span>
                        <span className="text-xs text-gray-400 ml-1">orders</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        ₹{cust.totalSpent}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        <div>{new Date(cust.lastVisit).toLocaleDateString()}</div>
                        <div className="text-gray-400">{new Date(cust.lastVisit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            cust.tag === "VIP"
                              ? "bg-purple-100 text-purple-700"
                              : cust.tag === "Loyal"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cust.tag}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => sendWhatsAppOffer(cust)}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white font-bold px-3 py-2 rounded-xl text-xs hover:bg-[#1ebd5b] transition active:scale-95 shadow-sm"
                        >
                          💬 Send Offer (WA)
                        </button>
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
