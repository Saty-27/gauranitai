import { Router } from "express";
import { db } from "../db";
import { imageGallery } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import { insertImageGallerySchema } from "@shared/schema";

const router = Router();

// Admin List Gallery Images
router.get("/admin/image-gallery", requireAdminAccess, async (req, res) => {
  try {
    const list = await db.select().from(imageGallery).orderBy(asc(imageGallery.sortOrder), desc(imageGallery.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error listing gallery images:", error);
    res.status(500).json({ message: "Failed to list gallery images." });
  }
});

// Admin Get Gallery Image by ID
router.get("/admin/image-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(imageGallery).where(eq(imageGallery.id, id));
    if (!item) return res.status(404).json({ message: "Image not found." });
    res.json(item);
  } catch (error) {
    console.error("Error getting gallery image:", error);
    res.status(500).json({ message: "Failed to get gallery image." });
  }
});

// Admin Create Gallery Image
router.post("/admin/image-gallery", requireAdminAccess, async (req, res) => {
  try {
    const parsedData = insertImageGallerySchema.parse(req.body);
    const [newItem] = await db
      .insert(imageGallery)
      .values(parsedData)
      .returning();
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating gallery image:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid gallery image data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create gallery image." });
  }
});

// Admin Update Gallery Image
router.put("/admin/image-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsedData = insertImageGallerySchema.partial().parse(req.body);
    const [updated] = await db
      .update(imageGallery)
      .set(parsedData)
      .where(eq(imageGallery.id, id))
      .returning();
    if (!updated) return res.status(404).json({ message: "Image not found." });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating gallery image:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid gallery image data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update gallery image." });
  }
});

// Admin Delete Gallery Image
router.delete("/admin/image-gallery/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db.delete(imageGallery).where(eq(imageGallery.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ message: "Image not found." });
    res.json({ success: true, message: "Gallery image deleted successfully." });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({ message: "Failed to delete gallery image." });
  }
});

// Public List Gallery Images
router.get("/image-gallery", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(imageGallery)
      .where(eq(imageGallery.status, "Published"))
      .orderBy(asc(imageGallery.sortOrder), desc(imageGallery.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error fetching public gallery images:", error);
    res.status(500).json({ message: "Failed to fetch gallery images." });
  }
});

export default router;
