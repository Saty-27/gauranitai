import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";
import { ShoppingCart, AlertCircle, Loader2, ArrowLeft, Trash2, Plus, Minus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart } from "@/lib/cart";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product?: {
    name: string;
    price: number;
    description: string;
  };
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading, error } = useQuery({
    queryKey: ["cart", isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) {
        return getGuestCart();
      }
      try {
        const res = await fetch("/api/cart", { credentials: "include", cache: "no-store" });
        if (res.status === 401) {
          return getGuestCart();
        }
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        return Array.isArray(data) ? data : (data.items || []);
      } catch (err: any) {
        return getGuestCart();
      }
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number, quantity: number }) => {
      if (!isAuthenticated) {
        updateGuestCartQuantity(itemId, quantity);
        return { success: true };
      }
      const res = await fetch(`/api/cart/items/${itemId}`, { 
        method: "PATCH", 
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      return res.json();
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart", isAuthenticated] });
      const previousCart = queryClient.getQueryData(["cart", isAuthenticated]);

      queryClient.setQueryData(["cart", isAuthenticated], (old: any) => {
        return old.map((item: any) => 
          item.id === itemId ? { ...item, quantity } : item
        );
      });

      return { previousCart };
    },
    onError: (err, __, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart", isAuthenticated], context.previousCart);
      }
      toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", isAuthenticated] });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!isAuthenticated) {
        removeFromGuestCart(itemId);
        return { success: true };
      }
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to remove item");
      return res.json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart", isAuthenticated] });
      const previousCart = queryClient.getQueryData(["cart", isAuthenticated]);

      queryClient.setQueryData(["cart", isAuthenticated], (old: any) => {
        return old.filter((item: any) => item.id !== itemId);
      });

      toast({ title: "✅ Item removed" });
      return { previousCart };
    },
    onError: (err, __, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart", isAuthenticated], context.previousCart);
      }
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", isAuthenticated] });
    }
  });

  const total = Array.isArray(cartItems)
    ? cartItems.reduce((sum: number, item: any) => {
        const itemPrice = item.product?.price || 0;
        return sum + itemPrice * (item.quantity || 1);
      }, 0)
    : 0;

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  return (
    <MainPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-bold">Error Loading Cart</p>
              <p className="text-sm">{(error as any).message || "Something went wrong"}</p>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="font-bold">Loading your cart...</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-4">
              <ShoppingCart className="w-10 h-10 text-green-600" /> Your Cart
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} currently in your cart
            </p>
          </div>
          <Button
            onClick={() => setLocation("/shop")}
            variant="outline"
            className="px-8 py-6 rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all font-bold"
          >
            ← Continue Shopping
          </Button>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {cartItems.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {item.product?.name}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                        {item.product?.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg text-sm">
                          ₹{item.product?.price} / unit
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                      <p className="text-2xl font-black text-gray-900">
                        ₹{(item.product?.price || 0) * (item.quantity || 1)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                          variant="ghost"
                          className="w-10 h-10 p-0 rounded-xl hover:bg-white hover:shadow-sm text-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-black text-lg">{item.quantity}</span>
                        <Button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updateQuantityMutation.isPending}
                          variant="ghost"
                          className="w-10 h-10 p-0 rounded-xl hover:bg-white hover:shadow-sm text-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-32">
                <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-gray-500 font-medium">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="text-gray-900 font-bold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-medium">
                    <span>Delivery</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <div className="flex justify-between items-center text-gray-900">
                      <span className="text-lg font-bold">Total Amount</span>
                      <span className="text-3xl font-black text-green-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setLocation("/checkout")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-16 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  Proceed to Checkout <ArrowLeft className="w-5 h-5 rotate-180" />
                </Button>
                
                <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-3 h-3" /> Secure Checkout Guaranteed
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-16 md:p-24 text-center">
            <div className="flex justify-center mb-10">
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                <ShoppingCart size={64} className="text-gray-200" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium text-lg">
              Looks like you haven't added anything to your cart yet. Browse our products to find something you like!
            </p>
            <Button
              onClick={() => setLocation("/shop")}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-8 rounded-[2rem] font-black text-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Start Shopping
            </Button>
          </div>
        )}
      </div>
    </MainPageLayout>
  );
}
