import { Router } from "express";
import { db } from "../db";
import { videoGallery } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import { insertVideoGallerySchema } from "@shared/schema";

const router = Router();

const convertToEmbedUrl = (url: string, type: string) => {
  if (!url) return "";
  const typeLower = type.toLowerCase();
  
  if (typeLower === "youtube") {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
  } else if (typeLower === "vimeo") {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regExp);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  return url;
};

// Admin List Gallery Videos
router.get("/admin/video-gallery", requireAdminAccess, async (req, res) => {
  try {
    const list = await db.select().from(videoGallery).orderBy(asc(videoGallery.sortOrder), desc(videoGallery.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error listing gallery videos:", error);
    res.status(500).json({ message: "Failed to list gallery videos." });
  }
});

// Admin Get Gallery Video by ID
router.get("/admin/video-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(videoGallery).where(eq(videoGallery.id, id));
    if (!item) return res.status(404).json({ message: "Video not found." });
    res.json(item);
  } catch (error) {
    console.error("Error getting gallery video:", error);
    res.status(500).json({ message: "Failed to get gallery video." });
  }
});

// Admin Create Gallery Video
router.post("/admin/video-gallery", requireAdminAccess, async (req, res) => {
  try {
    const parsedData = insertVideoGallerySchema.parse(req.body);
    
    let videoUrl = parsedData.videoUrl || "";
    if (parsedData.videoType) {
      videoUrl = convertToEmbedUrl(videoUrl, parsedData.videoType);
    }

    const [newItem] = await db
      .insert(videoGallery)
      .values({
        ...parsedData,
        videoUrl,
      })
      .returning();
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating gallery video:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid gallery video data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create gallery video." });
  }
});

// Admin Update Gallery Video
router.put("/admin/video-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsedData = insertVideoGallerySchema.partial().parse(req.body);
    
    const [item] = await db.select().from(videoGallery).where(eq(videoGallery.id, id));
    if (!item) return res.status(404).json({ message: "Video not found." });

    let videoUrl = parsedData.videoUrl !== undefined ? parsedData.videoUrl : item.videoUrl;
    const videoType = parsedData.videoType || item.videoType;
    if (videoUrl && videoType) {
      videoUrl = convertToEmbedUrl(videoUrl, videoType);
    }

    const [updated] = await db
      .update(videoGallery)
      .set({
        ...parsedData,
        videoUrl,
      })
      .where(eq(videoGallery.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating gallery video:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid gallery video data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update gallery video." });
  }
});

// Admin Delete Gallery Video
router.delete("/admin/video-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db.delete(videoGallery).where(eq(videoGallery.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ message: "Video not found." });
    res.json({ success: true, message: "Gallery video deleted successfully." });
  } catch (error) {
    console.error("Error deleting gallery video:", error);
    res.status(500).json({ message: "Failed to delete gallery video." });
  }
});

// Public List Gallery Videos
router.get("/video-gallery", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(videoGallery)
      .where(eq(videoGallery.status, "Published"))
      .orderBy(asc(videoGallery.sortOrder), desc(videoGallery.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error fetching public gallery videos:", error);
    res.status(500).json({ message: "Failed to fetch gallery videos." });
  }
});

export default router;
