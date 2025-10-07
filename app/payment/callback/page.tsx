"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get payment parameters from URL
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Payment failed. Please try again.');
          setTimeout(() => router.push('/checkout'), 3000);
          return;
        }

        if (paymentId && status === 'success') {
          // Verify payment with backend
          const response = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_id: paymentId }),
          });

          if (response.ok) {
            setStatus('success');
            setMessage('Payment successful! Redirecting to order confirmation...');
            
            // Get pending order from session storage
            const pendingOrder = sessionStorage.getItem('pendingOrder');
            if (pendingOrder) {
              // Complete the order
              const orderData = JSON.parse(pendingOrder);
              await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
              });
              
              // Clear session storage
              sessionStorage.removeItem('pendingOrder');
              sessionStorage.removeItem('paymentId');
            }
            
            setTimeout(() => router.push('/payment/success'), 2000);
          } else {
            setStatus('error');
            setMessage('Payment verification failed. Please contact support.');
            setTimeout(() => router.push('/checkout'), 3000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid payment response. Please try again.');
          setTimeout(() => router.push('/checkout'), 3000);
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('An error occurred. Please contact support.');
        setTimeout(() => router.push('/checkout'), 3000);
      }
    };

    handlePaymentCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center glass-background">
      <div className="glass-card p-8 text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h2>
          </>
        )}
        
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
