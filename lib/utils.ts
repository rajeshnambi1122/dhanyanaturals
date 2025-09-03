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
  total?: number
}) {
  const { heading, intro, orderId, status, items = [], total } = params
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#111">${i.name} × ${i.qty}</td><td style="padding:6px 0;text-align:right;color:#111">₹${(i.price * i.qty).toFixed(
          2
        )}</td></tr>`
    )
    .join("")
  const totalHtml =
    typeof total === "number"
      ? `<tr><td style="padding-top:8px;border-top:1px solid #eee;font-weight:600;color:#111">Total</td><td style="padding-top:8px;border-top:1px solid #eee;text-align:right;font-weight:700;color:#0a7e3a">₹${total.toFixed(
          2
        )}</td></tr>`
      : ""

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff">
    <h2 style="margin:0 0 8px;color:#0a7e3a">${heading}</h2>
    <p style="margin:0 0 8px;color:#111">${intro}</p>
    ${orderId ? `<p style=\"margin:0 0 8px;color:#111\">Order #${orderId}${status ? ` • ${status}` : ""}</p>` : ""}
    ${items.length ? `<table style="width:100%;margin-top:8px">${itemsHtml}${totalHtml}</table>` : ""}
    <p style="margin:16px 0 0;color:#555">Thank you for shopping with Dhanya Naturals.</p>
  </div>`
}
