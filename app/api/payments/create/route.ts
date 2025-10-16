import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getZohoAuthUrl } from '@/lib/zoho-auth'

const ZOHO_API_BASE = 'https://payments.zoho.in/api/v1'
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID

export async function POST(request: NextRequest) {
  try {
    console.log('Payment creation request received')
    
    // Get access token from cookies
    const ZOHO_ACCESS_TOKEN = await getAccessToken()
    
    // Check credentials
    if (!ZOHO_ACCESS_TOKEN || !ZOHO_ACCOUNT_ID) {
      console.error('Missing Zoho credentials:', { 
        hasAccessToken: !!ZOHO_ACCESS_TOKEN,
        hasAccountId: !!ZOHO_ACCOUNT_ID
      })
      
      // If no access token, return auth URL for client to redirect
      if (!ZOHO_ACCESS_TOKEN) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            authUrl: getZohoAuthUrl()
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, orderId, customerDetails, returnUrl } = body

    console.log('Payment request data:', { amount, orderId, customerName: customerDetails?.name })

    // Validate required fields
    if (!amount || !orderId || !customerDetails) {
      console.error('Missing required fields:', { amount, orderId, customerDetails })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment link with Zoho
    const paymentData: any = {
      amount: amount, // Amount in rupees (not paise)
      currency: 'INR',
      email: customerDetails.email,
      phone: customerDetails.phone,
      reference_id: orderId,
      description: `Order payment for Dhanya Naturals - Order #${orderId}`,
      notify_user: true,
    }
    
    // Only add return_url if it's provided and valid
    if (returnUrl) {
      paymentData.return_url = returnUrl
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      paymentData.return_url = `${process.env.NEXT_PUBLIC_APP_URL}/checkout`
    }

    // Make API call to Zoho Payments
    const response = await fetch(`${ZOHO_API_BASE}/paymentlinks?account_id=${ZOHO_ACCOUNT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZOHO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Zoho API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestData: paymentData
      })
      return NextResponse.json(
        { 
          error: 'Payment gateway error',
          details: response.status === 401 ? 'Invalid credentials' : 'Service unavailable'
        },
        { status: 500 }
      )
    }

    const paymentResponse = await response.json()

    if (paymentResponse.code === 0 && paymentResponse.payment_links) {
      return NextResponse.json({
        success: true,
        payment_id: paymentResponse.payment_links.payment_link_id,
        payment_url: paymentResponse.payment_links.url,
        order_id: orderId,
      })
    } else {
      console.error('Zoho Payment Link creation failed:', paymentResponse)
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
