import { NextResponse } from 'next/server'
import { sendOrderPlacedEmail } from '@/lib/resend'

export async function POST(req: Request) {
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


