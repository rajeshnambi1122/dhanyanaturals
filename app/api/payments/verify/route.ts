import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/zoho-auth-server'
import { supabase } from '@/lib/supabase'
import { authenticateRequest, verifyOrderOwnership } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authenticate the user
    const { error: authError, user } = await authenticateRequest(request)
    if (authError || !user) {
      return authError
    }

    const body = await request.json()
    const { payment_id, payments_session_id, order_id } = body

    // Log verification request (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Payment verification request:', { 
        payment_id, 
        payments_session_id, 
        order_id,
        user_email: user.email 
      });
    }

    if (!payment_id && !payments_session_id) {
      return NextResponse.json(
        { error: 'Payment ID or Payment Session ID is required' },
        { status: 400 }
      )
    }

    // ✅ SECURITY: Verify order ownership if order_id is provided
    if (order_id && user.email) {
      const ownershipCheck = await verifyOrderOwnership(order_id, user.email)
      
      if (!ownershipCheck.success) {
        console.error('Order ownership verification failed:', ownershipCheck.error)
        return NextResponse.json(
          { error: 'Unauthorized - You do not have permission to verify this order' },
          { status: 403 }
        )
      }
    }

    // Use the centralized Zoho service for payment verification
    const result = await verifyPayment(payment_id, payments_session_id)

    // Check if verification failed
    if (!result.success) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 500 }
      )
    }

    // If no payment data was found
    if (!result.payment) {
      return NextResponse.json(
        { error: 'Payment verification failed - no valid payment data found' },
        { status: 404 }
      )
    }

    // Update order status in database if we have an order_id
    if (order_id) {
      try {
        let orderStatus = 'pending'
        let paymentStatus = result.payment.status

        if (result.is_success) {
          orderStatus = 'confirmed'
          paymentStatus = 'success'
        } else if (result.is_failed) {
          orderStatus = 'cancelled'
          paymentStatus = 'failed'
        }

        // ✅ SECURITY: Update order with ownership verification
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: orderStatus,
            payment_status: paymentStatus,
            payment_id: result.payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id)
          .eq('customer_email', user.email) // ← Ensure user owns this order

        if (updateError) {
          console.error('Failed to update order status:', updateError)
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`Order ${order_id} updated to status: ${orderStatus}`)
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError)
      }
    }

    // Log successful verification (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Payment verification successful:', {
        payment_id: result.payment?.id,
        is_success: result.is_success,
        is_failed: result.is_failed,
        order_updated: order_id ? true : false
      });
    }
    
    // Return payment verification result
    return NextResponse.json({
      success: true,
      payment: result.payment,
      order_updated: order_id ? true : false,
      is_success: result.is_success,
      is_failed: result.is_failed,
      testing_mode: process.env.NODE_ENV === 'development' // Only in development
    })

  } catch (error) {
    // Log detailed error server-side only
    console.error('Payment verification error:', error)
    
    // ✅ SECURITY: Return generic error to client (don't expose internal details)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
