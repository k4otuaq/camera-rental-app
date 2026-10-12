import type { Metadata } from "next";
import Navbar from "./navbar";
import Footer from "./footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camera Rental Shop Solution",
  description: "Professional cinema camera, lighting, and gear rental store.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-black text-black dark:text-white flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
