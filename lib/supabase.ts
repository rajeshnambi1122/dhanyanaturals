import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Product, OrderItem, Order, CartItem, WishlistItem, Review, UserData } from "./types"
// Type definitions (moved from supabase.ts)

// Create the Supabase client for browser usage
// Note: createClientComponentClient() uses HTTP-only cookies for token storage by default
// Tokens are NOT stored in localStorage for security reasons
export const supabase = createClientComponentClient()

let cachedClient: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient
  }
  cachedClient = createClientComponentClient()
  return cachedClient
}

// Helper function to refresh session if expired
async function ensureValidSession() {
  try {
    const client = getSupabaseClient();
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      console.error('[Session] Error getting session:', error)
      try {
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession()
        if (!refreshError && refreshData.session) {
          console.log('[Session] Session refreshed after getSession error')
          return true
        }
      } catch (refreshErr) {
        console.error('[Session] Failed to refresh after getSession error:', refreshErr)
      }
      return false
    }
    
    if (session && (session as any).expires_at) {
      const expiresAt = (session as any).expires_at * 1000
      const now = Date.now()
      const bufferTime = 60 * 1000
      
      if (now >= expiresAt - bufferTime) {
        console.log('[Session] Session expiring soon, refreshing proactively...')
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession()
        
        if (refreshError) {
          console.error('[Session] Error refreshing session:', refreshError)
          return true
        }
        
        if (refreshData.session) {
          console.log('[Session] Session refreshed successfully')
          return true
        }
      }
      
      return true
    }
    
    if (!session) {
      console.log('[Session] No session found, attempting refresh...')
      try {
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession()
        if (!refreshError && refreshData.session) {
          console.log('[Session] Session restored via refresh')
          return true
        }
      } catch {}
    }
    
    return !!session
  } catch (error) {
    console.error('[Session] Error ensuring valid session:', error)
    return true
  }
}

// Wrapper function to execute queries with session refresh
async function executeWithSessionRefresh(queryFn: () => Promise<any>, retries = 2): Promise<any> {
  let lastError: any = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Session] Attempt ${attempt + 1}: Refreshing session before retry...`)
        try {
          const client = getSupabaseClient();
          const { data, error } = await client.auth.refreshSession()
          if (error) {
            console.error('[Session] Refresh failed:', error)
          } else if (data.session) {
            console.log('[Session] Session refreshed, retrying query...')
          }
        } catch (refreshErr) {
          console.error('[Session] Refresh exception:', refreshErr)
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        await ensureValidSession()
      }
      
      return await queryFn()
    } catch (error: any) {
      lastError = error
      const isSessionError = 
        error?.message?.includes('JWT') || 
        error?.message?.includes('expired') ||
        error?.message?.includes('token') ||
        error?.message?.includes('unauthorized') ||
        error?.message?.includes('authentication') ||
        error?.status === 401 ||
        error?.code === 'PGRST301' ||
        (error?.message && String(error.message).toLowerCase().includes('session'))
      
      if (isSessionError && attempt < retries) {
        console.log(`[Session] Session error detected (attempt ${attempt + 1}/${retries + 1}), will retry...`)
        continue
      }
      throw error
    }
  }
  throw lastError
}

// Initialize session refresh listener
if (typeof window !== 'undefined') {
  const client = createClientComponentClient();
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Session] Token refreshed automatically')
    } else if (event === 'SIGNED_OUT') {
      console.log('[Session] User signed out')
    }
  })
  
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('[Session] Page visible - checking session...')
      try {
        await ensureValidSession()
      } catch (error) {
        console.error('[Session] Error refreshing on visibility change:', error)
      }
    }
  })
}

// Helper to get a shared Supabase client
// This prevents race conditions by reusing the same client instance


// Create client-aware productService that uses the client-side supabase instance
export const productService = {
  async getProducts(filters?: {
    category?: string
    search?: string
    inStockOnly?: boolean
    sortBy?: string
    featured?: boolean
  }): Promise<Product[]> {
    console.log('[getProducts Client] Starting API call with filters:', filters);
    try {
      // Use the cached shared client to avoid race conditions with AuthContext
      const client = getSupabaseClient();

      let query = client
        .from("products")
        .select("*")
        .eq("status", "active")

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category)
      }

      if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      }

      if (filters?.inStockOnly) {
        query = query.eq("in_stock", true)
      }

      if (filters?.featured) {
        query = query.eq("featured", true)
      }

      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case "price-low":
            query = query.order("price", { ascending: true })
            break
          case "price-high":
            query = query.order("price", { ascending: false })
            break
          case "rating":
            query = query.order("rating", { ascending: false })
            break
          case "newest":
            query = query.order("created_at", { ascending: false })
            break
          case "name":
          default:
            query = query.order("name", { ascending: true })
            break
        }
      } else {
        query = query.order("featured", { ascending: false }).order("rating", { ascending: false })
      }

      console.log('[getProducts Client] Executing query...');
      const { data, error } = await query
      console.log('[getProducts Client] Query completed. Error:', error, 'Data length:', data?.length);

      if (error) {
        console.error("Error fetching products:", error)
        throw error;
      }

      return (data as unknown as Product[]) || []
    } catch (error) {
      console.error('[getProducts Client] Exception caught:', error);
      throw error;
    }
  },

  async getProductById(id: number): Promise<Product | null> {
    // Create a fresh client per call to avoid stale module-level client issues
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .single()

    if (error) {
      console.error("Error fetching product:", error)
      throw error;
    }

    return data as unknown as Product
  },

  async createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const client = getSupabaseClient();
    const { data, error } = await client.from("products").insert([product]).select().single()

    if (error) {
      console.error("Error creating product:", error)
      throw error
    }

    return data as unknown as Product
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      throw error
    }

    return data as unknown as Product
  },

  async deleteProduct(id: number) {
    const client = getSupabaseClient();
    const { error } = await client.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      throw error
    }

    return true
  },

  async getFeaturedProducts(limit = 4): Promise<Product[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("featured", true)
      .eq("in_stock", true)
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    return (data as unknown as Product[]) || []
  },

  async getRelatedProducts(productId: number, category: string, limit = 4): Promise<Product[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("in_stock", true)
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching related products:", error)
      return []
    }

    return (data as unknown as Product[]) || []
  },

  async searchProducts(searchTerm: string, limit = 20): Promise<Product[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .textSearch("name", searchTerm)
      .eq("in_stock", true)
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error searching products:", error)
      return []
    }

    return (data as unknown as Product[]) || []
  },

  async getProductsByIds(productIds: number[]): Promise<Product[]> {
    if (productIds.length === 0) return []
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching products by IDs:", error)
      throw error;
    }

    return (data as unknown as Product[]) || []
  },
}

// Create client-aware orderService
export const orderService = {
  // ⚠️ SECURITY: This function should ONLY be used in admin context
  // Regular users should use getOrdersByCustomer() instead
  async getOrders(): Promise<Order[]> {
    const client = getSupabaseClient();
    
    // Check if user is admin
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('[getOrders] No authenticated user');
      return [];
    }

    // Check admin status
    const { data: userData } = await client
      .from('user_data')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      console.warn('[getOrders] Non-admin user attempted to fetch all orders');
      // For non-admin users, return only their orders
      const { data: { user: currentUser } } = await client.auth.getUser();
      if (currentUser?.email) {
        return this.getOrdersByCustomer(currentUser.email);
      }
      return [];
    }

    // Admin user - fetch all orders
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error)
      throw error;
    }

    return (data as unknown as Order[]) || []
  },


  async getOrdersByCustomer(email: string): Promise<Order[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customer orders:", error)
      throw error;
    }

    return (data as unknown as Order[]) || []
  },

  async validateOrderPrices(order: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Omit<Order, "id" | "created_at" | "updated_at">> {
    console.warn('⚠️ Client-side price validation - should be done server-side!');
    return order;
  },

  async createOrder(order: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    const client = getSupabaseClient();
    const { data, error } = await client.from("orders").insert([order]).select().single()

    if (error) {
      console.error("Error creating order:", error)
      throw error
    }

    return data as unknown as Order
  },

  // ⚠️ SECURITY: This function should ONLY be used in admin context
  async getOrdersByStatus(status: "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled"): Promise<Order[]> {
    const client = getSupabaseClient();
    
    // Check if user is admin
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.error('[getOrdersByStatus] No authenticated user');
      return [];
    }

    // Check admin status
    const { data: userData } = await client
      .from('user_data')
      .select('role')
      .eq('user_id', user.id)
      .single();

    let query = client
      .from("orders")
      .select("*")
      .eq("status", status);

    // If not admin, filter by customer email
    if (userData?.role !== 'admin') {
      const { data: { user: currentUser } } = await client.auth.getUser();
      if (!currentUser?.email) {
        return [];
      }
      query = query.eq("customer_email", currentUser.email);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders by status:", error)
      return []
    }

    return (data as unknown as Order[]) || []
  },

  async updateOrderStatus(id: number, updates: {
    status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
    payment_status?: "pending" | "success" | "failed" | "cancelled"
    payment_id?: string
    payment_session_id?: string
    tracking_number?: string
    notes?: string
  }): Promise<Order> {
    const client = getSupabaseClient();
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await client.from("orders").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating order status:", error)
      throw error
    }

    return data as unknown as Order
  },

  async getOrderById(id: number): Promise<Order | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null // Order not found
      }
      console.error("Error fetching order by ID:", error)
      throw error
    }

    return data as unknown as Order
  },

  /**
   * Get the last/highest order ID
   * Useful for generating next order reference numbers
   * Returns just the ID number, not full order details (secure)
   */
  async getLastOrderId(): Promise<number> {
    const client = getSupabaseClient();
    
    try {
      // Only select the ID column for security
      // Orders with higher IDs were created more recently
      const { data, error } = await client
        .from("orders")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no orders exist, return 1000 as starting number
        if ((error as any).code === 'PGRST116') {
          console.log('[getLastOrderId] No orders found, returning starting ID 1000');
          return 1000;
        }
        console.error('[getLastOrderId] Error fetching last order:', error);
        // Return default starting number on error
        return 1000;
      }

      const lastId = (data?.id as number) || 1000;
      console.log('[getLastOrderId] Last order ID:', lastId);
      return lastId;
    } catch (error) {
      console.error('[getLastOrderId] Exception:', error);
      // Return default starting number on exception
      return 1000;
    }
  },
}

// Create client-aware userDataService
export const userDataService = {
  async getUserData(userId: string): Promise<UserData | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.from("user_data").select("*").eq("user_id", userId).single()

    if (error && (error as any).code !== "PGRST116") {
      console.error("Error fetching user data:", error)
      return null
    }

    return data as unknown as UserData | null
  },

  async upsertUserData(userData: Omit<UserData, "id" | "created_at" | "updated_at">): Promise<UserData> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("user_data")
      .upsert([userData], { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      console.error("Error upserting user data:", error)
      throw new Error(`Failed to upsert user data: ${(error as any).message || 'Unknown error'}`)
    }

    return data as unknown as UserData
  },

  async addToCart(userId: string, productId: number, quantity: number): Promise<UserData | null> {
    const existing = await this.getUserData(userId)
    const cartItems = (existing?.cart_items as CartItem[]) || []

    const existingItemIndex = cartItems.findIndex((item: CartItem) => item.product_id === productId)

    if (existingItemIndex >= 0) {
      cartItems[existingItemIndex].quantity += quantity
    } else {
      cartItems.push({
        product_id: productId,
        quantity,
        added_at: new Date().toISOString(),
      })
    }

    return this.upsertUserData({
      user_id: userId,
      role: (existing?.role as "admin" | "customer") || 'customer',
      cart_items: cartItems,
      wishlist_items: (existing?.wishlist_items as WishlistItem[]) || [],
      preferences: existing?.preferences || {},
    })
  },

  async removeFromCart(userId: string, productId: number): Promise<UserData | null> {
    const existing = await this.getUserData(userId)
    if (!existing) return null

    const cartItems = (existing.cart_items as CartItem[]).filter((item: CartItem) => item.product_id !== productId)

    return this.upsertUserData({
      user_id: userId,
      role: existing.role as "admin" | "customer",
      cart_items: cartItems,
      wishlist_items: existing.wishlist_items as WishlistItem[],
      preferences: existing.preferences,
    })
  },

  async updateCartQuantity(userId: string, productId: number, quantity: number): Promise<UserData | null> {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId)
    }

    const existing = await this.getUserData(userId)
    if (!existing) {
      return this.upsertUserData({
        user_id: userId,
        role: 'customer',
        cart_items: [{
          product_id: productId,
          quantity,
          added_at: new Date().toISOString()
        }],
        wishlist_items: [],
        preferences: {},
      })
    }

    const cartItems = (existing.cart_items as CartItem[]).map((item: CartItem) =>
      item.product_id === productId ? { ...item, quantity } : item,
    )

    return this.upsertUserData({
      user_id: userId,
      role: existing.role as "admin" | "customer",
      cart_items: cartItems,
      wishlist_items: existing.wishlist_items as WishlistItem[],
      preferences: existing.preferences,
    })
  },

  async clearCart(userId: string): Promise<UserData | null> {
    const existing = await this.getUserData(userId)
    if (!existing) return null

    return this.upsertUserData({
      user_id: userId,
      role: existing.role as "admin" | "customer",
      cart_items: [],
      wishlist_items: existing.wishlist_items as WishlistItem[],
      preferences: existing.preferences,
    })
  },

  async addToWishlist(userId: string, productId: number): Promise<UserData | null> {
    const existing = await this.getUserData(userId)
    const wishlistItems = (existing?.wishlist_items as WishlistItem[]) || []

    const exists = wishlistItems.some((item: WishlistItem) => item.product_id === productId)
    if (exists) return existing

    wishlistItems.push({
      product_id: productId,
      added_at: new Date().toISOString(),
    })

    return this.upsertUserData({
      user_id: userId,
      role: (existing?.role as "admin" | "customer") || 'customer',
      cart_items: (existing?.cart_items as CartItem[]) || [],
      wishlist_items: wishlistItems,
      preferences: existing?.preferences || {},
    })
  },

  async removeFromWishlist(userId: string, productId: number): Promise<UserData | null> {
    const existing = await this.getUserData(userId)
    if (!existing) return null

    const wishlistItems = (existing.wishlist_items as WishlistItem[]).filter((item: WishlistItem) => item.product_id !== productId)

    return this.upsertUserData({
      user_id: userId,
      role: existing.role as "admin" | "customer",
      cart_items: existing.cart_items as CartItem[],
      wishlist_items: wishlistItems,
      preferences: existing.preferences,
    })
  },
}

// Create client-aware authService
export const authService = {
  async getCurrentUser() {
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) {
      return null
    }
    return user
  },

  async getUserProfile(userId?: string) {
    const client = getSupabaseClient();
    const currentUser = userId ? { id: userId } : await this.getCurrentUser()
    if (!currentUser) {
      return null
    }

    const { data, error } = await client
      .from("user_data")
      .select("*")
      .eq("user_id", (currentUser as any).id)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  async isAdmin(userId?: string) {
    const user = await this.getUserProfile(userId)
    return (user as any)?.role === "admin"
  },

  async signIn(email: string, password: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  async signUp(email: string, password: string) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  async signOut() {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut()
    if (error) {
      throw error
    }
  },

  async signInWithGoogle() {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    return data
  },

  async handleOAuthCallback(user: any) {
    if (!user) {
      console.log("No user provided to handleOAuthCallback")
      return
    }

    const client = getSupabaseClient();
    const extractUserName = (user: any): string => {
      const metadata = user.user_metadata || {}
      
      if (metadata.full_name) return metadata.full_name
      if (metadata.name) return metadata.name
      if (metadata.display_name) return metadata.display_name
      if (metadata.user_name) return metadata.user_name
      if (metadata.first_name && metadata.last_name) {
        return `${metadata.first_name} ${metadata.last_name}`
      }
      if (user.email) {
        return user.email.split('@')[0]
      }
      
      return 'User'
    }

    const existingProfile = await this.getUserProfile(user.id)
    
    if (!existingProfile) {
      const userName = extractUserName(user)
      await this.createUserProfile(user.id, userName, user.email)
    } else {
      const needsUpdate = !(existingProfile as any).name || !(existingProfile as any).email
      if (needsUpdate) {
        const userName = (existingProfile as any).name || extractUserName(user)
        try {
          await this.updateUserProfile(user.id, {
            name: userName,
            email: (existingProfile as any).email || user.email
          })
        } catch (updateError) {
          console.error("Failed to update user profile, but continuing:", updateError)
        }
      }
    }
  },

  async updateUserProfile(userId: string, updates: { name?: string; email?: string; role?: string }) {
    try {
      const client = getSupabaseClient();
      const { data: existingUser, error: fetchError } = await client
        .from("user_data")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError) {
        if ((fetchError as any).code === 'PGRST116') {
          return null
        }
        throw fetchError
      }

      const { data, error } = await client
        .from("user_data")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user profile:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Failed to update user profile:", error)
      throw error
    }
  },

  async createUserProfile(userId: string, name?: string, email?: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("user_data")
      .insert([
        {
          user_id: userId,
          name: name || null,
          email: email || null,
          role: 'customer',
          cart_items: [],
          wishlist_items: [],
          preferences: {},
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      throw error
    }

    return data
  },
}

// Create client-aware storageService
export const storageService = {
  async uploadImage(file: File, bucket: string = 'product-images'): Promise<string> {
    try {
      const client = getSupabaseClient();
      const sanitizeFileName = (name: string): string => {
        const trimmed = name.trim().toLowerCase()
        return trimmed
          .replace(/[^a-z0-9._-]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^\.+/, '')
          .slice(0, 120)
      }

      const originalName = file.name || `upload-${Date.now()}`
      const lastDotIndex = originalName.lastIndexOf('.')
      const baseName = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
      const ext = lastDotIndex > 0 ? originalName.substring(lastDotIndex + 1) : 'bin'

      const safeBase = sanitizeFileName(baseName) || `file-${Date.now()}`
      const safeExt = sanitizeFileName(ext) || 'bin'
      let fileName = `${safeBase}.${safeExt}`
      let filePath = `products/${fileName}`

      let { data, error } = await client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        const isConflict = (error as any)?.statusCode === 409 || /exists/i.test((error as any)?.message || '')
        if (!isConflict) {
          throw new Error(`Upload failed: ${(error as any).message}`)
        }

        fileName = `${safeBase}-${Date.now()}.${safeExt}`
        filePath = `products/${fileName}`
        const retry = await client.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })
        if (retry.error) {
          throw new Error(`Upload failed: ${(retry.error as any).message}`)
        }
        data = retry.data
      }

      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },

  async deleteImage(imageUrl: string, bucket: string = 'product-images'): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === bucket)
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL format')
      }
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      const { error } = await client.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  },

  getImageUrl(filePath: string, bucket: string = 'product-images'): string {
    const client = getSupabaseClient();
    const { data } = client.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  },

  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Please upload images smaller than 5MB.'
      }
    }

    return { isValid: true }
  },

  async uploadMultipleImages(files: File[], bucket: string = 'product-images'): Promise<string[]> {
    const uploads = files.map(file => this.uploadImage(file, bucket))
    return Promise.all(uploads)
  },
}

// Create client-aware reviewService
export const reviewService = {
  async getProductReviews(productId: number) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error)
      return []
    }

    return data || []
  },

  async getUserReview(productId: number, userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single()

    if (error && (error as any).code !== "PGRST116") {
      console.error("Error fetching user review:", error)
      return null
    }

    return data
  },

  async createOrUpdateReview(review: Omit<Review, "id" | "created_at" | "updated_at" | "helpful_count">) {
    const client = getSupabaseClient();
    const existingReview = await this.getUserReview(review.product_id, review.user_id)

    if (existingReview) {
      if (existingReview.user_id !== review.user_id) {
        throw new Error("Unauthorized: You can only edit your own reviews")
      }

      const { data, error } = await client
        .from("reviews")
        .update({
          rating: review.rating,
          review_text: review.review_text,
          user_name: review.user_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", (existingReview as any).id)
        .eq("user_id", review.user_id)
        .select()
        .single()

      if (error) {
        console.error("Error updating review:", error)
        throw error
      }

      return data
    } else {
      const isVerified = await this.checkVerifiedPurchase(review.product_id, review.user_id)
      
      const { data, error } = await client
        .from("reviews")
        .insert([{
          ...review,
          helpful_count: 0,
          verified_purchase: isVerified
        }])
        .select()
        .single()

      if (error) {
        console.error("Error creating review:", error)
        throw error
      }

      return data
    }
  },

  async deleteReview(reviewId: number, userId: string) {
    const client = getSupabaseClient();
    const { error } = await client
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting review:", error)
      throw error
    }
  },

  async markHelpful(reviewId: number) {
    const client = getSupabaseClient();
    const { error } = await client.rpc("increment_helpful_count", {
      review_id: reviewId
    })

    if (error) {
      const { data: currentReview, error: fetchError } = await client
        .from("reviews")
        .select("helpful_count")
        .eq("id", reviewId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const { error: updateError } = await client
        .from("reviews")
        .update({
          helpful_count: (currentReview as any).helpful_count + 1
        })
        .eq("id", reviewId)

      if (updateError) {
        console.error("Error with fallback helpful update:", updateError)
        throw updateError
      }
    }
  },

  async checkVerifiedPurchase(productId: number, userId: string) {
    try {
      const client = getSupabaseClient();
      const { data: userData, error: userError } = await client
        .from("user_data")
        .select("email")
        .eq("user_id", userId)
        .single()

      if (userError || !userData) {
        return false
      }

      const { data: orders, error: orderError } = await client
        .from("orders")
        .select("items")
        .eq("customer_email", (userData as any).email)
        .eq("status", "delivered")

      if (orderError || !orders) {
        return false
      }

      for (const order of orders as any[]) {
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.product_id === productId) {
              return true
            }
          }
        }
      }

      return false
    } catch (error) {
      console.error("Error checking verified purchase:", error)
      return false
    }
  }
}

// Create client-aware dbUtils
export const dbUtils = {
  async getStats() {
    const client = getSupabaseClient();
    const [products, orders, users] = await Promise.all([
      client.from("products").select("id", { count: "exact", head: true }),
      client.from("orders").select("id", { count: "exact", head: true }),
      client.from("user_data").select("id", { count: "exact", head: true }),
    ])

    return {
      totalProducts: (products as any).count || 0,
      totalOrders: (orders as any).count || 0,
      totalUsers: (users as any).count || 0,
    }
  },
}

// Client-side authentication and verification functions
export const clientAuth = {
  /**
   * Get current authenticated user from Supabase session
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return null
      }
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  /**
   * Get session token for API authentication
   */
  async getSessionToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        return null
      }
      return session.access_token || null
    } catch (error) {
      console.error('Error getting session token:', error)
      return null
    }
  },

  /**
   * Verify that an order belongs to the authenticated user (client-side)
   */
  async verifyOrderOwnership(orderId: string | number, userEmail: string) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('customer_email, id')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        return { success: false, error: 'Order not found' }
      }

      if (order.customer_email !== userEmail) {
        return { success: false, error: 'Unauthorized - Order does not belong to user' }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Order ownership verification error:', error)
      return { success: false, error: 'Verification failed' }
    }
  },

  /**
   * Calculate the actual order total from database prices (client-side)
   * This prevents client-side price manipulation
   */
  async calculateOrderTotal(
    items: Array<{ product_id: number; quantity: number }>,
    shippingAddress: { state: string },
    clientSentShipping?: number
  ) {
    try {
      // Get product IDs
      const productIds = items.map(item => item.product_id)

      if (productIds.length === 0) {
        return {
          success: false,
          error: 'No items in cart'
        }
      }

      // Fetch products from database to get actual prices
      const { data: products, error } = await supabase
        .from('products')
        .select('id, price, in_stock, stock_quantity, name')
        .in('id', productIds)

      if (error || !products) {
        return {
          success: false,
          error: 'Failed to fetch product prices'
        }
      }

      // Calculate total from database prices
      let subtotal = 0
      const itemsWithPrices = []

      for (const item of items) {
        const product = products.find(p => p.id === item.product_id)
        
        if (!product) {
          return {
            success: false,
            error: `Product ${item.product_id} not found`
          }
        }

        if (!product.in_stock) {
          return {
            success: false,
            error: `${product.name || `Product ${item.product_id}`} is out of stock`
          }
        }

        if (product.stock_quantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${product.name || `product ${item.product_id}`}. Available: ${product.stock_quantity}`
          }
        }

        const itemTotal = product.price * item.quantity
        subtotal += itemTotal

        itemsWithPrices.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        })
      }

      // ✅ CALCULATE shipping based on rules (not trusting client)
      let calculatedShipping = 0;
      
      // Free shipping above ₹999
      if (subtotal > 999) {
        calculatedShipping = 0;
      } else {
        // State-based shipping
        const state = shippingAddress.state.toLowerCase().trim();
        if (state === 'tamil nadu' || state === 'tn') {
          calculatedShipping = 50;  // ✅ Fixed: ₹50 for TN
        } else {
          calculatedShipping = 80;  // ₹80 for rest of India
        }
      }

      // ✅ VALIDATE: If client sent shipping charge, verify it matches
      if (clientSentShipping !== undefined && clientSentShipping !== null) {
        const shippingDifference = Math.abs(clientSentShipping - calculatedShipping);
        
        if (shippingDifference > 0.01) {
          console.error('[Security] Shipping charge mismatch!', {
            calculated: calculatedShipping,
            clientSent: clientSentShipping,
            difference: shippingDifference,
            state: shippingAddress.state,
            subtotal
          });
          
          return {
            success: false,
            error: `Shipping charge validation failed. Expected ₹${calculatedShipping}, but got ₹${clientSentShipping}. Please refresh and try again.`
          }
        }
      }

      const calculatedTotal = subtotal + calculatedShipping;

      return {
        success: true,
        subtotal,
        shipping: calculatedShipping,  // ✅ Return calculated shipping (not client-sent)
        total: calculatedTotal,
        items: itemsWithPrices
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate order total'
      }
    }
  },

  /**
   * Check if user is admin (client-side)
   */
  async isAdmin(userId?: string) {
    try {
      const currentUser = userId ? { id: userId } : await this.getCurrentUser()
      if (!currentUser) {
        return false
      }

      const { data, error } = await supabase
        .from("user_data")
        .select("role")
        .eq("user_id", currentUser.id)
        .single()

      if (error) {
        return false
      }

      return data?.role === "admin"
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  },
}

// Log that we're calling a database function
console.log('[Supabase Client] Module loaded');
