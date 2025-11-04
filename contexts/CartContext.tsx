"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, userDataService } from '@/lib/supabase';
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
  const [initialized, setInitialized] = useState(false);
  const { user, loading: authLoading, refreshUser } = useAuth();

  const refreshCart = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setCartItems([]);
        return;
      }

      const userData = await userDataService.getUserData(authUser.id);
      setCartItems((userData?.cart_items as CartItem[]) || []);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await userDataService.addToCart(user.id, productId, quantity);
      
      const existingItem = cartItems.find(item => item.product_id === productId);
      if (existingItem) {
        setCartItems(prev => prev.map(item => 
          item.product_id === productId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      } else {
        setCartItems(prev => [...prev, {
          product_id: productId,
          quantity,
          added_at: new Date().toISOString()
        }]);
      }
      
      await refreshUser();
    } catch (error) {
      console.error('Error adding to cart:', error);
      await refreshCart();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: number) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.removeFromCart(user.id, productId);
      
      setCartItems(prev => prev.filter(item => item.product_id !== productId));
      
      await refreshUser();
    } catch (error) {
      console.error('Error removing from cart:', error);
      await refreshCart();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.updateCartQuantity(user.id, productId, quantity);
      
      setCartItems(prev => prev.map(item => 
        item.product_id === productId ? { ...item, quantity } : item
      ));
      
      await refreshUser();
    } catch (error) {
      console.error('Error updating quantity:', error);
      await refreshCart();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await userDataService.clearCart(user.id);
      
      setCartItems([]);
      
      await refreshUser();
    } catch (error) {
      console.error('Error clearing cart:', error);
      await refreshCart();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!authLoading) {
        if (user && user.cart_items) {
          setCartItems((prevItems) => {
            const newCartStr = JSON.stringify(user.cart_items || []);
            const prevCartStr = JSON.stringify(prevItems);
            return newCartStr !== prevCartStr ? (user.cart_items || []) : prevItems;
          });
          if (!initialized) setInitialized(true);
        } else if (!user && initialized) {
          setCartItems([]);
        } else if (!user && !initialized) {
          setInitialized(true);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user?.cart_items, authLoading, user, initialized]);

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