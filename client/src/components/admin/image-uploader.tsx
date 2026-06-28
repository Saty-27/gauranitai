import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  uploadUrl?: string;
  folder?: string;
}

export default function ImageUploader({ 
  value, 
  onChange, 
  label, 
  uploadUrl = "/api/admin/media/upload",
  folder = "cms"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</Label>
      <div className="flex gap-4 items-start">
        <div className="flex-1 space-y-2">
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="h-12 px-4 rounded-xl font-bold bg-gray-50 border-gray-100"
            placeholder="https://example.com/image.jpg"
          />
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-2 border-dashed border-gray-200 h-16 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-all"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Upload className="w-5 h-5 mr-2" />
              )}
              {uploading ? "Uploading..." : "Click to Upload Image"}
            </Button>
          </div>
        </div>
        
        {value && (
          <div className="w-32 h-32 rounded-2xl border-2 border-gray-100 overflow-hidden relative group shrink-0 shadow-lg">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange("")}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
