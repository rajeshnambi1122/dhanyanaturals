import { cookies } from 'next/headers';

// Zoho API constants
const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';
const ZOHO_API_BASE = 'https://payments.zoho.in/api/v1';
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID;
const ZOHO_AUTH_URL = 'https://accounts.zoho.in/oauth/v2/auth';

export interface ZohoTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Get the authorization URL for Zoho OAuth
 */
export function getZohoAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID || '',
    scope: 'ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE',
    redirect_uri: `${baseUrl}/api/auth/zoho/callback`,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Get access token from cookies or environment variable, with automatic refresh
 */
export async function getAccessToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // If forcing refresh, skip cookie check and go straight to refresh
    if (forceRefresh) {
      console.log('Force refresh requested, skipping cookie check');
      
      if (process.env.ZOHO_REFRESH_TOKEN) {
        console.log('Attempting to refresh token from environment variable');
        const newTokens = await refreshAccessToken(process.env.ZOHO_REFRESH_TOKEN);
        if (newTokens) {
          console.log('Successfully refreshed token');
          return newTokens.access_token;
        }
      }
      
      // If force refresh fails, return null
      console.log('Force refresh failed');
      return null;
    }
    
    // Try to get from cookies first (for subsequent requests)
    const accessToken = cookieStore.get('zoho_access_token');
    if (accessToken) {
      console.log('Found cookie access token');
      return accessToken.value;
    }
    
    // No cookie token found, try to refresh using environment variable
    if (process.env.ZOHO_REFRESH_TOKEN) {
      console.log('No cookie token found, attempting to refresh token from environment variable');
      const newTokens = await refreshAccessToken(process.env.ZOHO_REFRESH_TOKEN);
      if (newTokens) {
        console.log('Successfully refreshed token and stored in cookies');
        return newTokens.access_token;
      } else {
        console.log('Token refresh failed');
      }
    } else {
      console.log('No refresh token available in environment variables');
    }
    
    // Fallback to environment variable access token (for production/initial setup)
    if (process.env.ZOHO_ACCESS_TOKEN) {
      console.log('Using environment variable access token as fallback');
      return process.env.ZOHO_ACCESS_TOKEN;
    }
    
    console.log('No valid access token or refresh token found');
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Get access token with automatic retry on 401 errors
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }
  
  // We'll let the API call fail with 401, then refresh in the API route
  return token;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<ZohoTokens | null> {
  try {
    // According to Zoho docs, parameters should be query parameters in URL
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/zoho/callback`,
      grant_type: 'refresh_token'
    });
    
    console.log('Refreshing access token...');
    console.log('Using refresh token (first 10 chars):', refreshToken.substring(0, 10) + '...');
    
    // Build URL with query parameters as per Zoho documentation
    const refreshUrl = `${ZOHO_TOKEN_URL}?${params.toString()}`;
    console.log('Refresh URL:', refreshUrl.replace(/client_secret=[^&]+/, 'client_secret=***'));
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Failed to refresh token:', response.status, responseText);
      return null;
    }
    
    let tokens;
    try {
      tokens = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse token refresh response:', responseText);
      return null;
    }
    
    if (!tokens.access_token) {
      console.error('No access token in refresh response:', tokens);
      return null;
    }
    
    console.log('Token refresh successful');
    
    // Update cookies with new tokens
    const cookieStore = await cookies();
    cookieStore.set('zoho_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
    });
    console.log('Updated access token in cookies');
    
    return tokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Clear Zoho access token from cookies (refresh tokens are server-side only)
 */
export async function clearZohoTokens() {
  const cookieStore = await cookies();
  cookieStore.delete('zoho_access_token');
  // Note: Refresh tokens are stored server-side only, not in cookies
}

/**
 * Check if user is authenticated with Zoho
 */
export async function isZohoAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Make a Zoho API call with automatic token refresh on 401 errors
 */
export async function makeZohoApiCall(url: string, options: RequestInit, accessToken?: string | null): Promise<Response> {
  // If no access token provided, get one
  if (!accessToken) {
    accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available for API call');
    }
  }

  // First attempt with provided/existing token
  console.log('Making Zoho API call to:', url);
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken || ''}`,
    },
  });

  // If 401 (Unauthorized), the token is expired - refresh and retry
  if (response.status === 401) {
    console.log('❌ Received 401 Unauthorized - token expired, attempting to refresh...');
    
    const newAccessToken = await getAccessToken(true); // Force refresh
    if (newAccessToken) {
      console.log('✅ Successfully refreshed token, retrying API call...');
      
      // Retry the API call with the new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });
      
      if (response.ok) {
        console.log('✅ API call succeeded after token refresh');
      } else {
        console.log('❌ API call failed even after token refresh:', response.status);
      }
    } else {
      console.error('❌ Failed to refresh token - cannot retry API call');
    }
  }

  return response;
}

/**
 * Create a payment session with Zoho
 */
export async function createPaymentSession(
  amount: number | string, 
  currency: string = 'INR',
  description: string,
  referenceNumber: string,
  address?: {
    name?: string;
    email?: string;
    phone?: string;
  },
  invoiceNumber?: string
): Promise<{ payments_session_id: string } | { error: string, authUrl?: string }> {
  try {
    // Check if Zoho Payments is properly configured
    if (!ZOHO_ACCOUNT_ID) {
      console.error('❌ ZOHO_ACCOUNT_ID not configured');
      return { error: 'Payment gateway not configured - missing ZOHO_ACCOUNT_ID' };
    }

    // Try to get access token (will auto-refresh if expired)
    console.log('📝 Getting access token for payment session...');
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      console.error('❌ No access token available after refresh attempt');
      console.error('📋 Please set ZOHO_REFRESH_TOKEN in environment variables');
      return { 
        error: 'Authentication required - no valid access token or refresh token found',
        authUrl: getZohoAuthUrl()
      };
    }
    
    console.log('✅ Access token obtained successfully');

    // Prepare payload for Zoho API
    // Zoho expects amount as a NUMBER (not string)
    // Testing currency format - Zoho might want uppercase INR
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    const payload: any = {
      amount: numericAmount,
      currency: currency.toUpperCase(), // Try uppercase "INR"
    };

    // Add optional fields if provided
    if (description) {
      payload.description = description;
    }
    
    if (referenceNumber) {
      payload.reference_number = referenceNumber;
    }
    
    if (invoiceNumber) {
      payload.invoice_number = invoiceNumber;
    }

    // Note: callback_url is NOT part of the payment session API
    // Webhooks are configured in Zoho Payments Dashboard → Settings → Webhooks
    // Not in the API request payload
    
    console.log('📦 Payment session payload:', JSON.stringify(payload, null, 2));
    console.log('ℹ️  Note: Webhook URL should be configured in Zoho Dashboard, not in API request');

    // Make API call with retry logic
    const apiUrl = `${ZOHO_API_BASE}/paymentsessions?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID!)}`;
    console.log('🔗 Making API call to:', apiUrl);
    
    const response = await makeZohoApiCall(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      accessToken
    );
  
    const text = await response.text();
    console.log('📥 Zoho API response status:', response.status);
    console.log('📥 Zoho API response body:', text);
    
    if (!response.ok) {
      console.error('❌ Zoho session creation failed:', response.status);
      console.error('❌ Response body:', text);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(text);
        const errorMessage = errorData.message || errorData.error || text;
        return { error: `Failed to create payment session: ${errorMessage}` };
      } catch {
        return { error: `Failed to create payment session: ${text}` };
      }
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse Zoho response:', text);
      return { error: 'Invalid response format from payment gateway' };
    }
    
    console.log('📦 Parsed Zoho response:', JSON.stringify(data, null, 2));
    
    // Payment sessions API returns payments_session format
    if (data.code === 0 && data.payments_session) {
      const sessionId = data.payments_session.payments_session_id;
      console.log('✅ Payment session created successfully:', sessionId);
      return { payments_session_id: sessionId };
    } else {
      console.error('❌ Invalid session response format:', data);
      const errorMsg = data.message || data.error || 'Invalid session response';
      return { error: errorMsg };
    }
  } catch (error) {
    console.error('Session creation error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Verify a payment with Zoho
 */
export async function verifyPayment(
  paymentId?: string,
  paymentsSessionId?: string
): Promise<{
  success: boolean;
  payment?: any;
  is_success?: boolean;
  is_failed?: boolean;
  error?: string;
}> {
  try {
    if (!paymentId && !paymentsSessionId) {
      return { success: false, error: 'Payment ID or Payment Session ID is required' };
    }

    if (!ZOHO_ACCOUNT_ID) {
      return { success: false, error: 'Payment gateway not configured' };
    }

    // Get access token for OAuth authentication
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Authentication required for payment verification' };
    }

    let paymentData: any = null;

    // If we have a payments_session_id, get payment details from the session
    if (paymentsSessionId) {
      console.log('Verifying payment session:', paymentsSessionId);
      
      const sessionResponse = await makeZohoApiCall(
        `${ZOHO_API_BASE}/paymentsessions/${paymentsSessionId}?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`,
        { method: 'GET' },
        accessToken
      );

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.text();
        console.error('Zoho session verify API Error:', errorData);
        return { success: false, error: 'Payment session verification failed' };
      }

      const sessionData = await sessionResponse.json();
      console.log('Session verification response:', sessionData);

      if (sessionData.code === 0 && sessionData.payments_session) {
        paymentData = {
          payment_id: sessionData.payments_session.payments?.[0]?.payment_id || paymentsSessionId,
          status: sessionData.payments_session.status,
          amount: sessionData.payments_session.amount,
          created_at: sessionData.payments_session.created_time,
          payment_method: 'Online Payment',
          session_id: paymentsSessionId
        };
      }
    }

    // If we have a direct payment_id, verify it directly
    if (paymentId && !paymentData) {
      console.log('Verifying direct payment:', paymentId);
      
      const response = await makeZohoApiCall(
        `${ZOHO_API_BASE}/payments/${paymentId}?account_id=${encodeURIComponent(ZOHO_ACCOUNT_ID)}`,
        { method: 'GET' },
        accessToken
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Zoho payment verify API Error:', errorData);
        return { success: false, error: 'Payment verification failed' };
      }

      const directPaymentData = await response.json();
      console.log('Direct payment verification response:', directPaymentData);

      if (directPaymentData.code === 0) {
        paymentData = directPaymentData;
      }
    }

    if (!paymentData) {
      return { success: false, error: 'Payment verification failed - no valid payment data found' };
    }

    // Determine payment status - handle various success status formats from Zoho
    const successStatuses = ['succeeded', 'success', 'approved', 'captured', 'completed', 'authorized', 'paid'];
    const failedStatuses = ['failed', 'declined', 'cancelled', 'rejected', 'expired'];
    
    // Extract status from payment data, with fallbacks
    // Check nested payment object first, then top-level, then payments array
    const paymentStatus = paymentData.payment?.status ||
                         paymentData.status || 
                         (paymentData.payments && paymentData.payments[0]?.status);
    
    console.log('Raw payment data:', JSON.stringify(paymentData, null, 2));
    console.log('Raw payment status:', paymentStatus);
    
    // Convert to lowercase for case-insensitive comparison
    const status = (paymentStatus || '').toLowerCase();
    
    // Log detailed payment data for debugging
    console.log('Payment verification details:', {
      paymentId: paymentData.payment?.payment_id || paymentData.payment_id,
      status: status,
      rawStatus: paymentStatus,
      dataContainsStatus: !!paymentData.status,
      dataContainsPayment: !!paymentData.payment,
      dataContainsPayments: !!paymentData.payments
    });
    
    const isSuccess = successStatuses.some(s => status.includes(s));
    const isFailed = failedStatuses.some(s => status.includes(s));
    
    // Determine final success status based on explicit success statuses
    const finalIsSuccess = isSuccess;
    
    console.log('Payment status determination:', {
      isSuccess,
      isFailed,
      finalIsSuccess,
      hasPaymentData: !!paymentData
    });
    // Extract payment details from the nested structure if present
    const payment = paymentData.payment || paymentData;
    
    return {
      success: true,
      payment: {
        id: payment.payment_id,
        status: payment.status,
        amount: payment.amount,
        created_at: payment.created_at || payment.date,
        payment_method: payment.payment_method,
        session_id: payment.payments_session_id || paymentData.session_id,
        reference_number: payment.reference_number,
        transaction_reference_number: payment.transaction_reference_number
      },
      is_success: finalIsSuccess,
      is_failed: isFailed
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get token status for debugging
 */
export async function getTokenStatus(): Promise<{
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  source: 'cookie' | 'environment' | 'refreshed' | 'none';
  securityNote: string;
}> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('zoho_access_token');
    
    if (accessToken) {
      return {
        hasAccessToken: true,
        hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
        source: 'cookie',
        securityNote: 'Access token in cookie, refresh token in environment (secure)'
      };
    }
    
    if (process.env.ZOHO_ACCESS_TOKEN) {
      return {
        hasAccessToken: true,
        hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
        source: 'environment',
        securityNote: 'Tokens in environment variables (secure)'
      };
    }
    
    if (process.env.ZOHO_REFRESH_TOKEN) {
      // Try to refresh
      const newToken = await getAccessToken();
      if (newToken) {
        return {
          hasAccessToken: true,
          hasRefreshToken: true,
          source: 'refreshed',
          securityNote: 'Token refreshed from environment refresh token (secure)'
        };
      }
    }
    
    return {
      hasAccessToken: false,
      hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
      source: 'none',
      securityNote: 'No access token available, refresh token in environment (secure)'
    };
  } catch (error) {
    console.error('Error checking token status:', error);
    return {
      hasAccessToken: false,
      hasRefreshToken: false,
      source: 'none',
      securityNote: 'Error checking token status'
    };
  }
}
