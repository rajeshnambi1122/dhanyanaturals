import { NextRequest, NextResponse } from 'next/server'

const ZOHO_API_BASE = 'https://payment.zoho.in/api/v1'
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, customerDetails, returnUrl } = body

    // Validate required fields
    if (!amount || !orderId || !customerDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment with Zoho
    const paymentData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      order_id: orderId,
      customer: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      description: `Order payment for Dhanya Naturals - Order #${orderId}`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      payment_methods: ['card', 'upi', 'netbanking', 'wallet'],
    }

    // Make API call to Zoho Payments
    const response = await fetch(`${ZOHO_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${ZOHO_CLIENT_ID}:${ZOHO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Zoho API Error:', errorData)
      return NextResponse.json(
        { error: 'Payment gateway error' },
        { status: 500 }
      )
    }

    const paymentResponse = await response.json()

    return NextResponse.json({
      success: true,
      payment_id: paymentResponse.payment_id,
      payment_url: paymentResponse.payment_url,
      order_id: orderId,
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
