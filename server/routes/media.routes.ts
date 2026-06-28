import { Router } from "express";
import path from "path";
import fs from "fs";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

// Admin-only: upload images, videos, or PDFs (for gallery, blog, bill uploads, etc.)
router.post("/upload", requireAdminAccess, async (req: any, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const fileKey = req.files.file
      ? "file"
      : req.files.image
      ? "image"
      : req.files.video
      ? "video"
      : Object.keys(req.files)[0];

    const uploadedFile = req.files[fileKey];

    if (!uploadedFile) {
      return res.status(400).json({ message: "No valid file found in request." });
    }

    const ext = path.extname(uploadedFile.name).toLowerCase();

    const allowedImageExts = [".jpg", ".jpeg", ".png", ".webp"];
    const allowedVideoExts = [".mp4", ".webm", ".mov"];
    const allowedDocExts  = [".pdf"];

    const isImage = allowedImageExts.includes(ext);
    const isVideo = allowedVideoExts.includes(ext);
    const isDoc   = allowedDocExts.includes(ext);

    if (!isImage && !isVideo && !isDoc) {
      return res.status(400).json({
        message:
          "Invalid file type. Supported: jpg, jpeg, png, webp, mp4, webm, mov, pdf.",
      });
    }

    const sanitizedName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]+/g, "_");
    const fileName  = `${Date.now()}_${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await uploadedFile.mv(uploadPath);

    const publicUrl = `/uploads/${fileName}`;
    res.json({
      url: publicUrl,
      type: isImage ? "image" : isVideo ? "video" : "pdf",
      name: uploadedFile.name,
      size: uploadedFile.size,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    res.status(500).json({ message: "Failed to upload file." });
  }
});

// User-accessible: upload a payment screenshot for a specific bill
router.post("/upload-screenshot", async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileKey = req.files.file
      ? "file"
      : req.files.screenshot
      ? "screenshot"
      : req.files.image
      ? "image"
      : Object.keys(req.files)[0];

    const uploadedFile = req.files[fileKey];
    if (!uploadedFile) {
      return res.status(400).json({ message: "No valid file found." });
    }

    const ext = path.extname(uploadedFile.name).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ message: "Invalid file type. Use jpg, png, webp or pdf." });
    }

    const sanitizedName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]+/g, "_");
    const fileName  = `screenshot_${Date.now()}_${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await uploadedFile.mv(uploadPath);

    res.json({ url: `/uploads/${fileName}`, name: uploadedFile.name });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    res.status(500).json({ message: "Failed to upload screenshot." });
  }
});

export default router;
