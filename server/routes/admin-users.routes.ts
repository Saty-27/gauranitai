import { Router, Response } from "express";
import { storage } from "../storage";
import { requireAdminAccess } from "../middleware/auth";
import bcryptjs from "bcryptjs";
import { nanoid } from "nanoid";
import { sendEmail } from "../utils/mail";
import crypto from "crypto";

const router = Router();

// Apply admin access middleware to all routes in this router
router.use(requireAdminAccess);

// GET all users
router.get("/", async (req: any, res: Response) => {
  try {
    const usersList = await storage.getAllUsers();
    // Retrieve password reset request statuses
    const resetRequests = await storage.getPasswordResetRequests();
    
    // Map reset requests to users
    const mappedUsers = usersList.map((user) => {
      const pendingRequest = resetRequests.find(
        (req) => req.userId === user.id && req.status === "pending"
      );
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        hasPendingReset: !!pendingRequest,
        pendingResetId: pendingRequest?.id || null,
      };
    });

    res.json(mappedUsers);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// POST block user
router.post("/:id/block", async (req: any, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot block admin accounts" });
    }

    await storage.updateUser(userId, { isActive: false });
    res.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Failed to block user" });
  }
});

// POST unblock user
router.post("/:id/unblock", async (req: any, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await storage.updateUser(userId, { isActive: true });
    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Failed to unblock user" });
  }
});

// POST generate temporary password
router.post("/:id/reset-password", async (req: any, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate secure temporary password
    const tempPassword = nanoid(10); // e.g. "XyZ123aBc9"
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(tempPassword, salt);

    // Update user
    await storage.updateUser(userId, { passwordHash });

    // Find and resolve any pending reset requests for this user
    const resetRequests = await storage.getPasswordResetRequests();
    const pendingRequest = resetRequests.find(
      (r) => r.userId === userId && r.status === "pending"
    );
    if (pendingRequest) {
      await storage.updatePasswordResetRequestStatus(pendingRequest.id, "resolved", new Date());
    }

    // Send email
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    await sendEmail({
      to: user.email || "",
      subject: "Your Login Password Has Been Reset",
      body: `Hello ${fullName},

Your login details have been updated by the admin.

Login Email: ${user.email}
Temporary Password: ${tempPassword}

Please login and change your password from your profile section immediately.

Thank you.`,
    });

    // Return the plain tempPassword ONLY at this moment so the admin can copy/see it if needed
    res.json({
      message: "Temporary password generated and email sent",
      tempPassword,
    });
  } catch (error) {
    console.error("Generate temp password error:", error);
    res.status(500).json({ message: "Failed to generate temporary password" });
  }
});

// POST send password reset link
router.post("/:id/reset-link", async (req: any, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate secure token (hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in DB
    await storage.createPasswordResetToken({
      userId,
      tokenHash: token,
      expiresAt,
      used: false,
    });

    // Resolve any pending reset requests for this user
    const resetRequests = await storage.getPasswordResetRequests();
    const pendingRequest = resetRequests.find(
      (r) => r.userId === userId && r.status === "pending"
    );
    if (pendingRequest) {
      await storage.updatePasswordResetRequestStatus(pendingRequest.id, "resolved", new Date());
    }

    // Construct reset URL
    const protocol = req.secure ? "https" : "http";
    const resetUrl = `${protocol}://${req.get("host")}/auth/reset-password?token=${token}`;

    // Send email
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    await sendEmail({
      to: user.email || "",
      subject: "Password Reset Request",
      body: `Hello ${fullName},

You are receiving this because you (or the admin) requested a password reset for your account.

Please click on the following link, or paste this into your browser to complete the process:
${resetUrl}

This link is valid for 15 minutes. If you did not request this, please ignore this email.

Thank you.`,
    });

    res.json({ message: "Password reset link sent successfully" });
  } catch (error) {
    console.error("Send reset link error:", error);
    res.status(500).json({ message: "Failed to send reset link" });
  }
});

export default router;
