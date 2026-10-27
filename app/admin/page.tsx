"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Day / Night Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("tuaq_theme");
    if (savedTheme === "light") setIsDarkMode(false);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("tuaq_theme", next ? "dark" : "light");
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<"inventory" | "bookings">("inventory");
  const [equipment, setEquipment] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("ALL");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CINEMA CAMERA");
  const [dailyRate, setDailyRate] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [lensMount, setLensMount] = useState("");
  const [resolutionOutput, setResolutionOutput] = useState("");
  const [description, setDescription] = useState("");
  const [submittingGear, setSubmittingGear] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234" || pin === "tuaq2026") {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, bkRes] = await Promise.all([
        fetch("/api/equipment"),
        fetch("/api/bookings"),
      ]);

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        if (Array.isArray(eqData)) setEquipment(eqData);
      }

      if (bkRes.ok) {
        const bkData = await bkRes.json();
        if (Array.isArray(bkData)) setBookings(bkData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dailyRate) return;

    setSubmittingGear(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          dailyRate: parseFloat(dailyRate),
          stock: parseInt(stock, 10),
          imageUrl,
          lensMount: lensMount || null,
          resolutionOutput: resolutionOutput || null,
          description: description || null,
        }),
      });

      if (res.ok) {
        setName("");
        setDailyRate("");
        setImageUrl("");
        setLensMount("");
        setResolutionOutput("");
        setDescription("");
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 3000);
        fetchData();
      } else {
        alert("Failed to create equipment listing.");
      }
    } catch (err) {
      console.error("Error adding equipment", err);
    } finally {
      setSubmittingGear(false);
    }
  };

  const handleStockUpdate = async (id: string, delta: number) => {
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, (item.stock || 1) + delta) } : item
      )
    );

    try {
      await fetch(`/api/equipment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delta }),
      });
    } catch (err) {
      console.error("Failed to sync stock change", err);
      fetchData();
    }
  };

  const totalGearItems = equipment.length;
  const totalStockUnits = equipment.reduce((sum, item) => sum + (item.stock || 1), 0);
  const totalBookingsCount = bookings.length;
  const totalEstimatedRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.totalPrice || b.grandTotal || 0),
    0
  );

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      inventoryCategoryFilter === "ALL" ||
      item.category?.toUpperCase() === inventoryCategoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.doNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone?.includes(searchQuery);

    const matchesStatus =
      bookingStatusFilter === "ALL" ||
      (b.status || "CONFIRMED").toUpperCase() === bookingStatusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "bg-zinc-950 text-white" : "bg-[#F6F5F2] text-zinc-900"
      }`}>
        <div className={`p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-6 text-center backdrop-blur-2xl shadow-2xl relative z-10 border transition-colors ${
          isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/90 border-zinc-200"
        }`}>
          <div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold tracking-tighter">tuaq</span>
              <span className="text-xs font-semibold opacity-60">k4o™</span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">
              Tech & Support — Staff Terminal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="Enter Staff Passcode"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                className={`w-full border rounded-2xl px-4 py-3.5 text-center text-sm font-mono outline-none transition-colors ${
                  isDarkMode ? "bg-zinc-950 border-zinc-800 text-white focus:border-zinc-500" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400"
                }`}
              />
              {pinError && (
                <p className="text-[11px] text-red-500 font-mono">
                  Incorrect PIN. Try default: 1234
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Unlock Terminal 🔓
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-mono">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative ${
      isDarkMode ? "bg-zinc-950 text-zinc-100 selection:bg-zinc-800" : "bg-white text-zinc-900 selection:bg-zinc-200"
    }`}>
      
      {/* 1. EDITORIAL HEADER */}
      <header className={`border-b backdrop-blur-md px-6 lg:px-12 py-4 sticky top-0 z-30 transition-colors ${
        isDarkMode ? "bg-zinc-950/90 border-zinc-800/80" : "bg-white/90 border-zinc-100"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="group block cursor-pointer">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold tracking-tighter ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                  tuaq
                </span>
                <span className={`text-xs font-semibold ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                  k4o™
                </span>
              </div>
              <p className="text-[9px] font-medium tracking-widest text-zinc-500 uppercase -mt-1">
                tech & support
              </p>
            </Link>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
            }`}>
              STAFF PORTAL
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border ${
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-amber-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
              }`}
            >
              {isDarkMode ? "🌙 Dark" : "☀️ Day"}
            </button>

            <Link href="/" className="hidden sm:block text-zinc-400 hover:text-current transition-colors">
              Storefront ↗
            </Link>
            
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              Lock 🔒
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
        
        {/* 2. EXECUTIVE METRICS OVERVIEW BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`border p-5 rounded-2xl space-y-1 ${
            isDarkMode ? "bg-zinc-900/60 border-zinc-800/80" : "bg-[#F6F5F2] border-zinc-200/60"
          }`}>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">Gear Catalog</p>
            <p className="text-2xl font-extrabold font-mono">{totalGearItems} <span className="text-xs font-normal text-zinc-500">models</span></p>
          </div>
          <div className={`border p-5 rounded-2xl space-y-1 ${
            isDarkMode ? "bg-zinc-900/60 border-zinc-800/80" : "bg-[#F6F5F2] border-zinc-200/60"
          }`}>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">Total Stock</p>
            <p className="text-2xl font-extrabold text-emerald-500 font-mono">{totalStockUnits} <span className="text-xs font-normal text-zinc-500">units</span></p>
          </div>
          <div className={`border p-5 rounded-2xl space-y-1 ${
            isDarkMode ? "bg-zinc-900/60 border-zinc-800/80" : "bg-[#F6F5F2] border-zinc-200/60"
          }`}>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">Total Orders</p>
            <p className="text-2xl font-extrabold font-mono">{totalBookingsCount} <span className="text-xs font-normal text-zinc-500">DO quotes</span></p>
          </div>
          <div className={`border p-5 rounded-2xl space-y-1 ${
            isDarkMode ? "bg-zinc-900/60 border-zinc-800/80" : "bg-[#F6F5F2] border-zinc-200/60"
          }`}>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">Estimated Revenue</p>
            <p className="text-2xl font-extrabold text-emerald-500 font-mono">RM {totalEstimatedRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* 3. CONTROLS HEADER & SEARCH BAR */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 ${
          isDarkMode ? "border-zinc-800" : "border-zinc-100"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? isDarkMode ? "bg-white text-zinc-950" : "bg-zinc-900 text-white"
                  : isDarkMode ? "bg-zinc-900 text-zinc-400 border border-zinc-800" : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              Inventory Management ({equipment.length})
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "bookings"
                  ? isDarkMode ? "bg-white text-zinc-950" : "bg-zinc-900 text-white"
                  : isDarkMode ? "bg-zinc-900 text-zinc-400 border border-zinc-800" : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              Dispatch Orders ({bookings.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={activeTab === "inventory" ? "Search inventory gear..." : "Search DO# or Client Name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`border rounded-full px-4 py-2 text-xs outline-none w-full sm:w-64 transition-all ${
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
              }`}
            />
            <button
              onClick={fetchData}
              className={`border hover:bg-zinc-800 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              ↻ Sync
            </button>
          </div>
        </div>

        {/* 4. TAB 1: INVENTORY MANAGEMENT */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ADD GEAR FORM */}
            <div className={`lg:col-span-4 border p-6 rounded-3xl space-y-4 backdrop-blur-xl ${
              isDarkMode ? "bg-zinc-900/70 border-zinc-800" : "bg-[#F6F5F2] border-zinc-200/60"
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Add New Equipment Listing
                </h3>
                {formSuccess && (
                  <span className="text-[10px] font-mono text-emerald-500 font-bold animate-in fade-in">
                    ✓ Added
                  </span>
                )}
              </div>

              <form onSubmit={handleAddEquipment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony FX6 Full-Frame Cinema Camera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 font-semibold outline-none ${
                      isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 font-semibold outline-none cursor-pointer ${
                      isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                    }`}
                  >
                    <option value="CINEMA CAMERA">Cinema Camera</option>
                    <option value="LENSES">Lenses</option>
                    <option value="LIGHTING">Lighting</option>
                    <option value="SUPPORT & GRIP">Support & Grip</option>
                    <option value="AUDIO">Audio</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      Daily Rate (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="450.00"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 font-mono outline-none ${
                        isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      Stock Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 font-mono outline-none ${
                        isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 font-mono text-[11px] outline-none ${
                      isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingGear}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer mt-2 disabled:opacity-50 shadow-md"
                >
                  {submittingGear ? "Adding Gear..." : "Save to Inventory +"}
                </button>
              </form>
            </div>

            {/* LIVE INVENTORY TABLE */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Live Equipment Directory ({filteredEquipment.length})
                </h3>

                <div className="flex items-center gap-1 sm:gap-2">
                  {["ALL", "CINEMA CAMERA", "LENSES", "LIGHTING", "SUPPORT & GRIP", "AUDIO"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        inventoryCategoryFilter === cat
                          ? isDarkMode ? "bg-white text-zinc-950" : "bg-zinc-900 text-white"
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      }`}
                    >
                      {cat === "CINEMA CAMERA" ? "CAMERAS" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-zinc-400 text-xs font-mono">
                  Syncing inventory database...
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className={`py-16 text-center text-zinc-500 text-xs border border-dashed rounded-2xl ${
                  isDarkMode ? "border-zinc-800" : "border-zinc-200"
                }`}>
                  <p>No inventory gear matches your search filter.</p>
                </div>
              ) : (
                <div className={`border rounded-2xl overflow-hidden text-xs ${
                  isDarkMode ? "border-zinc-800" : "border-zinc-200"
                }`}>
                  <div className={`px-4 py-3 font-mono font-bold grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider border-b ${
                    isDarkMode ? "bg-zinc-900/90 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}>
                    <span className="col-span-5">Equipment Name</span>
                    <span className="col-span-3">Category</span>
                    <span className="col-span-2 text-right">Daily Rate</span>
                    <span className="col-span-2 text-center">Stock Control</span>
                  </div>

                  <div className={`divide-y ${
                    isDarkMode ? "divide-zinc-800/60 bg-zinc-900/30" : "divide-zinc-100 bg-white"
                  }`}>
                    {filteredEquipment.map((item) => {
                      const mount = item.lensMount || item.lens_mount;
                      return (
                        <div key={item.id} className="px-4 py-3.5 grid grid-cols-12 gap-2 font-mono items-center">
                          <div className="col-span-5 flex items-center gap-3">
                            
                            {/* FIX: WARM STUDIO BACKGROUND CONTAINER FOR PRODUCT PREVIEWS */}
                            <div className="w-10 h-10 rounded-xl bg-[#F6F5F2] border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center text-base p-1">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                              ) : (
                                "📷"
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className={`font-bold font-sans line-clamp-1 ${isDarkMode ? "text-white" : "text-zinc-900"}`}>{item.name}</p>
                              {mount && <p className="text-[10px] text-zinc-400">{mount}</p>}
                            </div>
                          </div>

                          <span className="col-span-3 text-[10px] text-zinc-400 uppercase tracking-tight">{item.category}</span>
                          <span className="col-span-2 text-right text-emerald-500 font-bold">RM {item.dailyRate?.toFixed(2)}</span>

                          <div className="col-span-2 flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStockUpdate(item.id, -1)}
                              className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center cursor-pointer ${
                                isDarkMode ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                              }`}
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center">{item.stock || 1}</span>
                            <button
                              onClick={() => handleStockUpdate(item.id, 1)}
                              className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center cursor-pointer ${
                                isDarkMode ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 5. TAB 2: DISPATCH ORDERS MANAGEMENT */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Dispatch Orders History ({filteredBookings.length})
              </h3>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["ALL", "CONFIRMED", "DISPATCHED", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      bookingStatusFilter === st
                        ? isDarkMode ? "bg-white text-zinc-950" : "bg-zinc-900 text-white"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-zinc-400 text-xs font-mono">
                Loading client bookings...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className={`py-16 text-center text-zinc-500 text-xs border border-dashed rounded-2xl ${
                isDarkMode ? "border-zinc-800" : "border-zinc-200"
              }`}>
                No dispatch orders found matching status filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const items = booking.items || [];
                  const totalPrice = Number(booking.totalPrice || booking.grandTotal || 0);

                  return (
                    <div
                      key={booking.id || booking.doNumber}
                      className={`border p-6 rounded-3xl space-y-4 font-mono text-xs backdrop-blur-xl ${
                        isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-[#F6F5F2] border-zinc-200/60"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500 font-bold text-base">{booking.doNumber}</span>
                            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-md">
                              {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-sans font-bold text-sm">
                            {booking.customerName} <span className="text-zinc-500 font-mono text-xs">({booking.phone})</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <span className="text-emerald-500 font-extrabold text-base">
                            RM {totalPrice.toFixed(2)}
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full text-[10px] uppercase font-bold">
                            {booking.status || "CONFIRMED"}
                          </span>
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl border ${
                        isDarkMode ? "bg-zinc-950/50 border-zinc-800/60 text-zinc-400" : "bg-white border-zinc-200/80 text-zinc-600"
                      }`}>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-zinc-400">IC / Passport</p>
                          <p className="font-bold mt-0.5">{booking.identityNo}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-zinc-400">Fulfillment</p>
                          <p className="font-bold mt-0.5">{booking.deliveryMethod}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-zinc-400">Payment Method</p>
                          <p className="font-bold mt-0.5">{booking.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-zinc-400">Contact Client</p>
                          <a
                            href={`https://wa.me/${booking.phone?.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-500 font-bold hover:underline inline-block mt-0.5"
                          >
                            WhatsApp Chat 💬
                          </a>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[9px] font-bold uppercase text-zinc-400">Reserved Equipment Items:</p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((i: any, idx: number) => (
                              <span key={idx} className={`px-3 py-1 rounded-lg text-[11px] ${
                                isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-800"
                              }`}>
                                • {i.equipment?.name || i.name || "Gear Item"} (x{i.quantity || 1})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
