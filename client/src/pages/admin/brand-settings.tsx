import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save, Upload, RefreshCw, Palette, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function BrandSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    brandName: "Gauranitai",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#0D3E83",
    secondaryColor: "#FFF9F2",
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    qrCodeUrl: "",
    isOnlinePaymentEnabled: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/site-settings", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        brandName: settings.brandName || "Gauranitai",
        logoUrl: settings.logoUrl || "",
        faviconUrl: settings.faviconUrl || "",
        primaryColor: settings.primaryColor || "#0D3E83",
        secondaryColor: settings.secondaryColor || "#FFF9F2",
        upiId: settings.upiId || "",
        bankName: settings.bankName || "",
        accountNumber: settings.accountNumber || "",
        ifscCode: settings.ifscCode || "",
        qrCodeUrl: settings.qrCodeUrl || "",
        isOnlinePaymentEnabled: settings.isOnlinePaymentEnabled || false,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "✅ Brand settings updated!", description: "Changes will reflect across the entire website." });
    },
    onError: (error: any) => {
      toast({ title: "❌ Update failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "faviconUrl" | "qrCodeUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to upload image");
      }
      const json = await res.json();
      setFormData((prev) => ({ ...prev, [field]: json.url }));
      toast({ title: "✅ Image uploaded!", description: "Save to apply changes." });
    } catch (err: any) {
      toast({
        title: "❌ Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brand Identity</h1>
            <p className="text-gray-500">Manage your brand name, logo, and theme colors.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || uploading}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
          >
            {updateMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Brand Info */}
          <Card className="border-2 border-green-50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                General Settings
              </CardTitle>
              <CardDescription>Primary brand name and identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input 
                  id="brandName" 
                  value={formData.brandName} 
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., Gauranitai"
                  className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 italic">This will replace "Gauranitai" everywhere on the site.</p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card className="border-2 border-green-50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-green-600" />
                Theme Colors
              </CardTitle>
              <CardDescription>Customize the primary look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primaryColor" 
                      type="color"
                      value={formData.primaryColor} 
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 rounded-lg border-gray-200"
                    />
                    <Input 
                      value={formData.primaryColor} 
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="secondaryColor" 
                      type="color"
                      value={formData.secondaryColor} 
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1 rounded-lg border-gray-200"
                    />
                    <Input 
                      value={formData.secondaryColor} 
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo Management */}
          <Card className="lg:col-span-2 border-2 border-green-50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Logo & Assets
              </CardTitle>
              <CardDescription>Upload your brand logo and favicon.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo */}
                <div className="space-y-4">
                  <Label>Brand Logo</Label>
                  <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                    {formData.logoUrl ? (
                      <div className="relative w-32 h-32 bg-white rounded-2xl shadow-md p-2 border border-gray-100 flex items-center justify-center">
                        <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-300">
                        <Upload className="w-8 h-8" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Recommended: Transparent PNG, 512x512px</p>
                      <Button variant="outline" className="rounded-xl relative">
                        Choose Logo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleFileUpload(e, "logoUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-4">
                  <Label>Favicon</Label>
                  <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                    {formData.faviconUrl ? (
                      <div className="relative w-16 h-16 bg-white rounded-xl shadow-md p-2 border border-gray-100 flex items-center justify-center">
                        <img src={formData.faviconUrl} alt="Favicon Preview" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, faviconUrl: "" }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-300">
                        <Globe className="w-6 h-6" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Recommended: PNG or ICO, 64x64px</p>
                      <Button variant="outline" className="rounded-xl relative">
                        Choose Favicon
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleFileUpload(e, "faviconUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="lg:col-span-2 border-2 border-green-50 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-600" />
                  Online Payment & QR Settings
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="isOnlinePaymentEnabled" className="text-sm font-semibold cursor-pointer">
                    Enable QR / Bank Payments
                  </Label>
                  <Switch
                    id="isOnlinePaymentEnabled"
                    checked={formData.isOnlinePaymentEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isOnlinePaymentEnabled: checked })
                    }
                  />
                </div>
              </CardTitle>
              <CardDescription>Configure bank details, UPI, and scan-to-pay QR code for customer payments.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g., brandname@okaxis"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., State Bank of India"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g., 123456789012"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    placeholder="e.g., SBIN0001234"
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              {/* QR Code Upload */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <Label>Payment QR Code</Label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                  {formData.qrCodeUrl ? (
                    <div className="relative w-48 h-48 bg-white rounded-2xl shadow-md p-2 border border-gray-100 flex items-center justify-center">
                      <img src={formData.qrCodeUrl} alt="QR Code Preview" className="max-w-full max-h-full object-contain" />
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, qrCodeUrl: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-300">
                      <Upload className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Upload payment QR code image (GPay, PhonePe, Paytm, etc.)</p>
                    <Button variant="outline" className="rounded-xl relative">
                      Choose QR Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "qrCodeUrl")}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
