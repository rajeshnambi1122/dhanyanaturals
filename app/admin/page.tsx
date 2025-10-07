"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Package, ShoppingCart, TrendingUp, AlertTriangle, Upload, X, Phone, MapPin, CreditCard, Truck, FileText, Clock, Calendar, DollarSign, UserCircle, Mail, Image as ImageIcon, Tag, Star } from "lucide-react"
import { productService, orderService, authService, storageService, type Product, type Order, type UserData } from "@/lib/supabase"

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    original_price: "",
    category: "",
    stock_quantity: "",
    description: "",
    long_description: "",
    image_url: "",
    ingredients: "",
    benefits: "",
    how_to_use: "",
    weight: "",
    dimensions: "",
    shelf_life: "",
    tags: "",
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [storageStatus, setStorageStatus] = useState<{ isReady: boolean; message: string } | null>(null)
  const [checkingStorage, setCheckingStorage] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false)
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      loadData()
      checkStorageSetup()
    }
  }, [isAuthorized])

  const checkStorageSetup = async () => {
    try {
      setCheckingStorage(true)
      const status = await storageService.checkStorageSetup()
      setStorageStatus(status)
    } catch (error) {
      console.error('Error checking storage setup:', error)
      setStorageStatus({
        isReady: false,
        message: 'Failed to check storage setup'
      })
    } finally {
      setCheckingStorage(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderStatus(true)
    try {
      const updated = await orderService.updateOrderStatus(orderId, newStatus as Order["status"])
      
      // Refresh orders list
      const updatedOrders = await orderService.getOrders()
      setOrders(updatedOrders)
      
      // Fire and forget: notify customer via email
      try {
        fetch('/api/email/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: updated?.customer_email,
            orderId,
            newStatus,
            items: updated?.items,
            total: updated?.total_amount,
            customerName: updated?.customer_name,
            trackingNumber: updated?.tracking_number,
          }),
        })
      } catch {}

      // Close dialog
      setIsEditStatusOpen(false)
      setEditingOrder(null)
      
      // Show success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in'
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>✅</span>
          <div>
            <div class="font-semibold">Status Updated</div>
            <div class="text-sm opacity-90">Order #${orderId} status changed to ${newStatus}</div>
          </div>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => {
        notification.remove()
      }, 3000)
      
    } catch (error) {
      console.error('Error updating order status:', error)
      
      // Show error notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in'
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>❌</span>
          <div>
            <div class="font-semibold">Update Failed</div>
            <div class="text-sm opacity-90">Could not update order status</div>
          </div>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => {
        notification.remove()
      }, 3000)
    } finally {
      setUpdatingOrderStatus(false)
    }
  }

  const checkAuth = async () => {
    try {
      setAuthLoading(true)
      const currentUser = await authService.getCurrentUser()
      
      if (!currentUser) {
        setIsAuthorized(false)
        setAuthLoading(false)
        return
      }

      const userProfile = await authService.getUserProfile(currentUser.id)
      
      if (!userProfile || userProfile.role !== "admin") {
        setIsAuthorized(false)
        setAuthLoading(false)
        return
      }

      setUser(userProfile)
      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsAuthorized(false)
    } finally {
      setAuthLoading(false)
    }
  }



  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed 5 images
    if (selectedImages.length + files.length > 5) {
      alert('You can only upload up to 5 images per product')
      return
    }

    // Validate each file
    for (const file of files) {
      const validation = storageService.validateImageFile(file)
      if (!validation.isValid) {
        alert(`${file.name}: ${validation.error}`)
        return
      }
    }

    // Add new files to existing selection
    const newImages = [...selectedImages, ...files]
    setSelectedImages(newImages)
    
    // Create previews for new files
    const newPreviews = [...imagePreviews]
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews[selectedImages.length + index] = e.target?.result as string
        setImagePreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleRemoveAllImages = () => {
    setSelectedImages([])
    setImagePreviews([])
    setNewProduct({ ...newProduct, image_url: "" })
  }

  const uploadImagesIfSelected = async (): Promise<{ image_url?: string; images?: string[] }> => {
    if (selectedImages.length === 0) {
      return { 
        image_url: newProduct.image_url || undefined,
        images: newProduct.image_url ? [newProduct.image_url] : undefined
      }
    }

    try {
      setUploadingImages(true)
      const imageUrls = await storageService.uploadMultipleImages(selectedImages)
      
      return {
        image_url: imageUrls[0], // Primary image for backward compatibility
        images: imageUrls
      }
    } catch (error: any) {
      console.error("Error uploading images:", error)
      const errorMessage = error?.message || 'Unknown error occurred'
      alert(`Failed to upload images: ${errorMessage}`)
      throw error
    } finally {
      setUploadingImages(false)
    }
  }

  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      original_price: "",
      category: "",
      stock_quantity: "",
      description: "",
      long_description: "",
      image_url: "",
      ingredients: "",
      benefits: "",
      how_to_use: "",
      weight: "",
      dimensions: "",
      shelf_life: "",
      tags: "",
    })
    setSelectedImages([])
    setImagePreviews([])
    setEditingProduct(null)
  }

  const loadData = async () => {
    try {
      const [productsData, ordersData] = await Promise.all([productService.getProducts(), orderService.getOrders()])
      setProducts(productsData)
      setOrders(ordersData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      try {
        // Upload images first if selected
        const { image_url, images } = await uploadImagesIfSelected()

        const productData = {
          name: newProduct.name,
          price: Number.parseFloat(newProduct.price),
          original_price: newProduct.original_price ? Number.parseFloat(newProduct.original_price) : undefined,
          category: newProduct.category,
          stock_quantity: Number.parseInt(newProduct.stock_quantity) || 0,
          in_stock: Number.parseInt(newProduct.stock_quantity) > 0,
          status: Number.parseInt(newProduct.stock_quantity) > 0 ? ("active" as const) : ("out-of-stock" as const),
          description: newProduct.description,
          long_description: newProduct.long_description || undefined,
          image_url,
          images,
          ingredients: newProduct.ingredients ? newProduct.ingredients.split(",").map((s) => s.trim()) : undefined,
          benefits: newProduct.benefits ? newProduct.benefits.split(",").map((s) => s.trim()) : undefined,
          how_to_use: newProduct.how_to_use || undefined,
          weight: newProduct.weight || undefined,
          dimensions: newProduct.dimensions || undefined,
          shelf_life: newProduct.shelf_life || undefined,
          tags: newProduct.tags ? newProduct.tags.split(",").map((s) => s.trim()) : undefined,
        }

        await productService.createProduct(productData)
        await loadData()
        resetForm()
        setIsAddProductOpen(false)
      } catch (error) {
        console.error("Error adding product:", error)
      }
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || "",
      long_description: product.long_description || "",
      image_url: product.image_url || "",
      ingredients: product.ingredients?.join(", ") || "",
      benefits: product.benefits?.join(", ") || "",
      how_to_use: product.how_to_use || "",
      weight: product.weight || "",
      dimensions: product.dimensions || "",
      shelf_life: product.shelf_life || "",
      tags: product.tags?.join(", ") || "",
    })
    // Set previews to existing images
    const existingImages = product.images || (product.image_url ? [product.image_url] : [])
    setImagePreviews(existingImages)
    setSelectedImages([])
    setIsAddProductOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (editingProduct && newProduct.name && newProduct.price && newProduct.category) {
      try {
        // Upload new images if selected, otherwise keep existing
        let imageData: { image_url?: string; images?: string[] }
        
        if (selectedImages.length > 0) {
          // New images uploaded
          imageData = await uploadImagesIfSelected()
        } else {
          // Keep existing images from previews
          const existingImages = imagePreviews.filter(url => url.startsWith('http'))
          imageData = {
            image_url: existingImages[0],
            images: existingImages.length > 0 ? existingImages : undefined
          }
        }

        const updates = {
          name: newProduct.name,
          price: Number.parseFloat(newProduct.price),
          original_price: newProduct.original_price ? Number.parseFloat(newProduct.original_price) : undefined,
          category: newProduct.category,
          stock_quantity: Number.parseInt(newProduct.stock_quantity) || 0,
          in_stock: Number.parseInt(newProduct.stock_quantity) > 0,
          status: Number.parseInt(newProduct.stock_quantity) > 0 ? ("active" as const) : ("out-of-stock" as const),
          description: newProduct.description,
          long_description: newProduct.long_description || undefined,
          image_url: imageData.image_url,
          images: imageData.images,
          ingredients: newProduct.ingredients ? newProduct.ingredients.split(",").map((s) => s.trim()) : undefined,
          benefits: newProduct.benefits ? newProduct.benefits.split(",").map((s) => s.trim()) : undefined,
          how_to_use: newProduct.how_to_use || undefined,
          weight: newProduct.weight || undefined,
          dimensions: newProduct.dimensions || undefined,
          shelf_life: newProduct.shelf_life || undefined,
          tags: newProduct.tags ? newProduct.tags.split(",").map((s) => s.trim()) : undefined,
        }

        await productService.updateProduct(editingProduct.id, updates)
        await loadData()
        resetForm()
        setIsAddProductOpen(false)
      } catch (error) {
        console.error("Error updating product:", error)
      }
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id)
      await loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const totalProducts = products.length
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
  const lowStockProducts = products.filter((p) => p.stock_quantity < 10).length

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="glass-background flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <h2 className="text-xl font-semibold mb-2">Checking Authentication...</h2>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    )
  }

  // Show unauthorized access message
  if (!isAuthorized) {
    return (
      <div className="glass-background flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need admin privileges to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <a href="/login">
              <Button className="w-full glass-button">
                Sign In
              </Button>
            </a>
            <a href="/">
              <Button variant="outline" className="w-full">
                Return to Store
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-background pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-stats-card p-6">
                <div className="h-20 glass-skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your inventory and orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="glass-stats-card p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl md:text-3xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="glass-stats-card p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl md:text-3xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="glass-stats-card p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl md:text-3xl font-bold">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
          </div>
          <div className="glass-stats-card p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">{lowStockProducts}</p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <div className="sticky bottom-0 z-50 bg-white/10 backdrop-blur-sm p-2 rounded-lg mx-auto max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products">
            <div className="glass-card">
              <div className="p-4 md:p-6 border-b border-white/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-lg md:text-xl font-semibold">Product Management</h3>
                    {products.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {products.length} product{products.length !== 1 ? 's' : ''} found
                      </div>
                    )}
                  </div>
                  <Dialog open={isAddProductOpen} onOpenChange={(open) => {
                    if (!open) {
                      resetForm()
                    }
                    setIsAddProductOpen(open)
                  }}>
                    <DialogTrigger asChild>
                      <Button className="glass-button w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] mx-auto glass-modal max-h-[90vh] overflow-y-auto sm:w-full sm:mx-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg md:text-xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Product Name</Label>
                            <Input
                              id="name"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                              placeholder="Enter product name"
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select
                              value={newProduct.category}
                              onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                            >
                              <SelectTrigger className="glass-input">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="glass-dropdown">
                                <SelectItem value="soaps">Soaps</SelectItem>
                                <SelectItem value="shampoos">Shampoos</SelectItem>
                                <SelectItem value="herbal-powders">Herbal Powders</SelectItem>
                                <SelectItem value="hair-care">Hair Care</SelectItem>
                                <SelectItem value="skin-care">Skin Care</SelectItem>
                                <SelectItem value="essential-oils">Essential Oils</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              placeholder="0.00"
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="original_price">Original Price</Label>
                            <Input
                              id="original_price"
                              type="number"
                              step="0.01"
                              value={newProduct.original_price}
                              onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value })}
                              placeholder="0.00"
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input
                              id="stock"
                              type="number"
                              value={newProduct.stock_quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                              placeholder="0"
                              className="glass-input"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="images">Product Images (up to 5)</Label>
                          <div className="space-y-4">
                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {imagePreviews.map((preview, index) => (
                                  <div key={index} className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-white/20">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="block w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                      {index + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* File Upload Input */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  id="images"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageSelect}
                                  className="hidden"
                                  disabled={imagePreviews.length >= 5}
                                />
                                <label htmlFor="images">
                                  <div className={`glass-input flex items-center space-x-2 cursor-pointer hover:bg-white/10 transition-colors px-4 py-2 ${
                                    imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}>
                                    <Upload className="h-4 w-4" />
                                    <span>
                                      {imagePreviews.length >= 5 
                                        ? "Maximum 5 images reached" 
                                        : `Add images (${imagePreviews.length}/5)`
                                      }
                                    </span>
                                  </div>
                                </label>
                                {uploadingImages && (
                                  <div className="text-sm text-blue-600">Uploading...</div>
                                )}
                              </div>
                              
                              {imagePreviews.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleRemoveAllImages}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  Remove all images
                                </button>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              Supported formats: JPEG, PNG, WebP. Max size: 5MB per image. First image will be the primary image.
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Short Description</Label>
                          <Textarea
                            id="description"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            placeholder="Brief product description"
                            className="glass-input"
                          />
                        </div>

                        <div>
                          <Label htmlFor="long_description">Long Description</Label>
                          <Textarea
                            id="long_description"
                            value={newProduct.long_description}
                            onChange={(e) => setNewProduct({ ...newProduct, long_description: e.target.value })}
                            placeholder="Detailed product description"
                            className="glass-input"
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
                            <Textarea
                              id="ingredients"
                              value={newProduct.ingredients}
                              onChange={(e) => setNewProduct({ ...newProduct, ingredients: e.target.value })}
                              placeholder="Ingredient 1, Ingredient 2, ..."
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                            <Textarea
                              id="benefits"
                              value={newProduct.benefits}
                              onChange={(e) => setNewProduct({ ...newProduct, benefits: e.target.value })}
                              placeholder="Benefit 1, Benefit 2, ..."
                              className="glass-input"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="how_to_use">How to Use</Label>
                          <Textarea
                            id="how_to_use"
                            value={newProduct.how_to_use}
                            onChange={(e) => setNewProduct({ ...newProduct, how_to_use: e.target.value })}
                            placeholder="Usage instructions"
                            className="glass-input"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="weight">Weight</Label>
                            <Input
                              id="weight"
                              value={newProduct.weight}
                              onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                              placeholder="100g"
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dimensions">Dimensions</Label>
                            <Input
                              id="dimensions"
                              value={newProduct.dimensions}
                              onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })}
                              placeholder="7cm x 5cm x 2cm"
                              className="glass-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shelf_life">Shelf Life</Label>
                            <Input
                              id="shelf_life"
                              value={newProduct.shelf_life}
                              onChange={(e) => setNewProduct({ ...newProduct, shelf_life: e.target.value })}
                              placeholder="24 months"
                              className="glass-input"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="tags">Tags (comma-separated)</Label>
                          <Input
                            id="tags"
                            value={newProduct.tags}
                            onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                            placeholder="natural, organic, handmade"
                            className="glass-input"
                          />
                        </div>

                        <Button
                          onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                          className="w-full glass-button"
                          disabled={uploadingImages}
                        >
                          {uploadingImages ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            editingProduct ? "Update Product" : "Add Product"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Order Status Dialog moved outside tabs (see below) */}
                </div>
              </div>
              <div className="p-4 md:p-6">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No products yet</h3>
                    <p className="text-gray-600 mb-6">Add your first product to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <div key={product.id} className="glass-card p-4 sm:p-6 hover-lift border border-white/20">
                        {/* Product Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                          {/* Product Images */}
                          <div className="flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <div className="relative">
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-white/20"
                                />
                                {product.images.length > 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                    {product.images.length}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg border-2 border-white/20 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-800 truncate">{product.name}</h3>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {product.status === "active" ? "Active" : "Inactive"}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 capitalize">
                                {product.category.replace("-", " ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-3 mb-4">
                          {/* Pricing */}
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Pricing
                            </h4>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Current: </span>
                                <span className="font-semibold text-green-600">₹{product.price}</span>
                              </div>
                              {product.original_price && parseFloat(String(product.original_price)) > parseFloat(String(product.price)) && (
                                <div>
                                  <span className="text-gray-600">Original: </span>
                                  <span className="text-gray-500 line-through">₹{product.original_price}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stock Information */}
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Stock Information
                            </h4>
                            <div className="text-sm">
                              <span className="text-gray-600">Available: </span>
                              <span className={`font-semibold ${
                                product.stock_quantity < 10 ? "text-red-600" : "text-blue-600"
                              }`}>
                                {product.stock_quantity} units
                              </span>
                              {product.stock_quantity < 10 && (
                                <div className="flex items-center gap-1 mt-1 text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">Low stock warning</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Description */}
                          {product.description && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Description
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {product.description}
                              </p>
                            </div>
                          )}

                          {/* Additional Product Images */}
                          {product.images && product.images.length > 1 && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Gallery ({product.images.length} images)
                              </h4>
                              <div className="flex gap-2 overflow-x-auto">
                                {product.images.slice(1, 5).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${product.name} ${idx + 2}`}
                                    className="w-12 h-12 object-cover rounded-md border border-white/20 flex-shrink-0"
                                    loading="lazy"
                                  />
                                ))}
                                {product.images.length > 5 && (
                                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                                    +{product.images.length - 5}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Actions */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="glass-input bg-transparent flex-1 min-w-0"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="glass-input bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 min-w-0"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="glass-card">
              <div className="p-4 md:p-6 border-b border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg md:text-xl font-semibold">Order Management</h3>
                  {orders.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {orders.length} order{orders.length !== 1 ? 's' : ''} found
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 md:p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:gap-3">
                    {orders.map((order) => (
                      <div key={order.id} className="glass-card p-2 sm:p-3 hover-lift border border-white/20">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                              <h3 className="font-bold text-sm flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3 text-green-600" />
                                Order #{order.id}
                              </h3>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === "delivered" ? "bg-green-100 text-green-800" : 
                                order.status === "shipped" ? "bg-blue-100 text-blue-800" : 
                                order.status === "processing" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-red-100 text-red-800"
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </div>
                            </div>
                            
                            {/* Customer Information */}
                            {(order.customer_name || order.customer_email || order.customer_phone) && (
                              <div className="mb-2 p-1 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                  <UserCircle className="h-3 w-3" />
                                  Customer Details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                  {order.customer_name && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <UserCircle className="h-3 w-3" />
                                      <span className="truncate">{order.customer_name}</span>
                                    </div>
                                  )}
                                  {order.customer_email && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{order.customer_email}</span>
                                    </div>
                                  )}
                                  {order.customer_phone && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Phone className="h-3 w-3" />
                                      <span className="truncate">{order.customer_phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Order Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(order.created_at || "").toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-semibold text-green-600">₹{parseFloat(String(order.total_amount || 0)).toFixed(2)}</span>
                              </div>
                              {order.updated_at && order.updated_at !== order.created_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span title="Last Updated">Updated: {new Date(order.updated_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Shipping Address */}
                            {order.shipping_address && (
                              <div className="mb-2 p-1 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  Shipping Address
                                </h4>
                                <div className="text-xs text-gray-600">
                                  {typeof order.shipping_address === 'string' ? (
                                    <div className="truncate">{order.shipping_address}</div>
                                  ) : (
                                    <div>
                                      {order.shipping_address.street && <div className="truncate">{order.shipping_address.street}</div>}
                                      <div className="truncate">
                                        {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zipCode]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                      {order.shipping_address.country && <div className="truncate">{order.shipping_address.country}</div>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Payment & Tracking */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-2">
                              {order.payment_method && (
                                <div className="p-1 bg-green-50 rounded-lg">
                                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                    <CreditCard className="h-3 w-3" />
                                    Payment Method
                                  </h4>
                                  <div className="text-xs text-gray-600 truncate">{order.payment_method}</div>
                                </div>
                              )}
                              
                              {order.tracking_number && (
                                <div className="p-1 bg-purple-50 rounded-lg">
                                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                    <Truck className="h-3 w-3" />
                                    Tracking Number
                                  </h4>
                                  <div className="text-xs text-gray-600 font-mono truncate">{order.tracking_number}</div>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="mb-2 p-1 bg-yellow-50 rounded-lg">
                                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                  <FileText className="h-3 w-3" />
                                  Admin Notes
                                </h4>
                                <div className="text-xs text-gray-600 line-clamp-1">{order.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div className="border-t border-gray-200 pt-2">
                            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                              <Package className="h-3 w-3" />
                              Items Ordered:
                            </h4>
                            <div className="space-y-1">
                              {order.items.map((item: any, index: number) => (
                                <div key={`${item.product_id}-${index}`} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <span className="text-gray-700 font-medium truncate">{item.product_name}</span>
                                    <span className="text-gray-500 ml-1">× {item.quantity}</span>
                                    <div className="text-xs text-gray-500">₹{parseFloat(item.price || 0).toFixed(2)} each</div>
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    ₹{(parseFloat(item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div className="border-t border-gray-300 pt-1">
                                <div className="flex justify-between items-center font-semibold text-xs">
                                  <span>Total Amount:</span>
                                  <span className="text-green-600">₹{parseFloat(String(order.total_amount || 0)).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Admin Actions */}
                        <div className="border-t border-gray-200 pt-1 mt-1">
                          <div className="flex flex-wrap gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass-input bg-transparent text-xs px-1 py-1"
                              onClick={() => {
                                setEditingOrder(order)
                                setIsEditStatusOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Status
                            </Button>
                            <Button variant="outline" size="sm" className="glass-input bg-transparent text-red-600 hover:text-red-700 text-xs px-1 py-1">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {/* Centralized Edit Order Status Dialog */}
        <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
          <DialogContent className="max-w-md w-[95vw] mx-auto glass-modal z-[100]" data-radix-dialog-content>
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Order Status</DialogTitle>
            </DialogHeader>
            {editingOrder && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Order #{editingOrder.id}</h4>
                  <p className="text-sm text-gray-600">{editingOrder.customer_name}</p>
                  <p className="text-sm font-medium text-green-600">₹{editingOrder.total_amount}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Select New Status</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
                      { value: 'processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
                      { value: 'shipped', label: 'Shipped', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
                      { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
                      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 hover:bg-red-200' }
                    ].map((status) => (
                      <Button
                        key={status.value}
                        variant="outline"
                        className={`justify-start h-auto p-3 ${status.color} ${
                          editingOrder.status === status.value ? 'ring-2 ring-green-500' : ''
                        }`}
                        onClick={() => handleUpdateOrderStatus(editingOrder.id, status.value)}
                        disabled={updatingOrderStatus || editingOrder.status === status.value}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{status.label}</span>
                          {editingOrder.status === status.value && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Current</span>
                          )}
                          {updatingOrderStatus && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setIsEditStatusOpen(false)
                      setEditingOrder(null)
                    }}
                    disabled={updatingOrderStatus}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
