import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import MainPageLayout from "@/components/layout/main-page-layout";
import { ShoppingCart, ShoppingBag, Package, Calendar, Phone, Star, CreditCard, Loader2 } from "lucide-react";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImage from "@assets/gauranitai_logo.png";

interface User {
  id?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  role?: string;
  profileImageUrl?: string;
}

import { addToGuestCart } from "@/lib/cart";

function FeaturedProductsGrid() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const handleAddToCart = async (product: any) => {
    try {
      if (!isAuthenticated) {
        addToGuestCart(product, 1);
        toast({ title: "Added to cart", description: `${product.name} added successfully!` });
        queryClient.invalidateQueries({ queryKey: ["cart", isAuthenticated] });
        return;
      }
      const res = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        toast({ title: "Added to cart", description: `${product.name} added successfully!` });
        queryClient.invalidateQueries({ queryKey: ["cart", isAuthenticated] });
      } else {
        throw new Error();
      }
    } catch {
      toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
    }
  };

  const featuredProducts = products.slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {featuredProducts.map((product: any) => (
        <div
          key={product.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
          onClick={() => setLocation(`/product/${product.id}`)}
        >
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={product.imageUrl || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
            <p className="text-gray-600 text-xs mb-3 line-clamp-1">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-bold text-lg">₹{product.price}</span>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full w-8 h-8 p-0 flex items-center justify-center"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth() as { user?: User; isLoading: boolean };
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "security">("overview");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<User>(user || {});
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);


  // Fetch current user data is handled by useAuth
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        // Complete page reload to clear all state and fetch fresh auth
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Logout failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        toast({ title: "✅ Profile updated successfully!" });
        setEditMode(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setPassLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <MainPageLayout>
      <div className="w-full bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 mb-16">
          {/* Header */}
          <div className="text-center py-6">
            <div className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl p-2 border-2 border-green-50">
              <img 
                src={settings.logoUrl || logoImage} 
                alt={settings.brandName} 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Home!</h1>
            <p className="text-gray-500 mt-1">{settings.brandName} Dairy Delivery</p>
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-600 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {user?.firstName?.charAt(0) || "👤"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600 text-sm truncate">{user?.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full sm:w-auto px-6 py-2 rounded text-sm font-bold"
              >
                Logout
              </Button>
            </div>

            {/* Tabs - Scrollable on mobile */}
            <div className="border-b border-gray-200 mb-6 flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 sm:px-4 py-2 font-bold text-sm sm:text-base transition-all ${
                  activeTab === "overview"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 sm:px-4 py-2 font-bold text-sm sm:text-base transition-all ${
                  activeTab === "profile"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`px-3 sm:px-4 py-2 font-bold text-sm sm:text-base transition-all ${
                  activeTab === "security"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600"
                }`}
              >
                Security
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("open-chatbot"));
                }}
                className="px-3 sm:px-4 py-2 font-bold text-sm sm:text-base text-gray-600 hover:text-green-650 border-b-2 border-transparent hover:border-green-300"
              >
                Chat Support
              </button>
              <button
                onClick={() => setLocation("/billing")}
                className="px-3 sm:px-4 py-2 font-bold text-sm sm:text-base text-blue-600 hover:text-blue-700 border-b-2 border-transparent hover:border-blue-300 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Phone</p>
                  <p className="text-lg font-bold text-gray-900">{user?.phone || "Not provided"}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Gender</p>
                  <p className="text-lg font-bold text-gray-900">{user?.gender || "Not provided"}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Date of Birth</p>
                  <p className="text-lg font-bold text-gray-900">{user?.dateOfBirth || "Not provided"}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Address</p>
                  <p className="text-lg font-bold text-gray-900">{user?.address || "Not provided"}</p>
                </div>
              </div>
            )}

            {/* Profile Tab - Editable */}
            {activeTab === "profile" && (
              <div>
                {editMode ? (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName || ""}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName || ""}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                      <select
                        value={formData.gender || ""}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth || ""}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                      <textarea
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setFormData(user || {});
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">First Name</p>
                        <p className="text-lg font-bold text-gray-900">{user?.firstName || "—"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Last Name</p>
                        <p className="text-lg font-bold text-gray-900">{user?.lastName || "—"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Phone</p>
                        <p className="text-lg font-bold text-gray-900">{user?.phone || "—"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Gender</p>
                        <p className="text-lg font-bold text-gray-900">{user?.gender || "—"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Date of Birth</p>
                        <p className="text-lg font-bold text-gray-900">{user?.dateOfBirth || "—"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-sm">Email</p>
                        <p className="text-lg font-bold text-gray-900">{user?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg mb-6">
                      <p className="text-gray-600 text-sm">Address</p>
                      <p className="text-lg font-bold text-gray-900">{user?.address || "—"}</p>
                    </div>
                    <Button
                      onClick={() => setEditMode(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab - Change Password */}
            {activeTab === "security" && (
              <div className="max-w-md space-y-4 py-2">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={passLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded text-sm flex items-center gap-2"
                  >
                    {passLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </div>
            )}
          </div>



          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <button
              onClick={() => setLocation("/shop")}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group border border-gray-100"
            >
              <div className="mb-4 p-3 bg-green-50 rounded-xl w-fit group-hover:bg-green-100 transition-colors">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Shop Products</h3>
              <p className="text-gray-600 text-sm mt-1">Browse and order dairy products</p>
            </button>

            <button
              onClick={() => setLocation("/cart")}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group border border-gray-100"
            >
              <div className="mb-4 p-3 bg-blue-50 rounded-xl w-fit group-hover:bg-blue-100 transition-colors">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Your Cart</h3>
              <p className="text-gray-600 text-sm mt-1">View and manage your shopping cart</p>
            </button>

            <button
              onClick={() => setLocation("/orders")}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group border border-gray-100"
            >
              <div className="mb-4 p-3 bg-purple-50 rounded-xl w-fit group-hover:bg-purple-100 transition-colors">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">My Orders</h3>
              <p className="text-gray-600 text-sm mt-1">View your order history</p>
            </button>

            <button
              onClick={() => setLocation("/subscription")}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group border border-gray-100"
            >
              <div className="mb-4 p-3 bg-orange-50 rounded-xl w-fit group-hover:bg-orange-100 transition-colors">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Milk Subscription</h3>
              <p className="text-gray-600 text-sm mt-1">Daily milk delivery to your door</p>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new Event("open-chatbot"));
              }}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group border border-gray-100 w-full"
            >
              <div className="mb-4 p-3 bg-red-50 rounded-xl w-fit group-hover:bg-red-100 transition-colors">
                <Phone className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Chat Support</h3>
              <p className="text-gray-600 text-sm mt-1">Click to chat with us / 1-800-DAIRY</p>
            </button>
          </div>
        </div>
      </div>
    </MainPageLayout>
  );
}
