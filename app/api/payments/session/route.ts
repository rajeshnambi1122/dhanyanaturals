import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/zoho-auth-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR', description, reference_number, address, invoice_number } = body || {}

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'amount and description are required' },
        { status: 400 }
      )
    }

    console.log('Creating payment session with payload:', {
      amount,
      currency,
      description,
      reference_number
    })
    
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
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}


