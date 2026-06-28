import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { getGuestCart } from "@/lib/cart";

export default function FloatingCart() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: cartItems = [] } = useQuery({
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
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : data.items || [];
      } catch (error) {
        return getGuestCart();
      }
    },
  });

  const cartCount = cartItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
  const cartTotal = cartItems.reduce((sum: number, item: any) => {
    const price = Number(item.product?.price || item.price || 0);
    return sum + price * Number(item.quantity || 0);
  }, 0);

  // Only show floating cart on shop page and when there are items
  if (location !== "/shop" || cartCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <Button
        className="bg-[var(--eco-primary)] text-white w-16 h-16 rounded-full shadow-lg hover:bg-[var(--eco-primary)]/90 relative animate-pulse"
        onClick={() => setLocation("/cart")}
      >
        <div className="text-center">
          <ShoppingBag className="w-6 h-6 mb-1" />
          <div className="text-xs leading-none">
            <div>₹{cartTotal.toFixed(0)}</div>
          </div>
        </div>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
          {cartCount}
        </span>
      </Button>
    </div>
  );
}
