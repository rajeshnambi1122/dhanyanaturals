import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
// import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Dhanya Naturals - Organic & Natural Products",
  description:
    "Premium organic soaps, shampoos, herbal powders and natural skincare products. Handcrafted with love, free from chemicals.",
  keywords: "organic soap, natural shampoo, herbal products, chemical-free skincare, handmade cosmetics",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            {/* <Toaster /> */}
            <Analytics />
            <SpeedInsights />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
