import { NextRequest, NextResponse } from 'next/server'
import { sendOrderPlacedEmail } from '@/lib/resend'
import { requireInternalAuth } from '@/lib/api-auth'

/**
 * Send order placed confirmation email
 * ⚠️ INTERNAL USE ONLY - Requires API key authentication
 */
export async function POST(req: NextRequest) {
  // ✅ SECURITY: Verify internal API key
  const authError = requireInternalAuth(req)
  if (authError) return authError
  
  try {
    const body = await req.json()
    const { to, orderId, customerName, total, items, shippingCharge } = body || {}

    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Missing to' }, { status: 400 })
    }

    await sendOrderPlacedEmail({ to, orderId, customerName, total, items, shippingCharge })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to send order placed email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }}


