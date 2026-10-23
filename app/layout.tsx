import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.vercel.app"), // 👈 Replace with your actual Vercel URL
  title: "tuaq k4o™ — Tech & Support | Cinema Equipment Rental",
  description:
    "Selected cinema cameras, lenses, lighting, audio, and grip equipment rentals based in Kuala Lumpur, Malaysia.",
  keywords: [
    "tuaq k4o",
    "camera rental KL",
    "cinema equipment rental Malaysia",
    "RED camera rental",
    "lighting hire Kuala Lumpur",
    "film production gear",
  ],
  authors: [{ name: "tuaq k4o™" }],
  openGraph: {
    title: "tuaq k4o™ — Tech & Support",
    description:
      "Selected cinema & production gear rental desk. Select items, pick your shoot dates, and request an official dispatch quote.",
    url: "https://your-domain.vercel.app", // 👈 Replace with your actual Vercel URL
    siteName: "tuaq k4o™",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "tuaq k4o™ Tech & Support Storefront",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tuaq k4o™ — Tech & Support",
    description:
      "Selected cinema & production gear rental desk in Kuala Lumpur, Malaysia.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
