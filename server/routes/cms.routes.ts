import { Router } from "express";
import { db } from "../db";
import { aboutUsSettings, contactSettings, termsOfServiceSettings, privacyPolicySettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import path from 'path';
import fs from 'fs';

const router = Router();

// ============================================================================
// ABOUT US
// ============================================================================

// Public: Get About Us
router.get("/about-us/public", async (req, res) => {
  try {
    const [data] = await db.select().from(aboutUsSettings).where(eq(aboutUsSettings.isActive, true));
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch about us" });
  }
});

// Admin: Get About Us
router.get("/about-us", requireAdminAccess, async (req, res) => {
  try {
    const [data] = await db.select().from(aboutUsSettings);
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch about us" });
  }
});

// Admin: Update About Us
router.put("/about-us", requireAdminAccess, async (req, res) => {
  try {
    const { 
      heroTitle, heroSubtitle, heroImageUrl, heroCtaText, heroCtaLink,
      storyHeading, storyDescription, storyImageUrl,
      valuesTitle, values,
      processTitle, processSteps,
      ctaHeading, ctaSubheading, ctaButtonText, ctaButtonLink,
      isActive 
    } = req.body;

    const [data] = await db.update(aboutUsSettings)
      .set({ 
        heroTitle, heroSubtitle, heroImageUrl, heroCtaText, heroCtaLink,
        storyHeading, storyDescription, storyImageUrl,
        valuesTitle, values,
        processTitle, processSteps,
        ctaHeading, ctaSubheading, ctaButtonText, ctaButtonLink,
        isActive, updatedAt: new Date() 
      })
      .where(eq(aboutUsSettings.id, 1))
      .returning();
    res.json(data);
  } catch (error) {
    console.error("Update About Us error:", error);
    res.status(500).json({ message: "Failed to update about us" });
  }
});

// ============================================================================
// CONTACT
// ============================================================================

// Public: Get Contact
router.get("/contact/public", async (req, res) => {
  try {
    const [data] = await db.select().from(contactSettings).where(eq(contactSettings.isActive, true));
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact info" });
  }
});

// Admin: Get Contact
router.get("/contact", requireAdminAccess, async (req, res) => {
  try {
    const [data] = await db.select().from(contactSettings);
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact info" });
  }
});

// Admin: Update Contact
router.put("/contact", requireAdminAccess, async (req, res) => {
  try {
    const { 
      heroTitle, heroSubtitle, heroImageUrl, 
      phone, email, address, businessHours, socialLinks, mapEmbedUrl, isActive 
    } = req.body;
    const [data] = await db.update(contactSettings)
      .set({ 
        heroTitle, heroSubtitle, heroImageUrl,
        phone, email, address, businessHours, socialLinks, mapEmbedUrl, isActive, updatedAt: new Date() 
      })
      .where(eq(contactSettings.id, 1))
      .returning();
    res.json(data);
  } catch (error) {
    console.error("Update Contact error:", error);
    res.status(500).json({ message: "Failed to update contact info" });
  }
});

// ============================================================================
// TERMS OF SERVICE
// ============================================================================

// Public: Get Terms of Service
router.get("/terms-of-service/public", async (req, res) => {
  try {
    const [data] = await db.select().from(termsOfServiceSettings).where(eq(termsOfServiceSettings.isActive, true));
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch terms of service" });
  }
});

// Admin: Get Terms of Service
router.get("/terms-of-service", requireAdminAccess, async (req, res) => {
  try {
    const [data] = await db.select().from(termsOfServiceSettings);
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch terms of service" });
  }
});

// Admin: Update Terms of Service
router.put("/terms-of-service", requireAdminAccess, async (req, res) => {
  try {
    const { title, content, sections, isActive } = req.body;
    const [data] = await db.update(termsOfServiceSettings)
      .set({ title, content, sections, isActive, updatedAt: new Date() })
      .where(eq(termsOfServiceSettings.id, 1))
      .returning();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to update terms of service" });
  }
});

// ============================================================================
// PRIVACY POLICY
// ============================================================================

// Public: Get Privacy Policy
router.get("/privacy-policy/public", async (req, res) => {
  try {
    const [data] = await db.select().from(privacyPolicySettings).where(eq(privacyPolicySettings.isActive, true));
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch privacy policy" });
  }
});

// Admin: Get Privacy Policy
router.get("/privacy-policy", requireAdminAccess, async (req, res) => {
  try {
    const [data] = await db.select().from(privacyPolicySettings);
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch privacy policy" });
  }
});

// Admin: Update Privacy Policy
router.put("/privacy-policy", requireAdminAccess, async (req, res) => {
  try {
    const { title, content, sections, isActive } = req.body;
    const [data] = await db.update(privacyPolicySettings)
      .set({ title, content, sections, isActive, updatedAt: new Date() })
      .where(eq(privacyPolicySettings.id, 1))
      .returning();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to update privacy policy" });
  }
});

export default router;
