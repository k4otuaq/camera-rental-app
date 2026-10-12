"use client"
import { useState, useEffect, use } from "react";
import Link from "next/link";

const imageMap: Record<string, string> = {
  "RED Komodo 6k": "/komodo.webp",
  "AMARAN Ray 660c": "/ray660.webp",
  "AMARAN Ray 120c": "/ray120.webp"
};

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysLater = new Date(tomorrow);
    threeDaysLater.setDate(threeDaysLater.getDate() + 2);

    setStartDate(tomorrow.toISOString().split("T")[0]);
    setEndDate(threeDaysLater.toISOString().split("T")[0]);

    async function fetchItem() {
      try {
        const res = await fetch("/api/equipment");
        const data = await res.json();
        if (Array.isArray(data)) {
          const decodedId = decodeURIComponent(id);
          const found = data.find((e: any) => 
            String(e.id) === String(id) || 
            String(e.id) === decodedId ||
            e.name.toLowerCase().replace(/\s+/g, '-') === decodedId.toLowerCase()
          );
          setItem(found || data[0] || null);
        }
      } catch (err) {
        console.error("Failed to load item", err);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const days = calculateDays();
  const subtotal = item ? (item.dailyRate || 0) * quantity * days : 0;

  if (loading) {
    return (
      <main className="p-8 max-w-4xl mx-auto font-sans min-h-screen text-black dark:text-white flex justify-center items-center">
        <p className="text-lg font-bold">Loading equipment details...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="p-8 max-w-4xl mx-auto font-sans min-h-screen text-black dark:text-white">
        <Link href="/" className="text-sm font-bold border-2 border-black dark:border-white px-4 py-2 rounded-lg inline-block mb-6">
          ← Back to Shop
        </Link>
        <div className="p-8 border-2 border-black dark:border-white rounded-lg text-center opacity-60">
          <h2 className="text-2xl font-bold mb-2">Equipment Not Found</h2>
        </div>
      </main>
    );
  }

  const totalStock = item.stock ?? 1;
  const rentedOut = item.rentedOut ?? 0;
  const availableLeft = Math.max(0, totalStock - rentedOut);
  const displayImage = imageMap[item.name] || item.imageUrl;

  const featuresList = item.keyFeatures
    ? item.keyFeatures.split("\n").filter((line: string) => line.trim() !== "")
    : ["Inspected & tested before hire", "Includes protective transport case"];

  const accessoriesList = item.includedAccessories
    ? item.includedAccessories.split("\n").filter((line: string) => line.trim() !== "")
    : ["1x Main Fixture / Body", "1x Power Cable / Charger", "1x Transport Case"];

  const handleBook = () => {
    if (availableLeft <= 0) {
      alert("Sorry, this item is out of stock!");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select both a start and end date!");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem("rental_cart") || "[]");
    
    const cartItem = {
      item,
      startDate,
      endDate,
      quantity,
      days,
      subtotal,
      selected: true // Default item as selected when added
    };

    const updatedCart = [...currentCart, cartItem];

    // 1. Save to LocalStorage
    localStorage.setItem("rental_cart", JSON.stringify(updatedCart));

    // 2. DISPATCH CUSTOM EVENT TO UPDATE NAVBAR COUNTER INSTANTLY
    window.dispatchEvent(new Event("cartUpdated"));

    // 3. Inform customer without redirecting
    alert(`Added ${quantity} unit(s) of ${item.name} to your rental cart! You can continue browsing or click Cart in the header to checkout.`);
  };

  return (
    <main className="p-8 font-sans max-w-5xl mx-auto min-h-screen text-black dark:text-white">
      <Link
        href="/"
        className="text-sm font-bold border-2 border-black dark:border-white px-4 py-2 rounded-lg hover:opacity-75 transition-opacity inline-block mb-6"
      >
        ← Back to Shop Catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-2 border-black dark:border-white p-6 rounded-lg bg-white dark:bg-black shadow-lg mb-8">
        
        {/* Left Column: Image & Stock Gauge */}
        <div>
          {displayImage ? (
            <img
              src={displayImage}
              alt={item.name}
              className="w-full h-80 object-cover rounded-lg border-2 border-black dark:border-white bg-white mb-4"
            />
          ) : (
            <div className="w-full h-80 border-2 border-black dark:border-white border-dashed rounded-lg mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900 opacity-60 font-bold">
              No Image Available
            </div>
          )}

          <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-xs">
            <div>
              <p className="opacity-60">Total Owned</p>
              <p className="font-bold text-base">{totalStock}</p>
            </div>
            <div>
              <p className="opacity-60">Rented Out</p>
              <p className="font-bold text-base text-orange-500">{rentedOut}</p>
            </div>
            <div>
              <p className="opacity-60">Available Left</p>
              <p className={`font-bold text-base ${availableLeft > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {availableLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Specs & Booking Box */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 px-2.5 py-1 rounded">
              {item.category}
            </span>
            <h1 className="text-3xl font-extrabold mt-3 mb-1">{item.name}</h1>
            <p className="text-xs opacity-60 mb-3">Serial Number: {item.serialNumber}</p>

            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">
              RM {item.dailyRate?.toFixed(2)} / day
            </p>

            <p className="text-sm opacity-80 mb-6 leading-relaxed border-t border-b border-gray-200 dark:border-gray-800 py-3">
              {item.description || "Professional cinema and video production rental gear."}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black font-semibold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">End Date</label>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded p-2 text-sm bg-white dark:bg-black font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mb-4 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg border border-gray-300 dark:border-gray-700">
              <label className="text-xs font-bold uppercase tracking-wider">Quantity to Rent:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={availableLeft <= 0}
                className="border-2 border-black dark:border-white rounded px-3 py-1 bg-white dark:bg-black font-bold text-sm cursor-pointer disabled:opacity-50 outline-none"
              >
                {availableLeft <= 0 ? (
                  <option value={0}>0</option>
                ) : (
                  Array.from({ length: availableLeft }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'unit' : 'units'}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="p-3 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 mb-6 text-xs font-bold space-y-1">
              <div className="flex justify-between">
                <span className="opacity-75">Rental Duration:</span>
                <span>{days} Day{days > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 dark:border-gray-800 pt-1 text-sm font-extrabold text-blue-600 dark:text-blue-400">
                <span>Calculated Subtotal:</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={availableLeft <= 0}
            className={`w-full py-3 rounded-lg font-extrabold text-base transition-all ${
              availableLeft > 0
                ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-80 cursor-pointer shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
            }`}
          >
            {availableLeft > 0 ? `Add ${quantity} Unit(s) to Rental Cart 🛒` : "Out of Stock"}
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900">
        <div>
          <h2 className="text-lg font-bold border-b-2 border-black dark:border-white pb-2 mb-3 uppercase">
            Technical Highlights
          </h2>
          {item.mount && (
            <p className="text-xs font-bold mb-1">
              Mount: <span className="font-normal">{item.mount}</span>
            </p>
          )}
          {item.resolution && (
            <p className="text-xs font-bold mb-3">
              Resolution / Output: <span className="font-normal">{item.resolution}</span>
            </p>
          )}
          <ul className="list-disc list-inside text-xs space-y-1.5 opacity-80 mt-2">
            {featuresList.map((feat: string, i: number) => (
              <li key={i}>{feat}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold border-b-2 border-black dark:border-white pb-2 mb-3 uppercase">
            Included Kit & Accessories
          </h2>
          <ul className="text-xs space-y-1.5">
            {accessoriesList.map((acc: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span> {acc}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </main>
  );
}
