"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase, clientAuth } from '@/lib/supabase';

// Initialize Zoho Payment Widget helper function
async function initializeZohoPaymentWidget(
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

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
        cart_items: cartItems,
        shipping_charge: shippingCharge
      })
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json().catch(() => ({}));
      
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

    sessionStorage.setItem('paymentsSessionId', paymentsSessionId || '');
    sessionStorage.setItem('sessionDescription', description);

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

interface ZohoPaymentWidgetProps {
  amount: number;
  currency?: string;
  description: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  orderId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onClose: () => void;
  authToken?: string; // ✅ SECURITY: Authentication token
  cartItems?: Array<{ product_id: number; quantity: number }>; // ✅ SECURITY: For server-side verification
  shippingCharge?: number; // ✅ SECURITY: For server-side verification
}

declare global {
  interface Window {
    ZPayments: any;
  }
}

export default function ZohoPaymentWidget({
  amount,
  currency = 'INR',
  description,
  customerDetails,
  orderId,
  onSuccess,
  onError,
  onClose,
  authToken,
  cartItems,
  shippingCharge
}: ZohoPaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const instanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false); // Track if widget has been initialize
  

  // Initialize widget and check payment completion
  useEffect(() => {
    const initializeWidget = async () => {
      console.log('[PaymentWidget] Starting initialization...');
      
      // Check if payment was already completed (from localStorage)
      if (typeof window !== 'undefined') {
        const paymentCompleted = localStorage.getItem('payment_completed') === 'true';
        const paymentId = localStorage.getItem('payment_id');
        
        if (paymentCompleted && paymentId) {
          console.log('[PaymentWidget] Payment already completed, closing widget');
          onClose();
          return;
        }
      }

      // Prevent multiple initializations
      if (isInitializedRef.current) {
        console.log('[PaymentWidget] Widget already initialized, skipping');
        return;
      }
      
      isInitializedRef.current = true;
      
      try {
        console.log('[PaymentWidget] Waiting for Zoho Payments script to load...');
        // Wait for Zoho Payments script to load with better error handling
        let retries = 0;
        const maxRetries = 100; // Increased from 50 to 100 (10 seconds)
        while (!window.ZPayments && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!window.ZPayments) {
          throw new Error('Zoho Payments script failed to load after 10 seconds. Please refresh the page and try again.');
        }

        console.log('[PaymentWidget] Zoho Payments script loaded successfully');

        // ✅ SECURITY: Get the current session token
        let token = authToken;
        if (!token) {
          console.log('[PaymentWidget] Getting session token...');
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token || undefined;
        }

        console.log('[PaymentWidget] Verifying order total client-side...');
        // ✅ SECURITY: Verify order total client-side before creating payment session
        if (cartItems && cartItems.length > 0) {
          const verification = await clientAuth.calculateOrderTotal(cartItems, shippingCharge || 0);
          
          if (!verification.success) {
            throw new Error(verification.error || 'Failed to verify order amount');
          }

          // Check if client-sent amount matches database-calculated amount
          const expectedAmount = verification.total || 0;
          const clientAmount = parseFloat(amount.toString());

          if (Math.abs(expectedAmount - clientAmount) > 0.01) { // Allow 1 paisa difference for rounding
            console.error('Amount mismatch detected:', {
              client_amount: clientAmount,
              database_calculated: expectedAmount,
              difference: Math.abs(expectedAmount - clientAmount)
            });
            
            throw new Error(`Amount verification failed. Expected ₹${expectedAmount.toFixed(2)}, but got ₹${clientAmount.toFixed(2)}`);
          }

          console.log('[PaymentWidget] Amount verified successfully:', {
            amount: expectedAmount,
            verified: true
          });
        }

        // Reuse pre-created session id if available
        let paymentsSessionId: string | undefined = undefined;
        if (typeof window !== 'undefined') {
          paymentsSessionId = sessionStorage.getItem('paymentsSessionId') || undefined;
        }

        if (paymentsSessionId) {
          console.log('[PaymentWidget] Reusing pre-created payment session:', paymentsSessionId);
        } else {
          console.log('[PaymentWidget] Creating payment session...');
          // Use our centralized helper to create a payment session with timeout
          const sessionPromise = initializeZohoPaymentWidget(
            amount,
            currency,
            description,
            orderId,
            customerDetails,
            token, // ✅ SECURITY: Pass authentication token
            cartItems, // ✅ SECURITY: Pass cart items for server-side verification
            shippingCharge // ✅ SECURITY: Pass shipping charge for server-side verification
          );

          const sessionResult = await sessionPromise;

          if (!sessionResult.success) {
            // Check if authentication is required
            if (sessionResult.authUrl) {
              console.log('[PaymentWidget] Authentication required, redirecting...');
              // Redirect to authentication
              window.location.href = sessionResult.authUrl;
              return;
            }
            throw new Error(sessionResult.error || 'Failed to create payment session');
          }

          paymentsSessionId = sessionResult.payments_session_id;
          console.log('[PaymentWidget] Payment session created:', paymentsSessionId);

          if (!paymentsSessionId) {
            throw new Error('Invalid session response');
          }
        }

        // Initialize Zoho Payments instance
        console.log('[PaymentWidget] Initializing Zoho Payments instance...');
        const config = {
          account_id: process.env.NEXT_PUBLIC_ZOHO_ACCOUNT_ID || '',
          domain: 'IN',
          otherOptions: {
            api_key: process.env.NEXT_PUBLIC_ZOHO_API_KEY || ''
          }
        };

        instanceRef.current = new window.ZPayments(config);

        // Prepare payment options
        const options = {
          amount: amount.toString(),
          currency_code: currency,
          payments_session_id: paymentsSessionId,
          currency_symbol: '₹',
          business: 'Dhanya Naturals',
          description,
          reference_number: orderId,
          address: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone
          }
        };

        console.log('[PaymentWidget] Initiating payment with options:', options);
        
        const paymentData = await instanceRef.current.requestPaymentMethod(options);
        
        console.log('[PaymentWidget] Payment widget response:', paymentData);
        console.log('[PaymentWidget] Payment response details:', {
          hasPaymentId: !!paymentData.payment_id,
          paymentId: paymentData.payment_id,
          code: paymentData.code,
          status: paymentData.status,
          allKeys: Object.keys(paymentData)
        });
        
        if (paymentData.payment_id) {
          console.log('[PaymentWidget] Payment successful, calling onSuccess');
          // Call onSuccess - parent component will handle closing/unmounting
          onSuccess(paymentData);
        } else if (paymentData.code === 'error') {
          console.log('[PaymentWidget] Payment error, calling onError');
          onError(paymentData);
        } else if (paymentData.code === 'cancelled' || paymentData.status === 'cancelled') {
          // User cancelled/closed the widget - don't treat as error
          console.log('[PaymentWidget] Payment cancelled by user');
          onClose(); // Just close, don't create order
        } else {
          // Handle any other cases (like widget closure without explicit cancellation)
          console.log('[PaymentWidget] Payment widget closed without explicit cancellation');
          console.log('[PaymentWidget] Unexpected payment response:', paymentData);
          // ✅ SECURITY: Only treat as success if we have a definitive payment confirmation
          if (paymentData && paymentData.payment_id && paymentData.payment_id.trim() !== '') {
            console.log('[PaymentWidget] Payment confirmed with payment_id:', paymentData.payment_id);
            onSuccess(paymentData);
          } else {
            console.warn('[PaymentWidget] No definitive payment confirmation found. Closing widget.');
            onClose(); // Just close, don't create order
          }
        }

      } catch (err: any) {
        console.error('[PaymentWidget] Payment widget error:', err);
        
        // Reset initialization flag on error so it can be retried
        isInitializedRef.current = false;
        
        // Check if this is a timeout error
        if (err.message?.includes('timed out')) {
          console.error('[PaymentWidget] Timeout error detected:', err.message);
          setError(`Payment initialization timed out: ${err.message}. Please try again or contact support.`);
          onError(err);
        }
        // Check if this is a widget closure vs actual error
        else if (err.message?.toLowerCase().includes('cancelled') || 
            err.message?.toLowerCase().includes('closed') ||
            err.code === 'cancelled') {
          console.log('[PaymentWidget] Payment widget closed by user (caught in error)');
          onClose(); // Just close, don't create order
        } else {
          console.error('[PaymentWidget] Setting error state:', err.message);
          setError(err.message || 'Payment failed');
          onError(err);
        }
      } finally {
        console.log('[PaymentWidget] Initialization completed, setting loading to false');
        setIsLoading(false);
      }
    };

    initializeWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, description, orderId, retryCount]); // Added retryCount to trigger re-initialization

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.close();
        } catch (err) {
          console.warn('Error closing widget on unmount:', err);
        }
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-center mb-2">Loading Payment...</h3>
          <p className="text-gray-600 text-center mb-2">Please wait while we initialize the payment widget.</p>
          <p className="text-gray-400 text-xs text-center">This should take only a few seconds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="text-red-600 text-6xl mb-4 text-center">✗</div>
          <h3 className="text-lg font-semibold text-center mb-2 text-red-600">Payment Error</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Reset state and retry
                setIsLoading(true);
                setError(null);
                isInitializedRef.current = false;
                setRetryCount(prev => prev + 1); // Increment retry count to trigger useEffect
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
