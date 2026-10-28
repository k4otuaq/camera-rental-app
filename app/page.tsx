"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function StorefrontPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeBrand, setActiveBrand] = useState("ALL");
  const [activeMount, setActiveMount] = useState("ALL");

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

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const rentalDays = calculateDays();

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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
      const targetY = element.getBoundingClientRect().top + window.pageYOffset - navOffset;
      customSmoothScrollTo(Math.max(0, targetY), 1200);
    }
  };

  const handleResetHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchQuery("");
    setActiveCategory("ALL");
    setActiveBrand("ALL");
    setActiveMount("ALL");
    customSmoothScrollTo(0, 1200);
  };

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

  const handlePlaceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmittingBooking(true);
    try {
      const payload = {
        customerName,
        name: customerName,
        phone,
        phoneNumber: phone,
        identityNo,
        icNo: identityNo,
        paymentMethod,
        deliveryMethod,
        fulfillment: deliveryMethod,
        startDate,
        endDate,
        rentalDays,
        totalPrice: grandTotal,
        grandTotal,
        items: cart.map((c) => ({
          equipmentId: c.item.id,
          id: c.item.id,
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

  const categories = ["ALL", "CINEMA CAMERA", "LENSES", "LIGHTING", "SUPPORT & GRIP", "AUDIO"];
  const brands = ["ALL", "SONY", "RED", "AMARAN", "ARRI"];
  const mounts = ["ALL", "PL MOUNT", "EF MOUNT", "E MOUNT"];

  const filteredEquipment = equipment.filter((item) => {
    const itemName = item.name?.toLowerCase() || "";
    const itemCat = item.category?.toLowerCase() || "";
    const itemMount = (item.lensMount || item.lens_mount || "").toUpperCase();

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      itemCat.includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "ALL" ||
      itemCat.toUpperCase() === activeCategory.toUpperCase();

    const matchesBrand =
      activeBrand === "ALL" ||
      itemName.toUpperCase().includes(activeBrand.toUpperCase());

    const matchesMount =
      activeMount === "ALL" ||
      itemMount.includes(activeMount.toUpperCase());

    return matchesSearch && matchesCategory && matchesBrand && matchesMount;
  });

  const generateWhatsAppMessage = () => {
    if (!completedOrder) return "";
    const itemsList = completedOrder.items
      .map((c) => `• ${c.item.name} (x${c.quantity}) - RM ${(c.item.dailyRate * c.quantity).toFixed(2)}/day`)
      .join("\n");

    return encodeURIComponent(
      `*DISPATCH ORDER INQUIRY — ${completedOrder.doNumber}*\n\n` +
      `*Client:* ${completedOrder.customerName}\n` +
      `*Phone:* ${completedOrder.phone}\n` +
      `*Dates:* ${completedOrder.startDate} to ${completedOrder.endDate} (${completedOrder.rentalDays} Days)\n` +
      `*Fulfillment:* ${completedOrder.deliveryMethod} • ${completedOrder.paymentMethod}\n\n` +
      `*Selected Equipment:*\n${itemsList}\n\n` +
      `*Estimated Total:* RM ${completedOrder.grandTotal.toFixed(2)}\n\n` +
      `Hi tuaq k4o™! Please review and confirm gear availability for this dispatch order.`
    );
  };

  const faqs = [
    {
      q: "Reservation and booking process?",
      a: "To reserve equipment, simply add your desired gear to the dispatch cart, select your rental dates, and proceed to checkout. Our rental desk will confirm availability and issue an official dispatch quote.",
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
      a: "Full rental payment is processed before/during collection via Local/International Bank Transfer, E-Wallet, or Cash on Pickup prior to gear release.",
    },
    {
      q: "What happens in the event of equipment damage or late returns?",
      a: "Renters assume full responsibility for equipment during the hire period. Unannounced late returns incur an additional full-day rate per gear item.",
    },
    {
      q: "Do you offer courier dispatch or site delivery?",
      a: "Yes! In addition to self-pickup at our Kuala Lumpur studio, we can arrange dedicated courier dispatch across Klang Valley upon request.",
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
      <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur-md px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
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

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-wider text-zinc-600">
            <a href="#catalogue" onClick={(e) => scrollToSection(e, "catalogue")} className="hover:text-zinc-900 transition-colors cursor-pointer">
              Catalogue
            </a>
            <a href="#about" onClick={(e) => scrollToSection(e, "about")} className="hover:text-zinc-900 transition-colors cursor-pointer">
              About
            </a>
            <button onClick={() => setIsFaqOpen(true)} className="hover:text-zinc-900 transition-colors cursor-pointer uppercase font-medium">
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 rounded-full px-4 py-1.5 pr-8 text-xs outline-none w-48 lg:w-64 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 text-xs font-bold transition-colors cursor-pointer"
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
      <section id="catalogue" className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-6 space-y-6">
        <div className="border-b border-zinc-100 pb-8">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight uppercase">
            Catalogue
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-500 uppercase mt-2">
            Selected Cinema & Production Equipment
          </p>
        </div>

        {/* PRIMARY CATEGORY CHIPS */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
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

        {/* SUB-FILTERS: BRAND & MOUNT */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs font-mono border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Brand:</span>
            <div className="flex items-center gap-1.5">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    activeBrand === b
                      ? "bg-zinc-200 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Mount:</span>
            <div className="flex items-center gap-1.5">
              {mounts.map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMount(m)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    activeMount === m
                      ? "bg-zinc-200 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. EQUIPMENT GRID */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 min-h-[50vh]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="aspect-square rounded-2xl bg-zinc-100"></div>
                <div className="h-4 rounded w-3/4 bg-zinc-100"></div>
              </div>
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl space-y-3">
            <p className="text-sm font-semibold text-zinc-500">No equipment found matching your criteria.</p>
            <button
              onClick={(e) => handleResetHome(e)}
              className="text-xs font-bold underline uppercase tracking-wider cursor-pointer"
            >
              Clear Filters & View All
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
                  <div className="relative aspect-square w-full bg-[#F6F5F2] rounded-2xl overflow-hidden flex items-center justify-center p-6 transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-black/10">
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
                      className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-900 flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-pointer disabled:opacity-20 shrink-0 hover:scale-105 active:scale-95"
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

      {/* 4. FOOTER BANNER */}
      <footer id="about" className="mt-16 px-6 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto border border-zinc-200/60 bg-[#F6F5F2] rounded-3xl p-8 sm:p-14 lg:p-16 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight leading-none text-zinc-900">
                DON'T BE SHY, JUST SAY HI!
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed font-sans text-zinc-600 pt-1">
                Send your equipment list and shoot dates. Our rental desk will confirm gear availability and issue an official dispatch quote for your project.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <a
                href={`https://wa.me/60123456789?text=${encodeURIComponent(
                  "Hi tuaq k4o™! I would like to check gear availability and request an official dispatch quote for my shoot."
                )}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3.5 bg-white/60 hover:bg-white/90 backdrop-blur-xl border border-white/80 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer text-zinc-900"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  💬
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">WhatsApp</p>
                  <p className="text-xs font-bold text-zinc-900 font-mono">Chat Direct →</p>
                </div>
              </a>

              <a
                href="mailto:k4otuaqstudio@gmail.com"
                className="group flex items-center gap-3.5 bg-white/60 hover:bg-white/90 backdrop-blur-xl border border-white/80 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer text-zinc-900"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900/10 border border-zinc-900/15 text-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  ✉️
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email Us</p>
                  <p className="text-xs font-bold text-zinc-900 font-mono">Send Mail →</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsFaqOpen(true)} className="hover:text-zinc-900 transition-colors cursor-pointer">
              Rental FAQ
            </button>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="text-xs font-semibold text-zinc-600">
              k4otuaqstudio@gmail.com • Kuala Lumpur, Malaysia
            </p>
            <div className="flex items-center justify-start sm:justify-end gap-3 text-[11px]">
              <span>© {new Date().getFullYear()} tuaq k4o™ tech & support. All rights reserved.</span>
              <Link href="/admin" title="Staff Portal Login" className="opacity-30 hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100">
                🔒
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. PRINTABLE DISPATCH ORDER SUMMARY MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-zinc-900 max-w-2xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between border border-zinc-100 relative">
            <div className="overflow-y-auto space-y-6 pr-1">
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

              <div className="border-t border-zinc-100 pt-4 space-y-1 text-xs font-mono text-right">
                <p className="text-zinc-500">Daily Subtotal: <span className="font-bold text-zinc-900">RM {completedOrder.dailySubtotal.toFixed(2)}</span></p>
                <p className="text-zinc-500">Duration Multiplier: <span className="font-bold text-zinc-900">{completedOrder.rentalDays} Day(s)</span></p>
                <p className="text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-100">
                  Estimated Total Quote: <span className="text-emerald-600">RM {completedOrder.grandTotal.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setCompletedOrder(null)}
                className="w-full sm:w-auto bg-zinc-100 text-zinc-700 font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="w-1/2 sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>PDF Quote</span>
                  <span>📄</span>
                </button>

                <a
                  href={`https://wa.me/60123456789?text=${generateWhatsAppMessage()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-1/2 sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>WhatsApp DO</span>
                  <span>💬</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FAQ MODAL */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsFaqOpen(false)}>
          <div className="bg-white text-zinc-900 max-w-3xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col justify-between border border-zinc-100 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsFaqOpen(false)} className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center cursor-pointer">✕</button>
            <div className="border-b border-zinc-100 pb-6 pr-8">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">RENTAL DESK DIRECTORY</span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 uppercase tracking-tight mt-3">FREQUENTLY ASKED QUESTIONS</h2>
            </div>
            <div className="overflow-y-auto py-6 space-y-6 pr-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-zinc-900 flex items-center gap-2">
                    <span className="text-zinc-400 font-mono text-[10px]">0{idx + 1}.</span>{faq.q}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans pl-5">{faq.a}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
              <button onClick={() => setIsFaqOpen(false)} className="bg-zinc-900 text-white font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer">Close FAQ</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EXPANDED ITEM DETAIL MODAL */}
      {selectedItem && (() => {
        const desc = selectedItem.description;
        const mount = selectedItem.lensMount || selectedItem.lens_mount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedItem(null)}>
            <div className="bg-white text-zinc-900 max-w-5xl lg:max-w-6xl w-full rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between border border-zinc-100 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center cursor-pointer">✕</button>

              <div className="overflow-y-auto pr-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-zinc-100 pb-8">
                  <div className="md:col-span-5 bg-[#F6F5F2] rounded-2xl aspect-square flex items-center justify-center p-8 relative">
                    {selectedItem.imageUrl ? (
                      <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="text-6xl opacity-30">📷</div>
                    )}
                  </div>

                  <div className="md:col-span-7 space-y-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">
                      {selectedItem.category || "CINEMA GEAR"}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 uppercase tracking-tight leading-none">{selectedItem.name}</h2>
                    <p className="text-2xl font-mono font-extrabold text-zinc-900">RM {selectedItem.dailyRate?.toFixed(2)} <span className="text-xs font-normal text-zinc-400">/ day</span></p>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono text-zinc-600 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Status</p>
                        <p className="font-bold text-zinc-900 mt-0.5">{selectedItem.stock > (selectedItem.rentedOut || 0) ? "In Stock" : "Out on Hire"}</p>
                      </div>
                      {mount && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400">Mount</p>
                          <p className="font-semibold text-zinc-900 mt-0.5">{mount}</p>
                        </div>
                      )}
                    </div>

                    {desc && (
                      <p className="text-sm text-zinc-700 leading-relaxed font-sans bg-zinc-50 p-4 rounded-2xl border border-zinc-100">{desc}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center gap-4">
                <button onClick={() => setSelectedItem(null)} className="w-1/4 bg-zinc-100 text-zinc-700 font-bold py-4 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-200">Close</button>
                <button
                  disabled={selectedItem.stock <= (selectedItem.rentedOut || 0)}
                  onClick={() => {
                    addToCart(selectedItem, true);
                    setSelectedItem(null);
                  }}
                  className="w-3/4 bg-zinc-900 text-white font-bold py-4 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer shadow-md disabled:opacity-40"
                >
                  Add to Dispatch Cart 🛒
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 8. DISPATCH DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white text-zinc-900 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">YOUR DISPATCH</h2>
                  <p className="text-[11px] font-mono text-zinc-500">{totalCartCount} item(s) selected</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
              </div>

              {checkoutStep === "cart" ? (
                <div className="space-y-6">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Rental Duration ({rentalDays} Day{rentalDays > 1 ? "s" : ""})</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Start Date</label>
                        <input type="date" min={todayStr} value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-mono text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">End Date</label>
                        <input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-mono text-xs outline-none" />
                      </div>
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs">Your dispatch cart is empty. Click gear items to add them.</div>
                  ) : (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                      {cart.map(({ item, quantity }) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#F6F5F2] rounded-lg p-1 flex items-center justify-center border border-zinc-100 shrink-0">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" /> : "📷"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500">RM {item.dailyRate?.toFixed(2)} / day</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, quantity - 1)} className="w-6 h-6 rounded bg-zinc-100 font-bold text-xs flex items-center justify-center cursor-pointer">-</button>
                            <span className="text-xs font-bold font-mono w-4 text-center">{quantity}</span>
                            <button onClick={() => updateQuantity(item.id, quantity + 1)} className="w-6 h-6 rounded bg-zinc-100 font-bold text-xs flex items-center justify-center cursor-pointer">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handlePlaceBooking} className="space-y-4 text-xs">
                  <button type="button" onClick={() => setCheckoutStep("cart")} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-2 block cursor-pointer">← Back to Selected Items</button>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-2">Client Details</h3>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">Full Name *</label>
                    <input type="text" required placeholder="e.g. Alex Tan" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-semibold outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">Phone Number *</label>
                      <input type="tel" required placeholder="e.g. +60123456789" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">IC / Passport No *</label>
                      <input type="text" required placeholder="e.g. 950101-14-5566" value={identityNo} onChange={(e) => setIdentityNo(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-mono outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">Payment Method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-bold outline-none cursor-pointer">
                        <option value="BANK TRANSFER">Bank Transfer</option>
                        <option value="TOUCH N GO">Touch 'n Go E-Wallet</option>
                        <option value="CASH">Cash on Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold uppercase text-[10px] text-zinc-500 mb-1">Fulfillment</label>
                      <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-bold outline-none cursor-pointer">
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
                <button disabled={cart.length === 0} onClick={() => setCheckoutStep("details")} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-30 shadow-md">
                  Proceed to Details →
                </button>
              ) : (
                <button type="submit" form="checkout-form" disabled={submittingBooking} className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50 shadow-md">
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
