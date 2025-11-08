import { NextResponse } from 'next/server'
import { sendOrderStatusEmail } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, orderId, newStatus, items, total, customerName, trackingNumber } = body || {}

    if (!to || typeof to !== 'string' || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendOrderStatusEmail({ to, orderId, newStatus, items, total, customerName, trackingNumber })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Email failed' }, { status: 500 })
  }
}


