import { NextResponse } from 'next/server'
import { sendOrderPlacedEmail } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, orderId, customerName, total, items } = body || {}

    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Missing to' }, { status: 400 })
    }

    await sendOrderPlacedEmail({ to, orderId, customerName, total, items })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Email failed' }, { status: 500 })
  }
}


