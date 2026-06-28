import { useState, useEffect } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useQuery } from "@tanstack/react-query";
import { 
  X, ChevronLeft, ChevronRight, Image as ImageIcon, ZoomIn 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ImageGalleryItem {
  id: number;
  title: string;
  image: string;
  altText: string;
  category: string;
  sortOrder: number;
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  "ALL",
  "Farm",
  "Products",
  "Delivery",
  "Customers",
  "Events",
  "Behind the Scenes",
  "General"
];

export default function ImageGalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Image Gallery | Gauranitai";
  }, []);

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery<ImageGalleryItem[]>({
    queryKey: ["public", "image-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/image-gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery images");
      return res.json();
    }
  });

  const filteredItems = galleryItems.filter(item => {
    return activeCategory === "ALL" || item.category === activeCategory;
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") handlePrev(e as any);
      if (e.key === "ArrowRight") handleNext(e as any);
      if (e.key === "Escape") setLightboxIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredItems]);

  return (
    <MainPageLayout>
      <div className="bg-white min-h-screen">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-green-700 to-emerald-800 text-white py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Image Gallery</h1>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl mx-auto">
              A glimpse into our products, process, and happy customers.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-white rounded-t-3xl"></div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setLightboxIndex(null);
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                  activeCategory === cat
                    ? "bg-green-600 border-green-600 text-white shadow-green-100"
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                )}
              >
                {cat === "ALL" ? "All Photos" : cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">No images available in gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item, idx) => (
                <div 
                  key={item.id} 
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 cursor-pointer bg-muted hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <img 
                    src={item.image} 
                    alt={item.altText || item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                    <Badge className="w-fit mb-2 bg-green-600 text-white border-0 font-semibold">{item.category}</Badge>
                    <h4 className="text-white font-bold text-lg leading-tight drop-shadow-sm">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Lightbox Popup Modal */}
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white/75 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Slider Controls */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors z-45"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors z-45"
              onClick={handleNext}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div className="max-w-5xl w-full h-[70vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={filteredItems[lightboxIndex].image} 
                alt={filteredItems[lightboxIndex].altText || filteredItems[lightboxIndex].title} 
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl animate-fade-in"
              />
            </div>

            {/* Title / Info Footer */}
            <div className="text-center mt-6 text-white max-w-2xl px-4 z-40" onClick={(e) => e.stopPropagation()}>
              <Badge className="mb-2 bg-green-600 border-0">{filteredItems[lightboxIndex].category}</Badge>
              <h3 className="text-xl font-bold">{filteredItems[lightboxIndex].title}</h3>
              {filteredItems[lightboxIndex].altText && (
                <p className="text-sm text-gray-400 mt-1">{filteredItems[lightboxIndex].altText}</p>
              )}
              <span className="text-xs text-gray-500 font-semibold mt-4 block">
                {lightboxIndex + 1} of {filteredItems.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </MainPageLayout>
  );
}
