import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import MainPageLayout from "@/components/layout/main-page-layout";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Calendar, ArrowLeft, ArrowRight, Clock, Tag, FileText 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Blog {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage: string;
  keywords: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  createdAt: string;
}

export default function BlogPage() {
  const [match, params] = useRoute("/blog/:slug");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // If viewing single article
  if (match && params?.slug) {
    return <BlogDetailView slug={params.slug} />;
  }

  return (
    <BlogListView 
      search={debouncedSearch} 
      setSearch={setSearch} 
      searchVal={search} 
    />
  );
}

function BlogListView({ 
  search, 
  setSearch, 
  searchVal 
}: { 
  search: string; 
  setSearch: (v: string) => void; 
  searchVal: string;
}) {
  useEffect(() => {
    document.title = "Our Blogs | Gauranitai";
  }, []);

  const { data: blogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ["public", "blogs", search],
    queryFn: async () => {
      const url = search 
        ? `/api/blogs?search=${encodeURIComponent(search)}` 
        : "/api/blogs";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch blogs");
      return res.json();
    }
  });

  return (
    <MainPageLayout>
      <div className="bg-white min-h-screen">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-green-700 to-emerald-800 text-white py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Our Blogs</h1>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl mx-auto">
              Read the latest stories, health tips, and updates from Gauranitai.
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
              placeholder="Search blog articles..."
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
              <p className="text-gray-500 text-lg font-medium">No blogs available right now.</p>
              {search && <Button onClick={() => setSearch("")} variant="link" className="text-green-600 mt-2">Clear search</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Card key={blog.id} className="group overflow-hidden rounded-[2rem] border-green-50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                  <div className="aspect-video w-full overflow-hidden bg-muted relative">
                    {blog.featuredImage ? (
                      <img 
                        src={blog.featuredImage} 
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-green-50">
                        <FileText className="w-12 h-12" />
                      </div>
                    )}
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
                      <Link href={`/blog/${blog.slug}`}>
                        <Button variant="link" className="p-0 text-green-600 hover:text-green-700 font-bold flex items-center gap-1 group/btn">
                          Read More <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
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

function BlogDetailView({ slug }: { slug: string }) {
  const { data: detailData, isLoading, error } = useQuery<{ blog: Blog; related: Blog[] }>({
    queryKey: ["public", "blog", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blogs/${slug}`);
      if (!res.ok) throw new Error("Blog not found");
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
          <h2 className="text-2xl font-black text-gray-900 mb-4">Blog Article Not Found</h2>
          <p className="text-gray-600 mb-8">The blog article you are looking for does not exist or has been removed.</p>
          <Link href="/blog">
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full">
              Back to Blogs
            </Button>
          </Link>
        </div>
      </MainPageLayout>
    );
  }

  const { blog, related } = detailData;

  return (
    <MainPageLayout>
      <article className="bg-white min-h-screen pb-24">
        {/* Banner with featured image */}
        {blog.featuredImage ? (
          <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden bg-gray-900">
            <img 
              src={blog.featuredImage} 
              alt={blog.title} 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 py-8 text-white z-10">
              <Link href="/blog">
                <button className="flex items-center text-sm font-semibold gap-1 text-green-200 hover:text-white mb-4 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Blogs
                </button>
              </Link>
              <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow">{blog.title}</h1>
              <div className="flex items-center gap-4 mt-4 text-sm text-green-100 font-medium">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(blog.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 pt-12">
            <Link href="/blog">
              <button className="flex items-center text-sm font-semibold gap-1 text-green-600 hover:text-green-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Blogs
              </button>
            </Link>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-gray-900">{blog.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium pb-8 border-b">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(blog.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* Content body */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Main article text */}
          <div 
            className="prose prose-lg prose-green max-w-none prose-headings:font-black prose-a:text-green-600 text-gray-700 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

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
              <h2 className="text-2xl font-black text-gray-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((item) => (
                  <Link key={item.id} href={`/blog/${item.slug}`}>
                    <div className="group cursor-pointer space-y-3">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border">
                        {item.featuredImage ? (
                          <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                        ) : (
                          <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-600"><FileText className="w-8 h-8" /></div>
                        )}
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
