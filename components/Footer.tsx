import Link from "next/link";
import { Leaf, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass-footer py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 stagger-animation">
          <div className="animate-fade-in">
            <div className="flex items-center space-x-2 mb-6">
              <Leaf className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Dhanya Naturals</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Bringing you the finest organic and natural products for a healthier lifestyle.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover-lift cursor-pointer">
                <span className="text-white text-sm">
                  <a href="https://www.instagram.com/dhanya_naturals/" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5" />
                  </a>
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/products" className="hover:text-white transition-colors hover-lift inline-block">
                  Products
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors hover-lift inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors hover-lift inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors hover-lift inline-block">
                  My Account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-white">Policies</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors hover-lift inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors hover-lift inline-block">
                  Refund & Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-white">Categories</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link
                  href="/products?category=soaps"
                  className="hover:text-white transition-colors hover-lift inline-block"
                >
                  Soaps
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=shampoos"
                  className="hover:text-white transition-colors hover-lift inline-block"
                >
                  Shampoos
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=herbal-powders"
                  className="hover:text-white transition-colors hover-lift inline-block"
                >
                  Herbal Powders
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=essential-oils"
                  className="hover:text-white transition-colors hover-lift inline-block"
                >
                  Hair Care
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-white">Contact Info</h4>
            <div className="space-y-3 text-gray-400">
              <p className="flex items-center hover-lift">
                <span className="mr-2">📧</span> <a href="mailto:dhanyanaturals01@gmail.com" className="hover:text-white transition-colors hover-lift inline-block">dhanyanaturals01@gmail.com</a>
              </p>
              <p className="flex items-center hover-lift">
                <span className="mr-2">📞</span> <a href="tel:+919865081056" className="hover:text-white transition-colors hover-lift inline-block">+91 98650 81056</a>
              </p>
              <p className="flex items-center hover-lift">
                <span className="mr-2">📍</span> Tiruchendur, India
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 animate-fade-in">
          <p> Dhanya Naturals Made with ❤️ for nature lovers.</p>
        </div>
      </div>
    </footer>
  );
}