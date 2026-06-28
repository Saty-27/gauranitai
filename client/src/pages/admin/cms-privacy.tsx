import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { ArrowLeft } from "lucide-react";

export default function CMSPrivacyPage() {
  const [, setLocation] = useLocation();
  const [privacy, setPrivacy] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch("/api/cms/privacy-policy");
        const data = await response.json();
        setPrivacy(data || { title: "Privacy Policy", content: "" });
      } catch (error) {
        console.error("Error fetching privacy data:", error);
        toast({ description: "Error loading privacy data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacy();
  }, []);

  const handleSave = async () => {
    if (!privacy.title.trim() || !privacy.content.trim()) {
      toast({ description: "Title and content are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/cms/privacy-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacy),
      });
      if (response.ok) {
        toast({ description: "✅ Privacy Policy updated successfully" });
      } else {
        toast({ description: "Error updating Privacy Policy", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error updating Privacy Policy", variant: "destructive" });
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
            <h1 className="text-4xl font-bold text-gray-900">🔒 Privacy Policy</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your privacy policy and data protection terms</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <CardTitle>Privacy Policy Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Page Title</label>
              <Input
                value={privacy.title || ""}
                onChange={(e) => setPrivacy({ ...privacy, title: e.target.value })}
                placeholder="Privacy Policy"
                className="text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
              <Textarea
                value={privacy.content || ""}
                onChange={(e) => setPrivacy({ ...privacy, content: e.target.value })}
                rows={15}
                placeholder="Enter your privacy policy here. Include sections on data collection, usage, and user rights."
                className="text-base font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Include information about data collection, cookies, third-party services, and user rights.
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-900">
                <strong>🔐 Important:</strong> Ensure your privacy policy complies with GDPR, CCPA, and other relevant regulations.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white px-6">
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
