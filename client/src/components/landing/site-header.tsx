import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImage from "@assets/gauranitai_logo.png";

import { getGuestCart } from "@/lib/cart";

export default function SiteHeader() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, isLoading } = useAuth();
  const { settings } = useSiteSettings();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

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

  const cartCount = cartItems.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/subscription", label: "Subscription" },
    { href: "/orders", label: "My Orders" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm transition-all duration-300">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between h-20 lg:h-24 xl:h-28 px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 xl:gap-4" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}>
            <div className="w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-1 border-2 border-green-50 transition-transform hover:scale-105">
              <img 
                src={settings.logoUrl || logoImage} 
                alt={settings.brandName} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold text-gray-950 leading-tight tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>{settings.brandName}</h1>
              <p className="text-[8px] sm:text-[9px] lg:text-[10px] xl:text-[11px] text-orange-500 font-medium tracking-wide -mt-0.5">PURE. FRESH. DAILY.</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link
              href="/"
              className={`text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                location === "/" ? "text-green-600" : "text-gray-700"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                location === "/about" ? "text-green-600" : "text-gray-700"
              }`}
            >
              About Us
            </Link>
            <Link
              href="/shop"
              className={`text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                location.startsWith("/shop") ? "text-green-600" : "text-gray-700"
              }`}
            >
              Products
            </Link>
            <Link
              href="/subscription"
              className={`text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                location.startsWith("/subscription") ? "text-green-600" : "text-gray-700"
              }`}
            >
              Subscription
            </Link>
            
            {/* Media Dropdown */}
            <div className="relative group">
              <button
                className={`flex items-center gap-1 text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                  location.startsWith("/blog") || 
                  location.startsWith("/video-blog") || 
                  location.startsWith("/image-gallery") || 
                  location.startsWith("/video-gallery")
                    ? "text-green-600" 
                    : "text-gray-700"
                }`}
              >
                Media
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full pt-2 w-48 hidden group-hover:block transition-all z-50">
                <div className="bg-white border border-gray-100 rounded-xl shadow-lg py-2">
                  <Link href="/blog" className={`block px-4 py-2 text-xs xl:text-sm transition-colors hover:bg-green-50 hover:text-green-600 ${location.startsWith("/blog") ? "text-green-600 font-semibold" : "text-gray-700"}`}>
                    Blog
                  </Link>
                  <Link href="/video-blog" className={`block px-4 py-2 text-xs xl:text-sm transition-colors hover:bg-green-50 hover:text-green-600 ${location.startsWith("/video-blog") ? "text-green-600 font-semibold" : "text-gray-700"}`}>
                    Video Blog
                  </Link>
                  <Link href="/image-gallery" className={`block px-4 py-2 text-xs xl:text-sm transition-colors hover:bg-green-50 hover:text-green-600 ${location.startsWith("/image-gallery") ? "text-green-600 font-semibold" : "text-gray-700"}`}>
                    Image Gallery
                  </Link>
                  <Link href="/video-gallery" className={`block px-4 py-2 text-xs xl:text-sm transition-colors hover:bg-green-50 hover:text-green-600 ${location.startsWith("/video-gallery") ? "text-green-600 font-semibold" : "text-gray-700"}`}>
                    Video Gallery
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className={`text-xs xl:text-sm font-medium transition-colors hover:text-green-600 ${
                location === "/contact" ? "text-green-600" : "text-gray-700"
              }`}
            >
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 lg:gap-3">
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-32 lg:w-40 xl:w-48 focus:w-40 lg:focus:w-48 xl:focus:w-56 px-4 py-2 pr-10 text-xs xl:text-sm bg-gray-50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-300"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={() => setLocation("/cart")}
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 lg:w-5 lg:h-5 bg-green-600 text-white text-[9px] lg:text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {!isLoading && (
              isAuthenticated ? (
                <button
                  onClick={() => setLocation("/home")}
                  className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <User className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              ) : (
                <Button
                  onClick={() => setLocation("/auth/login")}
                  className="hidden md:flex bg-green-600 hover:bg-green-700 text-white text-xs xl:text-sm font-medium px-4 py-1.5 xl:px-6 xl:py-2 rounded-full transition-all"
                >
                  Login
                </Button>
              )
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
              
              <nav className="space-y-1">
                {[
                  { href: "/", label: "Home" },
                  { href: "/about", label: "About Us" },
                  { href: "/shop", label: "Products" },
                  { href: "/subscription", label: "Subscription" },
                  { href: "/blog", label: "Blog" },
                  { href: "/video-blog", label: "Video Blog" },
                  { href: "/image-gallery", label: "Image Gallery" },
                  { href: "/video-gallery", label: "Video Gallery" },
                  { href: "/contact", label: "Contact Us" }
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                      location === link.href || (link.href !== "/" && location.startsWith(link.href))
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {!isAuthenticated && (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLocation("/auth/login");
                  }}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl"
                >
                  Login / Sign Up
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
