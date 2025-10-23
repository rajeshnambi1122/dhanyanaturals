// Zoho API constants
const ZOHO_AUTH_URL = 'https://accounts.zoho.in/oauth/v2/auth';
const ZOHO_API_KEY = process.env.NEXT_PUBLIC_ZOHO_API_KEY;
const ZOHO_ACCOUNT_ID = process.env.NEXT_PUBLIC_ZOHO_ACCOUNT_ID;

/**
 * Get the authorization URL for Zoho OAuth (client-side version)
 */
export function getZohoAuthUrl(): string {
  // Get the base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID || '',
    scope: 'ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE',
    redirect_uri: `${baseUrl}/api/auth/zoho/callback`,
    access_type: 'offline', // To get refresh token
    prompt: 'consent', // Force consent to get refresh token
  });
  
  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Client-side helper for initializing Zoho Payment Widget
 * Note: This must be used in a client component
 */
export async function initializeZohoPaymentWidget(
  amount: number,
  currency: string = 'INR',
  description: string,
  referenceNumber: string,
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  },
  authToken?: string,
  cartItems?: Array<{ product_id: number; quantity: number }>,
  shippingCharge?: number
): Promise<{
  success: boolean;
  payments_session_id?: string;
  error?: string;
  authUrl?: string;
}> {
  try {
    // ✅ SECURITY: Include authentication token in request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Create payment session first
    const sessionResponse = await fetch('/api/payments/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: amount.toString(),
        currency,
        description,
        reference_number: referenceNumber,
        address: {
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone
        },
        cart_items: cartItems, // ✅ SECURITY: Send cart items for server-side verification
        shipping_charge: shippingCharge
      })
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json().catch(() => ({}));
      
      // If authentication is required, return the auth URL
      if (sessionResponse.status === 401 && errorData.authUrl) {
        return { 
          success: false, 
          error: errorData.error || 'Authentication required',
          authUrl: errorData.authUrl
        };
      }
      
      throw new Error(errorData.error || 'Failed to create payment session');
    }

    const sessionData = await sessionResponse.json();
    const paymentsSessionId = sessionData.payments_session_id;

    if (!paymentsSessionId) {
      throw new Error('Invalid session response');
    }
    
    return {
      success: true,
      payments_session_id: paymentsSessionId
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
