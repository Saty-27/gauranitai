import { Home, Calendar, ShoppingCart, Package, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { getGuestCart } from "@/lib/cart";

export default function BottomNavigation() {
  const [location] = useLocation();
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

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      isActive: location === "/",
    },
    {
      href: "/milk",
      icon: Calendar,
      label: "Milk",
      isActive: location === "/milk",
    },
    {
      href: "/shop",
      icon: ShoppingCart,
      label: "Shop",
      isActive: location === "/shop",
      badge: cartCount,
    },
    {
      href: "/orders",
      icon: Package,
      label: "Orders",
      isActive: location === "/orders",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      isActive: location === "/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-[var(--eco-light)] shadow-2xl">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center p-3 space-y-1 relative ${
                  item.isActive
                    ? "text-[var(--eco-primary)]"
                    : "text-[var(--eco-text-muted)] hover:text-[var(--eco-primary)]"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Badge for cart */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
