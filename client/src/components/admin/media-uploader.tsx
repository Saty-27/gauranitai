import React, { useState, useRef } from "react";
import { Upload, X, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MediaUploaderProps {
  value: string;
  onChange: (url: string) => void;
  acceptType?: "image" | "video" | "both";
  placeholderText?: string;
}

export default function MediaUploader({ 
  value, 
  onChange, 
  acceptType = "both", 
  placeholderText 
}: MediaUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    const isVideo = [".mp4", ".webm", ".mov"].includes(ext);

    if (acceptType === "image" && !isImage) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, JPEG, PNG, WEBP).",
        variant: "destructive"
      });
      return;
    }
    
    if (acceptType === "video" && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video (MP4, WEBM, MOV).",
        variant: "destructive"
      });
      return;
    }

    if (acceptType === "both" && !isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video.",
        variant: "destructive"
      });
      return;
    }

    // Perform upload
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file.");
      }

      const result = await response.json();
      onChange(result.url);
      
      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong during upload.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getMediaType = (url: string) => {
    if (!url) return null;
    const ext = url.substring(url.lastIndexOf(".")).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return "image";
    }
    if ([".mp4", ".webm", ".mov"].includes(ext)) {
      return "video";
    }
    if (url.startsWith("data:image")) return "image";
    return "external";
  };

  const mediaType = getMediaType(value);

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={
          acceptType === "image" 
            ? "image/*" 
            : acceptType === "video" 
            ? "video/*" 
            : "image/*,video/*"
        }
      />
      
      {uploading ? (
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 flex flex-col items-center justify-center bg-muted/20 min-h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Uploading file...</p>
        </div>
      ) : value ? (
        <div className="relative border rounded-xl overflow-hidden bg-muted/10 group min-h-[150px] flex items-center justify-center">
          {mediaType === "image" ? (
            <img 
              src={value} 
              alt="Uploaded preview" 
              className="max-h-[300px] w-auto object-contain rounded-xl"
            />
          ) : mediaType === "video" ? (
            <video 
              src={value} 
              controls 
              className="max-h-[300px] w-full object-contain rounded-xl"
            />
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center w-full">
              {value.includes("youtube.com") || value.includes("player.vimeo.com") || value.includes("youtube.com/embed/") ? (
                <div className="w-full aspect-video max-w-[400px] mx-auto">
                  <iframe
                    src={value}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              ) : (
                <>
                  <File className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-xs text-muted-foreground break-all max-w-[250px] mx-auto">{value}</p>
                </>
              )}
            </div>
          )}

          {/* Action Overlay */}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 shadow-md"
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8 shadow-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/30 hover:border-green-600 hover:bg-green-50/20 transition-all rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer min-h-[150px]"
        >
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {placeholderText || `Click to upload ${acceptType === "both" ? "image or video" : acceptType}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptType === "image" 
              ? "JPG, PNG, WEBP up to 10MB" 
              : acceptType === "video" 
              ? "MP4, WEBM, MOV up to 50MB" 
              : "Images (JPG, PNG, WEBP) or Videos (MP4, WEBM, MOV)"}
          </p>
        </div>
      )}
    </div>
  );
}
