import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  badgeText: string | null;
  displayOrder: number;
  isActive: boolean;
  showOverlay: boolean;
}

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();
  const { settings } = useSiteSettings();

  const { data: banners = [], isLoading, error } = useQuery<Banner[]>({
    queryKey: ["/api/banners/public"],
    queryFn: async () => {
      const res = await fetch("/api/banners/public");
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    },
  });

  const nextSlide = useCallback(() => {
    if (banners.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    }
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (isLoading) {
    return (
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] bg-gradient-to-br from-green-50 to-green-100 animate-pulse flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </section>
    );
  }

  if (error || banners.length === 0) {
    return (
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] bg-gradient-to-br from-green-800 via-green-700 to-green-600 flex items-center justify-center">
        <div className="text-center text-white px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            {settings.brandName}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90 font-light">Pure. Fresh. Daily.</p>
          <Button
            onClick={() => setLocation("/shop")}
            className="mt-8 bg-white text-green-700 hover:bg-green-50 px-8 py-3 text-base font-semibold rounded-full"
          >
            Shop Now
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[25/10] min-h-[450px] max-h-[85vh] overflow-hidden bg-gray-950">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
          } ${banner.ctaLink ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (!banner.ctaLink) return;
            window.open(banner.ctaLink, "_blank");
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <picture className="absolute inset-0">
              {banner.imageUrlMobile && (
                <source media="(max-width: 639px)" srcSet={banner.imageUrlMobile} />
              )}
              {banner.imageUrlTablet && (
                <source media="(min-width: 640px) and (max-width: 1023px)" srcSet={banner.imageUrlTablet} />
              )}
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover object-center transition-transform duration-10000 ease-linear hover:scale-110"
              />
            </picture>
            
            {/* Conditional Overlay - Controlled by Admin */}
            {banner.showOverlay === true && (
              <div className="absolute inset-0 z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
              </div>
            )}
          </div>

          <div className="relative z-20 h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex items-center justify-start text-left">
            <div className={`max-w-2xl transition-all duration-1000 delay-300 ${index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              {banner.badgeText && (
                <span className="inline-block px-5 py-2 bg-green-500 text-white text-xs sm:text-sm font-bold rounded-full mb-6 uppercase tracking-wider shadow-md">
                  {banner.badgeText}
                </span>
              )}
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
                {banner.title}
              </h1>
              
              {banner.subtitle && (
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-10 leading-relaxed font-medium max-w-xl mr-auto drop-shadow-md">
                  {banner.subtitle}
                </p>
              )}

              {banner.ctaText && (
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {banner.ctaText}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white w-6 shadow-sm" : "bg-white/30 w-2 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
