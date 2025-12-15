import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusEmail } from '@/lib/resend'
import { requireInternalAuth } from '@/lib/api-auth'

/**
 * Send order status update email
 * ⚠️ INTERNAL USE ONLY - Requires API key authentication
 */
export async function POST(req: NextRequest) {
  // ✅ SECURITY: Verify internal API key
  const authError = requireInternalAuth(req)
  if (authError) return authError
  
  try {
    const body = await req.json()
    const { to, orderId, newStatus, items, total, customerName, trackingNumber, shippingCharge } = body || {}

    if (!to || typeof to !== 'string' || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendOrderStatusEmail({ to, orderId, newStatus, items, total, customerName, trackingNumber, shippingCharge })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Email failed' }, { status: 500 })
  }
}


