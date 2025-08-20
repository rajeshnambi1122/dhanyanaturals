"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      alert("Thank you for your message! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6 animate-fade-in">
            Get In Touch
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto animate-slide-up">
            We'd love to hear from you! Whether you have questions about our products, 
            need wellness advice, or want to share your experience, we're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Contact Form */}
          <div className="flex justify-center lg:justify-start">
            <div className="glass-card p-8 animate-scale-in w-full max-w-2xl lg:max-w-none">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="glass-input focus-ring"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="glass-input focus-ring"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="glass-input focus-ring"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="glass-input focus-ring"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="glass-input focus-ring min-h-[120px]"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="glass-button w-full hover-lift"
                size="lg"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
            </div>
          </div>

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
    </div>
  );
}