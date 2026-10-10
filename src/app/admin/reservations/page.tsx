"use client"
import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReservations = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('table_number', 'RESERVATION')
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (data) {
      setReservations(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReservations()

    const channel = supabase
      .channel('reservations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: "table_number=eq.RESERVATION" }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast.success('New Table Reservation Received!', { icon: '🔔' })
        }
        fetchReservations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleConfirm = async (res: any) => {
    // Optimistic UI
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'confirmed_reservation' } : r))
    
    // Parse the details
    let details: any = {};
    try {
      const items = typeof res.items === 'string' ? JSON.parse(res.items) : res.items;
      details = items[0] || {};
    } catch(e) {}

    // Send WhatsApp confirmation
    if (details.phone) {
      const cleanPhone = details.phone.replace(/\D/g, '');
      const text = `🎉 *RESERVATION CONFIRMED!* 🎉\n------------------------\nHello ${details.name},\nYour table at *HOTEL WHITE BLISS* is confirmed!\n\n📅 Date: ${details.date}\n⏰ Time: ${details.time}\n👥 Guests: ${details.guests}\n------------------------\nWe look forward to hosting you! 🙏`;
      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    }

    await fetch('/api/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: [res.id], status: 'confirmed_reservation' })
    });
  }

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this reservation?")) return;
    
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    
    await fetch('/api/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: [id], status: 'rejected' })
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Table Reservations</h1>
        <p className="text-gray-500 mt-2">Manage incoming booking requests from the website.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && reservations.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-400 font-bold">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-400 font-bold">No reservations found.</div>
        ) : (
          reservations.map(res => {
            let details: any = {};
            try {
              const items = typeof res.items === 'string' ? JSON.parse(res.items) : res.items;
              details = items[0] || {};
            } catch(e) {}

            return (
              <div key={res.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{details.name || 'Unknown'}</h2>
                    <p className="text-sm text-gray-500 font-mono mt-1">{details.phone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    res.status === 'pending_reservation' ? 'bg-orange-100 text-orange-700' :
                    res.status === 'confirmed_reservation' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {res.status.split('_')[0]}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Date</span>
                    <span className="font-bold text-gray-900">{details.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Time</span>
                    <span className="font-bold text-gray-900">{details.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Guests</span>
                    <span className="font-bold text-gray-900">{details.guests} People</span>
                  </div>
                </div>

                {res.status === 'pending_reservation' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConfirm(res)}
                      className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition"
                    >
                      Confirm & Send WA
                    </button>
                    <button 
                      onClick={() => handleReject(res.id)}
                      className="px-4 bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {res.status === 'confirmed_reservation' && (
                  <button 
                    onClick={() => handleConfirm(res)}
                    className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd5b] transition flex items-center justify-center gap-2"
                  >
                    Resend WhatsApp
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
