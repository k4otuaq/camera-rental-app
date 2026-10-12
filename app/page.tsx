"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

const imageMap: Record<string, string> = {
  "RED Komodo 6k": "/komodo.webp",
  "AMARAN Ray 660c": "/ray660.webp",
  "AMARAN Ray 120c": "/ray120.webp"
};

export default function Home() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const res = await fetch("/api/equipment");
        const data = await res.json();
        if (Array.isArray(data)) {
          setEquipment(data);
        }
      } catch (err) {
        console.error("Error fetching equipment:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEquipment();
  }, []);

  // Extract unique categories dynamically from the database list
  const categories = ["ALL", ...Array.from(new Set(equipment.map((item) => item.category)))];

  // Filter equipment based on Search Bar and Selected Category
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="p-8 font-sans max-w-6xl mx-auto min-h-screen text-black dark:text-white">
      
      {/* HEADER & HERO */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight uppercase mb-2">
          Equipment Catalog
        </h1>
        <p className="text-sm opacity-75">
          Browse live inventory, check rental availability, and book gear online.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search equipment by name or model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-2 border-black dark:border-white rounded-lg p-3 text-sm bg-white dark:bg-black font-medium outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* DYNAMIC CATEGORY FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border-2 ${
              selectedCategory === cat
                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow"
                : "border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* EQUIPMENT GRID */}
      {loading ? (
        <p className="text-center font-bold text-lg py-12">Loading store catalog...</p>
      ) : filteredEquipment.length === 0 ? (
        <div className="p-12 border-2 border-black dark:border-white rounded-lg text-center opacity-60">
          <p className="text-lg font-bold">No gear found matching your search.</p>
          <p className="text-xs mt-1">Try clearing your category filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => {
            const totalStock = item.stock ?? 1;
            const rentedOut = item.rentedOut ?? 0;
            const availableLeft = Math.max(0, totalStock - rentedOut);
            const displayImage = imageMap[item.name] || item.imageUrl;

            return (
              <div
                key={item.id}
                className="border-2 border-black dark:border-white rounded-lg p-5 bg-white dark:bg-black shadow-md flex flex-col justify-between hover:shadow-xl transition-shadow"
              >
                <div>
                  {/* IMAGE */}
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded border-2 border-black dark:border-white bg-white mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 border-2 border-black dark:border-white border-dashed rounded mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900 opacity-60 font-bold text-xs">
                      📷 {item.name}
                    </div>
                  )}

                  {/* CATEGORY & TITLE */}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <h2 className="text-xl font-bold mt-2 mb-1">{item.name}</h2>
                  <p className="text-xs opacity-60 font-mono mb-3">S/N: {item.serialNumber}</p>

                  {/* STOCK BADGES */}
                  <div className="p-3 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between text-[11px] mb-4">
                    <div>
                      <span className="block opacity-60">Owned</span>
                      <strong className="text-sm">{totalStock}</strong>
                    </div>
                    <div>
                      <span className="block opacity-60">Rented</span>
                      <strong className="text-sm text-orange-500">{rentedOut}</strong>
                    </div>
                    <div>
                      <span className="block opacity-60">Available</span>
                      <strong className={`text-sm ${availableLeft > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                        {availableLeft}
                      </strong>
                    </div>
                  </div>

                  <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mb-4">
                    RM {item.dailyRate?.toFixed(2)} <span className="text-xs font-normal text-black dark:text-white opacity-60">/ day</span>
                  </p>
                </div>

                {/* VIEW DETAILS BUTTON */}
                <Link
                  href={`/equipment/${encodeURIComponent(item.id)}`}
                  className={`w-full text-center py-2.5 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-opacity ${
                    availableLeft > 0
                      ? "bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                      : "bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {availableLeft > 0 ? "View & Book Gear →" : "Out of Stock"}
                </Link>
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
