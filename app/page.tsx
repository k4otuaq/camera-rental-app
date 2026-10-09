"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EquipmentCard from "./EquipmentCard";

export default function Home() {
  const router = useRouter();
  const [allEquipment, setAllEquipment] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const res = await fetch('/api/equipment');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setAllEquipment(data);
        } else {
          console.error("API response was not an array:", data);
          setAllEquipment([]);
        }
      } catch (err) {
        console.error("Failed to fetch equipment", err);
        setAllEquipment([]);
      }
    }
    fetchEquipment();

    const savedCart = JSON.parse(localStorage.getItem("rental_cart") || "[]");
    setCart(savedCart);
  }, []);

  const handleAddToCart = (booking: { item: any; startDate: string; endDate: string; quantity: number }) => {
    const updatedCart = [...cart, booking];
    setCart(updatedCart);
    localStorage.setItem("rental_cart", JSON.stringify(updatedCart));
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
    const updatedCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(updatedCart);
    localStorage.setItem("rental_cart", JSON.stringify(updatedCart));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem("rental_cart");
  };

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

  const grandTotal = cart.reduce((sum, booking) => {
    const { totalPrice } = getRentalDetails(
      booking.startDate, 
      booking.endDate, 
      booking.item.dailyRate, 
      booking.quantity
    );
    return sum + totalPrice;
  }, 0);

  const handleProceedToDO = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    router.push("/checkout");
  };

  const equipmentList = Array.isArray(allEquipment) ? allEquipment : [];

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(equipmentList.map(item => item.category)))];

  return (
    <main className="p-8 font-sans max-w-7xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold mb-2">My Camera Rental Shop</h1>
      <p className="text-lg opacity-75 mb-6">Live inventory from my database.</p>

      {/* SEARCH BAR */}
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Search equipment by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-2 border-black dark:border-white rounded-lg p-3 bg-white dark:bg-black text-black dark:text-white w-full outline-none text-sm"
        />
      </div>

      {/* CATEGORIES BAR */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-bold border-2 border-black dark:border-white text-sm transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === cat 
                ? "bg-black text-white dark:bg-white dark:text-black" 
                : "bg-white text-black dark:bg-black dark:text-white hover:opacity-70"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Equipment Catalogue Grid */}
      <div className="flex flex-wrap gap-6 mb-12">
        {filteredEquipment.length === 0 ? (
          <p className="opacity-60 text-sm">No equipment matches your search criteria.</p>
        ) : (
          filteredEquipment.map((item) => (
            <div key={item.id} className="w-full sm:w-[350px] flex-shrink-0">
              <EquipmentCard item={item} onBook={handleAddToCart} />
            </div>
          ))
        )}
      </div>

      {/* Rental Cart Section */}
      <div className="p-6 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-black text-black dark:text-white shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black dark:border-white pb-4">
          <h2 className="text-2xl font-bold">Your Rental Cart ({cart.length})</h2>
          {cart.length > 0 && (
            <button 
              onClick={handleClearCart}
              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>
        
        {cart.length === 0 ? (
          <p className="opacity-60 text-sm py-4 text-center">No items added to your cart yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {cart.map((booking, index) => {
              const { days, totalPrice, qty } = getRentalDetails(
                booking.startDate, 
                booking.endDate, 
                booking.item.dailyRate,
                booking.quantity
              );

              return (
                <div key={index} className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 pb-4">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">{booking.item.name}</p>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold px-2 py-0.5 rounded border border-blue-400">
                        Qty: {qty}
                      </span>
                    </div>

                    <p className="text-xs opacity-75 mt-1">
                      Serial: <span className="font-bold">{booking.item.serialNumber || "N/A"}</span>
                    </p>

                    <p className="text-xs opacity-75 mt-1">
                      Rental Dates: <span className="font-bold">{booking.startDate}</span> to <span className="font-bold">{booking.endDate}</span> ({days} {days === 1 ? 'day' : 'days'})
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        RM {totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs opacity-60">
                        RM {booking.item.dailyRate.toFixed(2)} / day × {qty} unit(s)
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-4 border-t-2 border-black dark:border-white text-xl font-bold">
              <span>Grand Total:</span>
              <span className="text-blue-600 dark:text-blue-400">RM {grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleProceedToDO}
              className="mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto self-end cursor-pointer"
            >
              Proceed to Delivery Order (DO)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
