"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Leaf,
  ShoppingBag,
  Star,
  Heart,
  Share2,
  Plus,
  Minus,
  ArrowLeft,
  Shield,
  Truck,
  RotateCcw,
  CheckCircle,
} from "lucide-react"
import { productService, userDataService, reviewService, supabase, type Product, type Review } from "@/lib/supabase"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"

// import { useToast } from "@/hooks/use-toast"



export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { user } = useAuth();
  // const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false) // Prevent duplicate API calls
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addCartLoading, setAddCartLoading] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    reviewText: ""
  })
  
  const loadingRef = useRef(false) // Prevent race conditions

  useEffect(() => {
    // Prevent duplicate API calls in React Strict Mode
    if (dataLoaded || !id || loadingRef.current) return;
    
    console.log(`[Product] useEffect triggered for ID: ${id}`);
    loadingRef.current = true;
    loadProduct()
    loadReviews()
  }, [id, dataLoaded])

  useEffect(() => {
    if (user && reviews.length > 0) {
      extractUserReview()
    }
  }, [user, reviews])

  const loadProduct = async () => {
    try {
      console.log(`[Product] Loading product ID: ${id}`);
      const productData = await productService.getProductById(Number.parseInt(id))
      if (productData) {
        setProduct(productData)
        // Load related products
        const related = await productService.getRelatedProducts(productData.id, productData.category, 4)
        setRelatedProducts(related)
        
        // Prefetch related products for instant navigation
        related.forEach(relatedProduct => {
          router.prefetch(`/products/${relatedProduct.id}`)
        })
      }
    } catch (error) {
      console.error("Error loading product:", error)
    } finally {
      setLoading(false)
      setDataLoaded(true) // Mark as loaded to prevent duplicate calls
    }
  }

  const loadReviews = async () => {
    try {
      console.log(`[Product] Loading reviews for product ID: ${id}`);
      const reviewsData = await reviewService.getProductReviews(parseInt(id))
      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading reviews:", error)
    }
  }

  const extractUserReview = () => {
    if (!user) return
    
    // Find user's review from already loaded reviews (no API call needed!)
    const userReviewData = reviews.find(review => 
      review.user_id === (user.user_id || user.id)
    )
    
    setUserReview(userReviewData || null)
    if (userReviewData) {
      setReviewFormData({
        rating: userReviewData.rating,
        reviewText: userReviewData.review_text || ""
      })
    } else {
      // Reset form if no existing review
      setReviewFormData({
        rating: 5,
        reviewText: ""
      })
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      // Create a custom notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>🔒</span>
          <div>
            <div class="font-semibold">Authentication Required</div>
            <div class="text-sm opacity-90">Please login to add items to your cart.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
      return;
    }
    
    if (!product) return;
    
    setAddCartLoading(true);
    try {
      await addToCart(product.id, quantity);
      
      // Create success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>🛒</span>
          <div>
            <div class="font-semibold">Added to Cart!</div>
            <div class="text-sm opacity-90">${product.name} (${quantity} ${quantity === 1 ? 'item' : 'items'}) added to your cart.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
      
    } catch (err) {
      // Create error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>❌</span>
          <div>
            <div class="font-semibold">Failed to Add Item</div>
            <div class="text-sm opacity-90">There was an error adding the item to your cart. Please try again.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
    } finally {
      setAddCartLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/products/${id}`));
      return;
    }
    
    if (!product) return;

    // Check stock
    if (!product.in_stock || product.stock_quantity < quantity) {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <div>
            <div class="font-semibold">Out of Stock</div>
            <div class="text-sm opacity-90">This product is out of stock or insufficient quantity available.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
      return;
    }

    // Redirect to checkout with buy now parameters
    router.push(`/checkout?buyNow=true&product=${product.id}&quantity=${quantity}`);
  }

  const handleShare = async () => {
    if (!product) return

    const shareData = {
      title: `${product.name} - Dhanya Naturals`,
      text: `Check out this amazing ${product.name} from Dhanya Naturals! ${product.description}`,
      url: window.location.href
    }

    try {
      // Check if Web Share API is supported (mobile browsers)
      if (navigator.share) {
        await navigator.share(shareData)
        
        // Success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            <span>📤</span>
            <div>
              <div class="font-semibold">Shared Successfully!</div>
              <div class="text-sm opacity-90">Product shared via your device.</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.remove();
        }, 3000);
      } else {
        // Fallback: Copy to clipboard
        // Try clipboard API first
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href)
          
          // Success notification for clipboard
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
          notification.innerHTML = `
            <div class="flex items-center gap-2">
              <span>📋</span>
              <div>
                <div class="font-semibold">Link Copied!</div>
                <div class="text-sm opacity-90">Product link copied to clipboard.</div>
              </div>
            </div>
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.remove();
          }, 3000);
        } else {
          // Final fallback: Show share options
          showShareOptions()
        }
      }
    } catch (error) {
      console.error('Error sharing:', error)
      
      // Show share options as fallback if sharing fails
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share, do nothing
        return
      }
      
      // For other errors, show share options
      showShareOptions()
    }
  }

  const showShareOptions = () => {
    if (!product) return

    const currentUrl = window.location.href
    const text = `Check out this amazing ${product.name} from Dhanya Naturals!`
    
    // Create share options modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm mx-4 animate-scale-in">
        <h3 class="text-lg font-semibold mb-4 text-center">Share Product</h3>
        <div class="space-y-3">
          <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + currentUrl)}" 
             target="_blank" 
             class="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
            <span class="text-2xl">📱</span>
            <span class="font-medium">WhatsApp</span>
          </a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}" 
             target="_blank"
             class="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            <span class="text-2xl">✈️</span>
            <span class="font-medium">Telegram</span>
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}" 
             target="_blank"
             class="flex items-center gap-3 p-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors">
            <span class="text-2xl">🐦</span>
            <span class="font-medium">Twitter</span>
          </a>
          <button onclick="navigator.clipboard.writeText('${currentUrl}').then(() => { 
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    notification.textContent = 'Link copied!';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 2000);
                    this.closest('.fixed').remove();
                  })"
                  class="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <span class="text-2xl">📋</span>
            <span class="font-medium">Copy Link</span>
          </button>
        </div>
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full mt-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
  }

  const handleSubmitReview = async () => {
    if (!user || !product) return

    setReviewLoading(true)
    try {
      // Get proper user name from user data
      let userName = "Anonymous"
      if (user.email) {
        // Try to get name from email (part before @)
        userName = user.email.split('@')[0]
      }
      // Override with actual name if available
      if (user.name && user.name.trim()) {
        userName = user.name
      }

      const reviewData = {
        product_id: product.id,
        user_id: user.user_id || user.id,
        user_name: userName,
        user_email: user.email || "",
        rating: reviewFormData.rating,
        review_text: reviewFormData.reviewText,
        verified_purchase: false // Will be calculated on the backend
      }

      await reviewService.createOrUpdateReview(reviewData)
      
      // Reload reviews (this will automatically update user review via extractUserReview)
      await loadReviews()
      
      // Close form
      setShowReviewForm(false)
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>✅</span>
          <div>
            <div class="font-semibold">${userReview ? 'Review Updated' : 'Review Submitted'}</div>
            <div class="text-sm opacity-90">Thank you for your feedback!</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
      
    } catch (error) {
      console.error("Error submitting review:", error)
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>❌</span>
          <div>
            <div class="font-semibold">Failed to Submit Review</div>
            <div class="text-sm opacity-90">Please try again later.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
    } finally {
      setReviewLoading(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview || !user) return

    try {
      await reviewService.deleteReview(userReview.id, user.user_id || user.id)
      
      // Reload reviews (this will automatically clear user review via extractUserReview)
      await loadReviews()
      setShowReviewForm(false)
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>🗑️</span>
          <div>
            <div class="font-semibold">Review Deleted</div>
            <div class="text-sm opacity-90">Your review has been removed.</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 4000);
      
    } catch (error) {
      console.error("Error deleting review:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen glass-background">
        <div className="container mx-auto px-4 py-8 ">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="glass-card p-4">
                <div className="aspect-square glass-skeleton"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 glass-skeleton w-3/4"></div>
              <div className="h-6 glass-skeleton w-1/2"></div>
              <div className="h-12 glass-skeleton w-1/3"></div>
              <div className="h-20 glass-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const productImages =
    product.images && product.images.length > 0 ? product.images : [product.image_url || "/placeholder.svg"]

  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-green-600">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-green-600">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{product.name}</span>
        </div>

        {/* Back Button */}
        <div className="mb-4">
          <Link href="/products">
            <Button variant="outline" size="sm" className="glass-input bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>

        {/* Mobile centered layout, desktop grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8 lg:gap-12 items-center lg:items-start">
          {/* Product Image Section */}
          <div className="space-y-2 w-full max-w-lg lg:max-w-xl lg:col-span-2">
            <div className="glass-card p-2">
              <div className="aspect-square relative overflow-hidden rounded-xl">
                <Image
                  src={productImages[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden ${
                      selectedImage === index ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="block object-cover"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6 w-full max-w-lg lg:max-w-none lg:col-span-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="glass-badge bg-green-500">{product.category.replace("-", " ").toUpperCase()}</Badge>
                {product.in_stock ? (
                  <Badge className="glass-badge bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="glass-badge bg-red-500">Out of Stock</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">{product.rating || 0}</span>
                </div>
                <span className="text-sm text-gray-500">({product.reviews_count || 0} reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
                {product.original_price && (
                  <span className="text-xl text-gray-500 line-through">₹{product.original_price}</span>
                )}
                {product.original_price && (
                  <Badge className="glass-badge bg-red-500">
                    {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                  </Badge>
                )}
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="glass-input"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (quantity < product.stock_quantity) {
                        setQuantity(quantity + 1)
                      }
                    }}
                    disabled={quantity >= product.stock_quantity}
                    className="glass-input"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock || addCartLoading || cartLoading}
                  className="flex-1 glass-button"
                  size="lg"
                >
                  {(addCartLoading || cartLoading) ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!product.in_stock}
                  variant="outline"
                  className="flex-1 glass-input bg-transparent border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  size="lg"
                >
                   Buy Now
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="flex-1 glass-input bg-transparent"
                >
                  <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </Button>
                <Button 
                  variant="outline" 
                  className="glass-input bg-transparent hover-lift"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="glass-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">100% Natural</p>
                    <p className="text-xs text-gray-500">Chemical Free</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Free Shipping</p>
                    <p className="text-xs text-gray-500">On orders over ₹1000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">No Returns</p>
                    <p className="text-xs text-gray-500">No returns accepted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8 md:mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
              <TabsTrigger 
                value="description" 
                className="text-xs sm:text-sm font-medium py-3 px-2 rounded-lg data-[state=active]:bg-[#50A41C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="ingredients" 
                className="text-xs sm:text-sm font-medium py-3 px-2 rounded-lg data-[state=active]:bg-[#50A41C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Ingredients
              </TabsTrigger>
              <TabsTrigger 
                value="usage" 
                className="text-xs sm:text-sm font-medium py-3 px-2 rounded-lg data-[state=active]:bg-[#50A41C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                How to Use
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="text-xs sm:text-sm font-medium py-3 px-2 rounded-lg data-[state=active]:bg-[#50A41C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4 md:mt-6">
              <div className="glass-card p-4 md:p-8 rounded-2xl shadow-lg">
                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Product Description</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{product.long_description || product.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Key Benefits
                    </h4>
                    <ul className="space-y-3">
                      {product.benefits?.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{benefit}</span>
                        </li>
                      )) || <li className="text-sm text-gray-500">No benefits listed</li>}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-semibold mb-3 text-blue-800">Product Details</h4>
                    <div className="space-y-2 text-sm">
                      {product.weight && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weight:</span>
                          <span>{product.weight}</span>
                        </div>
                      )}
                      {product.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span>{product.dimensions}</span>
                        </div>
                      )}
                      {product.shelf_life && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shelf Life:</span>
                          <span>{product.shelf_life}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-4 md:mt-6">
              <div className="glass-card p-4 md:p-8 rounded-2xl shadow-lg">
                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  Ingredients
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.ingredients?.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors">
                      <Leaf className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{ingredient}</span>
                    </div>
                  )) || <p className="text-gray-500 col-span-full text-center py-4">No ingredients listed</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="mt-4 md:mt-6">
              <div className="glass-card p-4 md:p-8 rounded-2xl shadow-lg">
                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">How to Use</h3>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-gray-700 leading-relaxed">{product.how_to_use || "Usage instructions not available"}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 md:mt-6">
              <div className="glass-card p-4 md:p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    Reviews ({reviews.length})
                  </h3>
                  {user && (
                    <Button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      variant="outline"
                      size="sm"
                      className="glass-button-secondary"
                    >
                      {userReview ? "Edit My Review" : "Write Review"}
                    </Button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && user && (
                  <div className="bg-blue-50 p-4 md:p-6 rounded-xl border border-blue-100 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {userReview ? "Edit My Review" : "Write a Review"}
                    </h4>
                    
                    {/* Rating Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewFormData(prev => ({ ...prev, rating }))}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= reviewFormData.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review (Optional)</label>
                      <textarea
                        value={reviewFormData.reviewText}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                        rows={4}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        placeholder="Share your experience with this product..."
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        className="glass-button"
                      >
                        {reviewLoading ? (
                          <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            {userReview ? "Updating..." : "Submitting..."}
                          </>
                        ) : (
                          userReview ? "Update Review" : "Submit Review"
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => setShowReviewForm(false)}
                        variant="outline"
                        className="glass-button-secondary"
                      >
                        Cancel
                      </Button>

                      {userReview && (
                        <Button
                          onClick={handleDeleteReview}
                          variant="outline"
                          className="ml-auto text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          Delete Review
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Login Prompt */}
                {!user && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-center">
                    <p className="text-gray-600 mb-3">Want to share your experience?</p>
                    <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                      Login to write a review
                    </Link>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-white/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                          <div className="flex items-center gap-2">
                      <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium text-gray-800">{review.user_name}</span>
                            {review.verified_purchase && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.review_text && (
                          <p className="text-gray-700 leading-relaxed mb-3">{review.review_text}</p>
                        )}
                        {review.helpful_count > 0 && (
                          <div className="text-sm text-gray-500">
                            {review.helpful_count} {review.helpful_count === 1 ? "person" : "people"} found this helpful
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg">No reviews yet</p>
                      <p className="text-gray-400 text-sm">Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`} prefetch={true}>
                <div className="glass-product-card product-card-hover cursor-pointer">
                  <div className="p-0">
                    <Image
                      src={relatedProduct.image_url || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{relatedProduct.name}</h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm ml-1">{relatedProduct.rating || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">₹{relatedProduct.price}</span>
                        <Button size="sm" className="glass-button">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
