import { useState, useEffect } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useQuery } from "@tanstack/react-query";
import { 
  X, Film, Play, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VideoGalleryItem {
  id: number;
  title: string;
  videoType: "YouTube" | "Vimeo" | "Local Upload" | "External URL";
  videoUrl: string;
  uploadedVideo: string;
  thumbnailImage: string;
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

export default function VideoGalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeVideo, setActiveVideo] = useState<VideoGalleryItem | null>(null);

  useEffect(() => {
    document.title = "Video Gallery | Gauranitai";
  }, []);

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery<VideoGalleryItem[]>({
    queryKey: ["public", "video-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/video-gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery videos");
      return res.json();
    }
  });

  const filteredItems = galleryItems.filter(item => {
    return activeCategory === "ALL" || item.category === activeCategory;
  });

  const renderVideoPlayer = (item: VideoGalleryItem) => {
    if (item.videoType === "Local Upload" && item.uploadedVideo) {
      return (
        <video 
          src={item.uploadedVideo} 
          controls 
          autoPlay
          className="w-full h-full object-contain"
        />
      );
    }

    const videoSrc = item.videoUrl;
    if (videoSrc && (videoSrc.includes("youtube.com/embed") || videoSrc.includes("player.vimeo.com"))) {
      return (
        <iframe
          src={`${videoSrc}?autoplay=1`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }

    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-sm font-semibold mb-2">Unsupported or invalid video URL:</p>
        <a href={videoSrc} target="_blank" rel="noreferrer" className="underline text-green-400 break-all max-w-md">{videoSrc}</a>
      </div>
    );
  };

  return (
    <MainPageLayout>
      <div className="bg-white min-h-screen">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-green-700 to-emerald-800 text-white py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Video Gallery</h1>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl mx-auto">
              Watch our journey, product videos, and customer stories.
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
                  setActiveVideo(null);
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                  activeCategory === cat
                    ? "bg-green-600 border-green-600 text-white shadow-green-100"
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                )}
              >
                {cat === "ALL" ? "All Videos" : cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">No videos available in gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setActiveVideo(item)}
                  className="group relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 cursor-pointer bg-muted hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  {item.thumbnailImage ? (
                    <img 
                      src={item.thumbnailImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-600">
                      <Film className="w-12 h-12" />
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-90 group-hover:bg-black/40 transition-colors">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-green-700 shadow-lg transition-transform group-hover:scale-110">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>
                  {/* Bottom Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/75 to-transparent text-white">
                    <Badge className="mb-2 bg-green-600 border-0 font-semibold">{item.category}</Badge>
                    <h4 className="font-bold text-lg leading-tight line-clamp-1">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Video Overlay Modal */}
        {activeVideo && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white/75 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
              onClick={() => setActiveVideo(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Video Player Box */}
            <div 
              className="max-w-5xl w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border"
              onClick={(e) => e.stopPropagation()}
            >
              {renderVideoPlayer(activeVideo)}
            </div>

            {/* Title Footer */}
            <div className="text-center mt-6 text-white max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
              <Badge className="mb-2 bg-green-600 border-0 font-semibold">{activeVideo.category}</Badge>
              <h3 className="text-xl font-bold">{activeVideo.title}</h3>
            </div>
          </div>
        )}
      </div>
    </MainPageLayout>
  );
}
