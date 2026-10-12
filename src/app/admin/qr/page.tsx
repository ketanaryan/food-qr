"use client"

import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Printer, Copy, ExternalLink, Download, RefreshCw, QrCode as QrIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRPrintPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableCount, setTableCount] = useState(15);
  const [copiedTable, setCopiedTable] = useState<number | null>(null);

  useEffect(() => {
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
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    fetchTables(tableCount);
  };

  const copyLink = (url: string, tableNum: number) => {
    navigator.clipboard.writeText(url);
    setCopiedTable(tableNum);
    toast.success(`Table #${tableNum} link copied!`, { icon: '📋' });
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const downloadQR = (tableNum: number) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`) as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Could not generate QR download");
      return;
    }
    const link = document.createElement('a');
    link.download = `Hotel-White-Bliss-Table-${tableNum}-QR.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(`Table #${tableNum} QR image saved!`, { icon: '💾' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 lg:p-8">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden gap-4 pb-6 border-b border-[#e8dfd3]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A18D6D] mb-1">
            <QrIcon size={14} /> Table Standee Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-[#1E1B16]">
            Print Table QR Codes
          </h1>
          <p className="text-xs sm:text-sm text-[#6F624E] mt-0.5">
            Generate and print luxury acrylic table tent cards for Hotel White Bliss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl shadow-xs border border-[#e8dfd3] w-full md:w-auto">
          <label className="font-bold text-xs uppercase tracking-wider text-gray-600 pl-2">
            Tables:
          </label>
          <input 
            type="number" 
            min="1" 
            max="100" 
            value={tableCount} 
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="border border-[#e8dfd3] bg-[#FAF7F2] rounded-xl px-3 py-1.5 w-18 font-bold text-sm text-[#1E1B16] focus:border-[#A18D6D] outline-none text-center"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#1E1B16] border border-[#e8dfd3] px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Generate
          </button>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-[#1E1B16] hover:bg-black text-[#F8F5F0] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-xs"
          >
            <Printer size={14} />
            Print (Ctrl + P)
          </button>
        </div>
      </div>

      {loading && tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-zinc-200 border-t-[#A18D6D] animate-spin mb-4" />
          <p className="text-sm font-semibold text-zinc-700">Generating Secure QR Codes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-6 print:p-0">
          {tables.map((t) => (
            <div 
              key={t.table} 
              className="standee-card bg-white p-6 rounded-2xl shadow-xs border border-[#e8dfd3] flex flex-col items-center justify-between text-center relative overflow-hidden transition-all hover:shadow-md"
            >
              {/* Luxury Gold Accents & Branding */}
              <div className="w-full flex flex-col items-center">
                <div className="text-[10px] font-bold tracking-[0.25em] text-[#A18D6D] uppercase mb-1">
                  HOTEL WHITE BLISS
                </div>
                <div className="w-12 h-0.5 bg-[#A18D6D]/40 mb-3" />

                <h2 className="font-playfair text-2xl font-bold text-[#1E1B16] mb-0.5">
                  Table {t.table}
                </h2>
                <p className="text-xs text-[#6F624E] mb-4 font-light">
                  Scan to View Menu & Order
                </p>

                {/* QR Code Container - Strictly bounded with responsive canvas scaling */}
                <div className="w-full max-w-[190px] aspect-square flex items-center justify-center p-3.5 bg-white rounded-2xl border-2 border-[#e8dfd3] shadow-xs mb-4 [&>canvas]:!w-full [&>canvas]:!h-auto [&>canvas]:!max-w-full">
                  <QRCode 
                    id={`qr-canvas-${t.table}`}
                    value={t.qrUrl || ""}
                    size={240}
                    qrStyle="squares"
                    eyeRadius={[
                      [8, 8, 0, 8],
                      [8, 8, 8, 0],
                      [8, 0, 8, 8],
                    ]}
                    fgColor="#1E1B16"
                    bgColor="#FFFFFF"
                    ecLevel="M"
                  />
                </div>

                {/* Professional Scan Instructions (Replaced ugly chopped URL) */}
                <div className="space-y-1 mb-2">
                  <p className="text-xs font-semibold text-[#1E1B16]">
                    📸 Open Camera to Scan
                  </p>
                  <p className="text-[11px] text-[#A18D6D] font-medium tracking-wide">
                    Digital Self-Ordering Table
                  </p>
                </div>
              </div>

              {/* Admin Utility Toolbar (Hidden on print) */}
              <div className="w-full pt-4 mt-2 border-t border-gray-100 flex items-center justify-center gap-2 print:hidden">
                <button
                  onClick={() => copyLink(t.qrUrl, t.table)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 py-1.5 px-2.5 rounded-lg border border-gray-200 transition"
                  title="Copy Table Link"
                >
                  {copiedTable === t.table ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedTable === t.table ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => downloadQR(t.table)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#A18D6D] bg-[#FAF7F2] hover:bg-[#F3EDE3] py-1.5 px-2.5 rounded-lg border border-[#e8dfd3] transition"
                  title="Download Standalone QR PNG"
                >
                  <Download size={12} />
                  <span>PNG</span>
                </button>
                <a
                  href={t.qrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                  title="Open Menu in new tab"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print-specific Stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .standee-card {
            border: 2px solid #A18D6D !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12mm;
            padding: 16mm 10mm !important;
          }
        }
      `}} />
    </div>
  );
}
