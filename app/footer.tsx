"use client"
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white mt-16 text-xs font-sans print:hidden">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>📷</span> Camera Rental Shop
          </h3>
          <p className="opacity-75 text-[11px] leading-relaxed">
            Professional cinema cameras, lenses, lighting, and grip gear available for daily and weekly rentals.
          </p>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-wider mb-2 text-[11px] opacity-60">Store Pickup Hours</h4>
          <p className="font-semibold">Mon – Sat: 9:00 AM – 7:00 PM</p>
          <p className="font-semibold opacity-75">Sun & Public Holidays: By Appointment</p>
          <p className="text-[11px] opacity-60 mt-2">Self-Pickup & Site Delivery Available</p>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-wider mb-2 text-[11px] opacity-60">Customer Self-Service</h4>
          <ul className="space-y-1 font-semibold">
            <li>
              <Link href="/" className="hover:underline">Browse Equipment Catalog</Link>
            </li>
            <li>
              <Link href="/lookup" className="hover:underline">Lookup Existing Delivery Order (DO)</Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:underline">View Active Rental Cart</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 max-w-6xl mx-auto flex flex-wrap justify-between items-center opacity-60 text-[11px]">
        <p>© {new Date().getFullYear()} Camera Rental Shop. All rights reserved.</p>
        <Link
          href="/admin"
          className="font-bold hover:opacity-100 underline flex items-center gap-1 transition-opacity"
        >
          <span>🔒</span> Staff Portal
        </Link>
      </div>
    </footer>
  );
}
