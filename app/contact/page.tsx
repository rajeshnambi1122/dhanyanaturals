import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";

export default function ContactPage() {

  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Contact Information */}
          <div className="flex justify-center lg:justify-start">
            <div className="space-y-8 w-full max-w-2xl lg:max-w-none">
            {/* Contact Details */}
            <div className="glass-card p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Tiruchendur, Tamil Nadu<br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-gray-600">
                      <a href="tel:+919865081056" className="hover:text-green-600 text-sm sm:text-base">
                        +91 98650 81056
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-gray-600">
                      <a href="mailto:spriyadarshini680@gmail.com" className="hover:text-green-600 text-sm sm:text-base break-all">
                        spriyadarshini680@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="glass-card p-8 animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Follow Us</h2>
              <p className="text-gray-600 mb-6">
                Stay connected with us on social media for the latest updates, 
                wellness tips, and natural beauty secrets.
              </p>
              
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/dhanya_naturals/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center hover-lift text-white"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="glass-card p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Quick Help</h2>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <strong>Product Questions:</strong> Need help choosing the right product? 
                  We're here to guide you based on your skin type and needs.
                </p>
                <p className="text-gray-600">
                  <strong>Order Support:</strong> Questions about your order, shipping, or 
                  returns? Our customer service team is ready to assist.
                </p>
                <p className="text-gray-600">
                  <strong>Wellness Advice:</strong> Looking for natural wellness tips? 
                  Our experts love sharing knowledge about healthy living.
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  );
}