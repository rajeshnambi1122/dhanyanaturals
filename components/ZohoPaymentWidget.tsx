"use client";

import { useEffect, useRef, useState } from 'react';

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
  onClose
}: ZohoPaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    const initializeWidget = async () => {
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

        // Create payment session first
        const sessionResponse = await fetch('/api/payments/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount.toString(),
            currency_code: currency,
            description,
            reference_number: orderId,
            address: {
              name: customerDetails.name,
              email: customerDetails.email,
              phone: customerDetails.phone
            }
          })
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create payment session');
        }

        const sessionData = await sessionResponse.json();
        const paymentsSessionId = sessionData.payments_session_id;

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
        
        if (paymentData.payment_id) {
          onSuccess(paymentData);
        } else if (paymentData.code === 'error') {
          onError(paymentData);
        }

      } catch (err: any) {
        console.error('Payment widget error:', err);
        setError(err.message || 'Payment failed');
        onError(err);
      } finally {
        setIsLoading(false);
        // Close the widget
        if (instanceRef.current) {
          try {
            await instanceRef.current.close();
          } catch (closeErr) {
            console.warn('Error closing widget:', closeErr);
          }
        }
      }
    };

    initializeWidget();
  }, [amount, currency, description, customerDetails, orderId, onSuccess, onError]);

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
