"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const updateCartCount = () => {
    if (typeof window === "undefined") return;
    try {
      const savedCart = JSON.parse(localStorage.getItem("rental_cart") || "[]");
      const totalQty = savedCart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      setCartCount(totalQty);
    } catch (err) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    setMounted(true);
    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <header className="border-b-2 border-black dark:border-white bg-white dark:bg-black sticky top-0 z-50 print:hidden">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
          <span>📷</span> CAMERA RENTAL SHOP
        </Link>

        {/* CUSTOMER LINKS */}
        <nav className="flex items-center gap-6 text-xs font-extrabold uppercase tracking-wide">
          <Link href="/" className="hover:opacity-75 transition-opacity">
            Catalog
          </Link>
          <Link href="/lookup" className="hover:opacity-75 transition-opacity">
            Order Lookup
          </Link>
          <Link
            href="/checkout"
            className="bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg border border-black dark:border-white hover:opacity-80 transition-opacity flex items-center gap-1.5"
          >
            <span>🛒</span> Cart ({mounted ? cartCount : 0})
          </Link>
        </nav>
      </div>
    </header>
  );
}
