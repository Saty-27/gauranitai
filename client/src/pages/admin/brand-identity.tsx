import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Palette, Globe, ShieldCheck } from "lucide-react";
import ImageUploader from "@/components/admin/image-uploader";

export default function BrandIdentityManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    brandName: "",
    slogan: "",
    logoUrl: "",
    faviconUrl: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/site-settings");
      const json = await res.json();
      if (json) {
        setData({
          brandName: json.brandName || "Gauranitai",
          slogan: json.slogan || "Pure. Fresh. Daily.",
          logoUrl: json.logoUrl || "",
          faviconUrl: json.faviconUrl || ""
        });
      }
    } catch (error) {
      toast({ description: "Failed to fetch brand settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast({ title: "Success! ✨", description: "Brand identity updated successfully." });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({ description: "Failed to update brand settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Palette className="w-8 h-8 text-green-600" /> Brand Identity
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Manage logos, names & slogans</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-2xl font-black shadow-lg"
          >
            {saving ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save Brand</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gray-50 p-8 border-b">
                <CardTitle className="text-xl font-black text-gray-900 uppercase">Core Branding</CardTitle>
                <CardDescription className="font-bold text-gray-400">Basic identification for your platform</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Brand Name</label>
                  <Input 
                    value={data.brandName} 
                    onChange={(e) => setData({...data, brandName: e.target.value})}
                    className="h-14 px-6 rounded-xl font-bold text-lg"
                    placeholder="Ex: Gauranitai"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Brand Slogan</label>
                  <Input 
                    value={data.slogan} 
                    onChange={(e) => setData({...data, slogan: e.target.value})}
                    className="h-14 px-6 rounded-xl font-bold"
                    placeholder="Ex: Pure. Fresh. Daily."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-green-50 p-8 border-b border-green-100">
                <CardTitle className="text-xl font-black text-gray-900 uppercase">Brand Visuals</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <ImageUploader 
                  label="Official Brand Logo" 
                  value={data.logoUrl} 
                  onChange={(url) => setData({...data, logoUrl: url})} 
                  folder="branding"
                />
                
                <ImageUploader 
                  label="Browser Favicon (32x32)" 
                  value={data.faviconUrl} 
                  onChange={(url) => setData({...url, faviconUrl: url})} 
                  folder="branding"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-gray-900 text-white">
              <CardHeader className="pb-4">
                <h3 className="font-black uppercase tracking-widest text-xs text-green-400">Live Preview</h3>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 shadow-2xl border-4 border-green-500/20">
                  {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <Palette className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black">{data.brandName || "Brand Name"}</h4>
                  <p className="text-green-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                    {data.slogan || "Pure. Fresh. Daily."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <p className="font-black text-blue-900 text-xs uppercase">Platform Reach</p>
              </div>
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Changes made here will reflect across the entire platform, including headers, footers, and emails.
              </p>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
