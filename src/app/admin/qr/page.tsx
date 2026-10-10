"use client"

import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

export default function QRPrintPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    // Get the base domain (e.g. http://localhost:3000 or https://your-app.vercel.app)
    setDomain(window.location.origin);
    
    // Fetch 10 tables from the secure API
    const fetchTables = async () => {
      try {
        const urls = [];
        for (let i = 1; i <= 10; i++) {
          const res = await fetch(`/api/admin/tables?table=${i}`);
          const data = await res.json();
          if (data.qrUrl) urls.push({ table: i, url: data.qrUrl });
        }
        setTables(urls);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  if (loading) return <div className="p-10 text-xl font-bold">Generating Secure QR Codes...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 lg:p-10">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold">Print QR Codes</h1>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
        >
          Print Now (Ctrl + P)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
        {tables.map((t) => (
          <div key={t.table} className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center break-inside-avoid">
            <h2 className="text-2xl font-black text-gray-800 mb-2">Table {t.table}</h2>
            <p className="text-sm text-gray-500 mb-4">Scan to order</p>
            <div className="p-2 border-4 border-gray-100 rounded-xl mb-4">
              <QRCode 
                value={t.url}
                size={180}
                qrStyle="dots"
                eyeRadius={10}
                fgColor="#000000"
              />
            </div>
            <p className="text-xs font-mono text-gray-400 break-all w-full px-2">{t.url.substring(0,40)}...</p>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
