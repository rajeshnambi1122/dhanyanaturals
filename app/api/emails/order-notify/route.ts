import { NextResponse } from 'next/server'
import { sendOrderNotifyEmail } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, customerName, total, items, shippingCharge } = body || {}

    await sendOrderNotifyEmail({orderId, customerName, total, items, shippingCharge })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Failed to send order placed email:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }}

