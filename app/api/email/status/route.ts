import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildOrderEmailHtml } from "@/lib/utils"

const resend = new Resend(process.env.RESEND_API_KEY || "")

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, orderId, newStatus, items = [], total, customerName, trackingNumber } = body || {}

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 })
    }
    if (!to || !newStatus) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    const intro = `Hi ${customerName || "there"}, your order ${orderId ? `#${orderId} ` : ""}status is now ${newStatus}.` +
      (trackingNumber ? ` Tracking number: ${trackingNumber}.` : "")

    const html = buildOrderEmailHtml({
      heading: "Order Status Update",
      intro,
      orderId,
      status: newStatus,
      items: items.map((i: any) => ({ name: i.product_name || i.name, qty: i.quantity || i.qty || 1, price: Number(i.price) || 0 })),
      total: Number(total) || undefined,
    })

    await resend.emails.send({
      from: "Dhanya Naturals <notifications@dhanyanaturals.dev>",
      to,
      subject: `Order #${orderId} is ${newStatus}` ,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to send" }, { status: 500 })
  }
}


