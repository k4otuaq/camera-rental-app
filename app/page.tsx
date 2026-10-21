"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function StorefrontPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Item Detail Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Cart & Dispatch Drawer State
  const [cart, setCart] = useState<{ item: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Booking / Dates State
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  // Checkout Step State
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details">("cart");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK TRANSFER");
  const [deliveryMethod, setDeliveryMethod] = useState("SELF-PICKUP");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Fetch Live Equipment Inventory
  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/equipment");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEquipment(data);
      }
    } catch (err) {
      console.error("Failed to load catalog equipment", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Calculate Rental Duration (Days)
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const rentalDays = calculateDays();

  // Cart Functions
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (equipmentId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== equipmentId));
  };

  const updateQuantity = (equipmentId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(equipmentId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.item.id === equipmentId ? { ...c, quantity: qty } : c))
    );
  };

  const dailySubtotal = cart.reduce(
    (sum, c) => sum + (c.item.dailyRate || 0) * c.quantity,
    0
  );
  const grandTotal = dailySubtotal * rentalDays;
  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // Handle Order Dispatch Submission
  const handlePlaceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmittingBooking(true);
    try {
      const payload = {
        customerName,
        phone,
        identityNo,
        paymentMethod,
        deliveryMethod,
        startDate,
        endDate,
        rentalDays,
        items: cart.map((c) => ({
          equipmentId: c.item.id,
          quantity: c.quantity,
        })),
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data.booking?.doNumber || "DO-SUCCESS");
        setCart([]);
        setCheckoutStep("cart");
      } else {
        alert(`Booking Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to place order", err);
      alert("An unexpected error occurred while placing your dispatch order.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Dynamic Category Filters
  const categories = [
    "ALL",
    "CINEMA CAMERA",
    "LENSES",
    "LIGHTING",
    "SUPPORT & GRIP",
    "AUDIO",
  ];

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "ALL" ||
      item.category?.toUpperCase() === activeCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
      
      {/* 1. SINGLE CLEAN EDITORIAL HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* TUAQ K4O LOGO */}
          <Link href="/" className="group block">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tighter text-zinc-900">
                tuaq
              </span>
              <span className="text-xs font-semibold text-zinc-600">
                k4o™
              </span>
            </div>
            <p className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase -mt-1">
              tech & support
            </p>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-wider text-zinc-600">
            <a href="#catalogue" className="hover:text-zinc-900 transition-colors">
              Catalogue
            </a>
            <a href="#about" className="hover:text-zinc-900 transition-colors">
              About
            </a>
            <Link href="/admin" className="hover:text-zinc-900 transition-colors opacity-60 hover:opacity-100">
              Staff Portal 🔒
            </Link>
          </nav>

          {/* SEARCH & CART BUTTON */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-full px-4 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 w-48 lg:w-64 transition-all"
              />
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              <span>Dispatch</span>
              <span className="bg-zinc-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CATALOGUE HERO */}
      <section id="catalogue" className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-6">
        <div className="border-b border-zinc-100 pb-8">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase text-zinc-900">
            Catalogue
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-500 uppercase mt-2">
            Selected Cinema & Production Equipment
          </p>
        </div>

        {/* CATEGORIES */}
        <div className="flex items-center justify-between gap-4 mt-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="block sm:hidden min-w-[140px]">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 text-xs outline-none"
            />
          </div>
        </div>
      </section>

      {/* 3. EQUIPMENT GRID */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 min-h-[50vh]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="bg-zinc-100 aspect-square rounded-2xl"></div>
                <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl">
            <p className="text-sm font-semibold text-zinc-600">No equipment found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filteredEquipment.map((item) => {
              const isOut = item.stock <= (item.rentedOut || 0);
              const mount = item.lensMount || item.lens_mount;
              const resOut = item.resolutionOutput || item.resolution || item.resolution_output;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-square w-full bg-[#F6F5F2] rounded-2xl overflow-hidden flex items-center justify-center p-6 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-zinc-900/5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-4xl opacity-20">📷</div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md ${
                          isOut
                            ? "bg-zinc-200/80 text-zinc-500"
                            : "bg-white/85 text-zinc-900 shadow-xs"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOut ? "bg-zinc-400" : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {isOut ? "Out on Hire" : "In Stock"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {(mount || resOut) && (
                        <p className="text-[10px] text-zinc-400 font-mono tracking-tight line-clamp-1">
                          {[mount, resOut].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <p className="text-xs font-mono font-bold text-zinc-900 pt-0.5">
                        RM {item.dailyRate?.toFixed(2)}{" "}
                        <span className="text-[10px] font-normal text-zinc-400">/ day</span>
                      </p>
                    </div>

                    <button
                      disabled={isOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-pointer disabled:opacity-20 shrink-0 hover:scale-105 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. SINGLE EDITORIAL FOOTER */}
      <footer id="about" className="border-t border-zinc-100 bg-zinc-50 mt-20 py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
              DON'T BE SHY, JUST SAY HI!
            </h2>
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              info@tuaqk4o.com • Kuala Lumpur, Malaysia
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-400">
            © {new Date().getFullYear()} tuaq k4o™ tech & support. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 5. ITEM DETAIL MODAL WITH SMOOTH ZOOM & SLIDE ANIMATION */}
      {selectedItem && (() => {
        const desc = selectedItem.description;
        const mount = selectedItem.lensMount || selectedItem.lens_mount;
        const resOut = selectedItem.resolutionOutput || selectedItem.resolution || selectedItem.resolution_output;
        const tech = selectedItem.technicalHighlights || selectedItem.technical_highlights;
        const kit = selectedItem.includedKit || selectedItem.included_kit;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between border border-zinc-100 relative transition-all duration-300 animate-in zoom-in-95 fade-in slide-in-from-bottom-4"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors z-10"
              >
                ✕
              </button>

              {/* CONTENT */}
              <div className="overflow-y-auto pr-1 space-y-6">
                
                {/* HERO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start border-b border-zinc-100 pb-6">
                  <div className="bg-[#F6F5F2] rounded-2xl aspect-square flex items-center justify-center p-6 relative">
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-5xl opacity-30">📷</div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">
                        {selectedItem.category || "CINEMA GEAR"}
                      </span>
                      <h2 className="text-2xl font-black text-zinc-900 mt-2 uppercase tracking-tight leading-tight">
                        {selectedItem.name}
                      </h2>
                    </div>

                    <div>
                      <p className="text-xl font-mono font-bold text-zinc-900">
                        RM {selectedItem.dailyRate?.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-zinc-500">/ day</span>
                      </p>

                      <div className="text-[11px] font-mono text-zinc-500 mt-2 space-y-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <p>
                          Status:{" "}
                          <span className="font-bold text-zinc-900">
                            {selectedItem.stock > (selectedItem.rentedOut || 0)
                              ? "In Stock"
                              : "Out on Hire"}
                          </span>
                        </p>
                        {selectedItem.serialNumber && (
                          <p>S/N: <span className="text-zinc-900 font-semibold">{selectedItem.serialNumber}</span></p>
                        )}
                        {mount && (
                          <p>Lens Mount: <span className="text-zinc-900 font-semibold">{mount}</span></p>
                        )}
                        {resOut && (
                          <p>Resolution/Output: <span className="text-zinc-900 font-semibold">{resOut}</span></p>
                        )}
                      </div>
                    </div>

                    {desc && (
                      <div className="pt-2">
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-1">
                          Item Description
                        </h4>
                        <p className="text-xs text-zinc-700 leading-relaxed font-sans">
                          {desc}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* TECH & KIT */}
                {(tech || kit) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {tech && (
                      <div>
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-2">
                          Technical Highlights
                        </h4>
                        <ul className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 space-y-1.5 font-mono text-[11px] text-zinc-700">
                          {tech
                            .split("\n")
                            .filter((line: string) => line.trim().length > 0)
                            .map((line: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-zinc-400">•</span>
                                <span>{line.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {kit && (
                      <div>
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-2">
                          Included Kit & Accessories
                        </h4>
                        <ul className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 space-y-1.5 font-mono text-[11px] text-zinc-700">
                          {kit
                            .split("\n")
                            .filter((line: string) => line.trim().length > 0)
                            .map((line: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{line.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-1/3 bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  disabled={selectedItem.stock <= (selectedItem.rentedOut || 0)}
                  onClick={() => {
                    addToCart(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="w-2/3 bg-zinc-900 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40 shadow-md"
                >
                  Add to Cart 🛒
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 6. SLIDE-OVER DISPATCH CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">
                    YOUR DISPATCH
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-500">
                    {totalCartCount} item(s) selected
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl mx-auto font-black">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Order Dispatched!</h3>
                  <p className="text-xs text-zinc-600 font-mono">
                    DO Ref Number: <span className="font-bold text-zinc-900">{bookingSuccess}</span>
                  </p>
                  <button
                    onClick={() => {
                      setBookingSuccess(null);
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-zinc-900 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider cursor-pointer mt-4"
                  >
                    Back to Catalogue
                  </button>
                </div>
              ) : checkoutStep === "cart" ? (
                <div className="space-y-6">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                      Rental Duration ({rentalDays} Day{rentalDays > 1 ? "s" : ""})
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-mono text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      Your dispatch cart is empty. Click gear items to add them.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                      {cart.map(({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-zinc-100 pb-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-zinc-50 rounded-lg p-1 flex items-center justify-center border border-zinc-100 shrink-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                "📷"
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500">
                                RM {item.dailyRate?.toFixed(2)} / day
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              className="w-6 h-6 rounded bg-zinc-100 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold font-mono w-4 text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                              className="w-6 h-6 rounded bg-zinc-100 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handlePlaceBooking} className="space-y-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-2 block cursor-pointer"
                  >
                    ← Back to Selected Items
                  </button>

                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-2">
                    Client Details
                  </h3>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Tan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-semibold outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +60123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-semibold outline-none focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">
                        IC / Passport No *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 950101-14-5566"
                        value={identityNo}
                        onChange={(e) => setIdentityNo(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-mono outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-bold outline-none cursor-pointer"
                      >
                        <option value="BANK TRANSFER">Bank Transfer</option>
                        <option value="TOUCH N GO">Touch 'n Go E-Wallet</option>
                        <option value="CASH">Cash on Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">
                        Fulfillment
                      </label>
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-bold outline-none cursor-pointer"
                      >
                        <option value="SELF-PICKUP">Self-Pickup (Studio)</option>
                        <option value="DELIVERY">Courier / Dispatch</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {!bookingSuccess && (
              <div className="border-t border-zinc-100 pt-4 mt-6 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Daily Subtotal</span>
                    <span className="font-mono">RM {dailySubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Duration</span>
                    <span className="font-mono">{rentalDays} Day(s)</span>
                  </div>
                  <div className="flex justify-between text-zinc-900 font-extrabold text-sm pt-2 border-t border-zinc-100">
                    <span>Estimated Total</span>
                    <span className="font-mono text-base">RM {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {checkoutStep === "cart" ? (
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep("details")}
                    className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-30 shadow-md"
                  >
                    Proceed to Details →
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={submittingBooking}
                    className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {submittingBooking ? "Processing..." : "Confirm Dispatch Booking 🛒"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
