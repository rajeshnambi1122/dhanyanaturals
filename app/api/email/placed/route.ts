import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { buildOrderEmailHtml } from "@/lib/utils"
import { authenticateRequest } from "@/lib/auth-middleware"
import { authService } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authenticate the user (customer placing order)
    const { error: authError, user } = await authenticateRequest(request)
    if (authError || !user) {
      return authError || NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      to,
      orderId,
      items = [],
      total,
      customerName,
    } = body || {}

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 })
    }
    if (!to) {
      return NextResponse.json({ ok: false, error: "Missing recipient email" }, { status: 400 })
    }

    // ✅ SECURITY: Ensure user can only send to their own email
    if (to !== user.email) {
      return NextResponse.json({ ok: false, error: "Forbidden - Can only send to your own email" }, { status: 403 })
    }

    const html = buildOrderEmailHtml({
      heading: "Order Placed Successfully",
      intro: `Hi ${customerName || "there"}, your order has been received and is now being processed.`,
      orderId,
      status: "Processing",
      items: items.map((i: any) => ({ name: i.product_name || i.name, qty: i.quantity || i.qty || 1, price: Number(i.price) || 0 })),
      total: Number(total) || undefined,
    })

    await resend.emails.send({
      from: "Dhanya Naturals <orders@dhanyanaturals.in>",
      to,
      subject: `Your order #${orderId} has been placed` ,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ ok: false, error: error?.message || "Failed to send email" }, { status: 500 })
  }
}


