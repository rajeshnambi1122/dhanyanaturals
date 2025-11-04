export interface Product {
  id: number
  name: string
  description: string
  long_description?: string
  price: number
  original_price?: number
  category: string
  image_url?: string
  images?: string[]
  rating?: number
  reviews_count?: number
  in_stock: boolean
  stock_quantity: number
  status: "active" | "out-of-stock" | "discontinued"
  ingredients?: string[]
  benefits?: string[]
  how_to_use?: string
  weight?: string
  dimensions?: string
  shelf_life?: string
  tags?: string[]
  featured?: boolean
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: OrderItem[]
  total_amount: number
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  shipping_address?: any
  billing_address?: any
  payment_method?: string
  payment_id?: string
  payment_status?: "pending" | "success" | "failed" | "cancelled"
  tracking_number?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface WishlistItem {
  product_id: number
  added_at: string
}

export interface Review {
  id: number
  product_id: number
  user_id: string
  user_name: string
  user_email: string
  rating: number
  review_text?: string
  helpful_count: number
  verified_purchase: boolean
  created_at: string
  updated_at: string
}

export interface UserData {
  id: number
  user_id: string
  role: "admin" | "customer"
  cart_items: CartItem[]
  wishlist_items: WishlistItem[]
  preferences: any
  created_at?: string
  updated_at?: string
}





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

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}
