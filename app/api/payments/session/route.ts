import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getZohoAuthUrl } from '@/lib/zoho-auth'

const ZOHO_API_BASE = 'https://payments.zoho.in/api/v1'
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID
const ZOHO_API_KEY = process.env.ZOHO_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check if Zoho Payments is properly configured
    if (!ZOHO_ACCOUNT_ID) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Get access token from OAuth
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          authUrl: getZohoAuthUrl()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, currency = 'INR', description, reference_number, address, invoice_number } = body || {}

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'amount and description are required' },
        { status: 400 }
      )
    }

    // Use currency_code if provided, otherwise use currency
    // Temporarily try USD to test if it's a currency-specific issue
    // const finalCurrency = currency_code || currency;
    
    // Test with USD instead of INR to see if it's a currency configuration issue
    const finalCurrency = 'INR';

    // Correct payload format according to Zoho API docs
    const payload: any = {
      amount: parseFloat(amount), // Should be a number, not string
      currency: finalCurrency, // Should be 'currency', not 'currency_code'
      description,
    }

    // Add optional fields according to API docs
    if (reference_number) {
      payload.reference_number = reference_number;
    }
    
    if (invoice_number) {
      payload.invoice_number = invoice_number;
    }

    console.log('Creating payment session with payload:', payload)
    console.log('API URL:', `${ZOHO_API_BASE}/paymentsessions?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`)
    console.log('Access Token:', accessToken ? 'Set' : 'Not set')
    console.log('Account ID:', ZOHO_ACCOUNT_ID)
    console.log('Access Token first 10 chars:', accessToken ? accessToken.substring(0, 10) + '...' : 'Not set')
    
    // Use OAuth Bearer token for authentication with correct endpoint
    const response = await fetch(`${ZOHO_API_BASE}/paymentsessions?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    console.log('Zoho session response:', response.status, text)
    
    if (!response.ok) {
      console.error('Zoho session error:', response.status, text)
      return NextResponse.json(
        { error: 'Failed to create payment session', details: text },
        { status: 502 }
      )
    }

    const data = JSON.parse(text)
    console.log('Parsed response data:', data)
    
    // Payment sessions API returns payments_session format
    if (data.code === 0 && data.payments_session) {
      const sessionId = data.payments_session.payments_session_id;
      
      return NextResponse.json({ 
        payments_session_id: sessionId,
        success: true
      })
    } else {
      console.error('Invalid session response:', data)
      return NextResponse.json(
        { error: 'Invalid session response', details: data },
        { status: 502 }
      )
    }
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


