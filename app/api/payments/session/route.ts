import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/zoho'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'INR', 
      description, 
      reference_number, 
      address, 
      invoice_number,
      cart_items,
      shipping_charge = 0
    } = body || {}

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'amount and description are required' },
        { status: 400 }
      )
    }

    // Note: Amount verification should be handled client-side
    // No server-side Supabase price verification

    // Log session creation (development only)
   
    
    // Use the centralized Zoho service for creating payment sessions
    const result = await createPaymentSession(
      amount,
      currency,
      description,
      reference_number,
      address,
      invoice_number
    )
    
    // Check if there was an error
    if ('error' in result) {
      // If authentication is required, return 401
      if (result.authUrl) {
        return NextResponse.json(
          { error: result.error, authUrl: result.authUrl },
          { status: 401 }
        )
      }
      
      // Otherwise return a 502 bad gateway
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      )
    }
    
    // Return the successful result
    return NextResponse.json({
      payments_session_id: result.payments_session_id,
      success: true
    })
  } catch (error) {
    // Log detailed error server-side only
  
    
    // Return generic error to client
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  // ✅ SECURITY: Restrict CORS to specific domain
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dhanyanaturals.in'
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}


