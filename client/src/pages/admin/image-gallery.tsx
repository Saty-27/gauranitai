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
  Plus, Search, Edit, Trash2, Image as ImageIcon 
} from "lucide-react";
import MediaUploader from "@/components/admin/media-uploader";

interface ImageGalleryItem {
  id: number;
  title: string;
  image: string;
  altText: string;
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

export default function AdminImageGalleryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImageGalleryItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("General");
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<"Draft" | "Published" | "Unpublished">("Published");

  // Fetch gallery items
  const { data: galleryItems = [], isLoading } = useQuery<ImageGalleryItem[]>({
    queryKey: ["admin", "image-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/admin/image-gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery images");
      return res.json();
    }
  });

  const resetForm = () => {
    setTitle("");
    setImage("");
    setAltText("");
    setCategory("General");
    setSortOrder(0);
    setStatus("Published");
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: ImageGalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setImage(item.image);
    setAltText(item.altText || "");
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
        image,
        altText,
        category,
        sortOrder: Number(sortOrder) || 0,
        status,
      };

      const url = editingItem 
        ? `/api/admin/image-gallery/${editingItem.id}` 
        : "/api/admin/image-gallery";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save gallery image");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "image-gallery"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Gallery image saved",
        description: "Gallery image has been successfully saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save image",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/image-gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete gallery image");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "image-gallery"] });
      toast({
        title: "Image deleted",
        description: "Gallery image has been successfully deleted.",
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
            Add Image
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Image Gallery Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading gallery...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No gallery images found. Add one to get started!</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
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
                        <img 
                          src={item.image} 
                          alt={item.altText || item.title} 
                          className="w-16 h-12 object-cover rounded-lg border"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground max-w-[200px] truncate">
                        {item.title}
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
              <DialogTitle>{editingItem ? "Edit Gallery Image" : "Add Gallery Image"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image-title">Image Title</Label>
                <Input 
                  id="image-title"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter title describing the image" 
                />
              </div>

              <div className="space-y-2">
                <Label>Image Upload</Label>
                <MediaUploader 
                  value={image} 
                  onChange={setImage} 
                  acceptType="image" 
                  placeholderText="Upload photo (PNG, JPG, WEBP)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text (for SEO)</Label>
                <Input 
                  id="image-alt"
                  value={altText} 
                  onChange={(e) => setAltText(e.target.value)} 
                  placeholder="Enter descriptive alt text" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="image-category">
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
                  <Label htmlFor="image-sort">Sort Order</Label>
                  <Input 
                    id="image-sort"
                    type="number"
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-status">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger id="image-status" className="w-[180px]">
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
                disabled={saveMutation.isPending || !title || !image}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveMutation.isPending ? "Saving..." : "Save Image"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
