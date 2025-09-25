"use client";
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Leaf, ShoppingBag, Star, Shield, Heart, Sparkles, Zap, Award } from "lucide-react"
import { productService } from "@/lib/supabase"
import { useState, useEffect } from "react"

const categories = [
  { 
    name: "Soaps", 
    image: "https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/products/1756378335713-lohlfd4ei.png", 
    count: 0, 
    gradient: "from-blue-400 to-blue-600" 
  },
  { 
    name: "Shampoos", 
    image: "https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/products/1756347564729-vq72fshtn.png", 
    count: 0, 
    gradient: "from-purple-400 to-purple-600" 
  },
  { 
    name: "Herbal Powders", 
    image: "https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/products/nalangumaavu1-min.jpg", 
    count: 12, 
    gradient: "from-green-400 to-green-600" 
  },
  { 
    name: "Hair Care", 
    image: "https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/products/neemcomb1.png", 
    count: 10, 
    gradient: "from-pink-400 to-pink-600" 
  },
  { 
    name: "Skin Care", 
    image: "https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/products/bodybutter1-min.jpg", 
    count: 18, 
    gradient: "from-yellow-400 to-yellow-600" 
  },
]

const features = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Made with pure, organic ingredients sourced directly from nature.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Shield,
    title: "Chemical Free",
    description: "No harmful chemicals, sulfates, or artificial preservatives.",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Heart,
    title: "Handcrafted",
    description: "Each product is carefully handmade with traditional methods.",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Highest quality standards with rigorous testing and certification.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Zap,
    title: "Fast Results",
    description: "See visible improvements in your skin and hair within weeks.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  }
]

export default function HomePage() {
  const [categoryCounts, setCategoryCounts] = useState<{[key: string]: number}>({})
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch category counts
        const countsResponse = await fetch('/api/categories/')
        if (countsResponse.ok) {
          const countsData = await countsResponse.json()
          setCategoryCounts(countsData.counts || {})
        }

        // Fetch featured products
        const featuredProductsData = await productService.getFeaturedProducts(4)
        setFeaturedProducts(featuredProductsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Map category names to database category keys
  const getCategoryKey = (categoryName: string) => {
    const mapping: {[key: string]: string} = {
      "Soaps": "soaps",
      "Shampoos": "shampoos", 
      "Herbal Powders": "herbal-powders",
      "Hair Care": "hair-care",
      "Skin Care": "skin-care"
    }
    return mapping[categoryName] || categoryName.toLowerCase().replace(" ", "-")
  }

  // Get real-time count for category or fallback to hardcoded
  const getCategoryCount = (categoryName: string, fallbackCount: number) => {
    const categoryKey = getCategoryKey(categoryName)
    return categoryCounts[categoryKey] || fallbackCount
  }
  

  return (
    <div className="min-h-screen glass-background page-transition">
      {/* Hero Section */}
      <section className="py-12 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="glass-hero rounded-3xl overflow-hidden max-w-6xl mx-auto animate-scale-in">
            <div className="grid lg:grid-cols-2 lg:gap-0">
              {/* Hero Text */}
              <div className="p-8 lg:p-12 flex flex-col justify-center text-center lg:text-left order-2 lg:order-1">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
                  Pure. Natural. <span className="gradient-text">Organic.</span>
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-8 animate-fade-in">
                  Discover the power of nature with our handcrafted organic soaps, shampoos, and herbal products. Made with
                  love, free from chemicals.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up">
                  <Link href="/products">
                    <Button size="lg" className="glass-button hover-lift">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Shop Now
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="relative order-1 lg:order-2">
                <Image
                  src="https://ccklbyexywvclddrqjwr.supabase.co/storage/v1/object/public/product-images/hero.jpg"
                  alt="Dhanya Naturals Organic Products"
                  width={600}
                  height={400}
                  className="object-cover w-full h-[250px] sm:h-[300px] lg:h-full lg:min-h-[500px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">Dhanya Naturals</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our premium natural products crafted with care and expertise.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center glass-stats-card p-8 floating hover-lift card-stack">
                <div
                  className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 hover-glow`}
                >
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">
              Shop by <span className="gradient-text">Category</span>
            </h2>
            <p className="text-xl text-gray-600">Explore our diverse range of natural products</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 stagger-animation">
            {categories.map((category, index) => (
              <Link key={category.name} href={`/products?category=${category.name.toLowerCase().replace(" ", "-")}`}>
                <div className="glass-card p-6 text-center cursor-pointer floating hover-lift group">
                  <div className="relative w-20 h-20 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-green-600 transition-colors">{category.name}</h3>
                  <p className="text-sm text-gray-500">{getCategoryCount(category.name, category.count)} products</p>
                  <div
                    className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${category.gradient} rounded-full transition-all duration-300 mx-auto mt-2`}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-16 animate-fade-in">
            <div>
              <h2 className="text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Products</span>
              </h2>
              <p className="text-xl text-gray-600">Handpicked favorites loved by our customers</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="glass-button-secondary hover-lift bg-transparent">
                View All Products
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 stagger-animation">
            {featuredProducts.length > 0 ? featuredProducts.map((product, index) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="glass-product-card product-card-hover cursor-pointer group">
                  <div className="p-0 relative overflow-hidden">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="glass-badge absolute top-3 left-3 animate-pulse">
                        {product.original_price && product.original_price > product.price ? "🔥 Sale" : "⭐ Featured"}
                      </div>
                      <Button
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 glass-button transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold mb-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm ml-1 font-medium">{product.rating || 0}</span>
                        </div>
                        <span className="text-sm text-gray-500 ml-2">({product.reviews_count || 0} reviews)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                          {product.original_price && (
                            <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="glass-button opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                        >
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Featured Products Yet</h3>
                  <p className="text-gray-500 mb-4">We're working on adding some amazing featured products for you!</p>
                  <Link href="/products">
                    <Button className="glass-button">
                      Browse All Products
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter 
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Stay <span className="text-yellow-300">Updated</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">Get the latest updates on new products and special offers.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full text-gray-900 glass-input focus-ring border-0 backdrop-blur-sm bg-white/90"
              />
              <Button className="glass-button px-8 py-3 rounded-full hover-lift">
                <Sparkles className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  )
}
