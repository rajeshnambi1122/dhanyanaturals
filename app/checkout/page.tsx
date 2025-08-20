"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userDataService, productService, orderService } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, MapPin, User, Phone, Mail, Loader2, ShoppingBag, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CartItemWithDetails, CartItem } from "@/lib/types";

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Form states
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: ''
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');

  // Scroll to top when order success is shown
  useEffect(() => {
    if (orderSuccess) {
      // Scroll to top smoothly to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderSuccess]);

  // Load cart items and populate user details
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // Skip loading if we're already showing order success
    if (orderSuccess) return;

    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        
        // Pre-populate customer details from user data
        setCustomerDetails({
          name: user.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: user.phone || ''
        });

        // Load cart items
        const cartItems = user.cart_items || [];
        
        if (cartItems.length === 0) {
          router.push('/cart');
          return;
        }

        // Get product details for cart items
        const productIds = cartItems.map((item: CartItem) => item.product_id);
        const uniqueProductIds: number[] = Array.from(new Set(productIds));
        const products = await productService.getProductsByIds(uniqueProductIds);
        
        const productMap = products.reduce((acc, product) => {
          if (product) {
            acc[product.id] = product;
          }
          return acc;
        }, {} as Record<number, any>);
        
        const cartWithDetails = cartItems.map((item: CartItem) => {
          const product = productMap[item.product_id];
          return {
            ...item,
            product_name: product?.name || 'Unknown Product',
            price: product?.price || 0,
            image: product?.image_url || product?.image,
            stock_quantity: product?.stock_quantity || 0,
            in_stock: product?.in_stock || false,
          };
        });
        
        setCartItems(cartWithDetails);
      } catch (error) {
        console.error('Error loading checkout data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [user, authLoading, router, orderSuccess]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 50;
  const total = subtotal + shipping;

  // Handle form submission
  const handleSubmitOrder = async () => {
    if (!user) return;

    // Validation
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      alert('Please fill in all customer details');
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      alert('Please fill in all shipping address fields');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare order data
      const orderData = {
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        shipping_address: shippingAddress,
        payment_method: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total_amount: total,
        status: 'processing' as const,
        notes: notes || undefined
      };

      // Create order
      const newOrder = await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      const userId = user.user_id || user.id;
      await userDataService.clearCart(userId);
      await refreshUser();
      
      setOrderId(newOrder.id);
      setOrderSuccess(true);
      
      // Scroll to top on mobile to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
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
              🎉 Order Placed Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for choosing Dhanya Naturals! Your order has been confirmed and is being processed.
            </p>

            {/* Order Details Card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6 border border-green-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Number</p>
                  <p className="font-bold text-lg text-green-800">#{orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="font-bold text-lg text-green-800">₹{total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-800">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                  <p className="font-semibold text-gray-800 text-sm">{shippingAddress.city}, {shippingAddress.state}</p>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-blue-800">Confirmation Email Sent</p>
              </div>
              <p className="text-blue-700 text-sm">
                Order details and tracking information sent to <strong>{customerDetails.email}</strong>
              </p>
            </div>

            {/* Order Items Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Items Ordered ({cartItems.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">What's Next?</h3>
              <ul className="text-yellow-700 text-sm space-y-1 text-left">
                <li>• We'll prepare your order within 1-2 business days</li>
                <li>• You'll receive tracking information via email</li>
                <li>• Expected delivery: 3-5 business days</li>
                <li>• Payment will be collected upon delivery</li>
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
              <p>🔒 Your order information is secure and encrypted</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Link href="/cart">
            <Button variant="outline" size="sm" className="glass-input bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="glass-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="glass-input"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="glass-input"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="glass-input"
                    placeholder="House/Flat No., Street Name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="glass-input"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="glass-input"
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PIN Code *</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="glass-input"
                      placeholder="110001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={shippingAddress.country} onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="India">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div 
                    className={`p-4 glass-input rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'cod' ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="cod"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-green-600"
                      />
                      <label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-gray-600">Pay when your order arrives</div>
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 glass-input rounded-lg cursor-pointer transition-colors opacity-50 ${
                      paymentMethod === 'online' ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="online"
                        name="payment"
                        value="online"
                        disabled
                        className="text-green-600"
                      />
                      <label htmlFor="online" className="flex-1">
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking (Coming Soon)</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-lg sm:text-xl font-semibold">Order Notes (Optional)</h2>
              </div>
              <div className="p-4 sm:p-6">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input"
                  placeholder="Any special instructions for your order..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass-card">
              <div className="p-4 sm:p-6 border-b border-white/20">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 p-3 glass-input rounded-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.product_name}
                        width={50}
                        height={50}
                        className="rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button 
                  className="w-full glass-button py-3" 
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <div className="text-center text-xs text-gray-600">
                  <p>🔒 Your information is secure and encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
