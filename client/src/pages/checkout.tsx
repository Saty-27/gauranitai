import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Banknote, User, MapPin, Phone, ShoppingCart, ShoppingBag, Loader2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface CartItem {
  id: number;
  quantity: number;
  product?: {
    name: string;
    price: number;
  };
}

interface User {
  id?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [userInfo, setUserInfo] = useState<User>({});
  const { settings } = useSiteSettings();

  const emptyCartSummary = {
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
  };

  const resetCartState = async () => {
    await queryClient.cancelQueries({ queryKey: ["cart"] });
    await queryClient.cancelQueries({ queryKey: ["cart-summary"] });
    queryClient.setQueryData(["cart"], []);
    queryClient.setQueryData(["cart-summary"], emptyCartSummary);
  };

  const clearServerCart = async () => {
    const clearRes = await fetch("/api/cart", {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });

    if (!clearRes.ok) return false;

    const verifyRes = await fetch("/api/cart", {
      credentials: "include",
      cache: "no-store",
    });

    if (!verifyRes.ok) return false;
    const data = await verifyRes.json();
    const items = Array.isArray(data) ? data : data.items || [];
    return items.length === 0;
  };

  // Fetch cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/cart", { credentials: "include", cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.items || []);
      } catch {
        return [];
      }
    },
  });

  // Fetch user info
  const { data: user } = useQuery({
    queryKey: ["user_info"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/current-user", { credentials: "include" });
        if (!res.ok) return null;
        const data = await res.json();
        setUserInfo(data);
        return data;
      } catch {
        return null;
      }
    },
  });

  const total = Array.isArray(cartItems)
    ? cartItems.reduce((sum: number, item: any) => {
        const itemPrice = item.product?.price || 0;
        return sum + itemPrice * (item.quantity || 1);
      }, 0)
    : 0;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    if (!userInfo.phone || !userInfo.address) {
      toast({
        title: "Error",
        description: "Please complete your profile information",
        variant: "destructive",
      });
      setEditMode(true);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          items: cartItems,
          total: total,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
          userInfo: userInfo,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        await resetCartState();
        toast({
          title: "✅ Order Placed Successfully!",
          description: `Order ID: ${order.id}`,
        });
        
        const serverCartCleared = await clearServerCart();
        await resetCartState();
        if (serverCartCleared) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["cart"], refetchType: "all" }),
            queryClient.invalidateQueries({ queryKey: ["cart-summary"], refetchType: "all" }),
            queryClient.invalidateQueries({ queryKey: ["user-orders"], refetchType: "all" }),
            queryClient.invalidateQueries({ queryKey: ["/api/orders"], refetchType: "all" }),
          ]);
        } else {
          queryClient.removeQueries({ queryKey: ["cart"] });
          queryClient.setQueryData(["cart"], []);
          queryClient.setQueryData(["cart-summary"], emptyCartSummary);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["user-orders"], refetchType: "all" }),
            queryClient.invalidateQueries({ queryKey: ["/api/orders"], refetchType: "all" }),
          ]);
        }
        setTimeout(() => setLocation("/orders"), 1500);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-6">Your cart is empty</p>
          <Button
            onClick={() => setLocation("/shop")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black text-[hsl(var(--eco-secondary))] mb-8 flex items-center">
            <span className="w-10 h-10 bg-[hsl(var(--eco-primary))] rounded-xl flex items-center justify-center mr-4 text-white shadow-lg">
              <ShoppingCart className="w-5 h-5" />
            </span>
            Complete Your Order
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Info */}
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-[hsl(var(--eco-primary))]"></div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-[hsl(var(--eco-secondary))] flex items-center">
                    <MapPin className="w-6 h-6 mr-3 text-[hsl(var(--eco-primary))]" />
                    Delivery Information
                  </h2>
                  <Button
                    onClick={() => setEditMode(!editMode)}
                    className="eco-button-outline px-6 h-10"
                  >
                    {editMode ? "✅ Done" : "✏️ Edit"}
                  </Button>
                </div>

                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-black text-[hsl(var(--eco-text-muted))] mb-2 uppercase tracking-wider">First Name</label>
                      <input
                        type="text"
                        value={userInfo.firstName || ""}
                        onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[hsl(var(--eco-primary))] focus:ring-0 transition-all font-semibold"
                        placeholder="e.g. Rahul"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-black text-[hsl(var(--eco-text-muted))] mb-2 uppercase tracking-wider">Last Name</label>
                      <input
                        type="text"
                        value={userInfo.lastName || ""}
                        onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[hsl(var(--eco-primary))] focus:ring-0 transition-all font-semibold"
                        placeholder="e.g. Kumar"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-black text-[hsl(var(--eco-text-muted))] mb-2 uppercase tracking-wider">Phone Number *</label>
                      <input
                        type="tel"
                        value={userInfo.phone || ""}
                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[hsl(var(--eco-primary))] focus:ring-0 transition-all font-semibold"
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-black text-[hsl(var(--eco-text-muted))] mb-2 uppercase tracking-wider">Full Delivery Address *</label>
                      <textarea
                        value={userInfo.address || ""}
                        onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[hsl(var(--eco-primary))] focus:ring-0 transition-all font-semibold"
                        placeholder="House No, Street, Landmark, City, Pincode"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm border border-slate-100">
                        <User className="w-5 h-5 text-[hsl(var(--eco-primary))]" />
                      </div>
                      <p className="text-xl font-black text-[hsl(var(--eco-secondary))]">{userInfo.firstName || "Guest"} {userInfo.lastName || "User"}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm border border-slate-100">
                        <Phone className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-lg font-bold text-slate-700">{userInfo.phone || "No phone added"}</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm border border-slate-100 flex-shrink-0">
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <p className="text-lg font-bold text-slate-700 pt-1">{userInfo.address || "No address added"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items Summary */}
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-slate-100">
                <h2 className="text-2xl font-black text-[hsl(var(--eco-secondary))] mb-6 flex items-center">
                  <ShoppingBag className="w-6 h-6 mr-3 text-[hsl(var(--eco-primary))]" />
                  Order Items
                </h2>
                <div className="space-y-4">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[hsl(var(--eco-primary))] transition-all">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm border border-slate-100 text-2xl">
                          <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-black text-[hsl(var(--eco-secondary))] text-lg">{item.product?.name}</p>
                          <p className="text-[hsl(var(--eco-text-muted))] font-bold">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-black text-[hsl(var(--eco-primary))] text-xl">
                        ₹{(item.product?.price || 0) * (item.quantity || 1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-slate-100">
                <h2 className="text-2xl font-black text-[hsl(var(--eco-secondary))] mb-6 flex items-center">
                  <Banknote className="w-6 h-6 mr-3 text-[hsl(var(--eco-primary))]" />
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <label 
                    className={`flex items-center p-6 border-3 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                      paymentMethod === "cash" 
                        ? "border-[hsl(var(--eco-primary))] bg-green-50 shadow-md" 
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      paymentMethod === "cash" ? "border-[hsl(var(--eco-primary))] bg-[hsl(var(--eco-primary))]" : "border-slate-300"
                    }`}>
                      {paymentMethod === "cash" && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex-1 flex items-center">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm border border-slate-100 text-3xl">
                        <Banknote className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-black text-[hsl(var(--eco-secondary))] text-xl">Cash on Delivery</p>
                        <p className="text-[hsl(var(--eco-text-muted))] font-bold">Pay safely when your order arrives</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 p-8 h-fit sticky top-24 border border-slate-100">
                <h2 className="text-2xl font-black text-[hsl(var(--eco-secondary))] mb-6">Order Summary</h2>
                <div className="space-y-4 border-b-2 border-slate-50 pb-6 mb-6">
                  <div className="flex justify-between text-lg font-bold text-[hsl(var(--eco-text-muted))]">
                    <span>Subtotal</span>
                    <span className="text-[hsl(var(--eco-secondary))]">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-[hsl(var(--eco-text-muted))]">Delivery Fee</span>
                    <span className="text-[hsl(var(--eco-success))]">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-black text-[hsl(var(--eco-secondary))] mb-8">
                  <span>Grand Total</span>
                  <span className="text-[hsl(var(--eco-primary))]">₹{total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || editMode}
                  className="w-full eco-button h-16 text-xl font-black shadow-lg hover:shadow-2xl transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[hsl(var(--eco-text-muted))] text-xs font-bold leading-relaxed">
                    Secure 256-bit SSL encrypted checkout. 
                    By placing an order, you agree to {settings.brandName}'s Terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
