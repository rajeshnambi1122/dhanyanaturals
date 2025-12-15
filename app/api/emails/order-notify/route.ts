import { NextRequest, NextResponse } from 'next/server'
import { sendOrderNotifyEmail } from '@/lib/resend'
import { requireInternalAuth } from '@/lib/api-auth'

/**
 * Send order notification email to admin
 * ⚠️ INTERNAL USE ONLY - Requires API key authentication
 */
export async function POST(req: NextRequest) {
  // ✅ SECURITY: Verify internal API key
  const authError = requireInternalAuth(req)
  if (authError) return authError
  
  try {
    const body = await req.json()
    const { orderId, customerName, total, items, shippingCharge } = body || {}

    await sendOrderNotifyEmail({orderId, customerName, total, items, shippingCharge })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to send order notify email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }}

