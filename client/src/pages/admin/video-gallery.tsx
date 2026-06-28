import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus, Search, Edit, Trash2, Film 
} from "lucide-react";
import MediaUploader from "@/components/admin/media-uploader";

interface VideoGalleryItem {
  id: number;
  title: string;
  videoType: "YouTube" | "Vimeo" | "Local Upload" | "External URL";
  videoUrl: string;
  uploadedVideo: string;
  thumbnailImage: string;
  category: string;
  sortOrder: number;
  status: "Draft" | "Published" | "Unpublished";
  createdAt: string;
}

const CATEGORIES = [
  "Farm",
  "Products",
  "Delivery",
  "Customers",
  "Events",
  "Behind the Scenes",
  "General"
];

export default function AdminVideoGalleryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoGalleryItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [videoType, setVideoType] = useState<"YouTube" | "Vimeo" | "Local Upload" | "External URL">("YouTube");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [category, setCategory] = useState("General");
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<"Draft" | "Published" | "Unpublished">("Published");

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery<VideoGalleryItem[]>({
    queryKey: ["admin", "video-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/admin/video-gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery videos");
      return res.json();
    }
  });

  const resetForm = () => {
    setTitle("");
    setVideoType("YouTube");
    setVideoUrl("");
    setUploadedVideo("");
    setThumbnailImage("");
    setCategory("General");
    setSortOrder(0);
    setStatus("Published");
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: VideoGalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setVideoType(item.videoType);
    setVideoUrl(item.videoUrl || "");
    setUploadedVideo(item.uploadedVideo || "");
    setThumbnailImage(item.thumbnailImage || "");
    setCategory(item.category);
    setSortOrder(item.sortOrder);
    setStatus(item.status);
    setIsDialogOpen(true);
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        videoType,
        videoUrl: videoType === "Local Upload" ? "" : videoUrl,
        uploadedVideo: videoType === "Local Upload" ? uploadedVideo : "",
        thumbnailImage,
        category,
        sortOrder: Number(sortOrder) || 0,
        status,
      };

      const url = editingItem 
        ? `/api/admin/video-gallery/${editingItem.id}` 
        : "/api/admin/video-gallery";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save gallery video");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "video-gallery"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Gallery video saved",
        description: "Gallery video has been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save video",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/video-gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete gallery video");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "video-gallery"] });
      toast({
        title: "Video deleted",
        description: "Gallery video has been successfully deleted.",
      });
    }
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search gallery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Gallery Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading gallery...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No gallery videos found. Add one to get started!</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.thumbnailImage ? (
                          <img 
                            src={item.thumbnailImage} 
                            alt={item.title} 
                            className="w-16 h-12 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Film className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.videoType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">
                        {item.sortOrder}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            item.status === "Published"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : item.status === "Draft"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } font-semibold`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id, item.title)}
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
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Gallery Video" : "Add Gallery Video"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title</Label>
                <Input 
                  id="title"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter video title" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border p-3 rounded-xl bg-muted/10">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="videoType">Video Source Type</Label>
                  <Select 
                    value={videoType} 
                    onValueChange={(val: any) => {
                      setVideoType(val);
                      if (val === "Local Upload") setVideoUrl("");
                      else setUploadedVideo("");
                    }}
                  >
                    <SelectTrigger id="videoType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Vimeo">Vimeo</SelectItem>
                      <SelectItem value="Local Upload">Local Upload</SelectItem>
                      <SelectItem value="External URL">External Video Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  {videoType === "Local Upload" ? (
                    <>
                      <Label>Upload Video File</Label>
                      <MediaUploader 
                        value={uploadedVideo} 
                        onChange={setUploadedVideo} 
                        acceptType="video" 
                        placeholderText="Upload video file"
                      />
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Video URL</Label>
                      <Input 
                        id="videoUrl"
                        value={videoUrl} 
                        onChange={(e) => setVideoUrl(e.target.value)} 
                        placeholder="Enter YouTube/Vimeo link" 
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
                <Label>Thumbnail Image (Optional)</Label>
                <MediaUploader 
                  value={thumbnailImage} 
                  onChange={setThumbnailImage} 
                  acceptType="image" 
                  placeholderText="Upload video cover thumbnail"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input 
                    id="sortOrder"
                    type="number"
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                  (videoType === "Local Upload" ? !uploadedVideo : !videoUrl)
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveMutation.isPending ? "Saving..." : "Save Video"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
