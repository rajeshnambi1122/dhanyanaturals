import { XCircle, AlertTriangle, Mail, Phone, ShoppingBag, Clock } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen glass-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="glass-card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">Refund and Cancellation Policy</h1>
            <p className="text-gray-600">Last updated: 03/09/2025</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-gray max-w-none">
            <div className="bg-red-50 p-6 rounded-lg mb-8 border border-red-200">
              <h2 className="text-xl font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                No Returns or Refunds Policy
              </h2>
              <p className="text-red-700 mb-0 font-medium">
                <strong>IMPORTANT NOTICE: Dhanya Naturals operates under a strict NO RETURNS and NO REFUNDS policy.</strong>
              </p>
            </div>

            {/* Section 1: No Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. No Refunds</h2>
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <ul className="list-disc list-inside space-y-2 text-red-700 font-medium">
                  <li><strong>All sales are final</strong></li>
                  <li>We do not provide refunds for any products under any circumstances</li>
                  <li>Once payment is processed, it cannot be reversed or refunded</li>
                  </ul>
              </div>
            </section>

            {/* Section 2: No Returns */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. No Returns</h2>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <ul className="list-disc list-inside space-y-2 text-red-700 font-medium">
                  <li><strong>We do not accept returns of any products</strong></li>
                  <li>Products cannot be returned for exchange, credit, or refund</li>
                  <li>This policy applies to all products regardless of condition</li>
                  </ul>
              </div>
            </section>

            {/* Section 3: Order Cancellation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Order Cancellation</h2>
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li><strong>Orders cannot be cancelled once payment is confirmed</strong></li>
                  <li>Please review your order carefully before completing purchase</li>
                  <li>Contact us immediately if you notice any errors, though changes may not be possible</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Product Quality */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Product Quality</h2>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <ul className="list-disc list-inside space-y-2 text-blue-700">
                  <li>We ensure all products meet our quality standards before shipping</li>
                  <li>Products are carefully inspected and packaged</li>
                  <li>By purchasing, you acknowledge acceptance of this no-return policy</li>
                    </ul>
              </div>
            </section>

            {/* Section 5: Damaged or Defective Products */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Damaged or Defective Products</h2>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rare Exception Policy
                  </h3>
                <ul className="list-disc list-inside space-y-2 text-orange-700">
                  <li>In the rare case of shipping damage or manufacturing defects</li>
                  <li>Contact us within 24 hours of delivery with photo evidence</li>
                  <li>Resolution will be at our sole discretion and may include replacement (not refund)</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Customer Responsibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Customer Responsibility</h2>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="space-y-4">
                  <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                    <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Before You Purchase
                </h3>
                    <ul className="list-disc list-inside space-y-2 text-purple-700 font-medium">
                      <li><strong>Please read product descriptions carefully before ordering</strong></li>
                      <li><strong>Ensure you understand our no-return policy before purchase</strong></li>
                      <li><strong>By completing your purchase, you agree to these terms</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Contact for Issues */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact for Issues</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  If you have concerns about your order, contact us at:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Email</p>
                      <p className="text-gray-700">dhanyanaturals1@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Response Time</p>
                      <p className="text-gray-700">1-2 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Policy Updates */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Policy Updates</h2>
              <p className="text-gray-700">
                This policy may be updated without notice. Current version is always available on our website.
              </p>
            </section>

            {/* Final Notice */}
            <section className="mb-0">
              <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
                <h3 className="text-xl font-bold text-red-800 mb-3">Final Notice</h3>
                <p className="text-red-700 font-medium text-lg">
                  <strong>By making a purchase, you acknowledge that you have read and agree to our NO RETURNS and NO REFUNDS policy.</strong>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}