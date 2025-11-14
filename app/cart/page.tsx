"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { userDataService, productService } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { CartItemWithDetails, CartItem, Product } from "@/lib/types"


export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const router = useRouter();
  const fetchingRef = useRef(false);
  const initializationRef = useRef(false);
  const productMap = useRef<Record<number, Product>>({});



  useEffect(() => {
    // Prevent multiple initializations with ref
    if (initializationRef.current) {
      return;
    }
    
    // Only proceed if auth is done and we haven't initialized
    if (authLoading || hasInitialized) {
      return;
    }
    
    // Mark as initializing immediately
    initializationRef.current = true;
    
    // If no user, set empty cart and mark as initialized
    if (!user) {
      setCartItems([]);
      setLoading(false);
      setHasInitialized(true);
      return;
    }
    
    // Prevent duplicate calls
    if (fetchingRef.current) {
      return;
    }
    
    const fetchCart = async () => {
      try {
        fetchingRef.current = true;
        setLoading(true);
        const userId = user.user_id || user.id;
        if (!userId) {
          setLoading(false);
          setHasInitialized(true);
          return;
        }
        
        // Use the user's cart data directly from AuthContext (already fetched)
        const cartItems = user.cart_items || [];
        
        if (cartItems.length === 0) {
          setCartItems([]);
          setLoading(false);
          setHasInitialized(true);
          return;
        }
        
        // Get unique product IDs
        const productIds = cartItems.map((item: CartItem) => item.product_id);
        const uniqueProductIds: number[] = Array.from(new Set(productIds));
        
        const products = await productService.getProductsByIds(uniqueProductIds) as unknown as Product[];
        
        // Create product lookup map and store in ref
        const newProductMap = products.reduce((acc: Record<number, Product>, product: Product) => {
          if (product) {
            acc[product.id] = product;
          }
          return acc;
        }, {} as Record<number, Product>);
        productMap.current = newProductMap;
        
        // Map cart items with product details
        const cartWithDetails = cartItems.map((item: CartItem) => {
          const product: Product | undefined = newProductMap[item.product_id];
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
        setLoading(false);
        setHasInitialized(true);
      } catch (error) {
        setLoading(false);
        setHasInitialized(true);
      } finally {
        fetchingRef.current = false;
      }
    };
    
    fetchCart();
  }, [authLoading, user?.id, hasInitialized]); // Only depend on user.id, not entire user object

  // Re-sync cart items when user cart data changes (after refreshUser calls)
  useEffect(() => {
    if (hasInitialized && user && !updating) { // Don't sync during updates to prevent conflicts
      const userCartItems = user.cart_items || [];
      const currentProductIds = cartItems.map(item => item.product_id);
      const userCartProductIds = userCartItems.map((item: CartItem) => item.product_id);
      
      // Check if the cart has changed significantly (new/removed items, not just quantity changes during updates)
      const hasNewOrRemovedItems = currentProductIds.length !== userCartProductIds.length ||
        currentProductIds.some((id: number) => !userCartProductIds.includes(id)) ||
        userCartProductIds.some((id: number) => !currentProductIds.includes(id));
      
      // Only sync for significant changes, not minor quantity updates
      if (hasNewOrRemovedItems) {
        // Re-fetch cart with updated data
        const fetchUpdatedCart = async () => {
          try {
            if (userCartItems.length === 0) {
              setCartItems([]);
              return;
            }
            
            // Get unique product IDs
            const productIds = userCartItems.map((item: CartItem) => item.product_id);
            const uniqueProductIds: number[] = Array.from(new Set(productIds));
            
            // Check if we already have all products in our cache
            const missingProductIds = uniqueProductIds.filter((id: number) => !productMap.current[id as number]);
            
            if (missingProductIds.length > 0) {
              // Only fetch missing products
              const products = await productService.getProductsByIds(missingProductIds) as unknown as Product[];
              
              // Update product cache
              products.forEach((product: Product) => {
                if (product) {
                  productMap.current[product.id] = product;
                }
              });
            }
            
            // Map cart items with product details using cached data
            const cartWithDetails = userCartItems.map((item: CartItem) => {
              const product: Product | undefined = productMap.current[item.product_id];
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
          }
        };
        
        fetchUpdatedCart();
      }
    }
  }, [user?.cart_items, hasInitialized, updating]);

  // Fetch featured products for recommendations
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
              const products = await productService.getProducts({ featured: true }) as unknown as Product[];
        // Get 2 random featured products, excluding items already in cart
        const cartProductIds = cartItems.map(item => item.product_id);
        const availableProducts = products.filter(p => !cartProductIds.includes(p.id));
        const randomProducts = availableProducts.sort(() => Math.random() - 0.5).slice(0, 2);
        setFeaturedProducts(randomProducts);
      } catch (error) {
      }
    };

    if (hasInitialized) {
      fetchFeaturedProducts();
    }
  }, [cartItems, hasInitialized]);

  const [promoCode, setPromoCode] = useState("")

  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    if (!user) return;
    
    setUpdating(productId);
    try {
      if (newQuantity === 0) {
        const userId = user.user_id || user.id;
        await userDataService.removeFromCart(userId, productId);
        setCartItems(prev => prev.filter((item) => item.product_id !== productId));
        
        // Refresh AuthContext so checkout page can see the updated cart
        await refreshUser();
      } else {
        // Check stock before updating
        const item = cartItems.find(item => item.product_id === productId);
        if (item && newQuantity > item.stock_quantity) {
          alert(`Only ${item.stock_quantity} items available in stock`);
          setUpdating(null);
          return;
        }

        // Update local state immediately for better UX
        setCartItems(prev => prev.map((item) => 
          item.product_id === productId ? { ...item, quantity: newQuantity } : item
        ));

        const userId = user.user_id || user.id;
        await userDataService.updateCartQuantity(userId, productId, newQuantity);
        
        // Refresh AuthContext so checkout page can see the updated cart
        await refreshUser();
      }
      
      // Cart updated successfully
    } catch (error) {
      alert('Failed to update quantity');
      
      // Revert local state on error
      const userData = await userDataService.getUserData(user.user_id || user.id);
      if (userData?.cart_items) {
        const cartWithDetails = userData.cart_items.map((item: CartItem) => {
          const product: Product | undefined = productMap.current[item.product_id];
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
      }
    } finally {
      setUpdating(null);
    }
  }, [user, cartItems, refreshUser]);

  const removeItem = useCallback(async (productId: number) => {
    if (!user) return;
    
    setUpdating(productId);
    try {
      // Update local state immediately for better UX
      setCartItems(prev => prev.filter((item) => item.product_id !== productId));
      
      const userId = user.user_id || user.id;
      await userDataService.removeFromCart(userId, productId);
      
      // Refresh AuthContext so checkout page can see the updated cart
      await refreshUser();
    } catch (error) {
      alert('Failed to remove item');
      
      // Revert local state on error
      const userData = await userDataService.getUserData(user.user_id || user.id);
      if (userData?.cart_items) {
        const cartWithDetails = userData.cart_items.map((item: CartItem) => {
          const product: Product | undefined = productMap.current[item.product_id];
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
      }
    } finally {
      setUpdating(null);
    }
  }, [user, refreshUser]);

  const clearCart = useCallback(async () => {
    if (!user || !confirm('Are you sure you want to clear your cart?')) return;
    
    setLoading(true);
    try {
      // Update local state immediately for better UX
      setCartItems([]);
      
      const userId = user.user_id || user.id;
      await userDataService.clearCart(userId);
      
      // No need to refresh user - CartContext will handle the sync automatically
    } catch (error) {
      alert('Failed to clear cart');
      
      // Revert local state on error
      const userData = await userDataService.getUserData(user.user_id || user.id);
      if (userData?.cart_items) {
        const cartWithDetails = userData.cart_items.map((item: CartItem) => {
          const product: Product | undefined = productMap.current[item.product_id];
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
      }
    } finally {
      setLoading(false);
    }
  }, [user, refreshUser]);

  const addRecommendedProduct = async (productId: number) => {
    if (!user) return;
    
    setAddingProduct(productId);
    try {
      await addToCartContext(productId, 1);
      // Remove from featured products after adding
      setFeaturedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      alert('Failed to add product to cart');
    } finally {
      setAddingProduct(null);
    }
  };

  const { subtotal, shipping, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // New shipping logic: Free above ₹999, ₹50 for TN, ₹80 for rest of India
    let shipping = 0;
    if (subtotal <= 999) {
      // For now, we'll use a default shipping cost
      // The actual state-based calculation will happen in checkout
      shipping = 50; // Default to rest of India rate
    }
    
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [cartItems]); 

  if (authLoading) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Link href="/products">
              <Button variant="outline" size="sm" className="glass-input bg-transparent w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Continue Shopping</span>
                <span className="sm:hidden">Back to Products</span>
              </Button>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Shopping Cart</h2>
          </div>
          {cartItems.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                clearCart();
              }}
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <div className="glass-card p-6 sm:p-12 max-w-md mx-auto">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Add some products to get started!</p>
              <Link href="/products">
                <Button className="glass-button w-full sm:w-auto">Shop Now</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="glass-card">
                <div className="p-4 sm:p-6 border-b border-white/20">
                  <h3 className="text-lg sm:text-xl font-semibold">Cart Items ({cartItems.length})</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product_id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4 glass-input rounded-lg">
                      {/* Product Image and Info */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <Link href={`/products/${item.product_id}`}>
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.product_name}
                            width={60}
                            height={60}
                            className="sm:w-20 sm:h-20 rounded-lg object-cover cursor-pointer hover-lift flex-shrink-0"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product_id}`}>
                            <h3 className="font-semibold hover:text-green-600 cursor-pointer text-sm sm:text-base truncate">{item.product_name}</h3>
                          </Link>
                          <p className="text-green-600 font-medium text-sm sm:text-base">₹{item.price}</p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                            {item.in_stock ? (
                              <span className="text-green-600">✓ In Stock</span>
                            ) : (
                              <span className="text-red-600">✗ Out of Stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quantity Controls and Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeItem(item.product_id);
                              } else {
                                updateQuantity(item.product_id, item.quantity - 1);
                              }
                            }}
                            disabled={updating === item.product_id}
                            className="glass-input h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            {updating === item.product_id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : item.quantity === 1 ? (
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                          <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updating === item.product_id || !item.in_stock || item.quantity >= item.stock_quantity}
                            className="glass-input h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            {updating === item.product_id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Price and Remove Button */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-sm sm:text-base">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.product_id)}
                            disabled={updating === item.product_id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            {updating === item.product_id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="glass-card">
                <div className="p-4 sm:p-6 border-b border-white/20">
                  <h3 className="text-lg sm:text-xl font-semibold">Order Summary</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm sm:text-base">
                    <span>Shipping</span>
                    <span className="font-medium">{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 sm:pt-4">
                    <div className="flex justify-between font-semibold text-base sm:text-lg">
                      <span>Total</span>
                      <span className="text-green-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {subtotal < 999 && (
                    <div className="mb-12 mt-12 glass-badge bg-blue-500 p-3 rounded-lg text-xs sm:text-sm text-white">
                      <span className="block sm:inline">Add ₹{(999 - subtotal).toFixed(2)} more</span>
                      <span className="block sm:inline"> for free shipping!</span>
                    </div>
                  )}
                  <div className="space-y-1"></div>
               {/*   <div className="space-y-2">
                    <Input
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="glass-input text-sm sm:text-base"
                    />
                    <Button variant="outline" className="w-full glass-input bg-transparent text-sm sm:text-base">
                      Apply Code
                    </Button>
                  </div> */}
                  <Link href="/checkout">
                    <Button className="w-full glass-button text-sm sm:text-base py-2 sm:py-3" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <div className="text-center text-xs sm:text-sm text-gray-600">
                    <p>🔒 Secure checkout with SSL encryption</p>
                  </div>
                </div>
              </div>

              {/* Recommended Products */}
              {featuredProducts.length > 0 && (
                <div className="glass-card mt-4 sm:mt-6 hidden lg:block">
                  <div className="p-4 sm:p-6 border-b border-white/20">
                    <h3 className="text-base sm:text-lg font-semibold">You might also like</h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {featuredProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 glass-input rounded-lg">
                          <Link href={`/products/${product.id}`}>
                            <Image
                              src={product.image_url || product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${product.id}`}>
                              <p className="font-medium text-xs sm:text-sm truncate hover:text-green-600 cursor-pointer">
                                {product.name}
                              </p>
                            </Link>
                            <p className="text-green-600 font-semibold text-xs sm:text-sm">₹{product.price}</p>
                          </div>
                          <Button 
                            size="sm" 
                            className="glass-button text-xs"
                            onClick={() => addRecommendedProduct(product.id)}
                            disabled={addingProduct === product.id}
                          >
                            {addingProduct === product.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Add'
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
