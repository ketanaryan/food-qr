"use client"

import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

export default function QRPrintPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableCount, setTableCount] = useState(15);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    setDomain(window.location.origin);
    fetchTables(tableCount);
  }, []);

  const fetchTables = async (count: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tables?count=${count}`);
      const data = await res.json();
      if (data.tables) setTables(data.tables);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    fetchTables(tableCount);
  };

  if (loading && tables.length === 0) return <div className="p-10 text-xl font-bold">Generating Secure QR Codes...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 lg:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden gap-4">
        <div>
          <h1 className="text-3xl font-bold">Print QR Codes</h1>
          <p className="text-gray-500">Generate secure table-specific ordering codes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl shadow-sm border w-full md:w-auto">
          <label className="font-bold text-gray-700 pl-2 text-sm">Tables:</label>
          <input 
            type="number" 
            min="1" 
            max="100" 
            value={tableCount} 
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="border-2 border-gray-200 rounded-lg p-2 w-20 font-bold focus:border-[#A18D6D] outline-none"
          />
          <button 
            onClick={handleGenerate}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 text-sm"
          >
            Generate
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-[#A18D6D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8A785D] text-sm"
          >
            Print (Ctrl + P)
          </button>
        </div>
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
