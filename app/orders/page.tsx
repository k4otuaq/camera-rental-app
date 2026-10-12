"use client"
import { useState } from "react";
import Link from "next/link";

export default function OrderLookupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedBooking(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/bookings/lookup?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
        if (data.bookings.length === 1) {
          setSelectedBooking(data.bookings[0]);
        }
      } else {
        alert(data.error || "Failed to search for orders.");
        setBookings([]);
      }
    } catch (err) {
      console.error("Error looking up order", err);
      alert("Error searching for order.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  // RENDER DETAILED DO VIEW WHEN AN ORDER IS SELECTED
  if (selectedBooking) {
    const rentalSubtotal = selectedBooking.items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    const formattedDate = new Date(selectedBooking.createdAt).toLocaleDateString();

    return (
      <main className="p-8 font-sans max-w-4xl mx-auto min-h-screen text-black dark:text-white">
        <div className="flex flex-wrap gap-3 mb-6 print:hidden justify-between items-center">
          <button
            onClick={() => setSelectedBooking(null)}
            className="border-2 border-black dark:border-white px-4 py-2 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-sm cursor-pointer"
          >
            ← Back to Order Search
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="bg-black text-white dark:bg-white dark:text-black px-5 py-2 rounded-lg font-bold hover:opacity-80 transition-opacity cursor-pointer text-sm"
            >
              🖨️ Print / Save DO (2 Pages)
            </button>
            <Link
              href="/"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
            >
              Return to Store
            </Link>
          </div>
        </div>

        {/* PAGE 1: DELIVERY ORDER INVOICE */}
        <div className="border-4 border-black dark:border-white p-8 rounded-lg bg-white dark:bg-black shadow-2xl mb-8 print:shadow-none print:border-2">
          <div className="flex justify-between items-start border-b-2 border-black dark:border-white pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide">Delivery Order</h1>
              <p className="text-sm opacity-75">Camera Rental Shop Solution</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{selectedBooking.doNumber}</p>
              <p className="text-xs opacity-60">Date: {formattedDate}</p>
              <span className="inline-block mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full border border-green-400">
                STATUS: {selectedBooking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-sm">
            <div>
              <p className="font-bold text-xs opacity-60 uppercase">Customer Details</p>
              <p className="font-bold text-base mt-1">{selectedBooking.customerName}</p>
              <p>IC / Passport: {selectedBooking.identityNo}</p>
              <p>Phone: {selectedBooking.phone}</p>
              {selectedBooking.email && <p>Email: {selectedBooking.email}</p>}
            </div>
            <div>
              <p className="font-bold text-xs opacity-60 uppercase">Fulfillment & Payment</p>
              <p className="font-bold text-base mt-1">{selectedBooking.deliveryMethod}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                Payment Method: {selectedBooking.paymentMethod}
              </p>
              {selectedBooking.notes && <p className="mt-2 text-xs opacity-60">Note: {selectedBooking.notes}</p>}
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
                {selectedBooking.items.map((item: any, i: number) => {
                  const days = calculateDays(item.startDate, item.endDate);
                  return (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-3 font-semibold">
                        {item.equipment?.name || "Equipment"}
                        <div className="text-xs font-normal opacity-60">S/N: {item.equipment?.serialNumber || "N/A"}</div>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-center text-xs">
                        {item.startDate} to {item.endDate} ({days} days)
                      </td>
                      <td className="py-3 text-right font-bold">RM {item.subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-black text-white dark:bg-white dark:text-black mb-2">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Grand Total Payable:</span>
              <span className="text-2xl font-extrabold">RM {selectedBooking.totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-right text-xs opacity-60 mt-2">Page 1 of 2 — Delivery Order Invoice</p>
        </div>

        {/* PAGE 2: HANDOVER CHECKLIST */}
        <div className="border-4 border-black dark:border-white p-8 rounded-lg bg-white dark:bg-black shadow-2xl print:shadow-none print:border-2">
          <h2 className="text-2xl font-extrabold uppercase border-b-2 border-black dark:border-white pb-4 mb-6">
            Equipment Handover & Inspection (Ref: {selectedBooking.doNumber})
          </h2>
          <div className="mb-6">
            <table className="w-full text-left text-xs border-2 border-black dark:border-white border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 border-b-2 border-black dark:border-white">
                  <th className="p-2 border-r border-black dark:border-white">Equipment Name</th>
                  <th className="p-2 text-center border-r border-black dark:border-white">Glass/Lens Clean</th>
                  <th className="p-2 text-center border-r border-black dark:border-white">Power/Cable OK</th>
                  <th className="p-2 text-center">Return Sign-off</th>
                </tr>
              </thead>
              <tbody>
                {selectedBooking.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-300 dark:border-gray-800">
                    <td className="p-2 border-r border-gray-300 dark:border-gray-800 font-bold">
                      {item.equipment?.name || "Equipment"} ({item.quantity}x)
                    </td>
                    <td className="p-2 text-center border-r border-gray-300 dark:border-gray-800">☐ Pass</td>
                    <td className="p-2 text-center border-r border-gray-300 dark:border-gray-800">☐ Pass</td>
                    <td className="p-2 text-center opacity-40">☐ Received</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-right text-xs opacity-60">Page 2 of 2 — Equipment Handover Agreement</p>
        </div>
      </main>
    );
  }

  // DEFAULT SEARCH BAR VIEW
  return (
    <main className="p-8 font-sans max-w-4xl mx-auto min-h-screen text-black dark:text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Delivery Order Lookup</h1>
        <p className="text-sm opacity-75">Search active orders by DO Number, Phone, or IC Number.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 p-6 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-black flex gap-4">
        <input
          type="text"
          required
          placeholder="Enter DO Number (e.g. DO-492595) or Phone Number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-2 border-black dark:border-white rounded p-3 text-sm bg-white dark:bg-black outline-none font-medium"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white dark:bg-white dark:text-black font-bold px-6 py-3 rounded hover:opacity-80 transition-opacity cursor-pointer text-sm"
        >
          {loading ? "Searching..." : "Search Order"}
        </button>
      </form>

      {searched && (
        <div>
          {bookings.length === 0 ? (
            <div className="p-8 border-2 border-black dark:border-white rounded-lg text-center opacity-60">
              <p className="text-lg font-bold">No matching orders found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">Matching Orders ({bookings.length})</h2>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 flex justify-between items-center"
                >
                  <div>
                    <span className="font-extrabold text-lg mr-2">{b.doNumber}</span>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                      {b.status}
                    </span>
                    <p className="text-sm font-bold mt-1">{b.customerName} ({b.phone})</p>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="bg-blue-600 text-white font-bold px-4 py-2 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    View / Print DO →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
