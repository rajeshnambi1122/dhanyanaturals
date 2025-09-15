"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    // Optional: Log payment cancellation for analytics
    if (orderId) {
      console.log(`Payment cancelled for order: ${orderId}`)
    }
  }, [orderId])

  return (
    <div className="min-h-screen glass-background flex items-center justify-center py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="glass-card p-6 sm:p-8 text-center animate-scale-in">
          {/* Cancel Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-red-600" />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 className="text-2xl sm:text-4xl font-bold text-red-600 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your payment was not completed. Don't worry, no charges were made to your account.
          </p>

          {/* Order Details */}
          {orderId && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="font-bold text-lg text-gray-800">#{orderId}</p>
              <p className="text-sm text-gray-600 mt-2">
                Your order is still saved and waiting for payment
              </p>
            </div>
          )}

          {/* What happened */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">What happened?</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• Payment was cancelled or interrupted</li>
              <li>• No amount was deducted from your account</li>
              <li>• Your order is still active and can be completed</li>
              <li>• You can try payment again or choose Cash on Delivery</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button 
              className="glass-button w-full py-3 flex items-center justify-center gap-2"
              onClick={() => router.push('/checkout')}
            >
              <CreditCard className="h-4 w-4" />
              Try Payment Again
            </Button>
            <Link href="/cart">
              <Button variant="outline" className="glass-input bg-transparent w-full py-3 flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Cart
              </Button>
            </Link>
          </div>

          {/* Alternative Options */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">Alternative Options</h3>
            <div className="text-yellow-700 text-sm space-y-2">
              <p>• Choose <strong>Cash on Delivery</strong> during checkout</p>
              <p>• Contact our support team for assistance</p>
              <p>• Try using a different payment method</p>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need help with payment?</p>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Security Message */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>🔒 Your payment information is always secure</p>
          </div>
        </div>
      </div>
    </div>
  )
}
