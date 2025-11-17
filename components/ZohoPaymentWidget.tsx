"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase, clientAuth } from '@/lib/supabase';

// Initialize Zoho Payment Widget helper function
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

    if (paymentsSessionId) {
      sessionStorage.setItem('paymentsSessionId', paymentsSessionId);
    }
    sessionStorage.setItem('sessionDescription', description);

    if (!paymentsSessionId) {
      throw new Error('Invalid session response');
    }
    
    return {
      success: true,
      payments_session_id: paymentsSessionId
    };
  } catch (error) {
    
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
  paymentsSessionId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onClose: () => void;
  onSessionReady: (paymentSessionId: string) => void;
  authToken?: string; // ✅ SECURITY: Authentication token
  cartItems?: Array<{ product_id: number; quantity: number }>; // ✅ SECURITY: For server-side verification
  shippingCharge?: number; // ✅ SECURITY: For server-side verification
  shippingAddress: { state: string; city?: string; zip?: string }; // ✅ SECURITY: For shipping validation
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
  paymentsSessionId,
  onSuccess,
  onError,
  onClose,
  authToken,
  cartItems,
  shippingCharge,
  shippingAddress,
  onSessionReady,
}: ZohoPaymentWidgetProps): React.ReactElement | null {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // Track retry attempts
  const instanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false); // Track if widget has been initialize
  

  // Initialize widget and check payment completion
  useEffect(() => {
    const initializeWidget = async () => {
      console.log('[ZohoPaymentWidget] 🎬 InitializeWidget called');
      
      // Check if payment was already completed (from localStorage)
      if (typeof window !== 'undefined') {
        const paymentCompleted = localStorage.getItem('payment_completed') === 'true';
        const paymentId = localStorage.getItem('payment_id');
        
        if (paymentCompleted && paymentId) {
          console.log('[ZohoPaymentWidget] ⚠️ Payment already completed, closing widget');
          onClose();
          return;
        }
      }

      // Prevent multiple initializations
      if (isInitializedRef.current) {
        console.log('[ZohoPaymentWidget] ⚠️ Already initialized, skipping');
        return;
      }
      
      console.log('[ZohoPaymentWidget] ✅ Setting initialized flag');
      isInitializedRef.current = true;
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('[ZohoPaymentWidget] ⏰ Widget initialization timed out after 30 seconds');
        setError('Payment widget failed to load. Please refresh the page and try again.');
        setIsLoading(false);
        isInitializedRef.current = false;
      }, 30000); // 30 second timeout
      
      try {
        console.log('[ZohoPaymentWidget] 🚀 Starting widget initialization...');
        
        // Wait for Zoho Payments script to load with better error handling
        let retries = 0;
        const maxRetries = 100; // Increased from 50 to 100 (10 seconds)
        console.log('[ZohoPaymentWidget] ⏳ Waiting for ZPayments script to load...');
        
        while (!window.ZPayments && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
          if (retries % 10 === 0) {
            console.log(`[ZohoPaymentWidget] Still waiting... ${retries}/100`);
          }
        }

        if (!window.ZPayments) {
          console.error('[ZohoPaymentWidget] ❌ ZPayments script failed to load');
          throw new Error('Zoho Payments script failed to load after 10 seconds. Please refresh the page and try again.');
        }

        console.log('[ZohoPaymentWidget] ✅ ZPayments script loaded successfully');

        // Validate session ID
        console.log('[ZohoPaymentWidget] 📝 Using pre-created session ID:', paymentsSessionId);
        if (!paymentsSessionId) {
          throw new Error('No payment session ID provided');
        }

        // Notify parent that session is ready
        console.log('[ZohoPaymentWidget] 📢 Notifying parent that session is ready');
        onSessionReady?.(paymentsSessionId);
        
        // Initialize Zoho Payments instance
        console.log('[ZohoPaymentWidget] 🔧 Initializing ZPayments instance...');
        const config = {
          account_id: process.env.NEXT_PUBLIC_ZOHO_ACCOUNT_ID || '',
          domain: 'IN',
          otherOptions: {
            api_key: process.env.NEXT_PUBLIC_ZOHO_API_KEY || ''
          }
        };

        console.log('[ZohoPaymentWidget] Config:', {
          has_account_id: !!config.account_id,
          has_api_key: !!config.otherOptions.api_key,
          domain: config.domain
        });

        instanceRef.current = new window.ZPayments(config);
        console.log('[ZohoPaymentWidget] ✅ ZPayments instance created');

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

        console.log('[ZohoPaymentWidget] 💳 Payment options prepared:', {
          amount: options.amount,
          currency_code: options.currency_code,
          payments_session_id: options.payments_session_id,
          reference_number: options.reference_number
        });
        
        console.log('[ZohoPaymentWidget] 🎯 Calling requestPaymentMethod...');
        const paymentData = await instanceRef.current.requestPaymentMethod(options);
        console.log('[ZohoPaymentWidget] 📥 Payment method request completed:', paymentData);
        
        
        
        if (paymentData.payment_id) {
          
          // Call onSuccess - parent component will handle closing/unmounting
          onSuccess(paymentData);
        } else if (paymentData.code === 'error') {
          
          onError(paymentData);
        } else if (paymentData.code === 'cancelled' || paymentData.status === 'cancelled') {
          // User cancelled/closed the widget - don't treat as error
          
          onClose(); // Just close, don't create order
        } else {
          // Handle any other cases (like widget closure without explicit cancellation)
          
          // ✅ SECURITY: Only treat as success if we have a definitive payment confirmation
          if (paymentData && paymentData.payment_id && paymentData.payment_id.trim() !== '') {
            
            onSuccess(paymentData);
          } else {
            
            onClose(); // Just close, don't create order
          }
        }

      } catch (err: any) {
        console.error('[ZohoPaymentWidget] ❌ Error in widget initialization:', err);
        console.error('[ZohoPaymentWidget] Error details:', {
          message: err.message,
          code: err.code,
          stack: err.stack
        });
        
        // Reset initialization flag on error so it can be retried
        isInitializedRef.current = false;
        
        // Check if this is a timeout error
        if (err.message?.includes('timed out') || err.message?.includes('failed to load')) {
          console.error('[ZohoPaymentWidget] Timeout/Load error');
          setError(`Payment initialization timed out: ${err.message}. Please try again or contact support.`);
          onError(err);
        }
        // Check if this is a widget closure vs actual error
        else if (err.message?.toLowerCase().includes('cancelled') || 
            err.message?.toLowerCase().includes('closed') ||
            err.code === 'cancelled') {
          console.log('[ZohoPaymentWidget] Payment cancelled by user');
          onClose(); // Just close, don't create order
        } else {
          console.error('[ZohoPaymentWidget] Unknown error type');
          setError(err.message || 'Payment initialization failed. Please try again.');
          onError(err);
        }
      } finally {
        console.log('[ZohoPaymentWidget] 🏁 Widget initialization completed, setting loading to false');
        clearTimeout(timeoutId); // Clear the timeout
        setIsLoading(false);
      }
    };

    initializeWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, description, orderId, retryCount, paymentsSessionId, customerDetails, cartItems, shippingCharge, authToken]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.close();
        } catch (err) {
          
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
