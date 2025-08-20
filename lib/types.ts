import { useState } from "react"

export interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  image: string
  rating?: number
  reviews?: number
  inStock: boolean
  stock: number
  status: "active" | "out-of-stock" | "discontinued"
  featured?: boolean
  tags?: string[]
  ingredients?: string[]
  benefits?: string[]
  createdAt?: string
  updatedAt?: string
}

export type CartItem = {
  product_id: number;
  quantity: number;
  added_at: string;
};

export type CartItemWithDetails = {
  product_id: number;
  quantity: number;
  added_at: string;
  product_name: string;
  price: number;
  image?: string;
  stock_quantity: number;
  in_stock: boolean;
};


export interface Order {
  id: number
  customer: string
  email?: string
  phone?: string
  items: CartItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  date: string
  shippingAddress?: Address
  billingAddress?: Address
  paymentMethod?: string
  trackingNumber?: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Category {
  id: string
  name: string
  description?: string
  image?: string
  productCount: number
}

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "customer"
  createdAt: string
}
