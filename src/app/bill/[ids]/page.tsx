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
      const orderIds = ids.split('-');
      
      const { data: orders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds);

      if (dbError || !orders || orders.length === 0) {
        throw new Error("Bill not found.");
      }

      const tableNumber = orders[0].table_number;
      let subtotal = 0;
      
      orders.forEach(order => {
        subtotal += Number(order.total_amount);
      });

      const gst = Math.round(subtotal * 0.05);
      const serviceCharge = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + gst + serviceCharge;

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
        
        return parsedItems.filter((i:any) => i.id !== 'NOTE').map((item: any) => [
          item.name,
          item.qty.toString(),
          `Rs. ${item.price}`,
          `Rs. ${item.price * item.qty}`
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

      const finalY = (doc as any).lastAutoTable.finalY + 8;
      const cgst = (subtotal * 0.025).toFixed(2);
      const sgst = (subtotal * 0.025).toFixed(2);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", 135, finalY);
      doc.text(`Rs. ${subtotal}`, 190, finalY, { align: 'right' });
      
      doc.text("CGST (2.5%):", 135, finalY + 6);
      doc.text(`Rs. ${cgst}`, 190, finalY + 6, { align: 'right' });
      
      doc.text("SGST (2.5%):", 135, finalY + 12);
      doc.text(`Rs. ${sgst}`, 190, finalY + 12, { align: 'right' });
      
      if (serviceCharge > 0) {
        doc.text("Service Charge (5%):", 135, finalY + 18);
        doc.text(`Rs. ${serviceCharge}`, 190, finalY + 18, { align: 'right' });
      }
      
      const grandTotalY = serviceCharge > 0 ? finalY + 28 : finalY + 22;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL:", 125, grandTotalY);
      doc.text(`Rs. ${grandTotal}`, 190, grandTotalY, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Thank you for dining with us!", 105, finalY + 40, { align: "center" });

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
