import { NextRequest, NextResponse } from 'next/server'

const ZOHO_API_BASE = 'https://payment.zoho.in/api/v1'
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id } = body

    if (!payment_id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Verify payment status with Zoho
    const response = await fetch(`${ZOHO_API_BASE}/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOHO_CLIENT_ID}:${ZOHO_CLIENT_SECRET}`).toString('base64')}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Zoho verify API Error:', errorData)
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 500 }
      )
    }

    const paymentData = await response.json()

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentData.payment_id,
        status: paymentData.status,
        amount: paymentData.amount / 100, // Convert from paise to rupees
        order_id: paymentData.order_id,
        created_at: paymentData.created_at,
        payment_method: paymentData.payment_method,
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
