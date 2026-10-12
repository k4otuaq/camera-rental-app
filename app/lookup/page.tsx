"use client"
import { useState } from "react";
import Link from "next/link";

export default function OrderLookupPage() {
  const [doNumber, setDoNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setBooking(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doNumber }),
      });

      const data = await res.json();

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        setErrorMessage(data.error || "Order not found.");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setErrorMessage("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to load jsPDF & AutoTable cleanly without npm installation
  const loadJsPDF = async () => {
    if ((window as any).jspdf) return (window as any).jspdf;

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    return (window as any).jspdf;
  };

  // 1-CLICK DIRECT PDF FILE GENERATOR
  const handleDownloadDirectPDF = async () => {
    if (!booking) return;
    setDownloadingPdf(true);

    try {
      const { jsPDF } = await loadJsPDF();
      const doc = new jsPDF();

      // --- PAGE 1: DELIVERY ORDER INVOICE ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("DELIVERY ORDER", 14, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Camera Rental Shop Solution", 14, 26);

      // Header DO Meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(String(booking.doNumber), 196, 20, { align: "right" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 196, 26, { align: "right" });
      doc.text(`Status: ${booking.status}`, 196, 31, { align: "right" });

      // Customer Details Box
      doc.rect(14, 38, 88, 35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("CUSTOMER DETAILS", 18, 44);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${booking.customerName}`, 18, 50);
      doc.text(`IC/Passport: ${booking.identityNo}`, 18, 55);
      doc.text(`Phone: ${booking.phone}`, 18, 60);
      if (booking.email) doc.text(`Email: ${booking.email}`, 18, 65);

      // Fulfillment Details Box
      doc.rect(106, 38, 90, 35);
      doc.setFont("helvetica", "bold");
      doc.text("FULFILLMENT & PAYMENT", 110, 44);
      doc.setFont("helvetica", "normal");
      doc.text(`Delivery: ${booking.deliveryMethod}`, 110, 50);
      doc.text(`Payment: ${booking.paymentMethod}`, 110, 55);
      if (booking.address) doc.text(`Address: ${booking.address.substring(0, 35)}...`, 110, 60);

      // Item Table
      const tableRows = (booking.items || []).map((item: any) => [
        `${item.equipment?.name || "Equipment"}\nS/N: ${item.equipment?.serialNumber || "N/A"}`,
        String(item.quantity || 1),
        `${item.startDate} to ${item.endDate}`,
        `RM ${(item.subtotal || 0).toFixed(2)}`
      ]);

      (doc as any).autoTable({
        startY: 80,
        head: [["Item Description", "Qty", "Rental Period", "Subtotal"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 50, halign: "center" },
          3: { cellWidth: 32, halign: "right" }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;

      // Grand Total Box
      doc.setFillColor(0, 0, 0);
      doc.rect(14, finalY + 10, 182, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total Payable:", 20, finalY + 19);
      doc.text(`RM ${(booking.totalPrice || 0).toFixed(2)}`, 190, finalY + 19, { align: "right" });

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("Page 1 of 2 — Delivery Order Invoice", 196, 285, { align: "right" });

      // --- PAGE 2: HANDOVER CHECKLIST & SIGNATURES ---
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`EQUIPMENT HANDOVER & INSPECTION (Ref: ${booking.doNumber})`, 14, 20);

      const page2Rows = (booking.items || []).map((item: any) => [
        `${item.equipment?.name || "Equipment"} (${item.quantity || 1}x)`,
        "[ Pass ]",
        "[ Pass ]",
        "[         ]"
      ]);

      (doc as any).autoTable({
        startY: 30,
        head: [["Equipment Name", "Glass / Lens Clean", "Power / Cable OK", "Return Sign-off"]],
        body: page2Rows,
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 34, halign: "center" },
          2: { cellWidth: 34, halign: "center" },
          3: { cellWidth: 34, halign: "center" }
        }
      });

      const page2FinalY = (doc as any).lastAutoTable.finalY || 120;
      const sigY = page2FinalY + 35;

      // Signatures
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Acknowledgment & Signature", 14, sigY);
      doc.line(14, sigY + 20, 90, sigY + 20);
      doc.text(String(booking.customerName), 14, sigY + 26);
      doc.setFont("helvetica", "normal");
      doc.text(`IC: ${booking.identityNo}`, 14, sigY + 31);

      doc.setFont("helvetica", "bold");
      doc.text("Shop Inspector Sign-Off", 110, sigY);
      doc.line(110, sigY + 20, 186, sigY + 20);
      doc.text("Authorized Staff Signature", 110, sigY + 26);
      doc.setFont("helvetica", "normal");
      doc.text("Camera Rental Shop Inspector", 110, sigY + 31);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("Page 2 of 2 — Equipment Handover Agreement", 196, 285, { align: "right" });

      // DIRECT FILE DOWNLOAD TO DISK
      doc.save(`${booking.doNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF file. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <main className="p-8 font-sans max-w-4xl mx-auto min-h-screen text-black dark:text-white">
      {/* WEB LOOKUP PAGE HEADER */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-black dark:border-white pb-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">Order Lookup</h1>
          <p className="text-sm opacity-75">Retrieve and download your official Delivery Order (DO).</p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold border-2 border-black dark:border-white px-3 py-2 rounded-lg hover:opacity-75 transition-opacity"
        >
          ← Back to Shop
        </Link>
      </div>

      {/* SEARCH FORM */}
      {!booking && (
        <div className="max-w-md mx-auto p-6 border-4 border-black dark:border-white rounded-lg bg-white dark:bg-black shadow-2xl my-8">
          <h2 className="text-lg font-bold uppercase mb-4 text-center">Find Your Rental Order</h2>

          <form onSubmit={handleSearch} className="space-y-4 text-xs font-bold">
            <div>
              <label className="block mb-1 uppercase">DO Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DO-372202"
                value={doNumber}
                onChange={(e) => setDoNumber(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded p-3 text-base bg-white dark:bg-black outline-none uppercase font-mono tracking-wider text-center"
              />
            </div>

            {errorMessage && (
              <p className="p-3 border border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded text-center text-xs font-bold">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-extrabold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loading ? "Searching Database..." : "Search Delivery Order"}
            </button>
          </form>
        </div>
      )}

      {/* RESULT VIEW */}
      {booking && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setBooking(null)}
              className="border-2 border-black dark:border-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
            >
              ← Search Another Order
            </button>

            {/* DIRECT PDF DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadDirectPDF}
              disabled={downloadingPdf}
              className="bg-blue-600 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs hover:bg-blue-700 transition-colors cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <span>📥</span> {downloadingPdf ? "Building PDF File..." : "Download Official DO (PDF)"}
            </button>
          </div>

          {/* PAGE PREVIEW ON SCREEN */}
          <div className="border-4 border-black dark:border-white p-8 rounded-lg bg-white dark:bg-black shadow-2xl mb-8">
            <div className="flex justify-between items-start border-b-2 border-black dark:border-white pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold uppercase tracking-wide">Delivery Order</h1>
                <p className="text-sm opacity-75">Camera Rental Shop Solution</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{booking.doNumber}</p>
                <p className="text-xs opacity-60">Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
                <span
                  className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full border ${
                    booking.status === "RETURNED"
                      ? "bg-gray-200 text-gray-800 border-gray-400"
                      : "bg-green-100 text-green-800 border-green-400"
                  }`}
                >
                  STATUS: {booking.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-sm">
              <div>
                <p className="font-bold text-xs opacity-60 uppercase">Customer Details</p>
                <p className="font-bold text-base mt-1">{booking.customerName}</p>
                <p>IC / Passport: {booking.identityNo}</p>
                <p>Phone: {booking.phone}</p>
                {booking.email && <p>Email: {booking.email}</p>}
              </div>
              <div>
                <p className="font-bold text-xs opacity-60 uppercase">Fulfillment & Payment</p>
                <p className="font-bold text-base mt-1">{booking.deliveryMethod}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                  Payment Method: {booking.paymentMethod}
                </p>
                {booking.notes && <p className="mt-2 text-xs opacity-60">Note: {booking.notes}</p>}
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black dark:border-white">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-center">Rental Period</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-3 font-semibold">
                        {item.equipment?.name || "Equipment"}
                        <div className="text-xs font-normal opacity-60">S/N: {item.equipment?.serialNumber || "N/A"}</div>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-center text-xs">
                        {item.startDate} to {item.endDate}
                      </td>
                      <td className="py-3 text-right font-bold">RM {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Grand Total Payable:</span>
                <span className="text-2xl font-extrabold">RM {booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
