import { NextRequest, NextResponse } from 'next/server'

const ZOHO_API_BASE = 'https://payments.zoho.in/api/v1'
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID
const ZOHO_API_KEY = process.env.ZOHO_API_KEY

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

    if (!ZOHO_ACCOUNT_ID || !ZOHO_API_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Verify payment status with Zoho (API key auth)
    const response = await fetch(`${ZOHO_API_BASE}/payments/${payment_id}?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': ZOHO_API_KEY,
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

    // Zoho Payments returns amounts in the base currency unit (e.g., rupees)
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentData.payment_id,
        status: paymentData.status,
        amount: paymentData.amount,
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
