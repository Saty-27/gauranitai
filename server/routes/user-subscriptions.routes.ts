import { Router } from "express";
import { db } from "../db";
import { userSubscriptions, customSubscriptionPlans, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

// ==========================================
// CLIENT / USER ROUTES (Requires Auth)
// ==========================================

// 1. Create a new user subscription enrollment
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in first." });
    }

    const {
      subscriptionPlanId,
      customerName,
      email,
      phone,
      address,
      selectedQuantity,
      selectedFrequency,
      startDate,
      duration,
      totalAmount,
    } = req.body;

    if (!customerName || !email || !phone || !address || !selectedQuantity || !selectedFrequency || !startDate || !duration || !totalAmount) {
      return res.status(400).json({ message: "Required enrollment fields are missing" });
    }

    const newEnrollment = await db.insert(userSubscriptions).values({
      userId,
      subscriptionPlanId: subscriptionPlanId ? parseInt(subscriptionPlanId) : null,
      customerName,
      email,
      phone,
      address,
      selectedQuantity,
      selectedFrequency,
      startDate, // stored as string date e.g. "YYYY-MM-DD"
      duration,
      totalAmount: totalAmount.toString(),
      paymentStatus: "pending",
      subscriptionStatus: "active",
    }).returning();

    res.status(201).json({
      message: "Subscription successfully registered!",
      subscription: newEnrollment[0],
    });
  } catch (error) {
    console.error("Error creating user subscription:", error);
    res.status(500).json({ message: "Failed to save subscription request" });
  }
});

// 2. Get active user subscriptions for the logged-in user
router.get("/me", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const enrollments = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));

    // Hydrate plan details
    const populated = await Promise.all(
      enrollments.map(async (enrollment) => {
        let plan = null;
        if (enrollment.subscriptionPlanId) {
          plan = await db.query.customSubscriptionPlans.findFirst({
            where: eq(customSubscriptionPlans.id, enrollment.subscriptionPlanId),
          }) || null;
        }
        return { ...enrollment, plan };
      })
    );

    res.json(populated);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ message: "Failed to retrieve subscriptions" });
  }
});

// ==========================================
// ADMIN WORKFLOWS (Requires Admin Access)
// ==========================================

// 3. Get all user subscription requests
router.get("/", requireAdminAccess, async (req, res) => {
  try {
    const enrollments = await db.select().from(userSubscriptions)
      .orderBy(desc(userSubscriptions.createdAt));

    // Hydrate plan details
    const populated = await Promise.all(
      enrollments.map(async (enrollment) => {
        let plan = null;
        if (enrollment.subscriptionPlanId) {
          plan = await db.query.customSubscriptionPlans.findFirst({
            where: eq(customSubscriptionPlans.id, enrollment.subscriptionPlanId),
          }) || null;
        }
        return { ...enrollment, plan };
      })
    );

    res.json(populated);
  } catch (error) {
    console.error("Error fetching all user subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

// 4. Update subscription status (active, paused, cancelled, completed)
router.put("/:id/status", requireAdminAccess, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { status } = req.body;

    const allowed = ["active", "paused", "cancelled", "completed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status option" });
    }

    const updated = await db.update(userSubscriptions)
      .set({ subscriptionStatus: status, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, enrollmentId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Status updated successfully", subscription: updated[0] });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    res.status(500).json({ message: "Failed to update subscription status" });
  }
});

// 5. Update payment status (pending, paid, failed)
router.put("/:id/payment", requireAdminAccess, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { paymentStatus } = req.body;

    const allowed = ["pending", "paid", "failed"];
    if (!paymentStatus || !allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status option" });
    }

    const updated = await db.update(userSubscriptions)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, enrollmentId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Payment status updated successfully", subscription: updated[0] });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
});

export default router;
