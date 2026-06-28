import { db } from "../db";
import { contactSubmissions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type { Express } from "express";

export function setupContactSubmissionsRoutes(app: Express) {
  // Public: Submit contact form
  app.post("/api/contact-submissions", async (req: any, res) => {
    try {
      const { name, email, phone, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email and message are required" });
      }

      const [submission] = await db
        .insert(contactSubmissions)
        .values({ name, email, phone, message, status: "new" })
        .returning();
      
      res.status(201).json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Admin: Get all submissions
  app.get("/api/admin/contact-submissions", async (req: any, res) => {
    try {
      const submissions = await db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt));
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Admin: Mark as read
  app.put("/api/admin/contact-submissions/:id/read", async (req: any, res) => {
    try {
      const [submission] = await db
        .update(contactSubmissions)
        .set({ status: "read", updatedAt: new Date() })
        .where(eq(contactSubmissions.id, parseInt(req.params.id)))
        .returning();
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  // Admin: Delete submission
  app.delete("/api/admin/contact-submissions/:id", async (req: any, res) => {
    try {
      await db.delete(contactSubmissions).where(eq(contactSubmissions.id, parseInt(req.params.id)));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });
}
