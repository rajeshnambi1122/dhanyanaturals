import { Resend } from "resend";
import { buildOrderEmailHtml } from "@/lib/utils";

function getResend() {
  if (typeof window !== "undefined") {
    throw new Error("Email sending must run on the server (not in the browser)");
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY – set it in your server env");
  }
  return new Resend(key);
}

export async function sendOrderPlacedEmail(params: {
  to: string;
  orderId?: number | string;
  items?: Array<{ name: string; qty: number; price: number }>;
  total?: number;
  customerName?: string;
}) {
  const html = buildOrderEmailHtml({
    heading: "Order Placed Successfully",
    intro: `Hi ${params.customerName || "there"}, your order has been received and is now being processed.`,
    orderId: params.orderId,
    status: "Processing",
    items: (params.items || []).map((i) => ({
      name: i.name,
      qty: i.qty,
      price: Number(i.price) || 0,
    })),
    total: params.total !== undefined ? Number(params.total) : undefined,
  });

  const resend = getResend();
  await resend.emails.send({
    from: "Dhanya Naturals <orders@dhanyanaturals.in>",
    to: params.to,
    subject: `Your order #${params.orderId ?? ""} has been placed`,
    html,
  });

  return { ok: true };
}

export async function sendOrderStatusEmail(params: {
  to: string;
  orderId?: number | string;
  newStatus: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  total?: number;
  customerName?: string;
  trackingNumber?: string;
}) {
  const intro = `Hi ${params.customerName || "there"}, your order ${
    params.orderId ? `#${params.orderId} ` : ""
  }status is now ${params.newStatus}.` + (params.trackingNumber ? ` Tracking number: ${params.trackingNumber}.` : "");

  const html = buildOrderEmailHtml({
    heading: "Order Status Update",
    intro,
    orderId: params.orderId,
    status: params.newStatus,
    items: (params.items || []).map((i) => ({
      name: i.name,
      qty: i.qty,
      price: Number(i.price) || 0,
    })),
    total: params.total !== undefined ? Number(params.total) : undefined,
  });

  const resend = getResend();
  await resend.emails.send({
    from: "Dhanya Naturals <orders@dhanyanaturals.in>",
    to: params.to,
    subject: `Order #${params.orderId ?? ""} is ${params.newStatus}`,
    html,
  });

  return { ok: true };
}
