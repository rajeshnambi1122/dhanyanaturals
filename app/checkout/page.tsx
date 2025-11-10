"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, MapPin, User, Mail, Loader2, ShoppingBag, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CartItemWithDetails, CartItem, Product } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { userDataService, productService, orderService, clientAuth } from "@/lib/supabase";
import ZohoPaymentWidget from "@/components/ZohoPaymentWidget";
import PaymentRecoveryModal from "@/components/PaymentRecoveryModal";
import type { ShippingAddress, CustomerDetails } from "@/lib/types"

import{ initializeZohoPaymentWidget } from "@/components/ZohoPaymentWidget";
import { supabase } from '@/lib/supabase';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // Prevent duplicate API calls
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const { user, loading: authLoading, refreshUser, getSessionToken } = useAuth();
  const router = useRouter();

  // Check if this is a Buy Now checkout
  const buyNowMode = searchParams.get('buyNow') === 'true';
  const buyNowProductId = searchParams.get('product');
  const buyNowQuantity = parseInt(searchParams.get('quantity') || '1');
  const isRetry = searchParams.get('retry') === 'true';

    // Generate payment reference ID based on next order number
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');
    const [orderIdGenerated, setOrderIdGenerated] = useState(false);
    
    // Payment recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryOrderId, setRecoveryOrderId] = useState<string | null>(null);
  const [recoveryOrderAmount, setRecoveryOrderAmount] = useState<string>('0');
  
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  // Form states - initialize from sessionStorage if available
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('checkout_customer_details');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
        }
      }
    }
    return { name: '', email: '', phone: '' };
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('checkout_shipping_address');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
        }
      }
    }
    return { street: '', city: '', state: '', zipCode: '', country: 'India' };
  });

  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('checkout_payment_method') || 'online';
    }
    return 'online';
  });

  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [notes, setNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('checkout_notes') || '';
    }
    return '';
  });
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  // Use localStorage to persist payment completion state across page loads
  const [paymentCompleted, setPaymentCompleted] = useState(() => {
    // Check localStorage on initial render (client-side only)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('payment_completed') === 'true';
    }
    return false;
  });
  

  // Don't use auto-refresh timeout on checkout page - payment widget has its own timeout
  // useApiTimeout is disabled here to prevent interference with payment flow

  // Fetch latest order number and generate next order reference
  useEffect(() => {
    if (orderIdGenerated) return;

    const generateOrderReference = async () => {
      try {
        // Fetch the latest order to get the highest order ID
        const orders = await orderService.getOrders();
        
        let nextOrderNumber = 1001; // Default starting number
        
        if (orders && orders.length > 0) {
          // Get the highest ID from existing orders
          const maxId = Math.max(...orders.map((order: any) => Number(order?.id ?? 0)));
          nextOrderNumber = maxId + 1;
        }
        
        setPaymentOrderId(`#${nextOrderNumber}`);
        setOrderIdGenerated(true);
      } catch (error) {
        // Fallback to timestamp-based ID if fetch fails
        setPaymentOrderId(`#ORDER_${Date.now()}`);
        setOrderIdGenerated(true);
      }
    };

    generateOrderReference();
  }, [orderIdGenerated]);

  // Check for pending orders and completed payments on page load
  useEffect(() => {
    // Only run if we haven't already processed payment and not in success state
    if (paymentCompleted || orderSuccess || submitting) {
      return;
    }

    if (typeof window !== 'undefined') {
      // Check for pending order from previous session
      const pendingOrderId = sessionStorage.getItem('pending_order_id');
      const pendingOrderTime = sessionStorage.getItem('pending_order_time');
      
      if (pendingOrderId && pendingOrderTime) {
        const orderAge = new Date().getTime() - new Date(pendingOrderTime).getTime();
        const isRecent = orderAge < 30 * 60 * 1000; // 30 minutes
        
        if (isRecent) {
          // Show recovery modal with order details
          const pendingAmount = sessionStorage.getItem('pending_payment_amount') || '0';
          setRecoveryOrderId(pendingOrderId);
          setRecoveryOrderAmount(pendingAmount);
          setShowRecoveryModal(true);
        } else {
          // Clear stale pending order data
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_order_time');
          sessionStorage.removeItem('pending_payment_amount');
        }
      }

      // Check for completed payment from previous session
      const storedPaymentCompleted = localStorage.getItem('payment_completed') === 'true';
      const storedPaymentId = localStorage.getItem('payment_id');
      const storedPaymentTime = localStorage.getItem('payment_time');
      
      if (storedPaymentCompleted && storedPaymentId && storedPaymentTime) {
        // Check if the payment was recent (within last 10 minutes)
        const isRecent = new Date().getTime() - new Date(storedPaymentTime).getTime() < 10 * 60 * 1000;
        
        if (isRecent) {
          handlePaymentSuccess({ payment_id: storedPaymentId });
        } else {
          // Clear stale payment data
          localStorage.removeItem('payment_completed');
          localStorage.removeItem('payment_id');
          localStorage.removeItem('payment_time');
        }
      }
    }
  }, []); // Only run once on mount

  // Persist form data to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Don't save if order is successful
    if (orderSuccess) return;
    
    try {
      sessionStorage.setItem('checkout_customer_details', JSON.stringify(customerDetails));
      sessionStorage.setItem('checkout_shipping_address', JSON.stringify(shippingAddress));
      sessionStorage.setItem('checkout_payment_method', paymentMethod);
      sessionStorage.setItem('checkout_notes', notes);
    } catch (error) {
    }
  }, [customerDetails, shippingAddress, paymentMethod, notes, orderSuccess]);

  // Scroll to top when order success is shown
  useEffect(() => {
    if (orderSuccess) {
      // Scroll to top smoothly to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderSuccess]);

  // Handle retry after authentication
  useEffect(() => {
    if (isRetry) {
      const pendingOrder = sessionStorage.getItem('pendingOrder');
      if (pendingOrder && paymentMethod === 'online') {
        // Automatically retry the payment
        const orderData = JSON.parse(pendingOrder);
        handleOnlinePayment(orderData);
      }
    }
  }, [isRetry]);

  // Load cart items and populate user details
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // Skip loading if we're already showing order success
    if (orderSuccess) return;

    // Allow reloading when cart items change (but not for buyNow mode)
    if (dataLoaded && !buyNowMode) {
      // Check if cart items have changed
      const currentCartStr = JSON.stringify(user.cart_items || []);
      const lastCartStr = sessionStorage.getItem('checkout_last_cart');
      
      if (currentCartStr === lastCartStr) {
        return; // No changes, skip reload
      }
      
      // Cart changed, reset dataLoaded to allow reload
      setDataLoaded(false);
      sessionStorage.setItem('checkout_last_cart', currentCartStr);
    }

    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        
        // Pre-populate customer details from user data
        setCustomerDetails({
          name: user.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: user.phone || ''
        });

        if (buyNowMode && buyNowProductId) {
          // Buy Now mode - load single product
          setIsBuyNow(true);
          
          const productIdNum = Number(buyNowProductId);
          const product: any = await productService.getProductById(productIdNum);
          
          if (!product) {
            alert('Product not found');
            router.push('/products');
            return;
          }

          const stockQty: number = typeof (product.stock_quantity ?? product.stock) === 'number' ? (product.stock_quantity ?? product.stock) : 0;
          const inStock: boolean = (product.in_stock ?? product.inStock) === true;

          if (!inStock || stockQty < buyNowQuantity) {
            console.error('[Checkout] Product out of stock:', { 
              in_stock: inStock, 
              stock_quantity: stockQty, 
              requested: buyNowQuantity 
            });
            alert('Product is out of stock or insufficient quantity available');
            router.push(`/products/${buyNowProductId}`);
            return;
          }

          const buyNowItem = {
            product_id: Number(product.id),
            quantity: buyNowQuantity,
            added_at: new Date().toISOString(),
            product_name: String(product.name || ''),
            price: Number(product.price) || 0,
            image: String(product.image_url || product.image || ''),
            stock_quantity: stockQty,
            in_stock: inStock,
          };

          setCartItems([buyNowItem]);
        } else {
          // Regular cart mode
          setIsBuyNow(false);
          const cartItems = user.cart_items || [];
          
          if (cartItems.length === 0) {
            router.push('/cart');
            return;
          }

          // Get product details for cart items - only fetch once
          const productIds = cartItems.map((item: CartItem) => item.product_id);
          const uniqueProductIds: number[] = Array.from(new Set(productIds));
          
          // Single API call to get all products at once
          console.log(`[Checkout] Fetching ${uniqueProductIds.length} products in single API call:`, uniqueProductIds);
          const products = await productService.getProductsByIds(uniqueProductIds) as any[];
          console.log('[Checkout] Products fetched:', products.length);
          
          const productMap = products.reduce((acc: Record<number, any>, product: any) => {
            if (product) {
              acc[product.id as number] = product;
            }
            return acc;
          }, {} as Record<number, any>);
          
          // Check for out-of-stock items
          const cartWithDetails = cartItems.map((item: CartItem) => {
            const product = productMap[item.product_id] as any;
            return {
              ...item,
              product_name: (product?.name as string) || 'Unknown Product',
              price: typeof product?.price === 'number' ? product.price : 0,
              image: String(product?.image_url || product?.image || ''),
              stock_quantity: typeof (product?.stock_quantity ?? product?.stock) === 'number' ? (product?.stock_quantity ?? product?.stock) : 0,
              in_stock: (product?.in_stock ?? product?.inStock) === true,
            };
          });
          
          // Filter out any out-of-stock items
          const outOfStockItems = cartWithDetails.filter((item: CartItemWithDetails) => !item.in_stock);
          if (outOfStockItems.length > 0) {
            // Create a list of out-of-stock items
            const outOfStockNames = outOfStockItems.map((item: CartItemWithDetails) => item.product_name).join(", ");
            console.warn('[Checkout] Out of stock items found:', outOfStockNames);
            alert(`The following items in your cart are out of stock: ${outOfStockNames}. They have been removed from checkout.`);
            
            // Remove out-of-stock items from cart
            const inStockItems = cartWithDetails.filter((item: CartItemWithDetails) => item.in_stock);
            setCartItems(inStockItems);
            
            // If no items are in stock, redirect to cart
            if (inStockItems.length === 0) {
              console.log('[Checkout] All items out of stock, redirecting to cart');
              alert("All items in your cart are out of stock. Redirecting to cart.");
              router.push('/cart');
              return;
            }
          } else {
            setCartItems(cartWithDetails);
          }
          
          console.log('[Checkout] Cart items loaded:', cartWithDetails.length);
        }
        
        setDataLoaded(true); // Mark data as loaded to prevent duplicate calls
        
        // Store current cart state for comparison
        if (!buyNowMode && user.cart_items) {
          sessionStorage.setItem('checkout_last_cart', JSON.stringify(user.cart_items));
        }
        
        console.log('[Checkout] Data loading completed successfully');
      } catch (error) {
        console.error('[Checkout] Error loading checkout data:', error);
        alert('Failed to load checkout data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    // Load data when user changes or cart items change
    loadCheckoutData();
  }, [user?.id, user?.cart_items, authLoading, buyNowMode, buyNowProductId, buyNowQuantity, orderSuccess, dataLoaded, router]); // Added user?.cart_items to dependencies

  // Calculate shipping based on state and order amount
  const calculateShipping = (state: string, orderTotal: number) => {
    if (orderTotal > 999) return 0; // Free shipping above ₹999
    
    // State-based shipping
    if (state.toLowerCase() === 'tamil nadu' || state.toLowerCase() === 'tn') {
      return 50; // ₹50 for Tamil Nadu
    } else {
      return 80; // ₹80 for rest of India
    }
  };

  // Calculate totals with memoization to prevent unnecessary recalculations
  const { subtotal, shipping, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = calculateShipping(shippingAddress.state, subtotal);
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [cartItems, shippingAddress.state]);

  // Shipping is now automatically recalculated via useMemo when state or cart changes

  // Handle online payment with Zoho Widget
// Handle online payment with Zoho Widget
const handleOnlinePayment = async (orderData: any) => {
  console.log('[Checkout] ===== HANDLE ONLINE PAYMENT CALLED =====');
  console.log('[Checkout] Payment completed:', paymentCompleted);
  console.log('[Checkout] Processing payment:', processingPayment);
  console.log('[Checkout] Show payment widget:', showPaymentWidget);
  
  if (paymentCompleted) {
    console.log('[Checkout] Payment already completed, returning');
    return;
  }

  setProcessingPayment(true);
  console.log('[Checkout] Set processing payment to true');
  
  try {
    if (!process.env.NEXT_PUBLIC_ZOHO_ACCOUNT_ID || !process.env.NEXT_PUBLIC_ZOHO_API_KEY) {
      throw new Error('Payment gateway not configured. Please contact support.');
    }
    console.log('[Checkout] Validating order amounts...');
    
    const verification = await clientAuth.calculateOrderTotal(
      cartItems.map(item => ({ 
        product_id: item.product_id, 
        quantity: item.quantity 
      })),
      shippingAddress,  // Pass full address
      shipping  // Pass for validation
    );

    if (!verification.success) {
      throw new Error(verification.error || 'Order validation failed');
    }

    // Check if amounts match
    const expectedTotal = verification.total || 0;
    if (Math.abs(expectedTotal - total) > 0.01) {
      throw new Error(
        `Price mismatch detected. Expected ₹${expectedTotal.toFixed(2)}, ` +
        `but got ₹${total.toFixed(2)}. Please refresh the page and try again.`
      );
    }

    console.log('[Checkout] Validation passed. Expected total:', expectedTotal);

    // ✅ STEP 1: Create payment session FIRST
    console.log('[Checkout] Creating payment session...');
    
    // Get auth token
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    const sessionResult = await initializeZohoPaymentWidget(
      total,
      'INR',
      `Dhanya Naturals - Order ${paymentOrderId}`,
      paymentOrderId,
      customerDetails,
      token,
      cartItems.map(item => ({ 
        product_id: item.product_id, 
        quantity: item.quantity 
      })),
      shipping
    );

    if (!sessionResult.success) {
      // Check if authentication is required
      if (sessionResult.authUrl) {
        console.log('[Checkout] Authentication required, redirecting...');
        window.location.href = sessionResult.authUrl;
        return;
      }
      throw new Error(sessionResult.error || 'Failed to create payment session');
    }

    const paymentsSessionId = sessionResult.payments_session_id;
    console.log('[Checkout] Payment session created:', paymentsSessionId);


    if (!paymentsSessionId) {
      throw new Error('Invalid payment session response');
    }
    setPaymentSessionId(paymentsSessionId); 

    // ✅ STEP 2: Now create pending order WITH the payment session ID
    console.log('[Checkout] Creating pending order with payment session ID...');
    const pendingOrderData = {
      ...orderData,
      status: 'pending' as const,
      payment_status: 'pending' as const,
      notes: (orderData.notes || '') + ' [Payment in progress - awaiting confirmation]',
      payment_id: null, // Now we have the actual session ID!
      payment_session_id: paymentsSessionId,
    };
    
    const pendingOrder = await orderService.createOrder(pendingOrderData);
    console.log('[Checkout] Pending order created:', pendingOrder.id);
    
    // Store order ID and session ID for recovery if browser closes
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pending_order_id', String((pendingOrder as any).id));
      sessionStorage.setItem('pending_order_time', new Date().toISOString());
      sessionStorage.setItem('pending_payment_amount', total.toString());
      sessionStorage.setItem('paymentsSessionId', paymentsSessionId);
    }
    
    // Set order ID for potential recovery
    setOrderId(String((pendingOrder as any).id));

    console.log('[Checkout] Setting show payment widget to true');
    setShowPaymentWidget(true);
    setProcessingPayment(false);
    console.log('[Checkout] Payment widget should now be visible');
    
  } catch (error) {
    console.error('Payment error:', error);
    
    // Show more specific error message
    let errorMessage = 'Failed to initiate payment. Please try again or contact support.';
    
    if (error instanceof Error) {
      if (error.message.includes('Payment gateway not configured')) {
        errorMessage = 'Online payments are temporarily unavailable. Please contact support.';
      } else if (error.message.includes('Invalid credentials')) {
        errorMessage = 'Payment service configuration error. Please contact support.';
      } else if (error.message.includes('Failed to create payment')) {
        errorMessage = 'Unable to process payment at this time. Please try again later or contact support.';
      }
    }
    
    alert(errorMessage);
    setProcessingPayment(false);
  }
};
  // Handle successful payment from widget
  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('[Checkout] ===== PAYMENT SUCCESS CALLBACK TRIGGERED =====');
    console.log('[Checkout] Payment successful:', paymentData);
    console.log('[Checkout] Payment data details:', {
      hasPaymentId: !!paymentData.payment_id,
      paymentId: paymentData.payment_id,
      paymentsSessionId: paymentData.payments_session_id,
      allKeys: Object.keys(paymentData)
    });
    
    // IMMEDIATELY close the payment widget by unmounting it
    setShowPaymentWidget(false);
    setSubmitting(true);
    
    // Store payment completion in state and localStorage
    setPaymentCompleted(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_id', paymentData.payment_id || '');
      localStorage.setItem('payment_time', new Date().toISOString());
    }
    
    try {
      // ✅ SECURITY: Get session token for authentication
      const token = await getSessionToken();
      console.log('[Checkout] Got session token for order creation');
      
      // Verify payment with backend API
      console.log('[Checkout] Verifying payment with API...');
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          payment_id: paymentData.payment_id,
          payments_session_id: paymentData.payments_session_id 
        }),
      });
      
      const verifyResult = await verifyResponse.json();
      console.log('[Checkout] Payment verification result:', verifyResult);
      
      if (verifyResponse.ok && verifyResult.success) {
        console.log('[Checkout] Payment verified successfully, updating pending order...');
        console.log('[Checkout] Verification details:', {
          success: verifyResult.success,
          is_success: verifyResult.is_success,
          is_failed: verifyResult.is_failed,
          payment: verifyResult.payment
        });
        
        // Get pending order ID from sessionStorage
        const pendingOrderId = typeof window !== 'undefined' 
          ? sessionStorage.getItem('pending_order_id')
          : null;
        
        let finalOrderId: string | null = null;
        
        if (pendingOrderId) {
          // Update existing pending order to confirmed
          console.log('[Checkout] Updating pending order:', pendingOrderId);
          try {
            await orderService.updateOrderStatus(parseInt(pendingOrderId), {
              status: 'confirmed',
              payment_status: 'success',
              payment_id: paymentData.payment_id,
              payment_session_id: paymentData.payments_session_id,

              notes: (notes || '') + ' [Order created after payment verification]'
            });
            console.log('[Checkout] Pending order updated to confirmed');
            
            // Clear sessionStorage
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('pending_order_id');
              sessionStorage.removeItem('pending_order_time');
              sessionStorage.removeItem('pending_payment_amount');
            }
            
            finalOrderId = pendingOrderId;
          } catch (updateError) {
            console.error('[Checkout] Failed to update pending order:', updateError);
            // Fallback: create new order if update fails
            throw new Error('Failed to update order. Please contact support with payment ID: ' + paymentData.payment_id);
          }
        } else {
          // No pending order found - create new order (backup)
          console.log('[Checkout] No pending order found, creating new order...');
          const orderData = {
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            shipping_address: shippingAddress,
            payment_method: 'Zoho Online Payment',
            payment_id: paymentData.payment_id,
            payment_status: 'success' as const,
            items: cartItems.map(item => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
              payment_session_id: paymentData.payments_session_id,      
              status: 'confirmed' as const,
             notes: (notes || '') + ' [Order created after payment verification]'
          };

          const newOrder = await orderService.createOrder(orderData as any);
          console.log('[Checkout] Order created successfully:', (newOrder as any).id);
          finalOrderId = String((newOrder as any).id);
        }
        
        // Clear cart after successful order (only for regular cart checkout, not buy now)
        if (!isBuyNow) {
          const userId = user.user_id || user.id;
          console.log('[Checkout] Clearing cart for user:', userId);
          await userDataService.clearCart(userId);
          await refreshUser();
        }
        
        // Clear payment data from localStorage after successful order creation
        if (typeof window !== 'undefined') {
          localStorage.removeItem('payment_completed');
          localStorage.removeItem('payment_id');
          localStorage.removeItem('payment_time');
          
          // Clear form data from sessionStorage after successful order
          sessionStorage.removeItem('checkout_customer_details');
          sessionStorage.removeItem('checkout_shipping_address');
          sessionStorage.removeItem('checkout_payment_method');
          sessionStorage.removeItem('checkout_notes');
        }
        
        // Show success UI immediately
        if (finalOrderId) {
          setOrderId(finalOrderId);
        }
        setOrderSuccess(true);
        setSubmitting(false);
        console.log('[Checkout] Order success state set, scrolling to top');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Send customer confirmation email
        fetch('/api/emails/order-placed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: String(customerDetails.email || ''),
            orderId: finalOrderId,
            customerName: customerDetails.name,
            total: Number(total ?? 0),
            items: cartItems.map(i => ({ name: i.product_name, qty: i.quantity, price: i.price })),
          })
        }).catch(() => {});

        // Send admin notification email
        fetch('/api/emails/order-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: finalOrderId,
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
            total: Number(total ?? 0),
            items: cartItems.map(i => ({ name: i.product_name, qty: i.quantity, price: i.price })),
          })
        }).catch(() => {});
        
        return;
      } else {
        throw new Error(verifyResult.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('[Checkout] Payment processing error:', error);
      
      const errorMessage = error instanceof Error 
        ? `Payment failed: ${error.message}` 
        : 'Payment verification failed. Please contact support.';
      
      alert(errorMessage);
      
      // Create a failed order for tracking
      try {
        console.log('[Checkout] Creating failed order for tracking...');
        const failedOrderData = {
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
          shipping_address: shippingAddress,
          payment_method: 'Zoho Online Payment',
          payment_status: 'failed' as const,
          items: cartItems.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          })),
          status: 'cancelled' as const,
          notes: `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };

      await orderService.createOrder(failedOrderData as any);
      console.log('[Checkout] Failed order created for tracking');
      } catch (orderError) {
        console.error('[Checkout] Failed to create failed order:', orderError);
      }
    } finally {
      setSubmitting(false);
      setShowPaymentWidget(false);
    }
  };

  // Handle payment recovery verification
  const handleRecoveryVerify = async () => {
    if (!recoveryOrderId) return;
    
    try {
      // Get the order to check if it's already confirmed
      const order = await orderService.getOrderById(parseInt(recoveryOrderId));
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // If order is already confirmed, nothing to do
      if (order.payment_status === 'success' && order.status === 'confirmed') {
        console.log('[Recovery] Order already confirmed');
        // Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_order_time');
          sessionStorage.removeItem('pending_payment_amount');
        }
        return;
      }
      
      // Get session token for API call
      const token = await getSessionToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('[Recovery] Attempting to verify payment for order:', recoveryOrderId);
      
      // Query Zoho Payments API to check for recent successful payments
      // Check payments from the last 2 hours for this customer
      
      // Note: Zoho Payments API would need to be queried here
      // For now, we'll use a fallback approach - check if order has payment_id in notes
      // In production, integrate with Zoho's payment list API
      
      // ✅ SECURITY: Verify order ownership client-side before verifying payment
      if (user?.email && order.customer_email) {
        const ownershipCheck = await clientAuth.verifyOrderOwnership(recoveryOrderId, user.email);
        
        if (!ownershipCheck.success) {
          throw new Error(ownershipCheck.error || 'You do not have permission to verify this order');
        }
      }
      
      // Try to find payment using order reference (paymentOrderId format)
      const orderReference = `#${recoveryOrderId}`;
      
      // Call verification API to check for any matching payments
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          payments_session_id: sessionStorage.getItem('paymentsSessionId') || '',
          // Additional params to search by customer email and amount
          customer_email: order.customer_email,
          amount: parseFloat(recoveryOrderAmount)
        }),
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyResult.is_success && verifyResult.payment) {
        // Payment found! Update the order
        console.log('[Recovery] Payment found, updating order:', verifyResult.payment.id);
        
        await orderService.updateOrderStatus(parseInt(recoveryOrderId), {
          status: 'confirmed',
          payment_status: 'success',
          payment_id: verifyResult.payment.id
        });
        
        // Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_order_time');
          sessionStorage.removeItem('pending_payment_amount');
        }
        
        // Clear cart
        if (!isBuyNow) {
          const userId = user?.user_id || user?.id;
          if (userId) {
            await userDataService.clearCart(userId);
            await refreshUser();
          }
        }
        
        // Clear form data from sessionStorage after successful recovery
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('checkout_customer_details');
          sessionStorage.removeItem('checkout_shipping_address');
          sessionStorage.removeItem('checkout_payment_method');
          sessionStorage.removeItem('checkout_notes');
        }
        
        // Set success state
        setOrderId(recoveryOrderId);
        setOrderSuccess(true);
        setShowRecoveryModal(false);
        
        return;
      } else {
        // No payment found
        throw new Error('No successful payment found. If you completed the payment, please contact support with your order number.');
      }
      
    } catch (error) {
      console.error('[Recovery] Verification error:', error);
      throw error;
    }
  };

  // Handle dismissal of recovery modal
  const handleRecoveryDismiss = () => {
    // Clear pending order data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pending_order_id');
      sessionStorage.removeItem('pending_order_time');
      sessionStorage.removeItem('pending_payment_amount');
    }
    setRecoveryOrderId(null);
    setRecoveryOrderAmount('0');
  };

  // Handle payment error from widget
  const handlePaymentError = async (error: any) => {
    console.error('Payment widget error:', error);
    
    // Check if this is a widget closure vs actual payment failure
    const isWidgetClosure = error?.code === 'cancelled' || 
                           error?.status === 'cancelled' || 
                           error?.message?.toLowerCase().includes('cancelled') ||
                           error?.message?.toLowerCase().includes('closed');
    
    if (isWidgetClosure) {
      // User closed the widget - don't create an order, just close
      console.log('Payment widget closed by user - no order created');
      setShowPaymentWidget(false);
      
      // Reset payment completed state since it was cancelled
      setPaymentCompleted(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('payment_completed');
        localStorage.removeItem('payment_id');
        localStorage.removeItem('payment_time');
      }
      return;
    }
    
    // This is an actual payment failure - create failed order for tracking
    setSubmitting(true);
    
    try {
      const failedOrderData = {
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        shipping_address: shippingAddress,
        payment_method: 'Zoho Online Payment',
        payment_status: 'failed' as const,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total_amount: total,
        status: 'cancelled' as const,
        notes: `Payment failed: ${error?.message || error || 'Unknown payment error'}`
      };

      await orderService.createOrder(failedOrderData as any);
      console.log('Failed order created for tracking payment failure');
      alert('Payment failed. Please try again.');
    } catch (orderError) {
      console.error('Failed to create failed order:', orderError);
      alert('Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
      setShowPaymentWidget(false);
    }
  };

  // Handle form submission
  const handleSubmitOrder = async () => {
    if (!user) return;

    console.log('[Checkout] Starting order submission...');

    // Validation
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      alert('Please fill in all customer details');
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      alert('Please fill in all shipping address fields');
      return;
    }
    
    // Check if any items are out of stock or have insufficient quantity at submission time
    const outOfStockItems = cartItems.filter(item => !item.in_stock);
    const insufficientQuantityItems = cartItems.filter(item => 
      item.in_stock && item.quantity > item.stock_quantity
    );
    
    if (outOfStockItems.length > 0 || insufficientQuantityItems.length > 0) {
      let message = '';
      
      if (outOfStockItems.length > 0) {
        const outOfStockNames = outOfStockItems.map(item => item.product_name).join(", ");
        message += `Sorry, the following items are no longer in stock: ${outOfStockNames}.\n\n`;
      }
      
      if (insufficientQuantityItems.length > 0) {
        const quantityIssues = insufficientQuantityItems.map(item => 
          `${item.product_name} (requested: ${item.quantity}, available: ${item.stock_quantity})`
        ).join(", ");
        message += `The following items have insufficient quantity: ${quantityIssues}.`;
      }
      
      message += "\n\nPlease update your cart before proceeding.";
      alert(message);
      router.push('/cart');
      return;
    }

    setSubmitting(true);
    
    try {
      console.log('[Checkout] Preparing order data...');
      // Prepare order data
      const orderData = {
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        shipping_address: shippingAddress,
        payment_method: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Zoho Online Payment',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        total_amount: total,
        payment_id:null,
        status: 'processing' as const,
        payment_status: 'pending' as const,
        notes: notes || undefined
      };

      console.log('[Checkout] Order data prepared:', orderData);

      // Handle online payment
      if (paymentMethod === 'online') {
        if (!paymentCompleted) {
          console.log('[Checkout] Initiating online payment...');
          await handleOnlinePayment(orderData);
          return;
        } else {
          console.log('[Checkout] Payment already completed, proceeding with order creation...');
          // Payment is completed, proceed to create order
        }
      } else {
        console.log('[Checkout] Creating COD order...');
        // Handle COD - create order directly
        const newOrder = await orderService.createOrder(orderData as any);
        console.log('[Checkout] COD order created successfully:', newOrder.id);
        
        // Clear cart after successful order (only for regular cart checkout, not buy now)
        if (!isBuyNow) {
          const userId = user.user_id || user.id;
          console.log('[Checkout] Clearing cart for user:', userId);
          await userDataService.clearCart(userId);
          await refreshUser();
        }
        
        // Clear form data from sessionStorage after successful order
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('checkout_customer_details');
          sessionStorage.removeItem('checkout_shipping_address');
          sessionStorage.removeItem('checkout_payment_method');
          sessionStorage.removeItem('checkout_notes');
        }
        
        setOrderId(String(newOrder.id));
        setOrderSuccess(true);
        console.log('[Checkout] Order success state set');
        
        // Fire and forget: send order placed email via server API
        fetch('/api/emails/order-placed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: String(customerDetails.email || ''),
            orderId: String((newOrder as any).id),
            items: (orderData as any).items?.map((i: any) => ({ name: i.product_name || i.name, qty: i.quantity || i.qty || 1, price: Number(i.price) || 0 })) || [],
            total: Number((orderData as any).total_amount ?? 0),
            customerName: customerDetails.name,
          })
        }).catch(() => {});
        
        // Scroll to top on mobile to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // This should only run for online payments that are already completed
      console.log('[Checkout] Creating online payment order...');
      const newOrder = await orderService.createOrder(orderData as any);
      console.log('[Checkout] Online payment order created successfully:', newOrder.id);
      
      // Clear cart after successful order (only for regular cart checkout, not buy now)
      if (!isBuyNow) {
        const userId = user.user_id || user.id;
        console.log('[Checkout] Clearing cart for user:', userId);
        await userDataService.clearCart(userId);
        await refreshUser();
      }
      
      // Clear form data from sessionStorage after successful order
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('checkout_customer_details');
        sessionStorage.removeItem('checkout_shipping_address');
        sessionStorage.removeItem('checkout_payment_method');
        sessionStorage.removeItem('checkout_notes');
      }
      
      setOrderId(String(newOrder.id));
      setOrderSuccess(true);
      console.log('[Checkout] Order success state set');
      
      // Fire and forget: send order placed email via server API
      fetch('/api/emails/order-placed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: String(customerDetails.email || ''),
          orderId: String((newOrder as any).id),
          items: (orderData as any).items?.map((i: any) => ({ name: i.product_name || i.name, qty: i.quantity || i.qty || 1, price: Number(i.price) || 0 })) || [],
          total: Number((orderData as any).total_amount ?? 0),
          customerName: customerDetails.name,
        })
      }).catch(() => {});
      
      // Scroll to top on mobile to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('[Checkout] Error creating order:', error);
      
      // Check if it's a price validation error
      if (error instanceof Error && error.message.includes('Price mismatch detected')) {
        alert('Price has changed. Please refresh your cart and try again.');
        // Optionally redirect to cart page
        router.push('/cart');
      } else {
        alert('Failed to place order. Please try again.');
      }
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
    console.log('[Checkout] Rendering order success page with orderId:', orderId);
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
                  <p className="font-bold text-lg text-green-800">#{orderId || 'Processing...'}</p>
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
                  <p className="font-semibold text-gray-800 text-sm">{shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state}</p>
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
          <Link href={isBuyNow && buyNowProductId ? `/products/${buyNowProductId}` : "/cart"}>
            <Button variant="outline" size="sm" className="glass-input bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isBuyNow ? "Back to Product" : "Back to Cart"}
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            {isBuyNow ? "Buy Now Checkout" : "Checkout"}
          </h1>
        </div>

        {/* Shipping Information Banner */}
        <div className="glass-card p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-blue-800 flex-1">
              <p className="font-medium mb-1">🚚 Shipping Information</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Free shipping</strong> for orders above ₹999</li>
                <li>• <strong>₹50</strong> for Tamil Nadu</li>
                <li>• <strong>₹80</strong> for rest of India</li>
              </ul>
            </div>
          </div>
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
                      onChange={(e) => {
                        setCustomerDetails(prev => ({ ...prev, name: e.target.value }));
                      }}
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
                      onChange={(e) => {
                        setCustomerDetails(prev => ({ ...prev, phone: e.target.value }));
                      }}
                      className="glass-input"
                      placeholder="Enter your phone number"
                      maxLength={15}
                      minLength={10}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email Address * 
                    <span className="text-xs text-green-600 font-medium flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                      From Account
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      readOnly
                      className="glass-input bg-gray-50 cursor-not-allowed text-gray-700"
                      placeholder="your.email@example.com"
                    />
                  </div>
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
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, street: e.target.value }));
                    }}
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
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, city: e.target.value }));
                      }}
                      className="glass-input"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                                         <Select value={shippingAddress.state} onValueChange={(value) => {
                                           setShippingAddress(prev => ({ ...prev, state: value }));
                                         }}>
                       <SelectTrigger className="glass-input w-full">
                         <SelectValue placeholder="Select your state" />
                       </SelectTrigger>
                                              <SelectContent className="w-[var(--radix-select-trigger-width)] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                         <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                        <SelectItem value="Assam">Assam</SelectItem>
                        <SelectItem value="Bihar">Bihar</SelectItem>
                        <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                        <SelectItem value="Goa">Goa</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Haryana">Haryana</SelectItem>
                        <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                        <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Kerala">Kerala</SelectItem>
                        <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Manipur">Manipur</SelectItem>
                        <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                        <SelectItem value="Mizoram">Mizoram</SelectItem>
                        <SelectItem value="Nagaland">Nagaland</SelectItem>
                        <SelectItem value="Odisha">Odisha</SelectItem>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="Sikkim">Sikkim</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Tripura">Tripura</SelectItem>
                        <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                        <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                        <SelectItem value="West Bengal">West Bengal</SelectItem>
                        <SelectItem value="Delhi">Delhi</SelectItem>
                        <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                        <SelectItem value="Ladakh">Ladakh</SelectItem>
                        <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                        <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                        <SelectItem value="Puducherry">Puducherry</SelectItem>
                        <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PIN Code *</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }));
                      }}
                      className="glass-input"
                      placeholder="110001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                                         <Select value={shippingAddress.country} onValueChange={(value) => {
                                           setShippingAddress(prev => ({ ...prev, country: value }));
                                         }}>
                       <SelectTrigger className="glass-input w-full">
                         <SelectValue />
                       </SelectTrigger>
                                              <SelectContent className="w-[var(--radix-select-trigger-width)] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
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
                    className="p-4 glass-input rounded-lg cursor-not-allowed transition-colors opacity-60 bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="cod"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                        }}
                        className="text-green-600"
                        disabled={true}
                      />
                      <label htmlFor="cod" className="flex-1 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600">Cash on Delivery</span>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Coming Soon</span>
                        </div>
                        <div className="text-sm text-gray-500">Pay when your order arrives</div>
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 glass-input rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'online' ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => {
                      setPaymentMethod('online');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="online"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                        }}
                        className="text-green-600 mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor="online" className="cursor-pointer">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-base mb-1">Online Payment</div>
                              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                                Credit/Debit Card, UPI, Net Banking
                              </div>
                            </div>
                            
                            {/* Zoho branding section */}
                            <div className="flex flex-col sm:items-end gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 font-medium">Powered by</span>
                                <div className="flex items-center gap-1 bg-white px-1 py-1 rounded-md shadow-sm border">
                                  <Image 
                                    src="/zoho.jpg" 
                                    alt="Zoho Payments" 
                                    width={35} 
                                    height={35} 
                                    className="rounded-sm object-contain"
                                  />
                                  <span className="text-xs text-gray-700">Zoho Payments</span>
                                </div>
                              </div>
                              
                              {/* Payment method badges */}
                              <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">UPI</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Cards</span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">Net Banking</span>
                              </div>
                              
                              {/* Security badge */}
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Secure & Fast</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
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
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
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
                  {shipping > 0 && (
                    <div className="text-xs text-gray-600 -mt-1 text-right">
                      {shippingAddress.state && (
                        <span>
                          {shippingAddress.state.toLowerCase() === 'tamil nadu' || shippingAddress.state.toLowerCase() === 'tn' 
                            ? '₹50 for Tamil Nadu' 
                            : '₹80 for rest of India'}
                        </span>
                      )}
                    </div>
                  )}
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
                  onClick={() => {
                    handleSubmitOrder();
                  }}
                  disabled={submitting || processingPayment || !paymentOrderId}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : processingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    paymentMethod === 'online' ? 'Pay Now' : 'Place Order'
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

      {/* Zoho Payment Widget - Only show if not in success state */}
      {showPaymentWidget && !orderSuccess && paymentSessionId && (
        <>
          {console.log('[Checkout] Rendering ZohoPaymentWidget with props:', {
            amount: total,
            orderId: paymentOrderId,
            showPaymentWidget,
            orderSuccess,
            onSuccess: 'handlePaymentSuccess'
          })}
          <ZohoPaymentWidget
            amount={total}
            currency="INR"
            description={`Dhanya Naturals - Order ${paymentOrderId}`}
            customerDetails={customerDetails}
            orderId={paymentOrderId}
            paymentsSessionId={paymentSessionId}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={() => setShowPaymentWidget(false)}
            onSessionReady={(paymentSessionId) => {
              console.log('[Checkout] Payment session ID:', paymentSessionId);
              if (paymentSessionId) {
                sessionStorage.setItem('paymentsSessionId', paymentSessionId);
              }
            }}
            authToken={undefined} // Will be fetched by widget when needed
            cartItems={cartItems.map(item => ({ 
              product_id: item.product_id, 
              quantity: item.quantity 
            }))} // ✅ SECURITY: Pass cart items for server-side verification
            shippingCharge={shipping} // ✅ SECURITY: Pass shipping for server-side verification
            shippingAddress={shippingAddress} // ✅ SECURITY: Pass shipping address for validation
          />
        </>
      )}

      {/* Payment Recovery Modal */}
      {recoveryOrderId && (
        <PaymentRecoveryModal
          open={showRecoveryModal}
          onOpenChange={setShowRecoveryModal}
          orderId={recoveryOrderId}
          orderAmount={recoveryOrderAmount}
          onVerify={handleRecoveryVerify}
          onDismiss={handleRecoveryDismiss}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
