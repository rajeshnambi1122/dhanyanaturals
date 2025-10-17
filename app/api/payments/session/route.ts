import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/zoho-auth-server'
import { authenticateRequest, calculateOrderTotal } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authenticate the user
    const { error: authError, user } = await authenticateRequest(request)
    if (authError || !user) {
      return authError
    }

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

    // ✅ SECURITY: Verify amount server-side to prevent price manipulation
    if (cart_items && Array.isArray(cart_items)) {
      const verification = await calculateOrderTotal(cart_items, shipping_charge)
      
      if (!verification.success) {
        return NextResponse.json(
          { error: verification.error || 'Failed to verify order amount' },
          { status: 400 }
        )
      }

      // Check if client-sent amount matches server-calculated amount
      const expectedAmount = verification.total || 0
      const clientAmount = parseFloat(amount)

      if (Math.abs(expectedAmount - clientAmount) > 0.01) { // Allow 1 paisa difference for rounding
        console.error('Amount mismatch detected:', {
          client_amount: clientAmount,
          server_calculated: expectedAmount,
          difference: Math.abs(expectedAmount - clientAmount)
        })
        
        return NextResponse.json(
          { error: 'Amount verification failed. Price mismatch detected.' },
          { status: 400 }
        )
      }

      // Log successful verification (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Amount verified successfully:', {
          amount: expectedAmount,
          user_email: user.email
        })
      }
    }

    // Log session creation (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating payment session:', {
        amount,
        currency,
        description,
        reference_number,
        user_email: user.email
      })
    }
    
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
    console.error('Session creation error:', error)
    
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


