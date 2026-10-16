"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const ADMIN_PIN = "6767"; // 4-digit staff PIN

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [activeTab, setActiveTab] = useState<"bookings" | "inventory">("inventory");
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [equipment, setEquipment] = useState<any[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Search & Filter States
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState("ALL");

  // Export State
  const [exporting, setExporting] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("CINEMA CAMERA");
  const [formSerial, setFormSerial] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formStock, setFormStock] = useState("1");
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMount, setFormMount] = useState("");
  const [formResolution, setFormResolution] = useState("");
  const [formKeyFeatures, setFormKeyFeatures] = useState("");
  const [formAccessories, setFormAccessories] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check existing session auth on load
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("admin_authenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("Invalid Admin PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    setPinInput("");
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load admin bookings", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/equipment");
      const data = await res.json();
      if (Array.isArray(data)) setEquipment(data);
    } catch (err) {
      console.error("Failed to load equipment", err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchEquipment();
    }
  }, [isAuthenticated]);

  // CSV Export Trigger
  const handleExportCSV = () => {
    setExporting(true);
    window.location.href = "/api/admin/export";
    setTimeout(() => setExporting(false), 2000);
  };

  // Analytics Calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.status !== "CANCELLED" ? (b.totalPrice || 0) : 0), 0);
  const activeRentalsCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const returnedCount = bookings.filter((b) => b.status === "RETURNED").length;

  const totalOwnedUnits = equipment.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalRentedUnits = equipment.reduce((sum, item) => sum + (item.rentedOut || 0), 0);
  const utilizationRate = totalOwnedUnits > 0 ? Math.round((totalRentedUnits / totalOwnedUnits) * 100) : 0;

  // File Uploader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setFormImage(data.imageUrl);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Error uploading image file.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMarkReturned = async (bookingId: string) => {
    if (!confirm("Confirm marking gear as RETURNED? This will restore stock availability.")) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Gear marked as returned and inventory updated!");
        fetchBookings();
        fetchEquipment();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to return booking", err);
      alert("Error processing return.");
    }
  };

  // --- CANCEL ORDER HANDLER ---
  const handleCancelOrder = async (bookingId: string) => {
    if (!confirm("Are you sure you want to CANCEL this delivery order?")) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (data.success) {
        alert("Order successfully marked as CANCELLED!");
        fetchBookings();
        fetchEquipment();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to cancel booking", err);
      alert("Error processing order cancellation.");
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategory("CINEMA CAMERA");
    setFormSerial("");
    setFormRate("");
    setFormStock("1");
    setFormImage("");
    setFormDescription("");
    setFormMount("");
    setFormResolution("");
    setFormKeyFeatures("");
    setFormAccessories("");
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormName(item.name || "");
    setFormCategory(item.category || "CINEMA CAMERA");
    setFormSerial(item.serialNumber || "");
    setFormRate(String(item.dailyRate || ""));
    setFormStock(String(item.stock || "1"));
    setFormImage(item.imageUrl || "");
    setFormDescription(item.description || "");
    setFormMount(item.mount || "");
    setFormResolution(item.resolution || "");
    setFormKeyFeatures(item.keyFeatures || "");
    setFormAccessories(item.includedAccessories || "");
    setShowModal(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      id: editingItem?.id,
      name: formName,
      category: formCategory,
      serialNumber: formSerial,
      dailyRate: formRate,
      stock: formStock,
      imageUrl: formImage,
      description: formDescription,
      mount: formMount,
      resolution: formResolution,
      keyFeatures: formKeyFeatures,
      includedAccessories: formAccessories,
    };

    try {
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch("/api/equipment", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success || Array.isArray(data)) {
        alert(editingItem ? "Equipment updated!" : "New equipment added!");
        setShowModal(false);
        fetchEquipment();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to save equipment", err);
      alert("Error saving equipment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;

    try {
      const res = await fetch(`/api/equipment?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        alert("Equipment removed successfully.");
        fetchEquipment();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to delete equipment", err);
      alert("Error deleting equipment.");
    }
  };

  // Dynamic Filters
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.doNumber?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.phone?.includes(bookingSearch);
    const matchesStatus = bookingStatusFilter === "ALL" || b.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEquipment = equipment.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      e.serialNumber?.toLowerCase().includes(equipmentSearch.toLowerCase());
    const matchesCategory = equipmentCategoryFilter === "ALL" || e.category === equipmentCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = ["ALL", ...Array.from(new Set(equipment.map((e) => e.category)))];

  // --- RENDER PIN LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <main className="p-8 font-sans max-w-md mx-auto min-h-screen flex flex-col justify-center items-center text-black dark:text-white">
        <div className="w-full p-8 border-4 border-black dark:border-white rounded-xl bg-white dark:bg-black shadow-2xl text-center backdrop-blur-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 border-2 border-black dark:border-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
            🛡️
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wide mb-1">Staff Access Portal</h1>
          <p className="text-xs opacity-70 mb-6">Enter PIN passcode to unlock shop dashboard.</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded-lg p-3 text-center text-3xl tracking-[0.6em] font-mono bg-white dark:bg-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {pinError && (
              <p className="text-xs font-bold text-red-600 border-2 border-red-500 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-lg">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white dark:bg-white dark:text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
            >
              Unlock Staff Portal 🔓
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href="/" className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- RENDER FULL ENHANCED ADMIN DASHBOARD ---
  return (
    <main className="p-6 md:p-8 font-sans max-w-7xl mx-auto min-h-screen text-black dark:text-white">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap justify-between items-center mb-8 border-b-2 border-black dark:border-white pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">System Online</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-0.5">Admin Management Hub</h1>
          <p className="text-xs opacity-75 mt-0.5">Live store revenue, booking dispatches, and equipment catalog inventory.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV EXPORT BUTTON */}
          <button
            onClick={handleExportCSV}
            disabled={exporting || bookings.length === 0}
            className="bg-green-700 hover:bg-green-800 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <span>📥</span> {exporting ? "Preparing File..." : "Export Orders (CSV)"}
          </button>

          <button
            onClick={handleLogout}
            className="text-xs font-extrabold border-2 border-red-600 text-red-600 px-3.5 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
          >
            🔒 Lock Admin
          </button>

          <Link
            href="/"
            className="text-xs font-extrabold border-2 border-black dark:border-white px-4 py-2.5 rounded-lg hover:opacity-75 transition-opacity"
          >
            ← Storefront
          </Link>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="p-5 border-2 border-black dark:border-white rounded-xl bg-white dark:bg-black shadow-md border-t-4 border-t-blue-600">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">Gross Revenue</p>
            <span className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded text-xs">💰</span>
          </div>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
            RM {totalRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] font-medium opacity-60 mt-1">{bookings.length} Total Booking(s)</p>
        </div>

        <div className="p-5 border-2 border-black dark:border-white rounded-xl bg-white dark:bg-black shadow-md border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">Active Out-on-Hire</p>
            <span className="p-1.5 bg-green-100 dark:bg-green-950 rounded text-xs">🚚</span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {activeRentalsCount} Order(s)
          </p>
          <p className="text-[11px] font-medium opacity-60 mt-1">Currently with production clients</p>
        </div>

        <div className="p-5 border-2 border-black dark:border-white rounded-xl bg-white dark:bg-black shadow-md border-t-4 border-t-purple-600">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">Completed Returns</p>
            <span className="p-1.5 bg-purple-100 dark:bg-purple-950 rounded text-xs">✅</span>
          </div>
          <p className="text-3xl font-black mt-2">
            {returnedCount} Order(s)
          </p>
          <p className="text-[11px] font-medium opacity-60 mt-1">Checked in & replenished</p>
        </div>

        <div className="p-5 border-2 border-black dark:border-white rounded-xl bg-white dark:bg-black shadow-md border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">Fleet Utilization</p>
            <span className="p-1.5 bg-amber-100 dark:bg-amber-950 rounded text-xs">📊</span>
          </div>
          <p className="text-3xl font-black text-amber-500 mt-2">
            {utilizationRate}%
          </p>
          <p className="text-[11px] font-medium opacity-60 mt-1">{totalRentedUnits} of {totalOwnedUnits} units rented</p>
        </div>

      </div>

      {/* PILL TAB NAVIGATION */}
      <div className="flex gap-2 mb-6 p-1.5 border-2 border-black dark:border-white rounded-xl bg-gray-100 dark:bg-gray-900 max-w-md">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "bookings"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          📋 Rental Orders ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          🎥 Equipment Inventory ({equipment.length})
        </button>
      </div>

      {/* TAB 1: RENTAL BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="border-2 border-black dark:border-white rounded-xl p-6 bg-white dark:bg-black shadow-xl">
          
          {/* SEARCH & STATUS FILTER BAR */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Search DO Number, Customer Name, or Phone..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="flex-1 border-2 border-black dark:border-white rounded-lg p-2.5 text-xs bg-white dark:bg-black font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="border-2 border-black dark:border-white rounded-lg px-3 py-2 text-xs bg-white dark:bg-black font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="CONFIRMED">Active (CONFIRMED)</option>
              <option value="RETURNED">Completed (RETURNED)</option>
              <option value="CANCELLED">Cancelled (CANCELLED)</option>
            </select>
          </div>

          {loadingBookings ? (
            <p className="text-center font-bold text-sm py-12">Loading customer bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-black dark:border-white rounded-lg text-center opacity-60">
              <p className="text-base font-bold">No rental bookings found.</p>
              <p className="text-xs mt-1">Try clearing your search query or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 text-[11px] uppercase tracking-wider">
                    <th className="p-3">DO Number</th>
                    <th className="p-3">Customer Info</th>
                    <th className="p-3">Rented Equipment</th>
                    <th className="p-3">Fulfillment & Price</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                      <td className="p-3 font-mono font-bold text-sm">
                        {b.doNumber}
                        <span className="block text-[10px] font-normal opacity-60 font-sans">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-sm">{b.customerName}</p>
                        <p className="opacity-75">{b.phone}</p>
                        <p className="opacity-60 text-[10px] font-mono">IC: {b.identityNo}</p>
                      </td>
                      <td className="p-3 max-w-xs">
                        <ul className="space-y-1">
                          {(b.items || []).map((item: any, idx: number) => (
                            <li key={idx} className="font-semibold">
                              • {item.equipment?.name || "Equipment"} ({item.quantity}x)
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3">
                        <p className="font-bold">{b.paymentMethod}</p>
                        <p className="opacity-75">{b.deliveryMethod}</p>
                        <p className="font-black text-blue-600 dark:text-blue-400 mt-1 text-sm">
                          RM {(b.totalPrice || 0).toFixed(2)}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            b.status === "RETURNED"
                              ? "bg-gray-200 text-gray-800 border-gray-400"
                              : b.status === "CANCELLED"
                              ? "bg-red-100 text-red-800 border-red-400"
                              : "bg-green-100 text-green-800 border-green-400 animate-pulse"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {b.status === "RETURNED" ? (
                          <span className="text-gray-400 font-bold text-[11px]">Returned ✓</span>
                        ) : b.status === "CANCELLED" ? (
                          <span className="text-red-500 font-bold text-[11px]">Cancelled ✕</span>
                        ) : (
                          <div className="flex justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleMarkReturned(b.id)}
                              className="bg-black text-white dark:bg-white dark:text-black font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] uppercase hover:opacity-80 transition-opacity cursor-pointer shadow"
                            >
                              Mark Returned ↩
                            </button>
                            <button
                              onClick={() => handleCancelOrder(b.id)}
                              className="bg-red-600 text-white font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] uppercase hover:bg-red-700 transition-colors cursor-pointer shadow"
                            >
                              Cancel Order ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EQUIPMENT INVENTORY */}
      {activeTab === "inventory" && (
        <div className="border-2 border-black dark:border-white rounded-xl p-6 bg-white dark:bg-black shadow-xl">
          
          {/* SEARCH & ADD TOOLBAR */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <div className="flex flex-1 gap-3 max-w-xl">
              <input
                type="text"
                placeholder="Search equipment by name or serial number..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 text-xs bg-white dark:bg-black font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={equipmentCategoryFilter}
                onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
                className="border-2 border-black dark:border-white rounded-lg px-3 py-2 text-xs bg-white dark:bg-black font-bold outline-none cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="bg-black text-white dark:bg-white dark:text-black font-extrabold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer shadow flex items-center gap-1.5"
            >
              <span>➕</span> Add New Equipment
            </button>
          </div>

          {loadingEquipment ? (
            <p className="text-center font-bold text-sm py-12">Loading equipment list...</p>
          ) : filteredEquipment.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-black dark:border-white rounded-lg text-center opacity-60">
              <p className="text-base font-bold">No equipment items found.</p>
              <p className="text-xs mt-1">Try clearing your category filter or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 text-[11px] uppercase tracking-wider">
                    <th className="p-3">Equipment Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Serial Number</th>
                    <th className="p-3">Daily Rate</th>
                    <th className="p-3 text-center">Owned Stock</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                      <td className="p-3 font-extrabold text-sm flex items-center gap-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded border border-gray-300 dark:border-gray-700 bg-white" />
                        )}
                        <span>{item.name}</span>
                      </td>
                      <td className="p-3 font-semibold uppercase">{item.category}</td>
                      <td className="p-3 font-mono opacity-80">{item.serialNumber}</td>
                      <td className="p-3 font-black text-blue-600 dark:text-blue-400 text-sm">
                        RM {item.dailyRate?.toFixed(2)}
                      </td>
                      <td className="p-3 text-center font-bold text-sm">{item.stock}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="border-2 border-black dark:border-white px-3 py-1 rounded-lg font-bold text-[11px] hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(item.id, item.name)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold text-[11px] hover:bg-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-6 rounded-xl max-w-2xl w-full shadow-2xl my-8">
            <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-3 mb-4">
              <h3 className="text-xl font-black uppercase">
                {editingItem ? "Edit Equipment Details" : "Add New Equipment"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="font-black text-sm px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1 uppercase">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony FX3 Cinema Camera"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CINEMA CAMERA / LIGHTING"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FX3-889900"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Daily Rate (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="450"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase">Total Owned Stock *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-semibold"
                  />
                </div>
              </div>

              {/* IMAGE FILE UPLOAD SECTION */}
              <div className="border-2 border-dashed border-black dark:border-white p-3.5 rounded-lg bg-gray-50 dark:bg-gray-900">
                <label className="block mb-1 font-extrabold uppercase">Equipment Image Upload</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-black file:text-white dark:file:bg-white dark:file:text-black cursor-pointer"
                  />
                  {uploadingImage && <span className="text-blue-600 font-bold animate-pulse">Uploading file...</span>}
                </div>

                {formImage && (
                  <div className="mt-3 flex items-center gap-3 bg-white dark:bg-black p-2 border-2 border-black dark:border-white rounded-lg">
                    <img src={formImage} alt="Preview" className="w-12 h-12 object-cover rounded border" />
                    <div>
                      <p className="text-[11px] font-mono text-green-600 dark:text-green-400 font-bold">Image Uploaded ✓</p>
                      <p className="text-[10px] opacity-60 font-mono truncate max-w-xs">{formImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 uppercase">Item Description</label>
                <textarea
                  rows={2}
                  placeholder="Write a short summary of this camera or lighting fixture..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-normal text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Lens Mount (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sony E-mount / Canon RF"
                    value={formMount}
                    onChange={(e) => setFormMount(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-normal text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase">Resolution / Output (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4K 120fps 10-bit 4:2:2"
                    value={formResolution}
                    onChange={(e) => setFormResolution(e.target.value)}
                    className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-normal text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 uppercase">Technical Highlights (Enter 1 per line)</label>
                <textarea
                  rows={3}
                  placeholder="Full-Frame 12.1MP Back-Illuminated Sensor&#10;15+ Stops Dynamic Range&#10;Dual CFexpress Type A & SD Card Slots"
                  value={formKeyFeatures}
                  onChange={(e) => setFormKeyFeatures(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block mb-1 uppercase">Included Kit & Accessories (Enter 1 per line)</label>
                <textarea
                  rows={3}
                  placeholder="1x Sony FX3 Camera Body&#10;2x 160GB CFexpress Type A Cards&#10;3x NP-FZ100 Batteries & Charger&#10;1x XLR Top Handle Unit"
                  value={formAccessories}
                  onChange={(e) => setFormAccessories(e.target.value)}
                  className="w-full border-2 border-black dark:border-white rounded-lg p-2.5 bg-white dark:bg-black outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-2 border-black dark:border-white py-2.5 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex-1 bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-lg font-extrabold uppercase hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 text-xs shadow-md"
                >
                  {submitting ? "Saving..." : "Save Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
