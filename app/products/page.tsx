"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Leaf, ShoppingBag, Star, Search, Grid, List, Filter, SlidersHorizontal, Heart, Sparkles } from "lucide-react"
import { productService, type Product } from "@/lib/supabase"

const categories = [
  { id: "all", name: "All Products", icon: "🌟" },
  { id: "soaps", name: "Soaps", icon: "🧼" },
  { id: "shampoos", name: "Shampoos", icon: "🧴" },
  { id: "herbal-powders", name: "Herbal Powders", icon: "🌿" },
  { id: "hair-care", name: "Hair Care", icon: "💇‍♀️" },
  { id: "skin-care", name: "Skin Care", icon: "✨" },
  { id: "essential-oils", name: "Essential Oils", icon: "🌸" },
]

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [prefetchedProducts, setPrefetchedProducts] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchTerm, sortBy, showInStockOnly])

  // Background prefetching for popular products
  useEffect(() => {
    const prefetchPopularProducts = async () => {
      if (products.length > 0) {
        // Prefetch top 3 featured or highest-rated products
        const popularProducts = products
          .filter(p => p.featured || (p.rating && p.rating >= 4.5))
          .slice(0, 3)
        
        popularProducts.forEach(product => {
          if (!prefetchedProducts.has(product.id)) {
            setTimeout(() => {
              router.prefetch(`/products/${product.id}`)
              setPrefetchedProducts(prev => new Set([...prev, product.id]))
            }, 100 * product.id) // Stagger the prefetches
          }
        })
      }
    }

    // Start prefetching after a small delay
    const timeoutId = setTimeout(prefetchPopularProducts, 2000)
    return () => clearTimeout(timeoutId)
  }, [products, router, prefetchedProducts])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const filters = {
        category: selectedCategory,
        search: searchTerm,
        inStockOnly: showInStockOnly,
        sortBy: sortBy,
      }
      const data = await productService.getProducts(filters)
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prefetch product data on hover
  const handleProductHover = async (productId: number) => {
    if (prefetchedProducts.has(productId)) return
    
    try {
      // Prefetch the route
      router.prefetch(`/products/${productId}`)
      
      // Prefetch product data (optional - for instant loading)
      productService.getProductById(productId)
      
      setPrefetchedProducts(prev => new Set([...prev, productId]))
    } catch (error) {
      console.error("Error prefetching product:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen glass-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="aspect-square glass-skeleton mb-4 rounded-lg"></div>
                <div className="h-4 glass-skeleton mb-2 rounded"></div>
                <div className="h-4 glass-skeleton w-3/4 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen glass-background page-transition">
        {/* Page Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4">
            Our <span className="gradient-text">Products</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated collection of natural and organic products
          </p>
        </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-80 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Search */}
            <div className="glass-sidebar p-6 animate-slide-up">
              <h3 className="font-semibold mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2 text-green-600" />
                Search Products
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-input focus-ring"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="glass-sidebar p-6 animate-slide-up">
              <h3 className="font-semibold mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-green-600" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 hover-lift ${
                      selectedCategory === category.id
                        ? "glass-button text-white transform scale-105"
                        : "glass-input hover:bg-white/50"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      {selectedCategory === category.id && <Sparkles className="h-4 w-4 animate-pulse" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="glass-sidebar p-6 animate-slide-up">
              <h3 className="font-semibold mb-4 flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-green-600" />
                Filters
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={showInStockOnly}
                    onCheckedChange={val => setShowInStockOnly(val === true)}
                    className="focus-ring"
                  />
                  <Label htmlFor="in-stock" className="cursor-pointer">
                    In Stock Only
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6">
              <Button onClick={() => setShowFilters(!showFilters)} className="glass-button-secondary w-full">
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Toolbar */}
            <div className="glass-card p-6 mb-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Products</h2>
                  <p className="text-gray-600 flex items-center">
                    <span className="mr-2">{products.length} products found</span>
                    {products.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Updated
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 glass-input focus-ring">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-low">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex border rounded-lg glass-input">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="hover-lift"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="hover-lift"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
                {products.map((product, index) => (
                  <Link href={`/products/${product.id}`} key={product.id} prefetch={true}>
                    <div 
                      className="glass-product-card product-card-hover cursor-pointer group"
                      onMouseEnter={() => handleProductHover(product.id)}
                    >
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
                          {!product.in_stock && (
                            <div className="glass-badge bg-red-500 absolute top-3 left-3 animate-pulse">
                              Out of Stock
                            </div>
                          )}
                          {product.original_price && product.original_price > product.price && (
                            <div className="glass-badge bg-gradient-to-r from-red-500 to-pink-500 absolute top-3 left-3 animate-pulse">
                              🔥 Sale
                            </div>
                          )}
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
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
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
                              disabled={!product.in_stock}
                              className="glass-button opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                            >
                              <ShoppingBag className="h-4 w-4 mr-1" />
                              {product.in_stock ? "Add" : "Out"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-6 stagger-animation">
                {products.map((product, index) => (
                  <Link href={`/products/${product.id}`} key={product.id} prefetch={true}>
                    <div 
                      className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover-lift group"
                      onMouseEnter={() => handleProductHover(product.id)}
                    >
                      <div className="flex gap-6">
                        <div className="relative overflow-hidden rounded-lg">
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={150}
                            height={150}
                            className="w-32 h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {!product.in_stock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-white text-xs font-medium">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-semibold group-hover:text-green-600 transition-colors">
                              {product.name}
                            </h3>
                            {product.original_price && product.original_price > product.price && (
                              <div className="glass-badge bg-red-500 animate-pulse">Sale</div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm ml-1 font-medium">{product.rating || 0}</span>
                            </div>
                            <span className="text-sm text-gray-500 ml-2">({product.reviews_count || 0} reviews)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                              {product.original_price && (
                                <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                              )}
                            </div>
                            <Button disabled={!product.in_stock} className="glass-button hover-lift">
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              {product.in_stock ? "Add to Cart" : "Out of Stock"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="glass-card p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("all")
                      setShowInStockOnly(false)
                    }}
                    className="glass-button-secondary"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
