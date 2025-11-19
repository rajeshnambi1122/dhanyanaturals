import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Email helper for building simple order emails
export function buildOrderEmailHtml(params: {
  heading: string
  intro: string
  orderId?: number | string
  status?: string
  items?: Array<{ name: string; qty: number; price: number }>
  shippingCharge?: number
  total?: number
}) {
  const { heading, intro, orderId, status, items = [], shippingCharge, total } = params
  
  // Get base URL for logo
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const logoUrl = `${baseUrl}/logo.png`;
  
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#111">${i.name} × ${i.qty}</td><td style="padding:6px 0;text-align:right;color:#111">₹${(i.price * i.qty).toFixed(
          2
        )}</td></tr>`
    )
    .join("")
  
  // Calculate subtotal if we have shipping charge
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  
  const shippingHtml =
    typeof shippingCharge === "number"
      ? `<tr><td style="padding:6px 0;color:#111">Shipping Charge</td><td style="padding:6px 0;text-align:right;color:#111">₹${shippingCharge.toFixed(2)}</td></tr>`
      : ""
  
  const totalHtml =
    typeof total === "number"
      ? `<tr><td style="padding-top:8px;border-top:1px solid #eee;font-weight:600;color:#111">Total</td><td style="padding-top:8px;border-top:1px solid #eee;text-align:right;font-weight:700;color:#0a7e3a">₹${total.toFixed(
          2
        )}</td></tr>`
      : ""

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#ffffff">
    <!-- Header with Logo -->
    <div style="background:linear-gradient(135deg, #0a7e3a 0%, #0d9944 100%);padding:24px;text-align:center;border-radius:8px 8px 0 0">
      <img src="${logoUrl}" alt="Dhanya Naturals" style="height:60px;width:auto;margin:0 auto;display:block" />
      <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:600">Dhanya Naturals</h1>
      <p style="margin:4px 0 0;color:#e0f2e9;font-size:14px">Pure & Natural Products</p>
    </div>
    
    <!-- Content -->
    <div style="padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#0a7e3a;font-size:22px">${heading}</h2>
      <p style="margin:0 0 16px;color:#111;font-size:16px;line-height:1.5">${intro}</p>
      ${orderId ? `<div style="background:#f8f9fa;padding:12px 16px;border-radius:6px;margin-bottom:16px"><p style="margin:0;color:#111;font-size:14px"><strong>Order #${orderId}</strong>${status ? ` • <span style="color:#0a7e3a">${status}</span>` : ""}</p></div>` : ""}
      
      ${items.length ? `
      <div style="margin-top:24px">
        <h3 style="margin:0 0 12px;color:#111;font-size:16px;font-weight:600">Order Items</h3>
        <table style="width:100%;border-collapse:collapse">
          ${itemsHtml}
          ${shippingHtml}
          ${totalHtml}
        </table>
      </div>` : ""}
      
      <div style="margin-top:32px;padding-top:24px;border-top:2px solid #e0f2e9">
        <p style="margin:0 0 8px;color:#555;font-size:14px">Thank you for choosing Dhanya Naturals! 🌿</p>
        <p style="margin:0;color:#777;font-size:13px">For any questions, contact us at <a href="mailto:dhanyanaturals01@gmail.com" style="color:#0a7e3a;text-decoration:none">dhanyanaturals01@gmail.com</a></p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8f9fa;padding:16px 24px;text-align:center;border-radius:0 0 8px 8px">
      <p style="margin:0;color:#777;font-size:12px">© ${new Date().getFullYear()} Dhanya Naturals. All rights reserved.</p>
    </div>
  </div>`
}
