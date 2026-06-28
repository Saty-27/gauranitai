import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Calendar, ArrowLeft, ArrowRight, Film, Play, Tag 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VideoBlog {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  videoType: "YouTube" | "Vimeo" | "Local Upload" | "External URL";
  videoUrl: string;
  uploadedVideo: string;
  thumbnailImage: string;
  keywords: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  createdAt: string;
}

export default function VideoBlogPage() {
  const [match, params] = useRoute("/video-blog/:slug");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  if (match && params?.slug) {
    return <VideoBlogDetailView slug={params.slug} />;
  }

  return (
    <VideoBlogListView 
      search={debouncedSearch} 
      setSearch={setSearch} 
      searchVal={search} 
    />
  );
}

function VideoBlogListView({ 
  search, 
  setSearch, 
  searchVal 
}: { 
  search: string; 
  setSearch: (v: string) => void; 
  searchVal: string;
}) {
  useEffect(() => {
    document.title = "Video Blogs | Gauranitai";
  }, []);

  const { data: blogs = [], isLoading } = useQuery<VideoBlog[]>({
    queryKey: ["public", "video-blogs", search],
    queryFn: async () => {
      const url = search 
        ? `/api/video-blogs?search=${encodeURIComponent(search)}` 
        : "/api/video-blogs";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch video blogs");
      return res.json();
    }
  });

  return (
    <MainPageLayout>
      <div className="bg-white min-h-screen">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-emerald-700 to-green-800 text-white py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Video Blogs</h1>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl mx-auto">
              Watch useful videos about milk, health, farming, and natural living.
            </p>
          </div>
          {/* Decorative Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-white rounded-t-3xl"></div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-12 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search video articles..."
              value={searchVal}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 py-6 rounded-full border-green-100 focus-visible:ring-green-500 shadow-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <p className="text-gray-500 text-lg font-medium">No video blogs available right now.</p>
              {search && <Button onClick={() => setSearch("")} variant="link" className="text-green-600 mt-2">Clear search</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Card key={blog.id} className="group overflow-hidden rounded-[2rem] border-green-50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                  <div className="aspect-video w-full overflow-hidden bg-muted relative">
                    {blog.thumbnailImage ? (
                      <img 
                        src={blog.thumbnailImage} 
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-green-50">
                        <Film className="w-12 h-12" />
                      </div>
                    )}
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-90 group-hover:bg-black/40 transition-colors">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-green-700 shadow-lg transition-transform group-hover:scale-110">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                    {/* Category Type Badge */}
                    <Badge className="absolute top-3 left-3 bg-green-600 text-white border-0 font-semibold">
                      {blog.videoType}
                    </Badge>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-green-700 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {blog.shortDescription}
                      </p>
                    </div>
                    
                    <div className="pt-6">
                      <Link href={`/video-blog/${blog.slug}`}>
                        <Button variant="link" className="p-0 text-green-600 hover:text-green-700 font-bold flex items-center gap-1 group/btn">
                          Watch Video <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainPageLayout>
  );
}

function VideoBlogDetailView({ slug }: { slug: string }) {
  const { data: detailData, isLoading, error } = useQuery<{ blog: VideoBlog; related: VideoBlog[] }>({
    queryKey: ["public", "video-blog", slug],
    queryFn: async () => {
      const res = await fetch(`/api/video-blogs/${slug}`);
      if (!res.ok) throw new Error("Video blog not found");
      return res.json();
    }
  });

  useEffect(() => {
    if (detailData?.blog) {
      document.title = `${detailData.blog.metaTitle || detailData.blog.title} | Gauranitai`;
    }
  }, [detailData]);

  if (isLoading) {
    return (
      <MainPageLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      </MainPageLayout>
    );
  }

  if (error || !detailData) {
    return (
      <MainPageLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Video Blog Article Not Found</h2>
          <p className="text-gray-600 mb-8">The video blog article you are looking for does not exist or has been removed.</p>
          <Link href="/video-blog">
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full">
              Back to Video Blogs
            </Button>
          </Link>
        </div>
      </MainPageLayout>
    );
  }

  const { blog, related } = detailData;

  const renderVideoPlayer = () => {
    if (blog.videoType === "Local Upload" && blog.uploadedVideo) {
      return (
        <video 
          src={blog.uploadedVideo} 
          controls 
          poster={blog.thumbnailImage} 
          className="w-full h-full object-contain"
        />
      );
    }

    const videoSrc = blog.videoUrl;
    if (videoSrc && (videoSrc.includes("youtube.com/embed") || videoSrc.includes("player.vimeo.com"))) {
      return (
        <iframe
          src={videoSrc}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }

    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
        <Film className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm">Video URL is invalid or unsupported: <a href={videoSrc} target="_blank" rel="noreferrer" className="underline text-green-400">{videoSrc}</a></p>
      </div>
    );
  };

  return (
    <MainPageLayout>
      <article className="bg-white min-h-screen pb-24">
        {/* Breadcrumbs / Back button */}
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
          <Link href="/video-blog">
            <button className="flex items-center text-sm font-semibold gap-1 text-green-600 hover:text-green-700 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Video Blogs
            </button>
          </Link>
        </div>

        {/* Video Player Section */}
        <div className="max-w-5xl mx-auto px-0 md:px-4">
          <div className="aspect-video w-full bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl relative border">
            {renderVideoPlayer()}
          </div>
        </div>

        {/* Content body */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-gray-900 mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium pb-8 border-b mb-8">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(blog.createdAt).toLocaleDateString("en-IN")}</span>
            <Badge variant="secondary" className="font-semibold">{blog.videoType}</Badge>
          </div>

          {/* Short description banner */}
          <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100/50 mb-8 font-medium text-gray-700 italic">
            {blog.shortDescription}
          </div>

          {/* Full description article */}
          {blog.content && (
            <div 
              className="prose prose-lg prose-green max-w-none prose-headings:font-black prose-a:text-green-600 text-gray-700 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          )}

          {/* Keywords / Tags */}
          {blog.keywords && (
            <div className="mt-12 pt-6 border-t flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-gray-400 mr-2" />
              {blog.keywords.split(",").map((kw) => (
                <Badge key={kw} variant="secondary" className="px-3 py-1 font-semibold text-xs rounded-full">
                  {kw.trim()}
                </Badge>
              ))}
            </div>
          )}

          {/* Related Blogs */}
          {related.length > 0 && (
            <div className="mt-20 pt-12 border-t">
              <h2 className="text-2xl font-black text-gray-900 mb-8">Related Video Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((item) => (
                  <Link key={item.id} href={`/video-blog/${item.slug}`}>
                    <div className="group cursor-pointer space-y-3">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border relative">
                        {item.thumbnailImage ? (
                          <img src={item.thumbnailImage} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                        ) : (
                          <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-600"><Film className="w-8 h-8" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-current opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-gray-500 font-semibold">{new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </MainPageLayout>
  );
}
