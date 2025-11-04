"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Star, Search, Grid, List, Filter, SlidersHorizontal, Heart, Sparkles } from "lucide-react"
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize with URL parameters if available
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || "") // What user types
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "") // Actual search filter
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "all")
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || "name")
  const [showInStockOnly, setShowInStockOnly] = useState(searchParams.get('inStock') === 'true')
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [prefetchedProducts, setPrefetchedProducts] = useState<Set<number>>(new Set())
  const isInitialMount = useRef(true) // Track if this is the first render

  // Debug: Log component render
  console.log('[ProductsPage] Component rendered, pathname:', pathname, 'products count:', products.length, 'loading:', loading)

  // Handle search button click
  const handleSearch = () => {
    console.log('[Search] Searching for:', searchInput);
    setSearchTerm(searchInput);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('search', searchInput);
    } else {
      params.delete('search');
    }
    router.replace(`/products?${params.toString()}`);
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Unified function to load products based on current filters
  const loadProducts = async () => {
    try {
      if (isInitialMount.current) {
        console.log('[ProductsPage] Loading initial data...');
        isInitialMount.current = false;
      } else {
        console.log('[ProductsPage] FILTER EFFECT triggered, filters changed');
      }
      
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('[ProductsPage] Request timed out after 10 seconds');
        setError('Request timed out. Please refresh the page.');
        setLoading(false);
      }, 10000);
      
      try {
        const loadedProducts = await productService.getProducts({
          category: selectedCategory,
          search: searchTerm,
          inStockOnly: showInStockOnly,
          sortBy: sortBy,
        });
        
        clearTimeout(timeoutId);
        setProducts(loadedProducts);
        console.log('[ProductsPage] Got', loadedProducts.length, 'products');
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('[ProductsPage] Error loading products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // This effect synchronizes the URL search params to the component's state
  useEffect(() => {
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'name'
    const inStock = searchParams.get('inStock') === 'true'

    setSelectedCategory(category)
    setSearchTerm(search)
    setSortBy(sort)
    setShowInStockOnly(inStock)
  }, [searchParams])

  // This effect fetches data whenever the state (driven by the URL) changes
  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm, sortBy, showInStockOnly]);


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
        <div className="text-center mb-1 mt-6 sm:mb-12 animate-fade-in px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Our <span className="gradient-text">Products</span>
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      handleSearchKeyPress(e);
                    }}
                    className="pl-10 glass-input focus-ring"
                  />
                </div>
                <Button
                  onClick={() => handleSearch()}
                  className="glass-button px-4"
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-2">
                  Searching for: <span className="font-semibold">{searchTerm}</span>
                  {searchInput !== searchTerm && ' (press Enter or click Search)'}
                </p>
              )}
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
                    onClick={() => {
                      setSelectedCategory(category.id);
                      
                      // Update URL parameters
                      const params = new URLSearchParams(searchParams);
                      if (category.id !== 'all') {
                        params.set('category', category.id);
                      } else {
                        params.delete('category');
                      }
                      router.replace(`/products?${params.toString()}`);
                    }}
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
                    onCheckedChange={(val) => {
                      setShowInStockOnly(val === true);
                    }}
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
              <Button onClick={() => {
                setShowFilters(!showFilters);
              }} className="glass-button-secondary w-full">
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
                  <Select value={sortBy} onValueChange={(value) => {
                    setSortBy(value);
                  }}>
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
                      onClick={() => {
                        setViewMode("grid");
                      }}
                      className="hover-lift"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setViewMode("list");
                      }}
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
                  <Link 
                    key={product.id}
                    href={`/products/${product.id}`}
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
                            className="block w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
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
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-6 stagger-animation">
                {products.map((product, index) => (
                  <div 
                    key={product.id}
                    className="glass-card p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover-lift group"
                    onMouseEnter={() => handleProductHover(product.id)}
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                      <div className="flex gap-3 sm:gap-6">
                        <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={150}
                            height={150}
                            className="block w-20 h-20 sm:w-32 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {!product.in_stock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-white text-xs font-medium">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base sm:text-xl font-semibold group-hover:text-green-600 transition-colors line-clamp-2 pr-2">
                              {product.name}
                            </h3>
                            {product.original_price && product.original_price > product.price && (
                              <div className="glass-badge bg-red-500 animate-pulse text-xs flex-shrink-0">Sale</div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base">{product.description}</p>
                          <div className="flex items-center mb-2 sm:mb-3">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs sm:text-sm ml-1 font-medium">{product.rating || 0}</span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 ml-2">({product.reviews_count || 0} reviews)</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg sm:text-xl font-bold text-green-600">₹{product.price}</span>
                              {product.original_price && (
                                <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                              )}
                            </div>
                            <Button disabled={!product.in_stock} className="glass-button hover-lift text-xs sm:text-sm px-3 py-2">
                              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              {product.in_stock ? "Add to Cart" : "Out of Stock"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}

            {products.length === 0 && !loading && (
              <div className="text-center py-16 animate-fade-in">
                <div className="glass-card p-12 max-w-md mx-auto">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${error ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {error ? (
                      <span className="text-4xl">⚠️</span>
                    ) : (
                      <Search className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {error ? 'Error Loading Products' : 'No products found'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {error ? error : 'Try adjusting your search or filter criteria.'}
                  </p>
                  <Button
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setShowInStockOnly(false);
                      setError(null);
                    }}
                    className="glass-button-secondary"
                  >
                    {error ? 'Retry' : 'Clear Filters'}
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
