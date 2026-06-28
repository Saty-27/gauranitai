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
  Plus, Search, Edit, Trash2, Globe, Film, Check, X 
} from "lucide-react";
import RichTextEditor from "@/components/admin/rich-text-editor";
import MediaUploader from "@/components/admin/media-uploader";

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
  status: "Draft" | "Published" | "Unpublished";
  createdAt: string;
  updatedAt: string;
}

export default function AdminVideoBlogsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<VideoBlog | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [videoType, setVideoType] = useState<"YouTube" | "Vimeo" | "Local Upload" | "External URL">("YouTube");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [keywords, setKeywords] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published" | "Unpublished">("Draft");

  // Fetch video blogs
  const { data: videoBlogsList = [], isLoading } = useQuery<VideoBlog[]>({
    queryKey: ["admin", "video-blogs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/video-blogs");
      if (!res.ok) throw new Error("Failed to fetch video blogs");
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
    setVideoType("YouTube");
    setVideoUrl("");
    setUploadedVideo("");
    setThumbnailImage("");
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

  const openEditDialog = (blog: VideoBlog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setIsManualSlug(true);
    setShortDescription(blog.shortDescription);
    setContent(blog.content || "");
    setVideoType(blog.videoType);
    setVideoUrl(blog.videoUrl || "");
    setUploadedVideo(blog.uploadedVideo || "");
    setThumbnailImage(blog.thumbnailImage || "");
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
        videoType,
        videoUrl: videoType === "Local Upload" ? "" : videoUrl,
        uploadedVideo: videoType === "Local Upload" ? uploadedVideo : "",
        thumbnailImage,
        keywords,
        metaTitle,
        metaDescription,
        status,
      };

      const url = editingBlog 
        ? `/api/admin/video-blogs/${editingBlog.id}` 
        : "/api/admin/video-blogs";
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save video blog");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "video-blogs"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Video blog saved",
        description: "Video blog article has been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save video blog",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/video-blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete video blog");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "video-blogs"] });
      toast({
        title: "Video blog deleted",
        description: "Video blog has been successfully deleted.",
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const res = await fetch(`/api/admin/video-blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "video-blogs"] });
      toast({
        title: "Status updated",
        description: "Video blog status has been updated.",
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

  const filteredBlogs = videoBlogsList.filter(blog => {
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
              placeholder="Search video blogs..."
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
            Add Video Blog
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Video Blog Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading video blogs...</div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No video blogs found. Create one to get started!</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Video Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        {blog.thumbnailImage ? (
                          <img 
                            src={blog.thumbnailImage} 
                            alt={blog.title} 
                            className="w-16 h-10 object-cover rounded-lg border border-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <Film className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                        {blog.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <Badge variant="outline">{blog.videoType}</Badge>
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
              <DialogTitle>{editingBlog ? "Edit Video Blog Article" : "Create New Video Blog Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Blog Title</Label>
                  <Input 
                    id="title"
                    value={title} 
                    onChange={handleTitleChange} 
                    placeholder="Enter title" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input 
                    id="slug"
                    value={slug} 
                    onChange={handleSlugChange} 
                    placeholder="enter-slug-name" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea 
                  id="shortDescription"
                  value={shortDescription} 
                  onChange={(e) => setShortDescription(e.target.value)} 
                  placeholder="Summarize the video contents briefly" 
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl bg-muted/10">
                <div className="space-y-2">
                  <Label htmlFor="video-type">Video Platform / Type</Label>
                  <Select 
                    value={videoType} 
                    onValueChange={(val: any) => {
                      setVideoType(val);
                      if (val === "Local Upload") setVideoUrl("");
                      else setUploadedVideo("");
                    }}
                  >
                    <SelectTrigger id="video-type">
                      <SelectValue placeholder="Select video type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Vimeo">Vimeo</SelectItem>
                      <SelectItem value="Local Upload">Local Upload</SelectItem>
                      <SelectItem value="External URL">External Video URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {videoType === "Local Upload" ? (
                    <>
                      <Label>Upload Video File</Label>
                      <MediaUploader 
                        value={uploadedVideo} 
                        onChange={setUploadedVideo} 
                        acceptType="video" 
                        placeholderText="Upload MP4, WEBM or MOV video"
                      />
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="video-url">Video link / URL</Label>
                      <Input 
                        id="video-url"
                        value={videoUrl} 
                        onChange={(e) => setVideoUrl(e.target.value)} 
                        placeholder={
                          videoType === "YouTube" 
                            ? "https://www.youtube.com/watch?v=..." 
                            : videoType === "Vimeo" 
                            ? "https://vimeo.com/..." 
                            : "Enter video direct URL (e.g. mp4 link)"
                        }
                      />
                      {videoUrl && (
                        <div className="mt-2 aspect-video w-full max-w-[360px] mx-auto border rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                          {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo.com") ? (
                            <iframe
                              src={(() => {
                                if (!videoUrl) return "";
                                // YouTube
                                let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                let match = videoUrl.match(regExp);
                                if (match && match[2].length === 11) {
                                  return `https://www.youtube.com/embed/${match[2]}`;
                                }
                                // Vimeo
                                regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
                                match = videoUrl.match(regExp);
                                if (match && match[1]) {
                                  return `https://player.vimeo.com/video/${match[1]}`;
                                }
                                return videoUrl;
                              })()}
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          ) : (
                            <video src={videoUrl} controls className="w-full h-full object-contain" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <MediaUploader 
                  value={thumbnailImage} 
                  onChange={setThumbnailImage} 
                  acceptType="image" 
                  placeholderText="Upload video thumbnail image"
                />
              </div>

              <div className="space-y-2">
                <Label>Long Description / Article Content (Optional)</Label>
                <RichTextEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="Write post content that goes along with the video..." 
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-foreground mb-4">SEO & Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input 
                      id="metaTitle"
                      value={metaTitle} 
                      onChange={(e) => setMetaTitle(e.target.value)} 
                      placeholder="Title for search engines" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">SEO Keywords</Label>
                    <Input 
                      id="keywords"
                      value={keywords} 
                      onChange={(e) => setKeywords(e.target.value)} 
                      placeholder="fresh-milk, dairy-video, organic" 
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea 
                    id="metaDescription"
                    value={metaDescription} 
                    onChange={(e) => setMetaDescription(e.target.value)} 
                    placeholder="Short summary displayed in search results" 
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Publication Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger id="status" className="w-[180px]">
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
                disabled={
                  saveMutation.isPending || 
                  !title || 
                  !shortDescription || 
                  (videoType === "Local Upload" ? !uploadedVideo : !videoUrl)
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveMutation.isPending ? "Saving..." : "Save Video Blog"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
