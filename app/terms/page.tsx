import { FileText, Shield, Users, AlertTriangle, Mail, Phone } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen glass-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="glass-card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">Terms & Conditions</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-gray max-w-none">
            <div className="bg-green-50 p-6 rounded-lg mb-8 border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Welcome to Dhanya Naturals
              </h2>
              <p className="text-green-700 mb-0">
                By accessing and using Dhanya Naturals' website and services, you agree to be bound by these Terms of Service.
                By using our website and purchasing our products, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>

            {/* Section 1: Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="mb-4">
                  By using our website and purchasing our products, you acknowledge that you have read, understood, and agree to be bound by these terms.
                </p>
                <ul className="space-y-3">
                  <li><strong>"Company"</strong> (or "we", "us", "our") refers to Dhanya Naturals.</li>
                  <li><strong>"You"</strong> refers to the individual accessing or using our website and services.</li>
                  <li><strong>"Products"</strong> refers to natural and organic personal care items sold through our platform.</li>
                </ul>
              </div>
            </section>

            {/* Section 2: Product Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Product Information</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <ul className="list-disc list-inside space-y-2 text-blue-700">
                  <li>All products are natural and organic as described</li>
                  <li>Product descriptions and images are provided for informational purposes</li>
                  <li>We reserve the right to modify product offerings without notice</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Orders and Payment */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Orders and Payment</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <ul className="list-disc list-inside space-y-2 text-yellow-700">
                    <li>All orders are subject to acceptance by Dhanya Naturals</li>
                    <li>Payment must be received before order processing</li>
                    <li>Prices are subject to change without notice</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Responsibilities</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <ul className="list-disc list-inside space-y-2 text-blue-700">
                  <li>Provide accurate and complete information</li>
                  <li>Use the website in accordance with applicable laws</li>
                  <li>Not engage in any fraudulent or harmful activities</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Intellectual Property</h2>
              <div className="bg-purple-50 p-6 rounded-lg">
                <ul className="list-disc list-inside space-y-2 text-purple-700">
                  <li>All content on this website is the property of Dhanya Naturals</li>
                  <li>Users may not reproduce or distribute content without permission</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Limitation of Liability</h2>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <ul className="list-disc list-inside space-y-2 text-red-700">
                  <li>Dhanya Naturals is not liable for any indirect, incidental, or consequential damages</li>
                  <li>Our liability is limited to the purchase price of the product</li>
                </ul>
              </div>
            </section>

            {/* Section 7: Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Privacy</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>We respect your privacy and handle personal information according to our Privacy Policy</li>
                  <li>By using our services, you consent to our data collection practices</li>
                </ul>
              </div>
            </section>

            {/* Section 8: Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Governing Law</h2>
              <p>These terms are governed by the laws of India.</p>
            </section>

            {/* Contact Information */}
            <section className="mb-0">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Questions about these Terms?
                </h3>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Email</p>
                    <p className="text-green-700">dhanyanaturals1@gmail.com</p>
                  </div>
                </div>
                <p className="text-green-700 text-sm mt-4">
                  For questions about these terms, contact us at: dhanyanaturals1@gmail.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
