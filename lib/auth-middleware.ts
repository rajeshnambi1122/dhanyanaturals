import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Authentication middleware for API routes
 * Verifies the user's session and returns the authenticated user
 */
export async function authenticateRequest(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized - Missing or invalid authorization header' },
          { status: 401 }
        ),
        user: null
      }
    }

    // Extract the token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        ),
        user: null
      }
    }

    // Return the authenticated user
    return {
      error: null,
      user: user
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
      user: null
    }
  }
}

/**
 * Verify that an order belongs to the authenticated user
 */
export async function verifyOrderOwnership(orderId: string, userEmail: string) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('customer_email')
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
}

/**
 * Calculate the actual order total from database prices
 * This prevents client-side price manipulation
 */
export async function calculateOrderTotal(
  items: Array<{ product_id: number; quantity: number }>,
  shippingCharge: number = 0
) {
  try {
    // Get product IDs
    const productIds = items.map(item => item.product_id)

    // Fetch products from database to get actual prices
    const { data: products, error } = await supabase
      .from('products')
      .select('id, price, in_stock, stock_quantity')
      .in('id', productIds)

    if (error || !products) {
      throw new Error('Failed to fetch product prices')
    }

    // Calculate total from database prices
    let subtotal = 0
    const itemsWithPrices = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`)
      }

      if (!product.in_stock) {
        throw new Error(`Product ${item.product_id} is out of stock`)
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`)
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

    return {
      success: true,
      subtotal,
      shipping: shippingCharge,
      total: subtotal + shippingCharge,
      items: itemsWithPrices
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate order total'
    }
  }
}

