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
  title: "Dhanya Naturals - Premium Organic Products",
  description: "Discover our range of premium organic products. Natural, organic, and authentic wellness solutions for your everyday health needs.",
  keywords: ["organic products", "natural products", "organic wellness", "dhanya naturals", "health and wellness", "herbal products"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js" async></script>
      </head>
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
