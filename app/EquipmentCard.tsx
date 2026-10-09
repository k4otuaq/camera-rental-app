"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const imageMap: Record<string, string> = {
  "RED Komodo 6k": "/komodo.webp",
  "AMARAN Ray 660c": "/ray660.webp",
  "AMARAN Ray 120c": "/ray120.webp"
};

export default function EquipmentCard({ item, onBook }: { item: any; onBook: (booking: any) => void }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Inventory Calculations
  const totalStock = item.stock ?? 1;
  const rentedOut = item.rentedOut ?? 0;
  const availableLeft = Math.max(0, totalStock - rentedOut);

  // Quantity State (Defaults to 1 if available, otherwise 0)
  const [quantity, setQuantity] = useState(availableLeft > 0 ? 1 : 0);

  // Reset quantity if available stock changes dynamically
  useEffect(() => {
    if (availableLeft > 0 && quantity === 0) {
      setQuantity(1);
    }
  }, [availableLeft]);

  const displayImage = imageMap[item.name] || item.imageUrl;

  const handleBook = () => {
    if (availableLeft <= 0) {
      alert("Sorry, this item is completely out of stock!");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select both a start and end date!");
      return;
    }
    if (quantity <= 0 || quantity > availableLeft) {
      alert(`Please select a valid quantity between 1 and ${availableLeft}!`);
      return;
    }

    // Pass the selected quantity along with the booking object
    onBook({ item, startDate, endDate, quantity });
    alert(`Added ${quantity} unit(s) of ${item.name} to your rental cart!`);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "DD - MM - YYYY";
    const [year, month, day] = dateString.split('-');
    return `${day} - ${month} - ${year}`;
  };

  return (
    <div className="border-2 border-black dark:border-white p-6 rounded-lg shadow-md max-w-sm w-full bg-white dark:bg-black text-black dark:text-white transition-colors flex flex-col relative">
      
      {/* Clickable Image & Title */}
      <div 
        onClick={() => router.push(`/equipment/${item.id}`)}
        className="cursor-pointer group mt-2"
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={item.name} 
            className="w-full h-48 object-cover rounded-md mb-4 border-2 border-black dark:border-white bg-white group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-full h-48 border-2 border-black dark:border-white border-dashed rounded-md mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-sm opacity-60">
            No Image Added
          </div>
        )}

        <h2 className="text-2xl font-bold group-hover:underline">{item.name}</h2>
      </div>

      <p className="text-sm opacity-80">Category: {item.category}</p>
      <p className="text-xs opacity-60 mb-3">Serial: {item.serialNumber}</p>

      {/* DETAILED INVENTORY STATUS BAR */}
      <div className="p-3 mb-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-xs">
        <div>
          <p className="opacity-60">Total Owned</p>
          <p className="font-bold text-sm">{totalStock}</p>
        </div>
        <div>
          <p className="opacity-60">Rented Out</p>
          <p className="font-bold text-sm text-orange-500">{rentedOut}</p>
        </div>
        <div>
          <p className="opacity-60">Available Left</p>
          <p className={`font-bold text-sm ${availableLeft > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
            {availableLeft}
          </p>
        </div>
      </div>

      <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
        RM {item.dailyRate.toFixed(2)} / day
      </p>

      {/* DATE PICKERS */}
      <div className="flex gap-4 mb-3 mt-auto">
        <div className="flex flex-col w-1/2 relative">
          <label className="text-xs font-semibold mb-1">Start Date</label>
          <div className="relative w-full">
            <div className="border-2 border-black dark:border-white rounded p-2 text-sm text-center w-full bg-white dark:bg-black">
              {formatDisplayDate(startDate)}
            </div>
            <input 
              type="date" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col w-1/2 relative">
          <label className="text-xs font-semibold mb-1">End Date</label>
          <div className="relative w-full">
            <div className="border-2 border-black dark:border-white rounded p-2 text-sm text-center w-full bg-white dark:bg-black">
              {formatDisplayDate(endDate)}
            </div>
            <input 
              type="date" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* QUANTITY SELECTOR */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-gray-100 dark:bg-gray-900 p-2 rounded-lg border border-gray-300 dark:border-gray-700">
        <label className="text-xs font-bold uppercase tracking-wider">Qty to Rent:</label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={availableLeft <= 0}
          className="border-2 border-black dark:border-white rounded px-3 py-1 bg-white dark:bg-black font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none"
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

      {/* BOOK BUTTON */}
      <button 
        onClick={handleBook}
        disabled={availableLeft <= 0}
        className={`border-2 border-black dark:border-white px-4 py-2 rounded w-full font-bold transition-colors ${
          availableLeft > 0 
            ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-75 cursor-pointer" 
            : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
        }`}
      >
        {availableLeft > 0 ? `Book ${quantity} Unit(s)` : "Unavailable"}
      </button>
    </div>
  );
}
