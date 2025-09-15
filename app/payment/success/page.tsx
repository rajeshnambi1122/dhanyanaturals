"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ShoppingBag, User } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const payment_id = searchParams.get('payment_id')
    const order_id = searchParams.get('order_id')

    if (!payment_id) {
      setError('Payment ID not found')
      setLoading(false)
      return
    }

    // Verify payment with backend
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payment_id }),
        })

        const data = await response.json()

        if (data.success && data.payment.status === 'completed') {
          setPaymentData(data.payment)
        } else {
          setError('Payment verification failed')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setError('Unable to verify payment')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to verify your payment'}</p>
          <div className="space-y-3">
            <Link href="/contact">
              <Button className="w-full glass-button">Contact Support</Button>
            </Link>
            <Link href="/checkout">
              <Button variant="outline" className="w-full glass-input bg-transparent">
                Try Again
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen glass-background flex items-center justify-center py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="glass-card p-6 sm:p-8 text-center animate-scale-in">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-green-600 animate-bounce" />
            </div>
            <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200 rounded-full mx-auto opacity-25 animate-ping"></div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl sm:text-4xl font-bold gradient-text mb-4">
            🎉 Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your payment! Your order has been confirmed and is being processed.
          </p>

          {/* Payment Details Card */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6 border border-green-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                <p className="font-bold text-sm text-green-800">{paymentData.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="font-bold text-sm text-green-800">#{paymentData.order_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="font-bold text-lg text-green-800">₹{paymentData.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="font-semibold text-gray-800">{paymentData.payment_method || 'Online Payment'}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• Your order is now being processed</li>
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• Tracking information will be sent once shipped</li>
              <li>• Expected delivery: 3-5 business days</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/account">
              <Button className="glass-button w-full py-3 flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                Track Your Order
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="glass-input bg-transparent w-full py-3 flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Security Message */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>🔒 Your payment was processed securely</p>
          </div>
        </div>
      </div>
    </div>
  )
}
