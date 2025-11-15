import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase admin client for server-side operations
// Use server-side environment variables (no NEXT_PUBLIC_ prefix)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface ZohoWebhookPayload {
  event_type: string
  payment_id: string
  payments_session_id: string
  status: string
  amount: number
  currency: string
  reference_number?: string
  customer_email?: string
  customer_name?: string
  timestamp: string
  signature?: string
}

/**
 * Verify webhook signature to ensure request is from Zoho
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.ZOHO_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('❌ ZOHO_WEBHOOK_SECRET not configured - cannot verify signature')
      return false // Reject if secret not set
    }

    // Create HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Find pending order by payment session ID or reference number
 */
async function findPendingOrder(
  paymentsSessionId: string,
  referenceNumber?: string
): Promise<any | null> {
  try {
    console.log('🔍 Searching for order with payment_session_id:', paymentsSessionId)
    
    // First try to find by payment_session_id (try both as string and as-is)
    let { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_session_id', paymentsSessionId)
      .in('status', ['pending', 'payment_initiated'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.log('⚠️ Error querying with payment_session_id:', error.message)
      console.log('⚠️ Error details:', error)
    }

    if (order) {
      console.log('✅ Found order:', order.id, 'with status:', order.status)
      console.log('📋 Order fields:', Object.keys(order))
      console.log('📦 Raw items value:', order.items)
      console.log('📦 Items type:', typeof order.items)
      return order
    }

    // Try without status filter to see if order exists at all
    console.log('🔍 Trying to find order without status filter...')
    const { data: orderAnyStatus, error: error2 } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_session_id', paymentsSessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (orderAnyStatus) {
      console.log('⚠️ Order found but with status:', orderAnyStatus.status)
      console.log('⚠️ Order details:', {
        id: orderAnyStatus.id,
        status: orderAnyStatus.status,
        payment_status: orderAnyStatus.payment_status,
        payment_session_id: orderAnyStatus.payment_session_id
      })
      
      // Return it anyway if payment_status is pending
      if (orderAnyStatus.payment_status === 'pending') {
        console.log('✅ Returning order based on payment_status=pending')
        return orderAnyStatus
      }
    }

    // If not found and we have a reference number, try that
    if (referenceNumber) {
      console.log('🔍 Trying reference_number:', referenceNumber)
      const result = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('reference_number', referenceNumber)
        .in('status', ['pending', 'payment_initiated'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (result.data) {
        console.log('✅ Found order by reference_number:', result.data.id)
        return result.data
      }
    }

    console.log('❌ No order found with payment_session_id:', paymentsSessionId)
    return null
  } catch (error) {
    console.error('Error finding pending order:', error)
    return null
  }
}

/**
 * Update order status after payment verification
 */
async function updateOrderAfterPayment(
  orderId: number,
  paymentData: {
    payment_id: string
    payments_session_id: string
    status: string
    amount: number
  },
  isSuccess: boolean
): Promise<boolean> {
  try {
    const updateData: any = {
      payment_id: paymentData.payment_id,
      payment_session_id: paymentData.payments_session_id,
      payment_status: isSuccess ? 'success' : 'failed',
      status: isSuccess ? 'confirmed' : 'cancelled',
      updated_at: new Date().toISOString()
    }

    // Add webhook confirmation note
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('notes')
      .eq('id', orderId)
      .single()

    const existingNotes = existingOrder?.notes || ''
    updateData.notes = existingNotes + 
      ` [Payment ${isSuccess ? 'confirmed' : 'failed'} via webhook at ${new Date().toISOString()}]`

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update order:', error)
      return false
    }

    console.log(`✅ Order ${orderId} updated successfully via webhook`)
    return true
  } catch (error) {
    console.error('Error updating order:', error)
    return false
  }
}

/**
 * Log webhook event for debugging and audit trail
 */
async function logWebhookEvent(
  eventType: string,
  paymentId: string,
  status: string,
  orderId: number | null,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabaseAdmin.from('webhook_logs').insert({
      event_type: eventType,
      payment_id: paymentId,
      status: status,
      order_id: orderId,
      success: success,
      error_message: errorMessage,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Don't fail the webhook if logging fails
    console.error('Failed to log webhook event:', error)
  }
}

/**
 * Check if this webhook event was already processed (idempotency)
 */
async function isWebhookAlreadyProcessed(
  paymentId: string,
  eventType: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('id')
      .eq('payment_id', paymentId)
      .eq('event_type', eventType)
      .eq('success', true)
      .limit(1)

    return !error && data && data.length > 0
  } catch (error) {
    console.error('Error checking webhook idempotency:', error)
    return false
  }
}

/**
 * Send email notification for confirmed order
 */
async function sendOrderConfirmationEmail(order: any) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    
    if (!appUrl) {
      console.warn('⚠️ NEXT_PUBLIC_APP_URL not set - skipping email notification')
      return
    }

    const emailUrl = `${appUrl}/api/emails/order-placed`
    
    console.log('📧 Sending order confirmation email...')
    console.log('Email API URL:', emailUrl)
    console.log('📋 Full order object keys:', Object.keys(order))
    console.log('Order data:', {
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      hasItems: !!order.items,
      itemsType: typeof order.items,
      itemsValue: order.items
    })

    // Validate we have customer email
    if (!order.customer_email) {
      console.warn('⚠️ Order has no customer_email - skipping email notification')
      return
    }

    // Parse items from JSONB if needed
    let orderItems = order.items
    if (typeof orderItems === 'string') {
      try {
        orderItems = JSON.parse(orderItems)
      } catch (e) {
        console.error('Failed to parse order items:', e)
        orderItems = []
      }
    }

    // Ensure items is an array
    if (!Array.isArray(orderItems)) {
      orderItems = []
    }

    // Transform items to match email API format
    // Database has: { product_name, quantity, price }
    // Email API expects: { name, qty, price }
    const emailItems = orderItems.map((item: any) => ({
      name: item.product_name || item.name || 'Unknown Product',
      qty: item.quantity || item.qty || 1,
      price: item.price || 0
    }))

    console.log('📦 Order items:', orderItems.length, 'items')
    console.log('📧 Email items formatted:', emailItems)

    // Call the email API endpoint
    const emailResponse = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to: order.customer_email,
        orderId: order.id,
        customerName: order.customer_name,
        total: order.total_amount,
        items: emailItems  // Use transformed items
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Failed to send order confirmation email:', emailResponse.status, errorText)
    } else {
      console.log('✅ Order confirmation email sent successfully')
    }
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error instanceof Error ? error.message : error)
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Zoho Payment Webhook received')

  try {
    // Parse request body
    const rawBody = await request.text()
    let webhookData: ZohoWebhookPayload

    try {
      webhookData = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    console.log('Webhook payload:', {
      event_type: webhookData.event_type,
      payment_id: webhookData.payment_id,
      status: webhookData.status,
      amount: webhookData.amount
    })

    // Verify webhook signature (mandatory)
    const signature = request.headers.get('x-zoho-signature')
    if (!signature) {
      console.error('❌ Missing x-zoho-signature header')
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      )
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('❌ Webhook signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Check idempotency - prevent duplicate processing
    if (await isWebhookAlreadyProcessed(webhookData.payment_id, webhookData.event_type)) {
      console.log('⚠️ Webhook already processed - skipping')
      await logWebhookEvent(
        webhookData.event_type,
        webhookData.payment_id,
        webhookData.status,
        null,
        true,
        'Already processed (idempotent)'
      )
      return NextResponse.json({ 
        success: true, 
        message: 'Already processed' 
      })
    }

    // Only process payment success/failure events
    const relevantEvents = ['payment.succeeded', 'payment.authorized', 'payment.captured']
    if (!relevantEvents.includes(webhookData.event_type)) {
      console.log(`⚠️ Ignoring event type: ${webhookData.event_type}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Event ignored' 
      })
    }

    // Find the pending order
    const order = await findPendingOrder(
      webhookData.payments_session_id,
      webhookData.reference_number
    )

    if (!order) {
      console.error('❌ No pending order found for payment session:', webhookData.payments_session_id)
      await logWebhookEvent(
        webhookData.event_type,
        webhookData.payment_id,
        webhookData.status,
        null,
        false,
        'Order not found'
      )
      return NextResponse.json(
        { error: 'The Order Not Found' },
        { status: 400 }
      )
    }

    console.log(`📦 Found pending order: ${order.id}`)

    // Check if order is already confirmed (race condition with client-side update)
    if (order.status === 'confirmed' && order.payment_status === 'success') {
      console.log('⚠️ Order already confirmed - skipping update')
      await logWebhookEvent(
        webhookData.event_type,
        webhookData.payment_id,
        webhookData.status,
        order.id,
        true,
        'Already confirmed'
      )
      return NextResponse.json({ 
        success: true, 
        message: 'Order already confirmed' 
      })
    }

    // Determine if payment was successful
    const successStatuses = ['success', 'authorized', 'captured', 'paid']
    const isSuccess = successStatuses.some(s => 
      webhookData.status.toLowerCase().includes(s)
    )

    // Update the order
    const updateSuccess = await updateOrderAfterPayment(
      order.id,
      {
        payment_id: webhookData.payment_id,
        payments_session_id: webhookData.payments_session_id,
        status: webhookData.status,
        amount: webhookData.amount
      },
      isSuccess
    )

    if (!updateSuccess) {
      console.error('❌ Failed to update order')
      await logWebhookEvent(
        webhookData.event_type,
        webhookData.payment_id,
        webhookData.status,
        order.id,
        false,
        'Order update failed'
      )
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Log successful webhook processing
    await logWebhookEvent(
      webhookData.event_type,
      webhookData.payment_id,
      webhookData.status,
      order.id,
      true
    )

    // Send confirmation email if payment was successful
    if (isSuccess) {
      // Don't await - send email asynchronously
      sendOrderConfirmationEmail(order).catch(err => 
        console.error('Email sending failed:', err)
      )
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ 
      success: true,
      order_id: order.id,
      status: isSuccess ? 'confirmed' : 'cancelled'
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook health check
export async function GET() {
  const healthStatus: any = {
    status: 'healthy',
    endpoint: 'zoho-payment-webhook',
    timestamp: new Date().toISOString(),
    checks: {
      environment: {
        has_supabase_url: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_webhook_secret: !!process.env.ZOHO_WEBHOOK_SECRET,
        has_app_url: !!process.env.NEXT_PUBLIC_APP_URL
      }
    }
  }

  // Test Supabase connection
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1)

    if (error) {
      healthStatus.status = 'degraded'
      healthStatus.checks.database = {
        connected: false,
        error: error.message
      }
    } else {
      healthStatus.checks.database = {
        connected: true,
        message: 'Database connection successful'
      }
    }
  } catch (dbError) {
    healthStatus.status = 'unhealthy'
    healthStatus.checks.database = {
      connected: false,
      error: dbError instanceof Error ? dbError.message : 'Unknown database error'
    }
  }

  // Test webhook_logs table exists
  try {
    const { error: logsError } = await supabaseAdmin
      .from('webhook_logs')
      .select('id')
      .limit(1)

    if (logsError) {
      healthStatus.checks.webhook_logs_table = {
        exists: false,
        error: logsError.message,
        hint: 'Run migration: supabase/migrations/20240114_add_webhook_logs.sql'
      }
    } else {
      healthStatus.checks.webhook_logs_table = {
        exists: true,
        message: 'Webhook logs table ready'
      }
    }
  } catch (error) {
    healthStatus.checks.webhook_logs_table = {
      exists: false,
      error: 'Failed to check webhook_logs table'
    }
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503
  return NextResponse.json(healthStatus, { status: statusCode })
}

