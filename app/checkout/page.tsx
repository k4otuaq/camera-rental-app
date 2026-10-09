"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Pickup"); // "Pickup" or "Delivery"
  const deliveryFee = 50; // Fixed delivery fee of RM 50
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState("DuitNow QR / FPX");
  
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("rental_cart") || "[]");
    setCart(savedCart);
  }, []);

  const getRentalDetails = (startDate: string, endDate: string, dailyRate: number, quantity: number = 1) => {
    if (!startDate || !endDate) return { days: 0, totalPrice: 0, qty: quantity };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const days = diffDays > 0 ? diffDays : 1;
    const qty = quantity || 1;
    const totalPrice = days * dailyRate * qty;
    return { days, totalPrice, qty };
  };

  // Subtotal of gear rentals
  const rentalSubtotal = cart.reduce((sum, booking) => {
    const { totalPrice } = getRentalDetails(
      booking.startDate,
      booking.endDate,
      booking.item.dailyRate,
      booking.quantity
    );
    return sum + totalPrice;
  }, 0);

  // Additional Delivery Surcharge applied only if "Delivery" is selected
  const activeDeliveryFee = deliveryMethod === "Delivery" ? deliveryFee : 0;
  
  // Grand Total = Rental Subtotal + Delivery Fee
  const grandTotal = rentalSubtotal + activeDeliveryFee;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!customerName || !phone || !identityNo) {
      alert("Please fill in all required customer details (Name, Phone, IC/Passport).");
      return;
    }

    if (deliveryMethod === "Delivery" && !address) {
      alert("Please provide a delivery address.");
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    const doNumber = `DO-${Math.floor(100000 + Math.random() * 900000)}`;
    const currentDate = new Date().toLocaleDateString();

    return (
      <main className="p-8 font-sans max-w-4xl mx-auto min-h-screen text-black dark:text-white">
        
        {/* TOP CONTROL BAR */}
        <div className="flex flex-wrap gap-3 mb-6 print:hidden justify-between items-center">
          <button
            onClick={() => setIsSubmitted(false)}
            className="border-2 border-black dark:border-white px-4 py-2 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer text-sm"
          >
            ← Back to Edit Details
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

        {/* PAGE 1: DELIVERY ORDER SUMMARY */}
        <div className="border-4 border-black dark:border-white p-8 rounded-lg bg-white dark:bg-black shadow-2xl mb-8 print:shadow-none print:border-2">
          
          {/* DO Header */}
          <div className="flex justify-between items-start border-b-2 border-black dark:border-white pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wide">Delivery Order</h1>
              <p className="text-sm opacity-75">Camera Rental Shop Solution</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{doNumber}</p>
              <p className="text-xs opacity-60">Date: {currentDate}</p>
              <span className="inline-block mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full border border-green-400">
                STATUS: CONFIRMED
              </span>
            </div>
          </div>

          {/* Customer & Payment Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-sm">
            <div>
              <p className="font-bold text-xs opacity-60 uppercase">Customer Details</p>
              <p className="font-bold text-base mt-1">{customerName}</p>
              <p>IC / Passport: {identityNo}</p>
              <p>Phone: {phone}</p>
              {email && <p>Email: {email}</p>}
            </div>
            <div>
              <p className="font-bold text-xs opacity-60 uppercase">Fulfillment & Payment</p>
              <p className="font-bold text-base mt-1">
                {deliveryMethod === "Delivery" ? "Delivery to Site" : "Self Pickup"}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                Payment Method: {paymentMethod}
              </p>
              {deliveryMethod === "Delivery" ? (
                <p className="mt-1 font-medium text-xs">{address}</p>
              ) : (
                <p className="mt-1 opacity-75 text-xs">Self-pickup at Store</p>
              )}
              {notes && <p className="mt-2 text-xs opacity-60">Note: {notes}</p>}
            </div>
          </div>

          {/* Line Items Table */}
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
                {cart.map((booking, i) => {
                  const { days, totalPrice, qty } = getRentalDetails(
                    booking.startDate,
                    booking.endDate,
                    booking.item.dailyRate,
                    booking.quantity
                  );
                  return (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-3 font-semibold">
                        {booking.item.name}
                        <div className="text-xs font-normal opacity-60">S/N: {booking.item.serialNumber || "N/A"}</div>
                      </td>
                      <td className="py-3 text-center">{qty}</td>
                      <td className="py-3 text-center text-xs">
                        {booking.startDate} to {booking.endDate} ({days} {days === 1 ? 'day' : 'days'})
                      </td>
                      <td className="py-3 text-right font-bold">RM {totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Additional Delivery Charge Line Item */}
                {deliveryMethod === "Delivery" && (
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-950/30">
                    <td className="py-3 font-bold text-blue-600 dark:text-blue-400">
                      Site Delivery & Transport Service
                    </td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-center text-xs">Fixed Fee</td>
                    <td className="py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      RM {deliveryFee.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Breakdown & Total Banner */}
          <div className="p-4 border-2 border-black dark:border-white rounded-lg bg-black text-white dark:bg-white dark:text-black mb-2">
            <div className="flex justify-between items-center text-sm opacity-80 mb-1">
              <span>Equipment Rental Subtotal:</span>
              <span>RM {rentalSubtotal.toFixed(2)}</span>
            </div>
            {deliveryMethod === "Delivery" && (
              <div className="flex justify-between items-center text-sm opacity-80 mb-2">
                <span>Site Delivery Fee:</span>
                <span>RM {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700 dark:border-gray-300">
              <span className="text-lg font-bold">Grand Total Payable:</span>
              <span className="text-2xl font-extrabold">RM {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-right text-xs opacity-60 mt-2">Page 1 of 2 — Delivery Order Invoice</p>
        </div>

        {/* PAGE 2: BACK PAGE - HANDOVER CHECKLIST, TERMS & SIGNATURES */}
        <div className="border-4 border-black dark:border-white p-8 rounded-lg bg-white dark:bg-black shadow-2xl print:shadow-none print:border-2">
          <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold uppercase">Equipment Handover & Inspection</h2>
              <p className="text-xs opacity-75">Delivery Order Back Page — Ref: {doNumber}</p>
            </div>
            <div className="text-right text-xs font-bold">
              <p>Customer: {customerName}</p>
              <p className="text-blue-600 dark:text-blue-400 mt-0.5">Paid via: {paymentMethod}</p>
            </div>
          </div>

          {/* Handover & Condition Checklist Table */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase mb-2">1. Outgoing / Returning Condition Checklist</h3>
            <table className="w-full text-left text-xs border-2 border-black dark:border-white border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 border-b-2 border-black dark:border-white">
                  <th className="p-2 border-r border-black dark:border-white">Equipment Name & S/N</th>
                  <th className="p-2 text-center border-r border-black dark:border-white w-24">Glass / Lens Clean</th>
                  <th className="p-2 text-center border-r border-black dark:border-white w-24">Power / Cable OK</th>
                  <th className="p-2 text-center border-r border-black dark:border-white w-24">Case & Accessories</th>
                  <th className="p-2 text-center w-28">Return Sign-off</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((booking, i) => (
                  <tr key={i} className="border-b border-gray-300 dark:border-gray-800">
                    <td className="p-2 border-r border-gray-300 dark:border-gray-800 font-bold">
                      {booking.item.name} ({booking.quantity || 1}x)
                      <span className="block font-normal opacity-60">S/N: {booking.item.serialNumber || "N/A"}</span>
                    </td>
                    <td className="p-2 text-center border-r border-gray-300 dark:border-gray-800">☐ Pass</td>
                    <td className="p-2 text-center border-r border-gray-300 dark:border-gray-800">☐ Pass</td>
                    <td className="p-2 text-center border-r border-gray-300 dark:border-gray-800">☐ Pass</td>
                    <td className="p-2 text-center opacity-40">☐ Received</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rental Terms & Conditions */}
          <div className="mb-6 text-xs leading-relaxed p-4 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-sm uppercase mb-2">2. Standard Rental Terms & Conditions</h3>
            <ol className="list-decimal list-inside space-y-1 opacity-80">
              <li><strong>Equipment Inspection:</strong> The renter acknowledges receipt of equipment in good working order and clean condition.</li>
              <li><strong>Loss or Damage:</strong> The hirer assumes full liability for loss, theft, or damage during the rental period. Replacement cost or repair fees will be charged accordingly.</li>
              <li><strong>Late Return Surcharge:</strong> Gear returned past the agreed return date will incur an additional daily rental charge plus a 20% late penalty.</li>
              <li><strong>Sub-letting Prohibition:</strong> Equipment must not be sub-let or operated by unauthorized third parties without prior written consent.</li>
            </ol>
          </div>

          {/* Signatures & Approvals */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-black dark:border-white text-xs">
            <div>
              <p className="font-bold uppercase mb-8">Issued By (Rental Representative):</p>
              <div className="border-b-2 border-black dark:border-white w-48 mb-2"></div>
              <p className="font-bold">Authorized Signature & Stamp</p>
              <p className="opacity-60 mt-1">Date: {currentDate}</p>
            </div>
            <div>
              <p className="font-bold uppercase mb-8">Received & Accepted By (Renter):</p>
              <div className="border-b-2 border-black dark:border-white w-48 mb-2"></div>
              <p className="font-bold">{customerName}</p>
              <p className="opacity-60 mt-1">IC / Passport: {identityNo}</p>
            </div>
          </div>

          <p className="text-right text-xs opacity-60 mt-6">Page 2 of 2 — Equipment Handover & Rental Agreement</p>
        </div>

      </main>
    );
  }

  return (
    <main className="p-8 font-sans max-w-5xl mx-auto min-h-screen text-black dark:text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Delivery Order Checkout</h1>
        <Link
          href="/"
          className="text-sm font-bold border-2 border-black dark:border-white px-4 py-2 rounded-lg hover:opacity-75 transition-opacity"
        >
          ← Back to Shop
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="p-8 border-2 border-black dark:border-white rounded-lg text-center opacity-60">
          <p className="text-lg mb-4">Your cart is empty.</p>
          <Link
            href="/"
            className="inline-block bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-lg font-bold"
          >
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Customer Information Form */}
          <form onSubmit={handleSubmitOrder} className="p-6 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-black flex flex-col gap-4">
            <h2 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-2">
              Customer & Delivery Details
            </h2>

            <div>
              <label className="text-xs font-bold uppercase block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bryan Lee"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 012-3456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">IC / Passport No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 980101-10-5555"
                  value={identityNo}
                  onChange={(e) => setIdentityNo(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase block mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="e.g. bryan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
              />
            </div>

            {/* FULFILLMENT METHOD */}
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Fulfillment Option</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                  <input
                    type="radio"
                    name="method"
                    value="Pickup"
                    checked={deliveryMethod === "Pickup"}
                    onChange={() => setDeliveryMethod("Pickup")}
                  />
                  Self Pickup (Free)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                  <input
                    type="radio"
                    name="method"
                    value="Delivery"
                    checked={deliveryMethod === "Delivery"}
                    onChange={() => setDeliveryMethod("Delivery")}
                  />
                  Delivery to Site (+RM 50.00)
                </label>
              </div>
            </div>

            {deliveryMethod === "Delivery" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="text-xs font-bold uppercase block mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter full delivery location..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-2">
                  ✓ Fixed Delivery Charge: RM 50.00 will be added to total
                </p>
              </div>
            )}

            {/* PAYMENT METHOD SELECTOR */}
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Payment Method *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "DuitNow QR / FPX",
                  "Credit / Debit Card",
                  "Bank Transfer",
                  "Cash on Pickup/Delivery"
                ].map((method) => (
                  <label
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 ${
                      paymentMethod === method
                        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                        : "border-black dark:border-white bg-white dark:bg-black"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase block mb-1">Special Notes / Requests</label>
              <textarea
                rows={2}
                placeholder="e.g. Request extra battery, late return notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black outline-none"
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors w-full cursor-pointer text-base"
            >
              Generate Delivery Order (DO)
            </button>
          </form>

          {/* Order Summary Side Card */}
          <div className="p-6 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold border-b-2 border-black dark:border-white pb-2 mb-4">
                Order Summary ({cart.length} item{cart.length > 1 ? "s" : ""})
              </h2>

              <div className="flex flex-col gap-3 mb-6">
                {cart.map((booking, index) => {
                  const { days, totalPrice, qty } = getRentalDetails(
                    booking.startDate,
                    booking.endDate,
                    booking.item.dailyRate,
                    booking.quantity
                  );

                  return (
                    <div key={index} className="flex justify-between items-start text-sm border-b border-gray-200 dark:border-gray-800 pb-2">
                      <div>
                        <p className="font-bold">{booking.item.name} × {qty}</p>
                        <p className="text-xs opacity-75 font-semibold text-gray-600 dark:text-gray-400">
                          S/N: {booking.item.serialNumber || "N/A"}
                        </p>
                        <p className="text-xs opacity-60">{booking.startDate} → {booking.endDate} ({days} days)</p>
                      </div>
                      <span className="font-bold whitespace-nowrap ml-2">RM {totalPrice.toFixed(2)}</span>
                    </div>
                  );
                })}

                {/* Delivery Fee Line item */}
                {deliveryMethod === "Delivery" && (
                  <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-800 pb-2 text-blue-600 dark:text-blue-400 font-bold">
                    <div>
                      <p>Delivery Charge</p>
                      <p className="text-xs font-normal opacity-75">Site transport surcharge</p>
                    </div>
                    <span>RM {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-black dark:border-white pt-4">
              <div className="flex justify-between items-center text-xs opacity-75 mb-1">
                <span>Rental Subtotal:</span>
                <span>RM {rentalSubtotal.toFixed(2)}</span>
              </div>
              {deliveryMethod === "Delivery" && (
                <div className="flex justify-between items-center text-xs opacity-75 mb-1 text-blue-600 dark:text-blue-400 font-bold">
                  <span>Delivery Fee:</span>
                  <span>+ RM {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs opacity-75 mb-2 font-bold text-gray-700 dark:text-gray-300">
                <span>Payment Method:</span>
                <span>{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-extrabold border-t border-gray-300 dark:border-gray-700 pt-2">
                <span>Total:</span>
                <span className="text-blue-600 dark:text-blue-400">RM {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </main>
  );
}
