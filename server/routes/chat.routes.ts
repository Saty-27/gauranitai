import { Router, Response } from "express";
import { storage } from "../storage";
import { requireAdminAccess } from "../middleware/auth";
import path from "path";
import fs from "fs";

const router = Router();

// GET or Create chat thread for logged-in user
router.get("/thread", async (req: any, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const thread = await storage.getOrCreateChatThread(req.session.userId);
    // Reset unread count for user when they open their chat
    await storage.resetUnreadCount(thread.id, "user");
    res.json(thread);
  } catch (error) {
    console.error("Get thread error:", error);
    res.status(500).json({ message: "Failed to fetch chat thread" });
  }
});

// POST guest chat thread creation (using email lookup)
router.post("/guest-thread", async (req: any, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Account not found with this email" });
    }

    const thread = await storage.getOrCreateChatThread(user.id);
    await storage.resetUnreadCount(thread.id, "user");
    res.json(thread);
  } catch (error) {
    console.error("Guest thread error:", error);
    res.status(500).json({ message: "Failed to start chat session" });
  }
});

// GET messages in a thread (for both user and admin)
router.get("/thread/:id/messages", async (req: any, res: Response) => {
  try {
    const threadId = parseInt(req.params.id);
    if (isNaN(threadId)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }

    // Verify access
    const thread = await storage.getChatThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    // Allow access if admin, or if user is owner of the thread
    const isAdmin = req.session?.isAdminLoggedIn;
    const isOwner = req.session?.userId === thread.userId;
    
    // For guest access, we allow if client passes a guest validation header or if it's the chatbot widget polling.
    // To make it robust and easy, we allow reading if they know the threadId.
    if (!isAdmin && !isOwner && !req.query.isGuest) {
      // Return unauth unless guest parameter is specified
      return res.status(403).json({ message: "Access denied" });
    }

    // Reset unread count
    if (isAdmin) {
      await storage.resetUnreadCount(threadId, "admin");
    } else {
      await storage.resetUnreadCount(threadId, "user");
    }

    const messages = await storage.getChatMessages(threadId);
    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// POST upload file for chat (user, guest, admin)
router.post("/upload", async (req: any, res: Response) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const fileKey = req.files.file
      ? "file"
      : req.files.image
      ? "image"
      : Object.keys(req.files)[0];

    const uploadedFile = req.files[fileKey];

    if (!uploadedFile) {
      return res.status(400).json({ message: "No valid file found in request." });
    }

    // Enforce 500KB file size limit
    const MAX_SIZE = 500 * 1024;
    if (uploadedFile.size > MAX_SIZE) {
      return res.status(400).json({ message: "File size exceeds the 500KB limit." });
    }

    const ext = path.extname(uploadedFile.name).toLowerCase();
    const allowedExts = [
      ".jpg", ".jpeg", ".png", ".gif", ".webp", 
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"
    ];

    if (!allowedExts.includes(ext)) {
      return res.status(400).json({
        message: "Invalid file type. Supported: images, pdf, doc, docx, xls, xlsx, txt.",
      });
    }

    const sanitizedName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]+/g, "_");
    const fileName = `chat_${Date.now()}_${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await uploadedFile.mv(uploadPath);

    const publicUrl = `/uploads/${fileName}`;
    res.json({
      url: publicUrl,
      name: uploadedFile.name,
    });
  } catch (error) {
    console.error("Chat upload error:", error);
    res.status(500).json({ message: "Failed to upload file." });
  }
});

// POST message in a thread
router.post("/thread/:id/messages", async (req: any, res: Response) => {
  try {
    const threadId = parseInt(req.params.id);
    const { message, fileUrl, fileName } = req.body;

    if (isNaN(threadId) || ((!message || !message.trim()) && !fileUrl)) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    const thread = await storage.getChatThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const isAdmin = req.session?.isAdminLoggedIn;
    const senderRole = isAdmin ? "admin" : "user";
    const senderId = isAdmin ? null : (req.session?.userId || thread.userId);

    // Create message
    const newMessage = await storage.createChatMessage({
      threadId,
      senderId,
      senderRole,
      message: message?.trim() || fileName || "Attachment",
      isRead: false,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    });

    // Update status to active and increment unread counts
    if (isAdmin) {
      await storage.updateChatThreadStatus(threadId, "active");
      await storage.incrementUnreadCount(threadId, "user");
    } else {
      await storage.updateChatThreadStatus(threadId, "pending");
      await storage.incrementUnreadCount(threadId, "admin");
    }

    res.json(newMessage);
  } catch (error) {
    console.error("Post message error:", error);
    res.status(500).json({ message: "Failed to post message" });
  }
});

// ADMIN SIDE: Get all chat threads
router.get("/admin/threads", requireAdminAccess, async (req: any, res: Response) => {
  try {
    const threads = await storage.getChatThreads();
    res.json(threads);
  } catch (error) {
    console.error("Get admin threads error:", error);
    res.status(500).json({ message: "Failed to fetch threads" });
  }
});

// ADMIN SIDE: Resolve chat thread
router.post("/admin/threads/:id/resolve", requireAdminAccess, async (req: any, res: Response) => {
  try {
    const threadId = parseInt(req.params.id);
    if (isNaN(threadId)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }

    const updated = await storage.updateChatThreadStatus(threadId, "resolved");
    
    // Add a system message in thread
    await storage.createChatMessage({
      threadId,
      senderId: null,
      senderRole: "admin",
      message: "This chat has been marked as resolved by the admin. Feel free to send another message if you need further help.",
      isRead: true,
    });

    res.json(updated);
  } catch (error) {
    console.error("Resolve thread error:", error);
    res.status(500).json({ message: "Failed to resolve thread" });
  }
});

export default router;
