import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { ArrowLeft } from "lucide-react";

export default function CMSTermsPage() {
  const [, setLocation] = useLocation();
  const [terms, setTerms] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch("/api/cms/terms-of-service");
        const data = await response.json();
        setTerms(data || { title: "Terms of Service", content: "" });
      } catch (error) {
        console.error("Error fetching terms data:", error);
        toast({ description: "Error loading terms data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleSave = async () => {
    if (!terms.title.trim() || !terms.content.trim()) {
      toast({ description: "Title and content are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/cms/terms-of-service", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(terms),
      });
      if (response.ok) {
        toast({ description: "✅ Terms of Service updated successfully" });
      } else {
        toast({ description: "Error updating Terms of Service", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error updating Terms of Service", variant: "destructive" });
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
            <h1 className="text-4xl font-bold text-gray-900">⚖️ Terms of Service</h1>
            <p className="text-gray-600 text-sm mt-1">Edit terms and conditions for your platform</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle>Terms of Service Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Page Title</label>
              <Input
                value={terms.title || ""}
                onChange={(e) => setTerms({ ...terms, title: e.target.value })}
                placeholder="Terms of Service"
                className="text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
              <Textarea
                value={terms.content || ""}
                onChange={(e) => setTerms({ ...terms, content: e.target.value })}
                rows={15}
                placeholder="Enter your terms and conditions here. You can use markdown formatting."
                className="text-base font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 You can use multiple lines and paragraphs. Line breaks will be preserved.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900">
                <strong>📝 Tip:</strong> Make sure your terms are clear and comprehensive. Include sections on user responsibilities, limitations, and dispute resolution.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                {saving ? "Saving..." : "💾 Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setLocation("/admin/cms")} className="px-6">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
