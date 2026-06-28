import { Router, Response } from "express";
import { storage } from "../storage";
import { requireAdminAccess } from "../middleware/auth";
import bcryptjs from "bcryptjs";

const router = Router();

// USER SIDE: Submit forgot password request
router.post("/forgot-password", async (req: any, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Return success even if user not found for security reasons (prevents email enumeration),
      // but only log or create request if user actually exists.
      return res.json({
        message: "Your password reset request has been sent to admin. You will receive help soon.",
      });
    }

    // Create a reset request in database
    await storage.createPasswordResetRequest({
      userId: user.id,
      email: user.email || email,
      status: "pending",
    });

    res.json({
      message: "Your password reset request has been sent to admin. You will receive help soon.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to submit request" });
  }
});

// USER SIDE: Reset password via link token
router.post("/reset-password", async (req: any, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find token
    const tokenRecord = await storage.getPasswordResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (tokenRecord.used) {
      return res.status(400).json({ message: "Token has already been used" });
    }

    const now = new Date();
    if (now > tokenRecord.expiresAt) {
      return res.status(400).json({ message: "Token has expired" });
    }

    // Update password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);
    await storage.updateUser(tokenRecord.userId, { passwordHash });

    // Mark token as used
    await storage.markPasswordResetTokenUsed(tokenRecord.id);

    res.json({ message: "Password has been successfully updated" });
  } catch (error) {
    console.error("Reset password token error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// ADMIN SIDE: Get all password reset requests (protected)
router.get("/admin/password-requests", requireAdminAccess, async (req: any, res: Response) => {
  try {
    const requests = await storage.getPasswordResetRequests();
    
    // Enrich requests with user details
    const enrichedRequests = [];
    for (const request of requests) {
      const user = await storage.getUser(request.userId);
      enrichedRequests.push({
        ...request,
        userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown",
        userEmail: user?.email || request.email,
      });
    }

    res.json(enrichedRequests);
  } catch (error) {
    console.error("Get password requests error:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

export default router;
