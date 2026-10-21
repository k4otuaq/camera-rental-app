import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tuaq k4o™ tech & support | Camera Rental",
  description: "Professional cinema camera and production equipment rental",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-zinc-900">
        {/* Render children directly without extra layout headers/footers */}
        {children}
      </body>
    </html>
  );
}
