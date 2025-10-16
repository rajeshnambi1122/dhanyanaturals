'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { orderService } from '@/lib/supabase'

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: any[]
  total_amount: number
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_method?: string
  payment_id?: string
  payment_status?: 'pending' | 'success' | 'failed' | 'cancelled'
  tracking_number?: string
  notes?: string
  shipping_address?: any
  created_at: string
  updated_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const result = await orderService.getOrdersWithFilters({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100
      })
      
      setOrders(result.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, updates: Partial<Order>) => {
    try {
      setUpdating(true)
      
      const updatedOrder = await orderService.updateOrderStatus(orderId, updates)
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? updatedOrder : order
      ))
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder)
      }
      
      alert('Order updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-emerald-100 text-emerald-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchOrders} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Orders ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                        <p className="text-sm font-medium">₹{order.total_amount}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        {order.payment_status && (
                          <Badge className={`ml-2 ${getPaymentStatusColor(order.payment_status)}`}>
                            Payment: {order.payment_status}
                          </Badge>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div>
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle>Order #{selectedOrder.id} Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Information</Label>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && (
                      <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Order Items</Label>
                  <div className="text-sm space-y-1">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>₹{item.total}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 font-semibold flex justify-between">
                      <span>Total:</span>
                      <span>₹{selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Payment Information</Label>
                  <div className="text-sm space-y-1">
                    <p><strong>Method:</strong> {selectedOrder.payment_method || 'N/A'}</p>
                    {selectedOrder.payment_id && (
                      <p><strong>Payment ID:</strong> {selectedOrder.payment_id}</p>
                    )}
                    <p><strong>Status:</strong> 
                      <Badge className={`ml-2 ${getPaymentStatusColor(selectedOrder.payment_status || 'pending')}`}>
                        {selectedOrder.payment_status || 'pending'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Update Order Status</Label>
                  <div className="space-y-2">
                    <Select 
                      value={selectedOrder.status} 
                      onValueChange={(value) => updateOrderStatus(selectedOrder.id, { status: value as any })}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <div>
                      <Label htmlFor="tracking">Tracking Number</Label>
                      <Input
                        id="tracking"
                        value={selectedOrder.tracking_number || ''}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, { tracking_number: e.target.value })}
                        placeholder="Enter tracking number"
                        disabled={updating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={selectedOrder.notes || ''}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, { notes: e.target.value })}
                        placeholder="Add order notes"
                        disabled={updating}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Shipping Address</Label>
                  {selectedOrder.shipping_address ? (
                    <div className="text-sm">
                      <p>{selectedOrder.shipping_address.street}</p>
                      <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                      <p>{selectedOrder.shipping_address.zipCode}</p>
                      {selectedOrder.shipping_address.country && (
                        <p>{selectedOrder.shipping_address.country}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No shipping address provided</p>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  <p>Created: {formatDate(selectedOrder.created_at)}</p>
                  <p>Updated: {formatDate(selectedOrder.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Select an order to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
