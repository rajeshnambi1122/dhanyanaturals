import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/zoho-auth-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, payments_session_id, order_id } = body

    console.log('Payment verification request:', { payment_id, payments_session_id, order_id });

    if (!payment_id && !payments_session_id) {
      console.error('Missing payment identifiers in verification request');
      return NextResponse.json(
        { error: 'Payment ID or Payment Session ID is required' },
        { status: 400 }
      )
    }

    // Use the centralized Zoho service for payment verification
    const result = await verifyPayment(payment_id, payments_session_id)

    // Check if verification failed
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment verification failed' },
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

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: orderStatus,
            payment_status: paymentStatus,
            payment_id: result.payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id)

        if (updateError) {
          console.error('Failed to update order status:', updateError)
        } else {
          console.log(`Order ${order_id} updated to status: ${orderStatus}`)
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError)
      }
    }

    // Log successful verification
    console.log('Payment verification successful:', {
      payment_id: result.payment?.id,
      is_success: result.is_success,
      is_failed: result.is_failed,
      order_updated: order_id ? true : false
    });
    
    // Return payment verification result
    return NextResponse.json({
      success: true,
      payment: result.payment,
      order_updated: order_id ? true : false,
      is_success: result.is_success,
      is_failed: result.is_failed,
      testing_mode: true // Indicate that we're in testing mode
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
