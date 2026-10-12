"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Self Pickup (Free)");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("DuitNow QR / FPX");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);

  const calcDays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const calcSubtotal = (c: any) => {
    if (!c) return 0;
    const days = calcDays(c.startDate, c.endDate);
    const rate = Number(c.item?.dailyRate) || 0;
    const qty = Number(c.quantity) || 1;
    return rate * qty * days;
  };

  useEffect(() => {
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem("rental_cart") || "[]");
      const normalized = saved.map((c: any) => {
        const itemObj = c.item || c.equipment || c;
        const startDate = c.startDate || new Date().toISOString().split("T")[0];
        const endDate = c.endDate || new Date().toISOString().split("T")[0];
        const quantity = Number(c.quantity) || 1;
        const selected = c.selected !== false;

        return {
          item: itemObj,
          startDate,
          endDate,
          quantity,
          selected,
          subtotal: calcSubtotal({ item: itemObj, startDate, endDate, quantity }),
        };
      });
      setCart(normalized);
    } catch (err) {
      console.error("Error reading cart from localStorage:", err);
      setCart([]);
    }
  }, []);

  const saveCartToStorage = (updatedCart: any[]) => {
    setCart(updatedCart);
    localStorage.setItem("rental_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const toggleItemSelection = (index: number) => {
    const updated = [...cart];
    updated[index].selected = !updated[index].selected;
    saveCartToStorage(updated);
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = Math.max(1, (updated[index].quantity || 1) + delta);
    updated[index].quantity = newQty;
    updated[index].subtotal = calcSubtotal(updated[index]);
    saveCartToStorage(updated);
  };

  const removeItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const selectedCartItems = cart.filter((item) => item.selected);
  const deliveryFee = deliveryMethod.includes("Site Delivery") ? 50 : 0;
  const itemsTotal = selectedCartItems.reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grandTotal = itemsTotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCartItems.length === 0) {
      alert("Please select at least one item to include in your order!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName,
        phone,
        identityNo,
        email,
        deliveryMethod,
        address: deliveryMethod.includes("Delivery") ? address : null,
        paymentMethod,
        notes,
        totalPrice: grandTotal,
        cart: selectedCartItems,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.booking) {
        setOrderedItems(selectedCartItems);
        setCreatedBooking(data.booking);

        const remainingCart = cart.filter((item) => !item.selected);
        saveCartToStorage(remainingCart);
      } else {
        alert(`Booking Error: ${data.error || "Failed to create booking"}`);
      }
    } catch (err: any) {
      console.error("Checkout submit error:", err);
      alert(`Network/Server error: ${err.message || "Failed to submit order"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="p-8 font-sans max-w-6xl mx-auto min-h-screen text-center font-bold text-lg">
        Loading checkout session...
      </main>
    );
  }

  // --- SUCCESSFUL ORDER: PERFECT 2-PAGE PDF PRINT LAYOUT ---
  if (createdBooking) {
    return (
      <main className="p-4 sm:p-8 font-sans max-w-4xl mx-auto min-h-screen text-black dark:text-white print:p-0 print:m-0 print:max-w-none print:bg-white print:text-black">
        {/* PRINT CSS STYLES FOR EXACT 2-PAGE PDF BREAKS */}
        <style jsx global>{`
          @media print {
            header, footer, nav, .print-hidden {
              display: none !important;
            }
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .pdf-page-1 {
              page-break-after: always !important;
              break-after: page !important;
              min-h-[100vh];
            }
            .pdf-page-2 {
              page-break-before: always !important;
              break-before: page !important;
              min-h-[100vh];
            }
          }
        `}</style>

        {/* TOP ACTION BUTTONS */}
        <div className="flex justify-between items-center mb-6 print-hidden">
          <Link
            href="/"
            className="border-2 border-black dark:border-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            ← Return to Store
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs hover:bg-blue-700 transition-colors cursor-pointer shadow-lg"
          >
            📥 Save / Download DO as PDF
          </button>
        </div>

        {/* PAGE 1: DO INVOICE */}
        <div className="pdf-page-1 border-4 border-black p-8 rounded-lg bg-white text-black shadow-2xl mb-8 print:shadow-none print:border-2 print:rounded-none print:p-6 print:mb-0">
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide">Delivery Order</h1>
              <p className="text-sm text-gray-600">Camera Rental Shop Solution</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{createdBooking.doNumber}</p>
              <p className="text-xs text-gray-500">Date: {new Date(createdBooking.createdAt).toLocaleDateString()}</p>
              <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-400">
                STATUS: CONFIRMED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 border-2 border-black rounded bg-gray-50 text-xs">
            <div>
              <p className="font-bold uppercase text-gray-500 text-[10px]">Customer Details</p>
              <p className="font-bold text-sm mt-0.5">{createdBooking.customerName}</p>
              <p>IC / Passport: {createdBooking.identityNo}</p>
              <p>Phone: {createdBooking.phone}</p>
              {createdBooking.email && <p>Email: {createdBooking.email}</p>}
            </div>
            <div>
              <p className="font-bold uppercase text-gray-500 text-[10px]">Fulfillment Details</p>
              <p className="font-bold text-sm mt-0.5">{createdBooking.deliveryMethod}</p>
              {createdBooking.address && <p className="text-gray-600">Address: {createdBooking.address}</p>}
              <p className="text-blue-600 font-bold mt-1">Payment Method: {createdBooking.paymentMethod}</p>
              {createdBooking.notes && <p className="mt-1 text-gray-500">Note: {createdBooking.notes}</p>}
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-center">Rental Period</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((c: any, i: number) => {
                  const days = calcDays(c.startDate, c.endDate);
                  const sub = calcSubtotal(c);

                  return (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="py-2.5 font-semibold">
                        {c.item?.name || "Equipment"}
                        <div className="text-[10px] text-gray-500">
                          S/N: {c.item?.serialNumber || "N/A"}
                        </div>
                      </td>
                      <td className="py-2.5 text-center">{c.quantity}</td>
                      <td className="py-2.5 text-center text-[11px]">
                        {c.startDate} to {c.endDate} ({days} day{days > 1 ? "s" : ""})
                      </td>
                        <td className="py-2.5 text-right font-bold">RM {sub.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {deliveryFee > 0 && (
            <div className="flex justify-between text-xs font-bold mb-2 px-1">
              <span>Site Delivery Fee:</span>
              <span>RM {deliveryFee.toFixed(2)}</span>
            </div>
          )}

          <div className="p-4 border-2 border-black rounded bg-black text-white">
            <div className="flex justify-between items-center text-base font-bold">
              <span>Grand Total Payable:</span>
              <span className="text-2xl font-extrabold">RM {createdBooking.totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-right text-[10px] text-gray-400 mt-2">Page 1 of 2 — Delivery Order Invoice</p>
        </div>

        {/* PAGE 2: HANDOVER CHECKLIST & SIGNATURES */}
        <div className="pdf-page-2 border-4 border-black p-8 rounded-lg bg-white text-black shadow-2xl print:shadow-none print:border-2 print:rounded-none print:p-6">
          <h2 className="text-xl font-extrabold uppercase border-b-2 border-black pb-3 mb-6">
            Equipment Handover & Inspection (Ref: {createdBooking.doNumber})
          </h2>

          <div className="mb-8">
            <table className="w-full text-left text-xs border-2 border-black border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black">
                  <th className="p-2 border-r border-black">Equipment Name</th>
                  <th className="p-2 text-center border-r border-black">Glass/Lens Clean</th>
                  <th className="p-2 text-center border-r border-black">Power/Cable OK</th>
                  <th className="p-2 text-center">Return Sign-off</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="p-2 border-r border-gray-300 font-bold">
                      {c.item?.name || "Equipment"} ({c.quantity}x)
                    </td>
                    <td className="p-2 text-center border-r border-gray-300">☐ Pass</td>
                    <td className="p-2 text-center border-r border-gray-300">☐ Pass</td>
                    <td className="p-2 text-center text-gray-400">☐ Received</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-black text-xs">
            <div>
              <p className="font-bold uppercase mb-12">Customer Acknowledgment & Signature</p>
              <div className="border-b border-black mb-2"></div>
              <p className="font-bold">{createdBooking.customerName}</p>
              <p className="text-gray-500">IC: {createdBooking.identityNo}</p>
            </div>
            <div>
              <p className="font-bold uppercase mb-12">Shop Inspector Sign-Off</p>
              <div className="border-b border-black mb-2"></div>
              <p className="font-bold">Authorized Staff Signature</p>
              <p className="text-gray-500">Camera Rental Shop Inspector</p>
            </div>
          </div>

          <p className="text-right text-[10px] text-gray-400 mt-8">Page 2 of 2 — Equipment Handover Agreement</p>
        </div>
      </main>
    );
  }

  // --- CHECKOUT FORM & CART VIEW ---
  return (
    <main className="p-8 font-sans max-w-6xl mx-auto min-h-screen text-black dark:text-white">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black dark:border-white pb-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">Delivery Order Checkout</h1>
          <p className="text-sm opacity-75">Review equipment, select/deselect items, and confirm fulfillment details.</p>
        </div>
        <div className="flex gap-2">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="bg-red-600 text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-red-700 cursor-pointer"
            >
              🗑️ Clear Cart
            </button>
          )}
          <Link
            href="/"
            className="border-2 border-black dark:border-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-75"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="p-12 border-2 border-black dark:border-white rounded-lg text-center opacity-60 my-8">
          <p className="text-xl font-bold mb-2">Your Rental Cart is Empty 🛒</p>
          <p className="text-xs mb-4">Browse our equipment catalog to select cinema cameras, lighting, and grip gear.</p>
          <Link
            href="/"
            className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-extrabold uppercase"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs font-bold border-2 border-black dark:border-white p-6 rounded-lg bg-white dark:bg-black shadow-lg">
              <h2 className="text-lg font-extrabold uppercase border-b-2 border-black dark:border-white pb-2 mb-4">
                Customer & Delivery Details
              </h2>

              <div>
                <label className="block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Tan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1">IC / Passport Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 900101-14-5566"
                    value={identityNo}
                    onChange={(e) => setIdentityNo(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="alex@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Fulfillment Option</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-bold text-xs"
                  >
                    <option value="Self Pickup (Free)">Self Pickup (Free)</option>
                    <option value="Site Delivery (+RM 50.00)">Site Delivery (+RM 50.00)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded p-2.5 bg-white dark:bg-black outline-none font-bold text-xs"
                  >
                    <option value="DuitNow QR / FPX">DuitNow QR / FPX</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash on Pickup">Cash on Pickup</option>
                  </select>
                </div>
              </div>

              {deliveryMethod.includes("Delivery") && (
                <div>
                  <label className="block mb-1">Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter production set address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded p-2 bg-white dark:bg-black outline-none font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block mb-1">Special Notes / Requests</label>
                <textarea
                  rows={2}
                  placeholder="Additional production requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 bg-white dark:bg-black outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || selectedCartItems.length === 0}
                className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-extrabold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? "Generating Delivery Order..." : `Generate Delivery Order (RM ${grandTotal.toFixed(2)})`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="border-2 border-black dark:border-white p-6 rounded-lg bg-white dark:bg-black shadow-lg">
              <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-3 mb-4">
                <h2 className="text-lg font-extrabold uppercase">
                  Cart Items ({selectedCartItems.length} of {cart.length} Selected)
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {cart.map((c, idx) => {
                  const days = calcDays(c.startDate, c.endDate);
                  const sub = calcSubtotal(c);

                  return (
                    <div
                      key={idx}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        c.selected
                          ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                          : "border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={c.selected}
                          onChange={() => toggleItemSelection(idx)}
                          className="mt-1 w-4 h-4 rounded cursor-pointer accent-black dark:accent-white"
                        />

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm">{c.item?.name || "Equipment"}</h3>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
                              title="Delete item"
                            >
                              🗑️
                            </button>
                          </div>

                          <p className="text-xs opacity-60 mt-0.5">
                            {c.startDate} → {c.endDate} ({days} day{days > 1 ? "s" : ""})
                          </p>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="opacity-60 text-[11px]">Qty:</span>
                              <div className="flex items-center border border-black dark:border-white rounded overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, -1)}
                                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 font-extrabold hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-2.5 font-bold text-xs">{c.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, 1)}
                                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 font-extrabold hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                              RM {sub.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {deliveryFee > 0 && (
                <div className="flex justify-between text-xs font-bold mb-3 px-1">
                  <span>Site Delivery Fee:</span>
                  <span>RM {deliveryFee.toFixed(2)}</span>
                </div>
              )}

              <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-black text-white dark:bg-white dark:text-black">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Selected Total:</span>
                  <span className="text-xl font-extrabold">RM {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
