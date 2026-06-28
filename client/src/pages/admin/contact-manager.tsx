import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Globe, 
  ArrowLeft,
  Layout,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";
import { Link } from "wouter";
import ImageUploader from "@/components/admin/image-uploader";

export default function ContactPageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    phone: "",
    email: "",
    address: "",
    businessHours: "",
    socialLinks: { facebook: "", instagram: "", twitter: "" },
    mapEmbedUrl: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/cms/contact");
      const json = await res.json();
      if (json && Object.keys(json).length > 0) {
        setData({
          ...json,
          socialLinks: json.socialLinks || { facebook: "", instagram: "", twitter: "" }
        });
      }
    } catch (error) {
      toast({ description: "Failed to fetch contact data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast({ title: "Success! 📞", description: "Contact page settings updated." });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({ description: "Failed to update contact info", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        <div className="flex items-center justify-between sticky top-4 z-40 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border border-blue-50">
          <div className="flex items-center gap-4">
            <Link href="/admin/pages">
              <Button variant="ghost" className="p-2"><ArrowLeft /></Button>
            </Link>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Contact Page Manager</h2>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Update info, map & settings</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl font-black shadow-lg transition-all"
          >
            {saving ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <div className="flex items-center gap-4">
                  <Layout className="w-6 h-6 text-gray-600" />
                  <CardTitle className="text-xl font-black text-gray-900 uppercase">Contact Hero Section</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Hero Title</label>
                  <Input 
                    value={data.heroTitle} 
                    onChange={(e) => setData({...data, heroTitle: e.target.value})}
                    className="h-14 px-6 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Hero Subtitle</label>
                  <Textarea 
                    value={data.heroSubtitle} 
                    onChange={(e) => setData({...data, heroSubtitle: e.target.value})}
                    className="h-24 p-4 rounded-xl font-bold"
                  />
                </div>
                <ImageUploader 
                  label="Hero Background Image" 
                  value={data.heroImageUrl} 
                  onChange={(url) => setData({...data, heroImageUrl: url})} 
                />
              </CardContent>
            </Card>

            {/* Map Section */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-orange-50 p-8 border-b">
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-orange-600" />
                  <CardTitle className="text-xl font-black text-gray-900 uppercase">Google Maps Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Google Map Embed Code (Iframe)</label>
                  <Textarea 
                    value={data.mapEmbedUrl} 
                    onChange={(e) => setData({...data, mapEmbedUrl: e.target.value})}
                    placeholder='<iframe src="..." ...></iframe>'
                    className="min-h-[150px] p-4 rounded-xl font-mono text-xs bg-gray-900 text-green-400"
                  />
                  <p className="text-xs text-gray-500 font-medium">Paste the entire iframe HTML code from Google Maps Share menu.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-blue-50 p-8 border-b border-blue-100">
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl font-black text-gray-900 uppercase">Contact Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <Input 
                    value={data.phone} 
                    onChange={(e) => setData({...data, phone: e.target.value})}
                    className="h-12 px-4 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                  <Input 
                    value={data.email} 
                    onChange={(e) => setData({...data, email: e.target.value})}
                    className="h-12 px-4 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Physical Address</label>
                  <Textarea 
                    value={data.address} 
                    onChange={(e) => setData({...data, address: e.target.value})}
                    className="h-24 p-4 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Hours</label>
                  <Textarea 
                    value={data.businessHours} 
                    onChange={(e) => setData({...data, businessHours: e.target.value})}
                    className="h-24 p-4 rounded-xl font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-gray-600" />
                  <CardTitle className="text-xl font-black text-gray-900 uppercase">Social Links</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <Input 
                    placeholder="Facebook URL" 
                    value={data.socialLinks.facebook}
                    onChange={(e) => setData({...data, socialLinks: {...data.socialLinks, facebook: e.target.value}})}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <Input 
                    placeholder="Instagram URL" 
                    value={data.socialLinks.instagram}
                    onChange={(e) => setData({...data, socialLinks: {...data.socialLinks, instagram: e.target.value}})}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <Input 
                    placeholder="Twitter URL" 
                    value={data.socialLinks.twitter}
                    onChange={(e) => setData({...data, socialLinks: {...data.socialLinks, twitter: e.target.value}})}
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <Link href="/admin/contact-submissions">
              <Button variant="outline" className="w-full h-16 rounded-2xl border-2 font-bold gap-3 hover:bg-gray-50">
                <MessageSquare className="w-5 h-5" /> View Submissions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
