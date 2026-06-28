import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  product?: { name: string; description: string };
}

interface Order {
  id: number;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryDate: string;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["user-orders", isAuthenticated],
    queryFn: async () => {
      try {
        let url = "/api/orders";
        if (!isAuthenticated) {
          const guestOrderIds = JSON.parse(localStorage.getItem("gauranitai_guest_order_ids") || "[]");
          if (guestOrderIds.length === 0) {
            return [];
          }
          url += `?ids=${guestOrderIds.join(",")}`;
        }
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return [];
        const data = await res.json();
        console.log("Orders fetched:", data);
        return Array.isArray(data) ? data : (data.orders || []);
      } catch (error) {
        console.error("Orders fetch error:", error);
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      PLACED: { bg: "#dbeafe", text: "#1e40af" },
      PENDING: { bg: "#fef3c7", text: "#92400e" },
      PROCESSING: { bg: "#ddd6fe", text: "#5b21b6" },
      OUT_FOR_DELIVERY: { bg: "#e9d5ff", text: "#6b21a8" },
      DELIVERED: { bg: "#d1fae5", text: "#065f46" },
      CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
      FAILED: { bg: "#fee2e2", text: "#991b1b" },
    };
    return colors[status] || { bg: "#f3f4f6", text: "#374151" };
  };

  const getPaymentColor = (status: string) => {
    if (status === "paid") return { bg: "#d1fae5", text: "#065f46" };
    if (status === "pending") return { bg: "#fef3c7", text: "#92400e" };
    return { bg: "#fee2e2", text: "#991b1b" };
  };

  const totalSpent = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || "0"), 0);
  const delivered = orders.filter((o: any) => o.status === "DELIVERED").length;

  if (isLoading) {
    return (
      <MainPageLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280" }}>Loading orders...</p>
          </div>
        </div>
      </MainPageLayout>
    );
  }

  return (
    <MainPageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
            <button
              onClick={() => setLocation(isAuthenticated ? "/home" : "/shop")}
              className="bg-white border-none rounded-lg p-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 m-0 truncate">My Orders</h1>
              <p className="text-gray-500 text-sm m-0">Track your recent purchases</p>
            </div>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Total Orders</p>
            <p className="text-2xl font-black text-blue-600 mt-2 m-0">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Delivered</p>
            <p className="text-2xl font-black text-green-600 mt-2 m-0">{delivered}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-500">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black m-0">Total Spent</p>
            <p className="text-2xl font-black text-orange-600 mt-2 m-0">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 sm:p-20 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gray-50 rounded-full">
                <PackageX size={64} className="text-gray-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              When you start shopping, your orders will appear here. Track your fresh dairy deliveries in real-time.
            </p>
            <Button 
              onClick={() => setLocation("/shop")} 
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order: any, idx: number) => {
              const statusColor = getStatusColor(order.status);
              const paymentColor = getPaymentColor(order.paymentStatus);

              return (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <PackageX className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Order ID</p>
                        <p className="text-lg font-black text-blue-600 font-mono">#{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-green-600">₹{parseFloat(order.totalAmount || "0").toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Status</p>
                      <span 
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-fit"
                        style={{ background: statusColor.bg, color: statusColor.text }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Payment</p>
                      <span 
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-fit"
                        style={{ background: paymentColor.bg, color: paymentColor.text }}
                      >
                        {order.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Date</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Method</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{order.paymentMethod || "COD"}</p>
                    </div>
                  </div>

                  {/* Items Summary */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">Items ({order.items.length})</p>
                      <div className="space-y-2">
                        {order.items.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 font-medium">
                              {item.product?.name || `Product ${item.productId}`} × {item.quantity}
                            </span>
                            <span className="text-green-600 font-bold">₹{parseFloat(item.price || "0").toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2">Delivery Address</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{order.deliveryAddress || "Not specified"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Action */}
        {orders.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Button
              onClick={() => setLocation("/shop")}
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Order More Fresh Products
            </Button>
          </div>
        )}
      </div>
    </MainPageLayout>
  );
}
