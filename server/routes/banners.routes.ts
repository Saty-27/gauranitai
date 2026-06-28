import { Router } from "express";
import { db } from "../db";
import { banners, homepageSections, users } from "@shared/schema";
import { eq, asc, and, lte, gte, isNull, or } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

// Public: Get active banners for homepage (no auth required)
router.get("/public", async (req, res) => {
  try {
    const now = new Date();
    const activeBanners = await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          or(
            isNull(banners.startDate),
            lte(banners.startDate, now)
          ),
          or(
            isNull(banners.endDate),
            gte(banners.endDate, now)
          )
        )
      )
      .orderBy(asc(banners.displayOrder));
    
    res.json(activeBanners);
  } catch (error) {
    console.error("Error fetching public banners:", error);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

// Admin: Get all banners (requires admin auth)
router.get("/", requireAdminAccess, async (req, res) => {
  try {
    const allBanners = await db
      .select()
      .from(banners)
      .orderBy(asc(banners.displayOrder));
    
    res.json(allBanners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

// Admin: Create new banner (requires admin auth)
router.post("/", requireAdminAccess, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, imageUrlTablet, imageUrlMobile, ctaText, ctaLink, badgeText, displayOrder, isActive, showOverlay, startDate, endDate } = req.body;
    

    const [newBanner] = await db
      .insert(banners)
      .values({
        title,
        subtitle,
        imageUrl,
        imageUrlTablet: imageUrlTablet || null,
        imageUrlMobile: imageUrlMobile || null,
        ctaText,
        ctaLink,
        badgeText,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        showOverlay: showOverlay !== false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      })
      .returning();
    
    res.status(201).json(newBanner);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ message: "Failed to create banner" });
  }
});

// Admin: Update banner (requires admin auth)
router.put("/:id", requireAdminAccess, async (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const { title, subtitle, imageUrl, imageUrlTablet, imageUrlMobile, ctaText, ctaLink, badgeText, displayOrder, isActive, showOverlay, startDate, endDate } = req.body;
    
    const [updatedBanner] = await db
      .update(banners)
      .set({
        title,
        subtitle,
        imageUrl,
        imageUrlTablet: imageUrlTablet || null,
        imageUrlMobile: imageUrlMobile || null,
        ctaText,
        ctaLink,
        badgeText,
        displayOrder,
        isActive,
        showOverlay,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, bannerId))
      .returning();
    
    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    res.json(updatedBanner);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ message: "Failed to update banner" });
  }
});

// Admin: Delete banner (requires admin auth)
router.delete("/:id", requireAdminAccess, async (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    
    const [deletedBanner] = await db
      .delete(banners)
      .where(eq(banners.id, bannerId))
      .returning();
    
    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Failed to delete banner" });
  }
});

// Public: Get active homepage sections
router.get("/sections/public", async (req, res) => {
  try {
    const activeSections = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.isActive, true))
      .orderBy(asc(homepageSections.displayOrder));
    
    res.json(activeSections);
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

// Admin: Get all homepage sections (requires admin auth)
router.get("/sections", requireAdminAccess, async (req, res) => {
  try {
    const allSections = await db
      .select()
      .from(homepageSections)
      .orderBy(asc(homepageSections.displayOrder));
    
    res.json(allSections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

// Admin: Create/Update homepage section (requires admin auth)
router.post("/sections", requireAdminAccess, async (req, res) => {
  try {
    const { sectionType, title, subtitle, content, displayOrder, isActive } = req.body;
    
    if (!sectionType) {
      return res.status(400).json({ message: "Section type is required" });
    }

    const [newSection] = await db
      .insert(homepageSections)
      .values({
        sectionType,
        title,
        subtitle,
        content,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      })
      .returning();
    
    res.status(201).json(newSection);
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ message: "Failed to create section" });
  }
});

export default router;
