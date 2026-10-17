"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillItem {
  name: string;
  qty: number;
  price: number;
  amount: number;
}

interface BillData {
  orderIds: string;
  tableName: string;
  createdAt: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  netFood: number;
  cgst: string;
  sgst: string;
  serviceCharge: number;
  roundOff: string;
  grandTotal: number;
  paymentMethod: string;
  billSessionId?: string;
}

export default function BillViewer({ params }: { params: Promise<{ ids: string }> }) {
  const unwrappedParams = use(params);
  const { ids } = unwrappedParams;

  const [billData, setBillData] = useState<BillData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillData();
  }, [ids]);

  const loadBillData = async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanOrderIds = String(ids || "")
        .split("-")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id) && id > 0);

      if (cleanOrderIds.length === 0) {
        throw new Error("Invalid bill reference ID.");
      }

      // Fetch from Supabase primary
      const { data: orders, error: dbError } = await supabase
        .from("orders")
        .select("*")
        .in("id", cleanOrderIds);

      if (dbError || !orders || orders.length === 0) {
        throw new Error("Bill not found. Please contact restaurant staff.");
      }

      const tableNumber = orders[0].table_number || "Counter";
      let calculatedSubtotal = 0;

      let storedSubtotal: number | undefined;
      let storedDiscount: number | undefined;
      let storedGst: number | undefined;
      let storedServiceCharge: number | undefined;
      let storedGrandTotal: number | undefined;
      let detectedPaymentMethod = "CASH";
      let detectedBillSession = "";

      const parsedItemsList: BillItem[] = [];

      orders.forEach((order) => {
        calculatedSubtotal += Number(order.total_amount) || 0;
        let itArr: any[] = [];
        try {
          itArr = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        } catch {}

        if (Array.isArray(itArr)) {
          itArr.forEach((item: any) => {
            if (!item) return;
            if (item.id === "SETTLEMENT_INFO") {
              if (typeof item.subtotal === "number") storedSubtotal = item.subtotal;
              if (typeof item.discount === "number") storedDiscount = item.discount;
              if (typeof item.gst === "number") storedGst = item.gst;
              if (typeof item.service_charge === "number") storedServiceCharge = item.service_charge;
              if (typeof item.grand_total === "number") storedGrandTotal = item.grand_total;
              if (item.payment_method) detectedPaymentMethod = item.payment_method;
              if (item.bill_session_id) detectedBillSession = item.bill_session_id;
            } else if (item.id === "PAYMENT_METHOD" && item.method) {
              detectedPaymentMethod = item.method;
            } else if (
              item.name &&
              item.id !== "NOTE" &&
              item.id !== "CUSTOMER_INFO" &&
              item.id !== "SETTLEMENT_INFO" &&
              item.id !== "PAYMENT_METHOD"
            ) {
              const qty = Number(item.qty) || 1;
              const price = Number(item.price) || 0;
              parsedItemsList.push({
                name: String(item.name),
                qty,
                price,
                amount: price * qty,
              });
            }
          });
        }
      });

      const finalSub = storedSubtotal !== undefined ? storedSubtotal : calculatedSubtotal;
      const discount = storedDiscount || 0;
      const netFood = Math.max(0, finalSub - discount);
      const cgst = (netFood * 0.025).toFixed(2);
      const sgst = (netFood * 0.025).toFixed(2);
      const exactTax = Number(cgst) + Number(sgst);
      const serviceCharge =
        storedServiceCharge !== undefined ? storedServiceCharge : Math.round(netFood * 0.05);
      const grandTotal =
        storedGrandTotal !== undefined
          ? storedGrandTotal
          : Math.round(netFood + exactTax + serviceCharge);
      const exactSum = netFood + exactTax + serviceCharge;
      const roundOff = (grandTotal - exactSum).toFixed(2);

      const bill: BillData = {
        orderIds: cleanOrderIds.join("-"),
        tableName: tableNumber,
        createdAt: orders[0].created_at || new Date().toISOString(),
        items: parsedItemsList,
        subtotal: finalSub,
        discount,
        netFood,
        cgst,
        sgst,
        serviceCharge,
        roundOff,
        grandTotal,
        paymentMethod: detectedPaymentMethod,
        billSessionId: detectedBillSession,
      };

      setBillData(bill);

      // Generate Clean, Proportionate PDF Receipt
      const generatedBlobUrl = generatePdfReceipt(bill);
      setPdfUrl(generatedBlobUrl);
    } catch (err: any) {
      setError(err.message || "Failed to load bill.");
    } finally {
      setLoading(false);
    }
  };

  const generatePdfReceipt = (bill: BillData): string => {
    // 80mm standard receipt width for authentic POS mobile & thermal compatibility
    const receiptWidth = 80;
    
    // Calculate proportionate height so there is NO awkward blank void
    const headerHeight = 44;
    const itemTableHeight = Math.max(14, bill.items.length * 6.5 + 8);
    const totalsBoxHeight = 32 + (bill.discount > 0 ? 4 : 0) + (bill.serviceCharge > 0 ? 4 : 0);
    const footerHeight = 26;
    const dynamicPageHeight = Math.max(125, Math.ceil(headerHeight + itemTableHeight + totalsBoxHeight + footerHeight + 10));

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [receiptWidth, dynamicPageHeight],
    });

    // Top Brand Gold Accent Line
    doc.setDrawColor(161, 141, 109);
    doc.setLineWidth(0.6);
    doc.line(5, 5, 75, 5);

    // Restaurant Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 27, 22);
    doc.text("HOTEL MARQUIS", 40, 11, { align: "center" });

    // Subtitle & Address
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(115, 100, 80);
    doc.text("LUXURY DINING & BANQUETS", 40, 15, { align: "center" });

    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text("Dnyaneshwar Nagar, Pathardi Phata, Nashik 422009", 40, 19, { align: "center" });
    doc.text("GSTIN: 27AABCH1234F1Z5  |  FSSAI: 11521045000123", 40, 22.5, { align: "center" });
    doc.text("Contact: +91 7499934257", 40, 26, { align: "center" });

    // Divider Line
    doc.setDrawColor(215, 205, 190);
    doc.setLineWidth(0.25);
    doc.line(5, 28.5, 75, 28.5);

    // Meta Section
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 27, 22);
    doc.text("TAX INVOICE / CASH MEMO", 40, 32.5, { align: "center" });

    const orderDate = new Date(bill.createdAt);
    const dateFormatted = orderDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = orderDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const formattedTableName = bill.tableName.match(/^(Swiggy|Zomato|Takeaway)/i)
      ? bill.tableName
      : `Table: ${bill.tableName}`;

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Bill No: HM-${bill.orderIds}`, 5, 36.5);
    doc.text(`${dateFormatted} ${timeFormatted}`, 75, 36.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 27, 22);
    doc.text(formattedTableName, 5, 40.5);

    doc.setTextColor(22, 101, 52);
    doc.text(`PAID VIA ${bill.paymentMethod || "CASH"}`, 75, 40.5, { align: "right" });

    // Divider before items table
    doc.setDrawColor(215, 205, 190);
    doc.line(5, 42.5, 75, 42.5);

    // Items Table with structured lines and borders
    const tableBody = bill.items.map((item) => [
      item.name,
      String(item.qty),
      `₹${item.price}`,
      `₹${item.amount}`,
    ]);

    autoTable(doc, {
      startY: 44,
      margin: { left: 5, right: 5 },
      head: [["Item", "Qty", "Rate", "Amount"]],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: [30, 27, 22],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
        cellPadding: 1.5,
      },
      styles: {
        font: "helvetica",
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [225, 220, 210],
        lineWidth: 0.1,
        textColor: [35, 35, 35],
      },
      alternateRowStyles: {
        fillColor: [250, 249, 246],
      },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 8, halign: "center" },
        2: { cellWidth: 13, halign: "right" },
        3: { cellWidth: 13, halign: "right" },
      },
    });

    // Summary Box with Crisp Borders and Alignments
    let curY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 3 : 55;

    const actualBoxH =
      22 +
      (bill.discount > 0 ? 3.5 : 0) +
      (bill.serviceCharge > 0 ? 3.5 : 0) +
      (Math.abs(Number(bill.roundOff)) >= 0.01 ? 3.5 : 0);

    // Box container for Totals
    doc.setDrawColor(205, 195, 180);
    doc.setFillColor(252, 251, 248);
    doc.setLineWidth(0.25);
    doc.roundedRect(5, curY, 70, actualBoxH, 1, 1, "FD");

    curY += 4;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    doc.text("Item Subtotal:", 8, curY);
    doc.text(`₹${bill.subtotal}`, 72, curY, { align: "right" });
    curY += 3.5;

    if (bill.discount > 0) {
      doc.setTextColor(22, 101, 52);
      doc.text("Discount:", 8, curY);
      doc.text(`-₹${bill.discount}`, 72, curY, { align: "right" });
      doc.setTextColor(60, 60, 60);
      curY += 3.5;
    }

    doc.text("CGST (2.5%):", 8, curY);
    doc.text(`₹${bill.cgst}`, 72, curY, { align: "right" });
    curY += 3.5;

    doc.text("SGST (2.5%):", 8, curY);
    doc.text(`₹${bill.sgst}`, 72, curY, { align: "right" });
    curY += 3.5;

    if (bill.serviceCharge > 0) {
      doc.text("Service Charge (5%):", 8, curY);
      doc.text(`₹${bill.serviceCharge}`, 72, curY, { align: "right" });
      curY += 3.5;
    }

    if (Math.abs(Number(bill.roundOff)) >= 0.01) {
      doc.setTextColor(100, 100, 100);
      doc.text("Round Off:", 8, curY);
      doc.text(
        `${Number(bill.roundOff) > 0 ? "+" : ""}₹${bill.roundOff}`,
        72,
        curY,
        { align: "right" }
      );
      doc.setTextColor(60, 60, 60);
      curY += 3.5;
    }

    // Divider line before Grand Total inside box
    doc.setDrawColor(161, 141, 109);
    doc.setLineWidth(0.4);
    doc.line(7, curY, 73, curY);
    curY += 4;

    // Grand Total Row
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 27, 22);
    doc.text("GRAND TOTAL:", 8, curY);
    doc.text(`₹${bill.grandTotal}`, 72, curY, { align: "right" });

    // Bottom Footer & Thank You
    curY += 6;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(115, 100, 80);
    doc.text("Thank you for dining with us at Hotel Marquis! 🙏", 40, curY, {
      align: "center",
    });

    curY += 3.5;
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("FSSAI Lic: 11521045000123  •  Visit Again Soon", 40, curY, {
      align: "center",
    });

    curY += 3;
    doc.setDrawColor(161, 141, 109);
    doc.setLineWidth(0.5);
    doc.line(5, curY, 75, curY);

    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  };

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-stone-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Bill Not Found</h2>
          <p className="text-sm text-stone-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-[#1E1B16] text-[#A18D6D] px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-900 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (loading || !billData) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-stone-200">
          <div className="animate-spin h-10 w-10 border-4 border-[#A18D6D] border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-lg font-bold text-stone-900 tracking-wider">HOTEL MARQUIS</h2>
          <p className="text-xs text-stone-500 mt-1">Generating official dining receipt...</p>
        </div>
      </div>
    );
  }

  const orderDate = new Date(billData.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-900 py-6 px-3 sm:px-6 flex flex-col items-center">
      {/* Top Fixed / Floating Action Bar (Hidden in Print) */}
      <div className="print:hidden w-full max-w-md mb-4 flex items-center justify-between bg-[#1E1B16] text-white px-4 py-3 rounded-2xl shadow-lg border border-[#3E382E]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#A18D6D]/20 border border-[#A18D6D]/40 flex items-center justify-center text-base">
            🧾
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#A18D6D] font-bold">
              Hotel Marquis
            </div>
            <div className="text-[11px] text-stone-400">Official Dining Bill</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`Hotel_Marquis_Bill_${billData.orderIds}.pdf`}
              className="bg-[#A18D6D] hover:bg-[#8F7C5D] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>PDF</span>
            </a>
          )}
          <button
            onClick={handlePrint}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-stone-700 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Digital Bill Card (Print-optimized) */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Card Header */}
        <div className="bg-[#1E1B16] text-white p-6 text-center relative">
          <div className="w-12 h-12 bg-[#A18D6D]/15 border border-[#A18D6D]/40 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            👑
          </div>
          <h1 className="font-playfair text-2xl font-bold tracking-wider text-[#F3EFE6]">
            HOTEL MARQUIS
          </h1>
          <p className="text-[11px] font-semibold text-[#A18D6D] tracking-widest uppercase mt-0.5">
            Luxury Fine Dining & Banquets
          </p>
          <p className="text-[11px] text-stone-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Dnyaneshwar Nagar, Pathardi Phata, Nashik, Maharashtra 422009
          </p>
          <div className="text-[10px] text-stone-400 mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span>GSTIN: 27AABCH1234F1Z5</span>
            <span>•</span>
            <span>FSSAI: 11521045000123</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">Contact: +91 7499934257</div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="bg-[#A18D6D]/20 text-[#A18D6D] px-2.5 py-1 rounded-md font-semibold tracking-wide border border-[#A18D6D]/30">
              TAX INVOICE
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span>●</span> PAID ({billData.paymentMethod || "CASH"})
            </span>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/70 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
              Invoice Reference
            </div>
            <div className="font-mono font-bold text-stone-800 mt-0.5">
              HM-{billData.orderIds}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
              Table / Section
            </div>
            <div className="font-bold text-stone-800 mt-0.5">
              {billData.tableName.match(/^(Swiggy|Zomato|Takeaway)/i)
                ? billData.tableName
                : `Table ${billData.tableName}`}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
              Date & Time
            </div>
            <div className="text-stone-700 mt-0.5 font-medium">
              {formattedDate}, {formattedTime}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
              Status
            </div>
            <div className="text-emerald-600 font-bold mt-0.5 flex items-center justify-end gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Settled</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="p-5">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Order Items
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 text-stone-500 font-semibold">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center w-12">Qty</th>
                  <th className="pb-2 text-right w-16">Rate</th>
                  <th className="pb-2 text-right w-16">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {billData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-2.5 font-medium text-stone-800 pr-2">{item.name}</td>
                    <td className="py-2.5 text-center text-stone-600 font-medium">{item.qty}</td>
                    <td className="py-2.5 text-right text-stone-600">₹{item.price}</td>
                    <td className="py-2.5 text-right font-semibold text-stone-900">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Box */}
          <div className="mt-5 bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Item Subtotal</span>
              <span className="font-semibold text-stone-800">₹{billData.subtotal}</span>
            </div>

            {billData.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Special Discount</span>
                <span>-₹{billData.discount}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>CGST (2.5%)</span>
              <span>₹{billData.cgst}</span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>SGST (2.5%)</span>
              <span>₹{billData.sgst}</span>
            </div>

            {billData.serviceCharge > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Service Charge (5%)</span>
                <span>₹{billData.serviceCharge}</span>
              </div>
            )}

            {Math.abs(Number(billData.roundOff)) >= 0.01 && (
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Round Off</span>
                <span>
                  {Number(billData.roundOff) > 0 ? "+" : ""}₹{billData.roundOff}
                </span>
              </div>
            )}

            <div className="pt-3 border-t-2 border-stone-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-stone-900">GRAND TOTAL</span>
              <span className="text-xl font-black text-[#A18D6D]">
                ₹{billData.grandTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Feedback Actions */}
        <div className="bg-[#1E1B16] text-white p-5 text-center">
          <p className="font-playfair text-sm italic text-[#E5DFD3]">
            Thank you for dining with us at Hotel Marquis! 🙏
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            FSSAI Lic No: 11521045000123 • We look forward to hosting you again
          </p>

          <div className="mt-4 pt-4 border-t border-stone-800 flex flex-col sm:flex-row gap-2 justify-center print:hidden">
            <a
              href="https://www.google.com/search?q=Hotel+Marquis"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#A18D6D] hover:bg-[#8F7C5D] text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              <span>⭐</span> Rate Your Experience on Google
            </a>

            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`Hotel_Marquis_Bill_${billData.orderIds}.pdf`}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-stone-700 transition-all active:scale-95"
              >
                <span>📥</span> Download PDF Invoice
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
