import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
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
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shipping_address?: any
  billing_address?: any
  payment_method?: string
  tracking_number?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  product_id: number
  quantity: number
  added_at: string
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

// Database functions
export const productService = {
  // Get all products with optional filtering
  async getProducts(filters?: {
    category?: string
    search?: string
    inStockOnly?: boolean
    sortBy?: string
    featured?: boolean
  }) {
    let query = supabase.from("products").select("*")

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
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

    const { data, error } = await query

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return data || []
  },

  // Get single product by ID
  async getProductById(id: number) {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product:", error)
      return null
    }

    return data
  },

  // Create new product
  async createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase.from("products").insert([product]).select().single()

    if (error) {
      console.error("Error creating product:", error)
      throw error
    }

    return data
  },

  // Update product
  async updateProduct(id: number, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      throw error
    }

    return data
  },

  // Delete product
  async deleteProduct(id: number) {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      throw error
    }

    return true
  },

  // Get featured products
  async getFeaturedProducts(limit = 4) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .eq("in_stock", true)
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    console.log(`Found ${data?.length || 0} featured products`)
    return data || []
  },

  // Get related products
  async getRelatedProducts(productId: number, category: string, limit = 4) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("in_stock", true)
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching related products:", error)
      return []
    }

    return data || []
  },

  // Search products with full-text search
  async searchProducts(searchTerm: string, limit = 20) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .textSearch("name", searchTerm)
      .eq("in_stock", true)
      .order("rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error searching products:", error)
      return []
    }

    return data || []
  },

  // Batch fetch products by IDs (optimized for cart/wishlist operations)
  async getProductsByIds(productIds: number[]) {
    if (productIds.length === 0) return []
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)

    if (error) {
      console.error("Error fetching products by IDs:", error)
      return []
    }

    return data || []
  },
}

export const orderService = {
  // Get all orders
  async getOrders() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    return data || []
  },

  // Get orders by customer email
  async getOrdersByCustomer(email: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customer orders:", error)
      return []
    }

    return data || []
  },

  // 🔒 SECURITY: Validate order prices against database prices
  async validateOrderPrices(order: Omit<Order, "id" | "created_at" | "updated_at">) {
    let serverCalculatedTotal = 0;
    const validatedItems = [];

    // Validate each item's price against database
    for (const item of order.items) {
      // Fetch actual product price from database
      const { data: product, error } = await supabase
        .from("products")
        .select("price")
        .eq("id", item.product_id)
        .single();

      if (error || !product) {
        throw new Error(`Product ${item.product_id} not found or unavailable`);
      }

      // Use server price, not client price
      const serverPrice = product.price;
      const itemTotal = serverPrice * item.quantity;
      
      // Build validated item with server price
      validatedItems.push({
        ...item,
        price: serverPrice,  // ✅ Use server price
        total: itemTotal     // ✅ Calculate server-side
      });

      serverCalculatedTotal += itemTotal;
    }

    // Calculate shipping server-side based on state and order amount
    const calculateShipping = (state: string, orderTotal: number) => {
      if (orderTotal > 999) return 0; // Free shipping above ₹999
      
      // State-based shipping
      if (state.toLowerCase() === 'tamil nadu' || state.toLowerCase() === 'tn') {
        return 50; // ₹50 for Tamil Nadu
      } else {
        return 80; // ₹80 for rest of India
      }
    };

    // Get shipping address state from order
    const shippingState = order.shipping_address?.state || 'Unknown';
    const shipping = calculateShipping(shippingState, serverCalculatedTotal);
    const finalTotal = serverCalculatedTotal + shipping;

    // 🚨 SECURITY CHECK: Compare with client-sent total
    const clientTotal = order.total_amount;
    const tolerance = 0.01; // Allow 1 paisa difference for rounding

    if (Math.abs(finalTotal - clientTotal) > tolerance) {
      console.error(`Price manipulation detected!`, {
        clientTotal,
        serverTotal: finalTotal,
        difference: Math.abs(finalTotal - clientTotal)
      });
      throw new Error("Price mismatch detected. Please refresh and try again.");
    }

    // Return validated order with server-calculated values
    return {
      ...order,
      items: validatedItems,
      total_amount: finalTotal  // ✅ Use server-calculated total
    };
  },

  // Create new order with server-side price validation
  async createOrder(order: Omit<Order, "id" | "created_at" | "updated_at">) {
    // 🔒 SECURITY: Validate prices server-side before creating order
    const validatedOrder = await this.validateOrderPrices(order);
    
    const { data, error } = await supabase.from("orders").insert([validatedOrder]).select().single()

    if (error) {
      console.error("Error creating order:", error)
      throw error
    }

    // Update product stock quantities
    for (const item of order.items) {
      try {
        // Try using the database function first
        const { error: rpcError } = await supabase.rpc("decrement_stock", {
          product_id: item.product_id,
          quantity: item.quantity,
        })
        
        if (rpcError) {
          console.warn("RPC decrement_stock failed, using direct update:", rpcError)
          // Fallback to direct update if RPC function doesn't exist
          await this.decrementStockDirect(item.product_id, item.quantity)
        }
      } catch (error) {
        console.warn("Error with decrement_stock RPC, using fallback:", error)
        // Fallback to direct update
        await this.decrementStockDirect(item.product_id, item.quantity)
      }
    }

    return data
  },

  // Fallback method to decrement stock directly
  async decrementStockDirect(productId: number, quantity: number) {
    // First get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (fetchError) {
      console.error("Error fetching product for stock update:", fetchError)
      return
    }

    // Calculate new stock quantity (don't go below 0)
    const newStockQuantity = Math.max(0, product.stock_quantity - quantity)
    
    // Update stock quantity and status
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newStockQuantity,
        in_stock: newStockQuantity > 0,
        status: newStockQuantity > 0 ? "active" : "out-of-stock",
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)

    if (updateError) {
      console.error("Error updating product stock:", updateError)
    }
  },

  // Update order payment status (for Zoho Payments webhook)
  async updateOrderPaymentStatus(orderId: string, paymentData: {
    payment_method?: string;
    payment_id?: string;
    payment_status?: string;
    failure_reason?: string;
    status?: string;
  }) {
    const updateData: any = {};
    
    if (paymentData.payment_method) {
      updateData.payment_method = paymentData.payment_method;
    }
    
    if (paymentData.payment_id) {
      // Store payment details in notes field
      updateData.notes = `Payment ID: ${paymentData.payment_id}${paymentData.failure_reason ? ` | Failure: ${paymentData.failure_reason}` : ''}`;
    }
    
    if (paymentData.status) {
      updateData.status = paymentData.status;
    }
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order payment status:", error);
      throw new Error("Failed to update order payment status");
    }

    return data;
  },

  // Update order status
  async updateOrderStatus(id: number, status: Order["status"], trackingNumber?: string) {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (trackingNumber) {
      updates.tracking_number = trackingNumber
    }

    const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating order status:", error)
      throw error
    }

    return data
  },

  // Get order statistics
  async getOrderStats() {
    const { data, error } = await supabase
      .from("orders")
      .select("status, total_amount, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) {
      console.error("Error fetching order stats:", error)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
      }
    }

    const stats = data.reduce(
      (acc, order) => {
        acc.totalOrders++
        acc.totalRevenue += order.total_amount
        if (order.status === "pending") acc.pendingOrders++
        if (order.status === "delivered") acc.completedOrders++
        return acc
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
      },
    )

    return stats
  },
}

export const userDataService = {
  // Get user data
  async getUserData(userId: string) {
    const { data, error } = await supabase.from("user_data").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching user data:", error)
      return null
    }

    return data
  },

  // Create or update user data
  async upsertUserData(userData: Omit<UserData, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("user_data")
      .upsert([userData], { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      console.error("Error upserting user data:", error)
      throw new Error(`Failed to upsert user data: ${error.message || 'Unknown error'}`)
    }

    return data
  },

  // Add item to cart
  async addToCart(userId: string, productId: number, quantity: number) {
    const userData = await this.getUserData(userId)
    const cartItems = userData?.cart_items || []

    // Check if item already exists
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

      role: userData?.role || 'customer',
      cart_items: cartItems,
      wishlist_items: userData?.wishlist_items || [],
      preferences: userData?.preferences || {},
    })
  },

  // Remove item from cart
  async removeFromCart(userId: string, productId: number) {
    const userData = await this.getUserData(userId)
    if (!userData) return null

    const cartItems = userData.cart_items.filter((item: CartItem) => item.product_id !== productId)

    return this.upsertUserData({
      user_id: userId,

      role: userData.role,
      cart_items: cartItems,
      wishlist_items: userData.wishlist_items,
      preferences: userData.preferences,
    })
  },

  // Update cart item quantity
  async updateCartQuantity(userId: string, productId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId)
    }

    const userData = await this.getUserData(userId)
    if (!userData) {
      console.log("No user data found, creating new cart entry")
      // Create new user data with the cart item
      const currentUser = await authService.getCurrentUser()
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

    const cartItems = userData.cart_items.map((item: CartItem) =>
      item.product_id === productId ? { ...item, quantity } : item,
    )

    return this.upsertUserData({
      user_id: userId,

      role: userData.role,
      cart_items: cartItems,
      wishlist_items: userData.wishlist_items,
      preferences: userData.preferences,
    })
  },

  // Clear cart
  async clearCart(userId: string) {
    const userData = await this.getUserData(userId)
    if (!userData) return null

    return this.upsertUserData({
      user_id: userId,

      role: userData.role,
      cart_items: [],
      wishlist_items: userData.wishlist_items,
      preferences: userData.preferences,
    })
  },

  // Add to wishlist
  async addToWishlist(userId: string, productId: number) {
    const userData = await this.getUserData(userId)
    const wishlistItems = userData?.wishlist_items || []

    // Check if item already exists
    const exists = wishlistItems.some((item: WishlistItem) => item.product_id === productId)
    if (exists) return userData

    wishlistItems.push({
      product_id: productId,
      added_at: new Date().toISOString(),
    })

    return this.upsertUserData({
      user_id: userId,

      role: userData?.role || 'customer',
      cart_items: userData?.cart_items || [],
      wishlist_items: wishlistItems,
      preferences: userData?.preferences || {},
    })
  },

  // Remove from wishlist
  async removeFromWishlist(userId: string, productId: number) {
    const userData = await this.getUserData(userId)
    if (!userData) return null

    const wishlistItems = userData.wishlist_items.filter((item: WishlistItem) => item.product_id !== productId)

    return this.upsertUserData({
      user_id: userId,

      role: userData.role,
      cart_items: userData.cart_items,
      wishlist_items: wishlistItems,
      preferences: userData.preferences,
    })
  },
}

// Authentication service
export const authService = {
  // Get current user session
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return null
    }
    return user
  },

  // Get user profile with role
  async getUserProfile(userId?: string) {
    const currentUser = userId ? { id: userId } : await this.getCurrentUser()
    if (!currentUser) {
      return null
    }

    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("user_id", currentUser.id)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  // Check if current user is admin
  async isAdmin(userId?: string) {
    const user = await this.getUserProfile(userId)
    return user?.role === "admin"
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  // Sign up new user
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
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

  // Handle OAuth callback and create user profile if needed
  async handleOAuthCallback(user: any) {
    if (!user) {
      console.log("No user provided to handleOAuthCallback")
      return
    }

    console.log("OAuth user data:", {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }) // Debug log

    // Extract name from various OAuth providers
    const extractUserName = (user: any): string => {
      // Try different metadata fields based on OAuth provider
      const metadata = user.user_metadata || {}
      
      // Google OAuth
      if (metadata.full_name) return metadata.full_name
      if (metadata.name) return metadata.name
      
      // GitHub OAuth
      if (metadata.display_name) return metadata.display_name
      if (metadata.user_name) return metadata.user_name
      
      // Facebook OAuth
      if (metadata.first_name && metadata.last_name) {
        return `${metadata.first_name} ${metadata.last_name}`
      }
      
      // Fallback to email username
      if (user.email) {
        return user.email.split('@')[0]
      }
      
      return 'User'
    }

    // Check if user profile exists
    const existingProfile = await this.getUserProfile(user.id)
    
    if (!existingProfile) {
      // Create user profile for OAuth user
      const userName = extractUserName(user)
      console.log(`Creating profile for ${user.id} with name: ${userName}`) // Debug log
      
      await this.createUserProfile(
        user.id,
        userName,
        user.email
      )
    } else {
      // Update existing profile if name or email is missing
      const needsUpdate = !existingProfile.name || !existingProfile.email
      if (needsUpdate) {
        const userName = existingProfile.name || extractUserName(user)
        console.log(`Updating profile for ${user.id} with name: ${userName}`) // Debug log
        
        try {
          await this.updateUserProfile(user.id, {
            name: userName,
            email: existingProfile.email || user.email
          })
        } catch (updateError) {
          console.error("Failed to update user profile, but continuing:", updateError)
          // Don't throw here - OAuth callback should succeed even if profile update fails
        }
      }
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: { name?: string; email?: string; role?: string }) {
    try {
      console.log(`Updating user profile for ${userId} with:`, updates)
      
      // First check if the user record exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("user_data")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError) {
        console.error("Error fetching user for update:", fetchError)
        if (fetchError.code === 'PGRST116') {
          console.log("User record not found, cannot update")
          return null
        }
        throw fetchError
      }

      console.log("Existing user record:", existingUser)

      // Now update the record
      const { data, error } = await supabase
        .from("user_data")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user profile:", error)
        console.error("Update details:", { userId, updates })
        throw error
      }

      console.log("Updated user profile successfully:", data)
      return data
    } catch (error) {
      console.error("Failed to update user profile:", error)
      throw error
    }
  },

  // Create user profile (simplified - role will be set manually in database)
  async createUserProfile(userId: string, name?: string, email?: string) {
    const { data, error } = await supabase
      .from("user_data")
      .insert([
        {
          user_id: userId,
          name: name || null,
          email: email || null,
          role: 'customer', // Default role, admin will be set manually in database
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

  // Check current auth context and permissions
  async checkAuthContext() {
    try {
      const { data: session } = await supabase.auth.getSession()
      console.log("Current session:", session?.session?.user?.id)
      
      // Test database access
      const { data: testData, error: testError } = await supabase
        .from("user_data")
        .select("user_id, name, email")
        .limit(1)

      if (testError) {
        console.error("Database access test failed:", testError)
      } else {
        console.log("Database access test passed:", testData)
      }

      return { session: session?.session, dbAccess: !testError }
    } catch (error) {
      console.error("Auth context check failed:", error)
      return { session: null, dbAccess: false }
    }
  },

  // Fix existing user records that are missing name/email
  async fixExistingUserData() {
    try {
      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error("Error fetching auth users:", authError)
        return
      }

      // Get all user_data records
      const { data: userDataRecords, error: userDataError } = await supabase
        .from("user_data")
        .select("*")

      if (userDataError) {
        console.error("Error fetching user_data:", userDataError)
        return
      }

      // Update records missing name/email
      for (const authUser of authUsers.users) {
        const userDataRecord = userDataRecords?.find(record => record.user_id === authUser.id)
        
        if (userDataRecord && (!userDataRecord.name || !userDataRecord.email)) {
          const updates: any = {}
          
          if (!userDataRecord.name) {
            updates.name = authUser.user_metadata?.full_name || 
                           authUser.user_metadata?.name || 
                           authUser.user_metadata?.display_name ||
                           authUser.email?.split('@')[0] || 
                           "User"
          }
          
          if (!userDataRecord.email) {
            updates.email = authUser.email
          }

          if (Object.keys(updates).length > 0) {
            await this.updateUserProfile(authUser.id, updates)
            console.log(`Updated user ${authUser.id} with:`, updates)
          }
        }
      }
      
      console.log("Finished fixing user data records")
    } catch (error) {
      console.error("Error fixing user data:", error)
    }
  }
}

// Storage service for handling image uploads
export const storageService = {
  // Upload image to Supabase Storage
  async uploadImage(file: File, bucket: string = 'product-images'): Promise<string> {
    try {
      // Preserve original filename (safely sanitized)
      const sanitizeFileName = (name: string): string => {
        const trimmed = name.trim().toLowerCase()
        // Replace unsafe chars, collapse repeats, trim leading dots/spaces
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

      // Upload file to Supabase Storage
      let { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // If file exists, append timestamp to keep name as close as possible
        // Supabase returns 409 conflict when the object already exists
        const isConflict = (error as any)?.statusCode === 409 || /exists/i.test((error as any)?.message || '')
        if (!isConflict) {
          throw new Error(`Upload failed: ${error.message}`)
        }

        fileName = `${safeBase}-${Date.now()}.${safeExt}`
        filePath = `products/${fileName}`
        const retry = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })
        if (retry.error) {
          throw new Error(`Upload failed: ${retry.error.message}`)
        }
        data = retry.data
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },

  // Delete image from Supabase Storage
  async deleteImage(imageUrl: string, bucket: string = 'product-images'): Promise<boolean> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === bucket)
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL format')
      }
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      const { error } = await supabase.storage
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

  // Get image URL from storage
  getImageUrl(filePath: string, bucket: string = 'product-images'): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  },

  // Validate file type and size
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

  // Upload multiple images
  async uploadMultipleImages(files: File[], bucket: string = 'product-images'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, bucket))
    return Promise.all(uploadPromises)
  },

  // Create storage bucket if it doesn't exist
  async createBucketIfNotExists(bucketName: string = 'product-images'): Promise<boolean> {
    try {
      // Assume bucket exists (should be created manually in dashboard)
      return true
    } catch (error) {
      console.error('Error in createBucketIfNotExists:', error)
      return false
    }
  },

  // Check storage setup and provide helpful information
  async checkStorageSetup(): Promise<{ isReady: boolean; message: string }> {
    try {
      // Since we can't list buckets with anon key, we'll assume it's ready
      // The actual test will happen during upload
      return {
        isReady: true,
        message: 'Storage assumed ready (bucket should exist in Supabase dashboard).'
      }
    } catch (error: any) {
      return {
        isReady: false,
        message: `Storage check failed: ${error.message}`
      }
    }
  }
}

// Database utility functions
export const reviewService = {
  // Get reviews for a product
  async getProductReviews(productId: number) {
    const { data, error } = await supabase
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

  // Get user's review for a product
  async getUserReview(productId: number, userId: string) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error fetching user review:", error)
      return null
    }

    return data
  },

  // Create or update a review
  async createOrUpdateReview(review: Omit<Review, "id" | "created_at" | "updated_at" | "helpful_count">) {
    // Check if review already exists
    const existingReview = await this.getUserReview(review.product_id, review.user_id)

    if (existingReview) {
      // Security check: ensure user can only update their own review
      if (existingReview.user_id !== review.user_id) {
        throw new Error("Unauthorized: You can only edit your own reviews")
      }

      // Update existing review with user authorization
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating: review.rating,
          review_text: review.review_text,
          user_name: review.user_name, // Update name in case user changed their profile
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id)
        .eq("user_id", review.user_id) // Double security check
        .select()
        .single()

      if (error) {
        console.error("Error updating review:", error)
        throw error
      }

      return data
    } else {
      // Check if verified purchase
      const isVerified = await this.checkVerifiedPurchase(review.product_id, review.user_id)
      
      // Create new review
      const { data, error } = await supabase
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

  // Delete a review
  async deleteReview(reviewId: number, userId: string) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", userId) // Ensure user can only delete their own review

    if (error) {
      console.error("Error deleting review:", error)
      throw error
    }
  },

  // Mark review as helpful
  async markHelpful(reviewId: number) {
    const { error } = await supabase.rpc("increment_helpful_count", {
      review_id: reviewId
    })

    if (error) {
      console.error("Error marking review as helpful:", error)
      // Fallback to direct update - get current count and increment
      const { data: currentReview, error: fetchError } = await supabase
        .from("reviews")
        .select("helpful_count")
        .eq("id", reviewId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          helpful_count: currentReview.helpful_count + 1
        })
        .eq("id", reviewId)

      if (updateError) {
        console.error("Error with fallback helpful update:", updateError)
        throw updateError
      }
    }
  },

  // Check if user has purchased the product (for verified purchase badge)
  async checkVerifiedPurchase(productId: number, userId: string) {
    try {
      // Get user data to find their orders
      const { data: userData, error: userError } = await supabase
        .from("user_data")
        .select("email")
        .eq("user_id", userId)
        .single()

      if (userError || !userData) {
        return false
      }

      // Check if user has ordered this product
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("items")
        .eq("customer_email", userData.email)
        .eq("status", "delivered")

      if (orderError || !orders) {
        return false
      }

      // Check if any order contains this product
      for (const order of orders) {
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

export const dbUtils = {
  // Create database function to decrement stock
  async createStockFunction() {
    try {
      // Try to create the decrement_stock function using SQL
      const { error } = await supabase.rpc('sql', {
        query: `
          CREATE OR REPLACE FUNCTION decrement_stock(product_id INTEGER, quantity INTEGER)
          RETURNS void AS $$
          BEGIN
              UPDATE products 
              SET stock_quantity = GREATEST(0, stock_quantity - quantity),
                  updated_at = NOW()
              WHERE id = product_id;
          END;
          $$ language 'plpgsql';
        `
      })
      
      if (error) {
        console.warn("Could not create decrement_stock function via RPC:", error)
        console.log("Please run the SQL script: scripts/add-stock-function.sql")
      } else {
        console.log("Successfully created decrement_stock function")
      }
    } catch (error) {
      console.warn("Error creating stock function:", error)
      console.log("Please run the SQL script manually: scripts/add-stock-function.sql")
    }
  },

  // Test if decrement_stock function exists
  async testStockFunction() {
    try {
      const { error } = await supabase.rpc("decrement_stock", {
        product_id: 999999, // Non-existent ID for testing
        quantity: 1
      })
      
      if (error && error.message.includes("function decrement_stock")) {
        console.log("decrement_stock function not found - using fallback method")
        return false
      }
      
      console.log("decrement_stock function is available")
      return true
    } catch (error) {
      console.log("decrement_stock function test failed - using fallback method")
      return false
    }
  },

  // Get database statistics
  async getStats() {
    const [products, orders, users] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("user_data").select("id", { count: "exact", head: true }),
    ])

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalUsers: users.count || 0,
    }
  },
}
