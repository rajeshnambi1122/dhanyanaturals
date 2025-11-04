import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/zoho'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, payments_session_id, order_id } = body

    // Log verification request (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Payment verification request:', { 
        payment_id, 
        payments_session_id, 
        order_id,
      });
    }

    if (!payment_id && !payments_session_id) {
      return NextResponse.json(
        { error: 'Payment ID or Payment Session ID is required' },
        { status: 400 }
      )
    }

    // Note: Order ownership verification should be handled client-side
    // Use clientAuth.verifyOrderOwnership() before calling this API

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

    // Note: Order status updates should be handled client-side
    // No server-side Supabase operations

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
