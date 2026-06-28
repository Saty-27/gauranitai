import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function CMSAboutPage() {
  const [, setLocation] = useLocation();
  const [about, setAbout] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await fetch("/api/cms/about-us");
        const data = await response.json();
        setAbout(data || { title: "About Gauranitai", subtitle: "", content: "", imageUrl: "", mission: "", vision: "" });
        if (data?.imageUrl) setImagePreview(data.imageUrl);
      } catch (error) {
        console.error("Error fetching about data:", error);
        toast({ description: "Error loading about data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setImagePreview(imageUrl);
        setAbout({ ...about, imageUrl });
        toast({ description: "Image preview updated" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!about.title.trim()) {
      toast({ description: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/cms/about-us", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(about),
      });
      if (response.ok) {
        toast({ description: "✅ About Us updated successfully" });
      } else {
        toast({ description: "Error updating About Us", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error updating About Us", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/cms")}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📄 About Us</h1>
            <p className="text-gray-600 text-sm mt-1">Manage company mission, vision, and values</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle>About Us Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Page Title</label>
                  <Input
                    value={about.title || ""}
                    onChange={(e) => setAbout({ ...about, title: e.target.value })}
                    placeholder="About Gauranitai"
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Subtitle</label>
                  <Input
                    value={about.subtitle || ""}
                    onChange={(e) => setAbout({ ...about, subtitle: e.target.value })}
                    placeholder="Pure. Fresh. Daily."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Main Content</label>
                  <Textarea
                    value={about.content || ""}
                    onChange={(e) => setAbout({ ...about, content: e.target.value })}
                    rows={5}
                    placeholder="Enter the main content about your company..."
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Mission</label>
                  <Textarea
                    value={about.mission || ""}
                    onChange={(e) => setAbout({ ...about, mission: e.target.value })}
                    rows={3}
                    placeholder="What is your mission?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Vision</label>
                  <Textarea
                    value={about.vision || ""}
                    onChange={(e) => setAbout({ ...about, vision: e.target.value })}
                    rows={3}
                    placeholder="What is your vision?"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/admin/cms")} className="px-6">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="text-base">Page Image</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        onClick={() => {
                          setImagePreview("");
                          setAbout({ ...about, imageUrl: "" });
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image selected</span>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm text-gray-600 block">
                        Click to upload image
                      </span>
                      <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Recommended: 1200x600px
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> Upload a high-quality image that represents your company well.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
