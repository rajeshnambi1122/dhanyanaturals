"use client";

import { useEffect, useRef, useState } from 'react';
import { initializeZohoPaymentWidget } from '@/lib/zoho-auth-client';
import { supabase } from '@/lib/supabase';

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
  console.log('🔄 ZohoPaymentWidget component rendered/re-rendered for orderId:', orderId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false); // Track if widget has been initialized
  
  // Initialize widget and check payment completion
  useEffect(() => {
    const initializeWidget = async () => {
      // Check if payment was already completed (from localStorage)
      if (typeof window !== 'undefined') {
        const paymentCompleted = localStorage.getItem('payment_completed') === 'true';
        const paymentId = localStorage.getItem('payment_id');
        
        if (paymentCompleted && paymentId) {
          console.log('Payment already completed, closing widget');
          onClose();
          return;
        }
      }

      // Prevent multiple initializations
      if (isInitializedRef.current) {
        console.log('⚠️ Widget already initialized, skipping...');
        return;
      }
      
      console.log('🎯 Initializing ZohoPaymentWidget for orderId:', orderId);
      isInitializedRef.current = true;
      
      try {
        // Wait for Zoho Payments script to load
        let retries = 0;
        while (!window.ZPayments && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!window.ZPayments) {
          throw new Error('Zoho Payments script failed to load');
        }

        // ✅ SECURITY: Get the current session token
        let token = authToken;
        if (!token) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token || undefined;
        }

        // Use our centralized helper to create a payment session
        const sessionResult = await initializeZohoPaymentWidget(
          amount,
          currency,
          description,
          orderId,
          customerDetails,
          token, // ✅ SECURITY: Pass authentication token
          cartItems, // ✅ SECURITY: Pass cart items for server-side verification
          shippingCharge // ✅ SECURITY: Pass shipping charge for server-side verification
        );

        if (!sessionResult.success) {
          // Check if authentication is required
          if (sessionResult.authUrl) {
            // Redirect to authentication
            window.location.href = sessionResult.authUrl;
            return;
          }
          throw new Error(sessionResult.error || 'Failed to create payment session');
        }

        const paymentsSessionId = sessionResult.payments_session_id;

        if (!paymentsSessionId) {
          throw new Error('Invalid session response');
        }

        // Initialize Zoho Payments instance
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

        // Initiate payment
        const paymentData = await instanceRef.current.requestPaymentMethod(options);
        
        console.log('Payment widget response:', paymentData);
        
        if (paymentData.payment_id) {
          // Call onSuccess - parent component will handle closing/unmounting
          onSuccess(paymentData);
        } else if (paymentData.code === 'error') {
          onError(paymentData);
        } else if (paymentData.code === 'cancelled' || paymentData.status === 'cancelled') {
          // User cancelled/closed the widget - don't treat as error
          console.log('Payment widget closed by user');
          onClose(); // Just close, don't create order
        } else {
          // Handle any other cases (like widget closure without explicit cancellation)
          console.log('Payment widget closed without explicit cancellation');
          onClose(); // Just close, don't create order
        }

      } catch (err: any) {
        console.error('Payment widget error:', err);
        
        // Reset initialization flag on error so it can be retried
        isInitializedRef.current = false;
        
        // Check if this is a widget closure vs actual error
        if (err.message?.toLowerCase().includes('cancelled') || 
            err.message?.toLowerCase().includes('closed') ||
            err.code === 'cancelled') {
          console.log('Payment widget closed by user (caught in error)');
          onClose(); // Just close, don't create order
        } else {
          setError(err.message || 'Payment failed');
          onError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, description, orderId]); // Removed callback dependencies to prevent re-renders

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
          <p className="text-gray-600 text-center">Please wait while we initialize the payment widget.</p>
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
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return null;
}
