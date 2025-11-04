"use client"
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Leaf, User, Shield, LogOut } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, isLoggedIn, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin";

  const handleSignOut = async () => {
    try {
      await signOut();
      if (isAdminPage) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="glass-header">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center min-w-0 space-x-2">
            <Image src="/logo.png" alt="Dhanya Naturals" width={40} height={40} className="rounded-full flex-shrink-0" />
            <Link href="/">
              <h1 className="text-lg sm:text-2xl font-bold gradient-text truncate">
                Dhanya Naturals
                {isAdminPage && <span className="text-green-600"> Admin</span>}
              </h1>
            </Link>
          </div>
          <nav className="hidden md:flex flex-wrap items-center space-x-4">
            <Link href="/" className="glass-nav-item text-gray-700 hover:text-green-600">
              Home
            </Link>
            <Link href="/products" className="glass-nav-item text-gray-700 hover:text-green-600">
              Products
            </Link>
            <Link href="/about" className="glass-nav-item text-gray-700 hover:text-green-600">
              About
            </Link>
            <Link href="/contact" className="glass-nav-item text-gray-700 hover:text-green-600">
              Contact
            </Link>
          </nav>
          <div className="flex flex-row items-center gap-1">
            {isAdminPage ? (
              // Admin page header buttons
              <>
                {user && (
                  <div className="hidden sm:flex items-center space-x-3 mr-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <LogOut className="h-3 w-3 md:mr-2" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              // Regular page header buttons
              <>
                <Link href="/cart">
                  <Button variant="outline" size="sm" className="glass-input bg-transparent hover-lift flex items-center justify-center relative">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="hidden sm:inline ml-2">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {isLoggedIn ? (
                  <Link href="/account">
                    <Button variant="ghost" size="sm" className="hover-lift flex items-center justify-center">
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline ml-2">Account</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hover-lift flex items-center justify-center">
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline ml-2">Login</span>
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 