import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/lib/supabase'

const ZOHO_WEBHOOK_SECRET = process.env.ZOHO_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-zoho-signature')
    if (ZOHO_WEBHOOK_SECRET && signature) {
      // Implement signature verification if needed
      // This is optional based on your Zoho Payments setup
    }

    const { event_type, payment } = body

    console.log('Zoho webhook received:', { event_type, payment_id: payment?.payment_id })

    if (event_type === 'payment.completed') {
      // Payment was successful
      const { payment_id, order_id, amount, status } = payment

      try {
        // Update order status in database
        await orderService.updateOrderPaymentStatus(order_id, {
          payment_method: 'Zoho Online Payment',
          payment_id: payment_id,
          payment_status: status,
          status: status === 'completed' ? 'processing' : 'pending'
        })

        console.log(`Order ${order_id} payment completed: ${payment_id}`)

        // Send confirmation email (optional)
        // You can trigger email notification here

      } catch (error) {
        console.error('Error updating order status:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

    } else if (event_type === 'payment.failed') {
      // Payment failed
      const { payment_id, order_id, failure_reason } = payment

      try {
        await orderService.updateOrderPaymentStatus(order_id, {
          payment_method: 'Zoho Online Payment',
          payment_id: payment_id,
          payment_status: 'failed',
          failure_reason: failure_reason,
          status: 'cancelled'
        })

        console.log(`Order ${order_id} payment failed: ${payment_id}`)

      } catch (error) {
        console.error('Error updating failed payment:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-zoho-signature',
    },
  })
}
