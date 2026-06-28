import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Search, Edit, Trash2, Globe, FileText, Eye, Check, X 
} from "lucide-react";
import RichTextEditor from "@/components/admin/rich-text-editor";
import MediaUploader from "@/components/admin/media-uploader";

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
  status: "Draft" | "Published" | "Unpublished";
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [keywords, setKeywords] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published" | "Unpublished">("Draft");

  // Fetch blogs
  const { data: blogsList = [], isLoading } = useQuery<Blog[]>({
    queryKey: ["admin", "blogs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blogs");
      if (!res.ok) throw new Error("Failed to fetch blogs");
      return res.json();
    }
  });

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isManualSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value));
    setIsManualSlug(true);
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setIsManualSlug(false);
    setShortDescription("");
    setContent("");
    setFeaturedImage("");
    setKeywords("");
    setMetaTitle("");
    setMetaDescription("");
    setStatus("Draft");
    setEditingBlog(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setIsManualSlug(true);
    setShortDescription(blog.shortDescription);
    setContent(blog.content);
    setFeaturedImage(blog.featuredImage || "");
    setKeywords(blog.keywords || "");
    setMetaTitle(blog.metaTitle || "");
    setMetaDescription(blog.metaDescription || "");
    setStatus(blog.status);
    setIsDialogOpen(true);
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        slug,
        shortDescription,
        content,
        featuredImage,
        keywords,
        metaTitle,
        metaDescription,
        status,
      };

      const url = editingBlog 
        ? `/api/admin/blogs/${editingBlog.id}` 
        : "/api/admin/blogs";
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save blog");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Blog saved",
        description: "Blog article has been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save blog",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete blog");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      toast({
        title: "Blog deleted",
        description: "Blog article has been successfully deleted.",
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      toast({
        title: "Status updated",
        description: "Blog visibility status has been updated.",
      });
    }
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Published" ? "Unpublished" : "Published";
    toggleStatusMutation.mutate({ id, newStatus });
  };

  const filteredBlogs = blogsList.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(search.toLowerCase()) || 
                          blog.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Unpublished">Unpublished</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add New Blog
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Blog Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading blogs...</div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No blogs found. Create one to get started!</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Featured Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        {blog.featuredImage ? (
                          <img 
                            src={blog.featuredImage} 
                            alt={blog.title} 
                            className="w-16 h-10 object-cover rounded-lg border border-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                        {blog.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs truncate max-w-[150px]">
                        {blog.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            blog.status === "Published"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : blog.status === "Draft"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } font-semibold`}
                        >
                          {blog.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(blog.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(blog.id, blog.status)}
                          title={blog.status === "Published" ? "Unpublish" : "Publish"}
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-800"
                        >
                          {blog.status === "Published" ? <X className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(blog)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(blog.id, blog.title)}
                          className="h-8 w-8 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlog ? "Edit Blog Article" : "Create New Blog Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-title">Blog Title</Label>
                  <Input 
                    id="blog-title"
                    value={title} 
                    onChange={handleTitleChange} 
                    placeholder="Enter blog title" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-slug">URL Slug</Label>
                  <Input 
                    id="blog-slug"
                    value={slug} 
                    onChange={handleSlugChange} 
                    placeholder="enter-slug-name" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-short">Short Description</Label>
                <Textarea 
                  id="blog-short"
                  value={shortDescription} 
                  onChange={(e) => setShortDescription(e.target.value)} 
                  placeholder="Summarize the article briefly" 
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Blog Content</Label>
                <RichTextEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="Write the blog post content..." 
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <MediaUploader 
                  value={featuredImage} 
                  onChange={setFeaturedImage} 
                  acceptType="image" 
                  placeholderText="Upload blog featured image"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-foreground mb-4">SEO & Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input 
                      id="meta-title"
                      value={metaTitle} 
                      onChange={(e) => setMetaTitle(e.target.value)} 
                      placeholder="Title for search engines" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta-keywords">SEO Keywords</Label>
                    <Input 
                      id="meta-keywords"
                      value={keywords} 
                      onChange={(e) => setKeywords(e.target.value)} 
                      placeholder="fresh-milk, delivery-mumbai, organic" 
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="meta-desc">Meta Description</Label>
                  <Textarea 
                    id="meta-desc"
                    value={metaDescription} 
                    onChange={(e) => setMetaDescription(e.target.value)} 
                    placeholder="Short summary displayed in search results" 
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-status">Publication Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger id="blog-status" className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Unpublished">Unpublished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saveMutation.isPending}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || !title || !shortDescription || !content}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveMutation.isPending ? "Saving..." : "Save Blog"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
