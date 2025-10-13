import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, getZohoAuthUrl } from '@/lib/zoho-auth'

const ZOHO_API_BASE = 'https://payments.zoho.in/api/v1'
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const ZOHO_ACCESS_TOKEN = await getAccessToken()
    
    if (!ZOHO_ACCOUNT_ID) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    if (!ZOHO_ACCESS_TOKEN) {
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

    const payload: any = {
      amount: String(amount),
      currency_code: currency,
      description,
    }

    if (reference_number) payload.reference_number = reference_number
    if (invoice_number) payload.invoice_number = invoice_number
    if (address) payload.address = address

    const response = await fetch(`${ZOHO_API_BASE}/payments/session?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZOHO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    if (!response.ok) {
      console.error('Zoho session error:', response.status, text)
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 502 }
      )
    }

    const data = JSON.parse(text)
    // Expecting { code: 0, payment_sessions: { payments_session_id: '...' } }
    const paymentsSessionId = data?.payment_sessions?.payments_session_id || data?.payments_session_id

    if (!paymentsSessionId) {
      return NextResponse.json(
        { error: 'Invalid session response' },
        { status: 502 }
      )
    }

    return NextResponse.json({ payments_session_id: paymentsSessionId })
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


