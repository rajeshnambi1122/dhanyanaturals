"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, orderService } from "@/lib/supabase";
import { LogOut, Mail, UserCircle, ShoppingBag, Calendar, DollarSign, ListOrdered, Settings, Star, Package, Gift, Phone, MapPin, CreditCard, Truck, FileText, Clock } from "lucide-react";
import Image from "next/image";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      if (user.email) {
        const orders = await orderService.getOrdersByCustomer(user.email);
        setOrders(orders);
        
        // Calculate user statistics
        setStats({
          totalOrders: orders.length
        });
      } else {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchUserAndOrders();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Get user's profile image (for Google OAuth users)
  const getProfileImage = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  };

  // Get user's display name
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get provider information
  const getAuthProvider = () => {
    if (user?.app_metadata?.provider === 'google') {
      return { name: 'Google', color: 'bg-red-500', icon: '🔍' };
    }
    if (user?.app_metadata?.provider === 'github') {
      return { name: 'GitHub', color: 'bg-gray-800', icon: '🐙' };
    }
    return { name: 'Email', color: 'bg-blue-500', icon: '📧' };
  };

  if (loading) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-4xl w-full animate-fade-in">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-4">
                <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const profileImage = getProfileImage();
  const displayName = getDisplayName();
  const provider = getAuthProvider();

  return (
    <div className="min-h-screen glass-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-6 sm:p-8 max-w-6xl mx-auto animate-scale-in">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 pb-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Profile Image */}
              <div className="relative">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg hover-lift"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                )}
                {/* Provider Badge */}
                <div className={`absolute -bottom-1 -right-1 ${provider.color} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                  <span>{provider.icon}</span>
                  <span className="hidden sm:inline">{provider.name}</span>
                </div>
              </div>
              
              {/* User Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
                  Welcome back, {displayName}!
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(user.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  handleLogout();
                }} 
                className="glass-button px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover-lift bg-red-500 hover:bg-red-600 text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="flex justify-center mb-8">
            <div className="glass-card p-4 sm:p-6 text-center hover-lift max-w-xs w-full">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{stats.totalOrders}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Orders</div>
            </div>
          </div>

          {/* Orders Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <ListOrdered className="h-6 w-6 text-green-600" />
                Order History
              </h2>
              {orders.length > 0 && (
                <div className="text-sm text-gray-600">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
                <button 
                  onClick={() => router.push('/products')}
                  className="glass-button px-6 py-3 rounded-lg hover-lift"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card p-4 sm:p-6 hover-lift">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-green-600" />
                            Order #{order.id}
                          </h3>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "delivered" ? "bg-green-100 text-green-800" : 
                            order.status === "confirmed" ? "bg-green-100 text-black" : 
                            order.status === "shipped" ? "bg-blue-100 text-blue-800" : 
                            order.status === "processing" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </div>
                        
                        {/* Customer Information */}
                        {(order.customer_name || order.customer_email || order.customer_phone) && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <UserCircle className="h-4 w-4" />
                              Customer Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {order.customer_name && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <UserCircle className="h-3 w-3" />
                                  <span>{order.customer_name}</span>
                                </div>
                              )}
                              {order.customer_email && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  <span>{order.customer_email}</span>
                                </div>
                              )}
                              {order.customer_phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{order.customer_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                          {order.updated_at && order.updated_at !== order.created_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span title="Last Updated">Updated: {new Date(order.updated_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Shipping Address
                            </h4>
                            <div className="text-sm text-gray-600">
                              {typeof order.shipping_address === 'string' ? (
                                <div>{order.shipping_address}</div>
                              ) : (
                                <div>
                                  {order.shipping_address.street && <div>{order.shipping_address.street}</div>}
                                  <div>
                                    {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zipCode]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </div>
                                  {order.shipping_address.country && <div>{order.shipping_address.country}</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment & Tracking */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {order.payment_method && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Payment Method
                              </h4>
                              <div className="text-sm text-gray-600">{order.payment_method}</div>
                            </div>
                          )}
                          
                          {order.tracking_number && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Tracking Number
                              </h4>
                              <div className="text-sm text-gray-600 font-mono">{order.tracking_number}</div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Notes
                            </h4>
                            <div className="text-sm text-gray-600">{order.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Items Ordered:
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item: any, index: number) => (
                            <div key={`${item.product_id}-${index}`} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{item.product_name}</span>
                                <span className="text-gray-500 ml-2">× {item.quantity}</span>
                                <div className="text-xs text-gray-500">₹{parseFloat(item.price).toFixed(2)} each</div>
                              </div>
                              <span className="font-medium text-gray-800">
                                ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-300 pt-2 mt-2">
                            <div className="flex justify-between items-center font-semibold">
                              <span>Total Amount:</span>
                              <span className="text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 