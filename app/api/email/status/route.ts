import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { buildOrderEmailHtml } from "@/lib/utils"
import { authenticateRequest } from "@/lib/auth-middleware"
import { authService } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Authenticate the user
    const { error: authError, user } = await authenticateRequest(request)
    if (authError || !user) {
      return authError || NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    // ✅ SECURITY: Check admin role
    const userProfile = await authService.getUserProfile(user.id)
    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden - Admin access required" }, { status: 403 })
    }
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
      from: "Dhanya Naturals <orders@dhanyanaturals.in>",
      to,
      subject: `Order #${orderId} is ${newStatus}` ,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ ok: false, error: error?.message || "Failed to send email" }, { status: 500 })
  }
}


