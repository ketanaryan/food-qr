"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function BillViewer({ params }: { params: Promise<{ ids: string }> }) {
  const unwrappedParams = use(params);
  const { ids } = unwrappedParams;
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateBill();
  }, [ids]);

  const generateBill = async () => {
    try {
      const cleanOrderIds = String(ids || '')
        .split('-')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);

      if (cleanOrderIds.length === 0) {
        throw new Error("Invalid bill reference ID.");
      }
      
      const { data: orders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .in('id', cleanOrderIds);

      if (dbError || !orders || orders.length === 0) {
        throw new Error("Bill not found.");
      }

      const tableNumber = orders[0].table_number;
      let subtotal = 0;
      
      let storedSubtotal: number | undefined;
      let storedDiscount: number | undefined;
      let storedGst: number | undefined;
      let storedServiceCharge: number | undefined;
      let storedGrandTotal: number | undefined;

      orders.forEach(order => {
        subtotal += Number(order.total_amount);
        let itArr: any[] = [];
        try { itArr = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e) {}
        if (Array.isArray(itArr)) {
          const sInfo = itArr.find((i: any) => i && i.id === 'SETTLEMENT_INFO');
          if (sInfo) {
            if (typeof sInfo.subtotal === 'number') storedSubtotal = sInfo.subtotal;
            if (typeof sInfo.discount === 'number') storedDiscount = sInfo.discount;
            if (typeof sInfo.gst === 'number') storedGst = sInfo.gst;
            if (typeof sInfo.service_charge === 'number') storedServiceCharge = sInfo.service_charge;
            if (typeof sInfo.grand_total === 'number') storedGrandTotal = sInfo.grand_total;
          }
        }
      });

      const finalSub = storedSubtotal !== undefined ? storedSubtotal : subtotal;
      const discount = storedDiscount || 0;
      const netFood = Math.max(0, finalSub - discount);
      const cgst = (netFood * 0.025).toFixed(2);
      const sgst = (netFood * 0.025).toFixed(2);
      const exactTax = Number(cgst) + Number(sgst);
      const serviceCharge = storedServiceCharge !== undefined ? storedServiceCharge : Math.round(netFood * 0.05);
      const grandTotal = storedGrandTotal !== undefined ? storedGrandTotal : Math.round(netFood + exactTax + serviceCharge);
      const exactSum = netFood + exactTax + serviceCharge;
      const roundOff = (grandTotal - exactSum).toFixed(2);

      // Generate PDF
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("HOTEL WHITE BLISS", 105, 18, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Dnyaneshwar Nagar, Pathardi Phata, Nashik, Maharashtra 422009", 105, 24, { align: "center" });
      doc.text("GSTIN: 27AABCH1234F1Z5  |  FSSAI: 11521045000123  |  Contact: +91 7499934257", 105, 29, { align: "center" });
      doc.text(`Date: ${new Date(orders[0].created_at).toLocaleDateString()} ${new Date(orders[0].created_at).toLocaleTimeString()}`, 105, 34, { align: "center" });
      
      const formattedTableName = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i) ? tableNumber : `Table No: ${tableNumber}`;
      doc.setFont("helvetica", "bold");
      doc.text(formattedTableName, 105, 40, { align: "center" });

      const tableBody = orders.flatMap(order => {
        let parsedItems = [];
        try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e) {}
        
        return parsedItems
          .filter((i: any) => i && i.name && i.id !== 'NOTE' && i.id !== 'SETTLEMENT_INFO' && i.id !== 'PAYMENT_METHOD' && i.id !== 'CUSTOMER_INFO')
          .map((item: any) => [
            String(item.name || ''),
            String(item.qty ?? 1),
            `Rs. ${item.price ?? 0}`,
            `Rs. ${(Number(item.price) || 0) * (Number(item.qty) || 1)}`
          ]);
      });

      autoTable(doc, {
        startY: 46,
        head: [['Item', 'Qty', 'Rate', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [161, 141, 109] }, // Accent color
        styles: { font: 'helvetica', fontSize: 10 },
      });

      let curY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.text("Subtotal:", 135, curY);
      doc.text(`Rs. ${finalSub}`, 190, curY, { align: 'right' });
      curY += 6;

      if (discount > 0) {
        doc.setTextColor(22, 163, 74);
        doc.text("Discount:", 135, curY);
        doc.text(`-Rs. ${discount}`, 190, curY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        curY += 6;
      }
      
      doc.text("CGST (2.5%):", 135, curY);
      doc.text(`Rs. ${cgst}`, 190, curY, { align: 'right' });
      curY += 6;
      
      doc.text("SGST (2.5%):", 135, curY);
      doc.text(`Rs. ${sgst}`, 190, curY, { align: 'right' });
      curY += 6;
      
      if (serviceCharge > 0) {
        doc.text("Service Charge (5%):", 135, curY);
        doc.text(`Rs. ${serviceCharge}`, 190, curY, { align: 'right' });
        curY += 6;
      }

      if (Math.abs(Number(roundOff)) >= 0.01) {
        doc.setTextColor(100, 100, 100);
        doc.text("Round Off:", 135, curY);
        doc.text(`${Number(roundOff) > 0 ? '+' : ''}Rs. ${roundOff}`, 190, curY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        curY += 6;
      }
      
      curY += 2;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL:", 125, curY);
      doc.text(`Rs. ${grandTotal}`, 190, curY, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Thank you for dining with us!", 105, curY + 16, { align: "center" });

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Optional: Auto download
      // const fileName = `Hotel_White_Bliss_Bill_${formattedTableName.replace(' ', '_')}.pdf`;
      // doc.save(fileName);
      
    } catch (err: any) {
      setError(err.message || "Failed to load bill.");
    }
  };

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-gray-100 font-bold text-red-500">{error}</div>;
  }

  if (!pdfUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 flex-col gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#A18D6D] border-t-transparent rounded-full"></div>
        <p className="font-bold text-[#A18D6D] tracking-widest">GENERATING SECURE PDF...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
      <div className="bg-[#1E1B16] text-[#A18D6D] p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="font-playfair font-bold text-xl tracking-widest">HOTEL WHITE BLISS</h1>
        <a 
          href={pdfUrl} 
          download={`Bill_${ids}.pdf`}
          className="bg-[#A18D6D] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#8A785D] transition-colors"
        >
          Download PDF
        </a>
      </div>
      <iframe src={pdfUrl} className="flex-1 w-full border-none bg-gray-200" title="PDF Bill" />
    </div>
  );
}
