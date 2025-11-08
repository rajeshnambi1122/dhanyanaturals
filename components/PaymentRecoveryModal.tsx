"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, CreditCard, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentRecoveryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderAmount: string
  onVerify: () => Promise<void>
  onDismiss: () => void
}

export default function PaymentRecoveryModal({
  open,
  onOpenChange,
  orderId,
  orderAmount,
  onVerify,
  onDismiss,
}: PaymentRecoveryModalProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const router = useRouter()

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerificationStatus('idle')
    
    try {
      await onVerify()
      setVerificationStatus('success')
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onOpenChange(false)
        router.push('/account')
      }, 2000)
    } catch (error) {
      setVerificationStatus('failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDismiss = () => {
    onDismiss()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] glass-card border-2 border-yellow-200" style={{ zIndex: 60 }}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              Payment Recovery
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-gray-700 pt-2">
            We found a pending order from your previous session.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Order Number</span>
              <span className="text-lg font-bold text-blue-800">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Amount</span>
              <span className="text-lg font-bold text-blue-800">₹{orderAmount}</span>
            </div>
          </div>

          {/* Status Message */}
          {verificationStatus === 'idle' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Did you complete the payment?</strong>
                <br />
                If you paid via UPI or card, click "Verify Payment" to check and update your order status.
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Payment Verified!</p>
                <p className="text-xs text-green-700 mt-1">Your order has been confirmed and will be processed soon.</p>
              </div>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Payment Not Found</p>
                <p className="text-xs text-red-700 mt-1">
                  No successful payment was found. If you did pay, please contact support with your order number.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {verificationStatus === 'idle' && (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="w-full sm:w-auto"
                disabled={isVerifying}
              >
                Dismiss
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full sm:w-auto glass-button"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify Payment
                  </>
                )}
              </Button>
            </>
          )}
          
          {verificationStatus === 'success' && (
            <Button
              onClick={() => {
                onOpenChange(false)
                router.push('/account')
              }}
              className="w-full glass-button"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              View My Orders
            </Button>
          )}

          {verificationStatus === 'failed' && (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => router.push('/contact')}
                className="w-full sm:w-auto glass-button"
              >
                Contact Support
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

