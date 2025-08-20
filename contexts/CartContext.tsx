"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, userDataService } from '@/lib/supabase';
import { CartItem } from '@/lib/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading, refreshUser } = useAuth();

  const refreshCart = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setCartItems([]);
        return;
      }

      const userData = await userDataService.getUserData(authUser.id);
      setCartItems(userData?.cart_items || []);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await userDataService.addToCart(user.id, productId, quantity);
      await refreshCart();
      // Refresh AuthContext user data to sync with cart page
      await refreshUser();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: number) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.removeFromCart(user.id, productId);
      await refreshCart();
      // Refresh AuthContext user data to sync with cart page
      await refreshUser();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.updateCartQuantity(user.id, productId, quantity);
      await refreshCart();
      // Refresh AuthContext user data to sync with cart page
      await refreshUser();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.clearCart(user.id);
      setCartItems([]);
      // Refresh AuthContext user data to sync with cart page
      await refreshUser();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Sync cart items with user data from AuthContext
  useEffect(() => {
    if (!authLoading) {
      if (user && user.cart_items) {
        setCartItems(user.cart_items || []);
      } else {
        setCartItems([]);
      }
    }
  }, [user, authLoading]);

  const value = {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    isLoading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}