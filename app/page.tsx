"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function StorefrontPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Item Detail & FAQ Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cart & Dispatch Drawer State
  const [cart, setCart] = useState<{ item: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Booking / Dates State with Guardrails
  const todayStr = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(() => todayStr);
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  // Handle Start Date change and auto-adjust End Date
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart >= endDate) {
      const nextDay = new Date(newStart);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split("T")[0]);
    }
  };

  // Checkout Step State & Full Order Summary
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details">("cart");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNo, setIdentityNo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK TRANSFER");
  const [deliveryMethod, setDeliveryMethod] = useState("SELF-PICKUP");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  
  // Completed Order Summary State
  const [completedOrder, setCompletedOrder] = useState<{
    doNumber: string;
    customerName: string;
    phone: string;
    identityNo: string;
    startDate: string;
    endDate: string;
    rentalDays: number;
    paymentMethod: string;
    deliveryMethod: string;
    items: { item: any; quantity: number }[];
    dailySubtotal: number;
    grandTotal: number;
  } | null>(null);

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

  // Custom Slower Smooth Scroll Function (1.2 Seconds Cubic Ease-In-Out)
  const customSmoothScrollTo = (targetY: number, duration: number = 1200) => {
    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetY - startY;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const step = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * easeProgress);

      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  // Scroll to section with custom duration
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
      const targetY = element.getBoundingClientRect().top + window.pageYOffset - navOffset;
      customSmoothScrollTo(Math.max(0, targetY), 1200);
    }
  };

  // Reset Home State & Slower Smooth Scroll to Top
  const handleResetHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchQuery("");
    setActiveCategory("ALL");
    customSmoothScrollTo(0, 1200);
  };

  // Cart Functions
  const addToCart = (item: any, openDrawerDirectly: boolean = false) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: `Added ${item.name} to dispatch` });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);

    if (openDrawerDirectly) {
      setIsCartOpen(true);
    }
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
        const doNum = data.booking?.doNumber || `DO-${Math.floor(100000 + Math.random() * 900000)}`;
        setCompletedOrder({
          doNumber: doNum,
          customerName,
          phone,
          identityNo,
          startDate,
          endDate,
          rentalDays,
          paymentMethod,
          deliveryMethod,
          items: [...cart],
          dailySubtotal,
          grandTotal,
        });
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

  // FAQ Content Array
  const faqs = [
    {
      q: "Reservation and booking process?",
      a: "To reserve equipment, simply add your desired gear to the dispatch cart, select your rental dates, and proceed to checkout. Our rental desk will confirm availability and issue an official dispatch quote. If any gear is unavailable, we will notify you promptly.",
    },
    {
      q: "What are the equipment pick-up and return timings?",
      a: "Pick-ups are available before 4:00 PM the day prior to your shoot date. Equipment returns must be completed by 12:00 - 13:00pm the day immediately following your rental period.",
    },
    {
      q: "What verification documents are required for first-time renters?",
      a: "First-time renters must present a valid NRIC or Passport, an active phone number, email, and company SSM registration or social profile.",
    },
    {
      q: "How do security deposits and payments work?",
      a: "Full rental payment is processed before/during collection of the equipment via Local/International Bank Transfer, E-Wallet, or Cash on Pickup prior to gear release. A refundable deposit may apply depending on equipment tier.",
    },
    {
      q: "What happens in the event of equipment damage or late returns?",
      a: "Renters assume full responsibility for equipment during the hire period. Unannounced late returns incur an additional full-day rate per gear item.",
    },
    {
      q: "Do you offer courier dispatch or site delivery?",
      a: "Yes! In addition to self-pickup at our Kuala Lumpur studio, we can arrange dedicated courier dispatch across Klang Valley upon request and the additional cost shall be bear by the renter.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 bg-zinc-900/95 text-white backdrop-blur-xl border border-zinc-800 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-mono font-medium tracking-tight">
            {toast.message}
          </span>
          <button
            onClick={() => {
              setToast(null);
              setIsCartOpen(true);
            }}
            className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white underline ml-2 cursor-pointer transition-colors"
          >
            View Cart →
          </button>
        </div>
      )}

      {/* 1. EDITORIAL HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* TUAQ K4O LOGO - SLOWER CUBIC SMOOTH SCROLL TO TOP */}
          <Link href="/" onClick={handleResetHome} className="group block cursor-pointer">
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

          {/* DESKTOP NAV WITH SLOWER SMOOTH SCROLL */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-wider text-zinc-600">
            <a 
              href="#catalogue" 
              onClick={(e) => scrollToSection(e, "catalogue")} 
              className="hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Catalogue
            </a>
            <a 
              href="#about" 
              onClick={(e) => scrollToSection(e, "about")} 
              className="hover:text-zinc-900 transition-colors cursor-pointer"
            >
              About
            </a>
            <button
              onClick={() => setIsFaqOpen(true)}
              className="hover:text-zinc-900 transition-colors cursor-pointer uppercase font-medium"
            >
              FAQ
            </button>
          </nav>

          {/* SEARCH & CART BUTTON */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-full px-4 py-1.5 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 w-48 lg:w-64 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
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
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight uppercase text-zinc-900">
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

          <div className="block sm:hidden min-w-[140px] relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 pr-7 text-xs outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
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
          <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl space-y-3">
            <p className="text-sm font-semibold text-zinc-600">No equipment found matching your search.</p>
            <button
              onClick={(e) => handleResetHome(e)}
              className="text-xs font-bold text-zinc-900 underline uppercase tracking-wider cursor-pointer"
            >
              Clear Filter & View All
            </button>
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
                        addToCart(item, false);
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

      {/* 4. FOOTER BANNER WITH GLASS MATERIAL CONTACT ICONS & RIGHT-ALIGNED FOOTER DETAILS */}
      <footer id="about" className="mt-16 px-6 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto bg-[#F6F5F2] border border-zinc-200/60 rounded-3xl p-8 sm:p-14 lg:p-16 relative overflow-hidden">
          
          {/* Subtle Ambient Glass Glow Effect */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-zinc-200/50 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            
            {/* HEADING & DISPATCH DESCRIPTION */}
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight leading-none text-zinc-900">
                DON'T BE SHY, JUST SAY HI!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-sans pt-1">
                Send your equipment list and shoot dates. Our rental desk will confirm gear availability and issue an official dispatch quote for your project.
              </p>
            </div>

            {/* GLASS MATERIAL CONTACT BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              
              {/* WHATSAPP GLASS BUTTON WITH AUTO-FILL MESSAGE */}
              <a
                href={`https://wa.me/60123456789?text=${encodeURIComponent(
                  "Hi tuaq k4o™! I would like to check gear availability and request an official dispatch quote for my shoot."
                )}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3.5 bg-white/60 hover:bg-white/90 backdrop-blur-xl border border-white/80 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">WhatsApp</p>
                  <p className="text-xs font-bold text-zinc-900 font-mono">Chat Direct →</p>
                </div>
              </a>

              {/* EMAIL GLASS BUTTON */}
              <a
                href="mailto:k4otuaqstudio@gmail.com"
                className="group flex items-center gap-3.5 bg-white/60 hover:bg-white/90 backdrop-blur-xl border border-white/80 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900/10 border border-zinc-900/15 text-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email Us</p>
                  <p className="text-xs font-bold text-zinc-900 font-mono">Send Mail →</p>
                </div>
              </a>

            </div>

          </div>
        </div>

        {/* COPYRIGHT BOTTOM BAR WITH EMAIL/LOCATION ON THE RIGHT SIDE ABOVE COPYRIGHT */}
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs font-mono text-zinc-400">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFaqOpen(true)}
              className="hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Rental FAQ
            </button>
          </div>

          {/* RIGHT SIDE: EMAIL & LOCATION STACKED ABOVE COPYRIGHT */}
          <div className="text-left sm:text-right space-y-1">
            <p className="text-xs font-semibold text-zinc-600">
              k4otuaqstudio@gmail.com • Kuala Lumpur, Malaysia
            </p>
            <div className="flex items-center justify-start sm:justify-end gap-3 text-[11px] text-zinc-400">
              <span>© {new Date().getFullYear()} tuaq k4o™ tech & support. All rights reserved.</span>
              <Link 
                href="/admin" 
                title="Staff Portal Login"
                className="opacity-30 hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100 text-zinc-600"
              >
                🔒
              </Link>
            </div>
          </div>

        </div>

      </footer>

      {/* 5. PRINTABLE DISPATCH ORDER (DO) QUOTE MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between border border-zinc-100 relative">
            
            <div className="overflow-y-auto space-y-6 pr-1 print:p-0">
              
              {/* DO HEADER */}
              <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tighter text-zinc-900">tuaq</span>
                    <span className="text-xs font-bold text-zinc-600">k4o™</span>
                  </div>
                  <p className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">tech & support</p>
                  <p className="text-xs text-zinc-500 font-mono mt-2">Kuala Lumpur, Malaysia • k4otuaqstudio@gmail.com</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    DISPATCH ORDER
                  </span>
                  <p className="text-sm font-mono font-bold text-zinc-900 mt-2">{completedOrder.doNumber}</p>
                  <p className="text-[11px] font-mono text-zinc-400">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* CLIENT & DATES GRID */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Client Info</p>
                  <p className="font-bold text-zinc-900 mt-0.5">{completedOrder.customerName}</p>
                  <p className="text-zinc-600">{completedOrder.phone}</p>
                  <p className="text-zinc-500 text-[11px]">IC/Pass: {completedOrder.identityNo}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Rental Period ({completedOrder.rentalDays} Day{completedOrder.rentalDays > 1 ? "s" : ""})</p>
                  <p className="font-semibold text-zinc-900 mt-0.5">Start: {completedOrder.startDate}</p>
                  <p className="font-semibold text-zinc-900">End: {completedOrder.endDate}</p>
                  <p className="text-zinc-500 text-[11px] mt-0.5">{completedOrder.deliveryMethod} • {completedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* ITEMIZED TABLE */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Selected Equipment</h4>
                <div className="border border-zinc-100 rounded-2xl overflow-hidden text-xs">
                  <div className="bg-zinc-100 px-4 py-2 font-bold text-zinc-600 grid grid-cols-12 gap-2 text-[10px] uppercase">
                    <span className="col-span-7">Gear Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Daily Rate</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {completedOrder.items.map(({ item, quantity }, idx) => (
                      <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-2 font-mono items-center">
                        <span className="col-span-7 font-bold text-zinc-900">{item.name}</span>
                        <span className="col-span-2 text-center text-zinc-600">{quantity}</span>
                        <span className="col-span-3 text-right text-zinc-900">RM {(item.dailyRate * quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TOTAL SUMMARY */}
              <div className="border-t border-zinc-100 pt-4 space-y-1 text-xs font-mono text-right">
                <p className="text-zinc-500">Daily Subtotal: <span className="font-bold text-zinc-900">RM {completedOrder.dailySubtotal.toFixed(2)}</span></p>
                <p className="text-zinc-500">Duration Multiplier: <span className="font-bold text-zinc-900">{completedOrder.rentalDays} Day(s)</span></p>
                <p className="text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-100">
                  Estimated Total Quote: <span className="text-emerald-600">RM {completedOrder.grandTotal.toFixed(2)}</span>
                </p>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setCompletedOrder(null)}
                className="bg-zinc-100 text-zinc-700 font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="bg-zinc-900 text-white font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <span>Print / Save PDF</span>
                <span>📄</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MINIMALIST FAQ POPUP MODAL */}
      {isFaqOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setIsFaqOpen(false)}
        >
          <div 
            className="bg-white max-w-3xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col justify-between border border-zinc-100 relative transition-all duration-300 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setIsFaqOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors z-10"
            >
              ✕
            </button>

            {/* HEADER */}
            <div className="border-b border-zinc-100 pb-6 pr-8">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">
                RENTAL DESK DIRECTORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 uppercase tracking-tight mt-3">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Essential guidelines for renting production gear at tuaq k4o™
              </p>
            </div>

            {/* FAQ ITEM LIST */}
            <div className="overflow-y-auto py-6 space-y-6 pr-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-zinc-900 flex items-center gap-2">
                    <span className="text-zinc-400 font-mono text-[10px]">0{idx + 1}.</span>
                    {faq.q}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            {/* FOOTER ACTION */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-4">
              <p className="text-[11px] font-mono text-zinc-400 hidden sm:block">
                Have a unique production inquiry?
              </p>
              <button
                onClick={() => setIsFaqOpen(false)}
                className="w-full sm:w-auto bg-zinc-900 text-white font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EXPANDED LARGE ITEM DETAIL MODAL */}
      {selectedItem && (() => {
        const desc = selectedItem.description;
        const mount = selectedItem.lensMount || selectedItem.lens_mount;
        const resOut = selectedItem.resolutionOutput || selectedItem.resolution || selectedItem.resolution_output;
        const tech = selectedItem.technicalHighlights || selectedItem.technical_highlights;
        const kit = selectedItem.includedKit || selectedItem.included_kit;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-white max-w-5xl lg:max-w-6xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between border border-zinc-100 relative transition-all duration-300 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 ease-out"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors z-10"
              >
                ✕
              </button>

              {/* CONTENT AREA */}
              <div className="overflow-y-auto pr-2 space-y-8">
                
                {/* HERO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-zinc-100 pb-8">
                  
                  {/* STUDIO IMAGE CONTAINER */}
                  <div className="md:col-span-5 bg-[#F6F5F2] rounded-2xl aspect-square flex items-center justify-center p-8 relative">
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-6xl opacity-30">📷</div>
                    )}
                  </div>

                  {/* METADATA & EXPANDED DESCRIPTION AREA */}
                  <div className="md:col-span-7 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">
                        {selectedItem.category || "CINEMA GEAR"}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {selectedItem.stock > (selectedItem.rentedOut || 0) ? "• In Stock" : "• Out on Hire"}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 uppercase tracking-tight leading-none">
                        {selectedItem.name}
                      </h2>
                      <p className="text-2xl font-mono font-extrabold text-zinc-900 mt-3">
                        RM {selectedItem.dailyRate?.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-zinc-400">/ day</span>
                      </p>
                    </div>

                    {/* SPECS GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Status</p>
                        <p className="font-bold text-zinc-900 mt-0.5">
                          {selectedItem.stock > (selectedItem.rentedOut || 0) ? "In Stock" : "Out on Hire"}
                        </p>
                      </div>
                      {selectedItem.serialNumber && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400">S/N</p>
                          <p className="font-semibold text-zinc-900 mt-0.5">{selectedItem.serialNumber}</p>
                        </div>
                      )}
                      {mount && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Lens Mount</p>
                          <p className="font-semibold text-zinc-900 mt-0.5">{mount}</p>
                        </div>
                      )}
                      {resOut && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Resolution</p>
                          <p className="font-semibold text-zinc-900 mt-0.5">{resOut}</p>
                        </div>
                      )}
                    </div>

                    {/* EXPANDED DESCRIPTION BOX */}
                    {desc && (
                      <div className="pt-2">
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-2">
                          Item Overview & Description
                        </h4>
                        <p className="text-sm text-zinc-700 leading-relaxed font-sans bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          {desc}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* TECHNICAL SPECS & INCLUDED KIT */}
                {(tech || kit) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {tech && (
                      <div>
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-2.5">
                          Technical Specifications
                        </h4>
                        <ul className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2 font-mono text-[11px] text-zinc-700">
                          {tech
                            .split("\n")
                            .filter((line: string) => line.trim().length > 0)
                            .map((line: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-zinc-400">•</span>
                                <span className="leading-relaxed">{line.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {kit && (
                      <div>
                        <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] mb-2.5">
                          Included Kit & Accessories
                        </h4>
                        <ul className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2 font-mono text-[11px] text-zinc-700">
                          {kit
                            .split("\n")
                            .filter((line: string) => line.trim().length > 0)
                            .map((line: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span className="leading-relaxed">{line.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center gap-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-1/4 bg-zinc-100 text-zinc-700 font-bold py-4 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  disabled={selectedItem.stock <= (selectedItem.rentedOut || 0)}
                  onClick={() => {
                    addToCart(selectedItem, true);
                    setSelectedItem(null);
                  }}
                  className="w-3/4 bg-zinc-900 text-white font-bold py-4 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40 shadow-md"
                >
                  Add to Dispatch Cart 🛒
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 8. SLIDE-OVER DISPATCH CART DRAWER */}
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

              {checkoutStep === "cart" ? (
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
                          min={todayStr}
                          value={startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          min={startDate}
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
          </div>
        </div>
      )}

    </div>
  );
}
