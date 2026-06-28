import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { addToGuestCart } from "@/lib/cart";

export default function DealsSection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product: any) => {
      if (!isAuthenticated) {
        addToGuestCart(product, 1);
        return { success: true };
      }
      const res = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      return res.json();
    },
    onMutate: async (product) => {
      // Optimistic update: show item in cart immediately
      await queryClient.cancelQueries({ queryKey: ["cart", isAuthenticated] });
      const previousCart = queryClient.getQueryData(["cart", isAuthenticated]);
      
      // Optimistically add to cart
      queryClient.setQueryData(["cart", isAuthenticated], (old: any) => {
        const newItem = { id: product.id, cartId: 1, productId: product.id, quantity: 1, price: product.price || "0", addedAt: new Date().toISOString() };
        return old ? [...old, newItem] : [newItem];
      });
      
      // Show instant feedback
      toast({ title: "✅ Added!", description: `${product.name} added to your cart` });
      
      return { previousCart };
    },
    onError: (_, __, context: any) => {
      // Restore on error
      if (context?.previousCart) {
        queryClient.setQueryData(["cart", isAuthenticated], context.previousCart);
      }
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    },
    onSuccess: () => {
      // Sync with server after
      queryClient.invalidateQueries({ queryKey: ["cart", isAuthenticated] });
    },
  });

  const featuredProducts = products.slice(0, 8);

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-orange-500 text-sm font-semibold tracking-widest uppercase">Fresh Products</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              Shop Our Best Sellers
            </h2>
          </div>
          <Button
            onClick={() => setLocation("/shop")}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 rounded-full px-6 self-start sm:self-auto"
          >
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product: any) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setLocation(`/product/${product.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.imageUrl || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 mb-1">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-1">
                  {product.unit}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-bold text-base sm:text-lg">
                    ₹{parseFloat(product.price).toFixed(0)}
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCartMutation.mutate(product);
                    }}
                    disabled={addToCartMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full w-8 h-8 sm:w-9 sm:h-9 p-0"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
