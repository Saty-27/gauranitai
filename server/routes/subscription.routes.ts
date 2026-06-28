import { Router } from "express";
import { db } from "../db";
import { milkSubscriptions, subscriptionDeliveries, products, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";

const router = Router();
router.use(isAuthenticated);

const toAmount = (value: unknown) => {
  const amount = Number.parseFloat(`${value ?? 0}`);
  return Number.isFinite(amount) ? amount : 0;
};

const getMonthlyDeliveryCount = (frequency?: string | null) => {
  const normalized = `${frequency || "daily"}`.toLowerCase().trim();
  if (normalized.includes("week")) return 4;
  if (normalized.includes("alternate") || normalized.includes("every other")) return 15;
  if (normalized.includes("month")) return 1;
  return 30;
};

// POST - Create subscription
router.post("/", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId, quantity, frequency, deliveryTime } = req.body;
    const productIdInt = parseInt(productId);

    // Get product for pricing
    const product = await db.query.products.findFirst({
      where: eq(products.id, productIdInt),
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Force start date to tomorrow (next day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const deliveryStartDate = new Date(tomorrowStr);

    const newSub = await db.insert(milkSubscriptions).values({
      userId,
      productId: productIdInt,
      quantity: parseInt(quantity),
      frequency,
      deliveryTime,
      startDate: tomorrowStr,
      status: "ACTIVE",
      pricePerL: product.price,
    }).returning();

    res.status(201).json({ message: "Subscription created", subscription: newSub[0] });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription" });
  }
});

// GET - Get all my subscriptions
router.get("/me", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptions = await db
      .select()
      .from(milkSubscriptions)
      .where(eq(milkSubscriptions.userId, userId));

    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    // Get product details and today's delivery status for each subscription
    const subscriptionsWithProducts = await Promise.all(
      subscriptions.map(async (sub) => {
        const product = sub.productId ? await db.query.products.findFirst({
          where: eq(products.id, sub.productId),
        }) : undefined;
        const perDeliveryAmount = toAmount(sub.pricePerL || product?.price) * toAmount(sub.quantity || 1);
        const monthlyDeliveryCount = getMonthlyDeliveryCount(sub.frequency);

        // Fetch today's delivery status
        const todayDelivery = await db.query.subscriptionDeliveries.findFirst({
          where: and(
            eq(subscriptionDeliveries.subscriptionId, sub.id),
            eq(subscriptionDeliveries.deliveryDate, todayStr)
          )
        });

        return {
          ...sub,
          product,
          perDeliveryAmount,
          monthlyDeliveryCount,
          monthlyAmount: perDeliveryAmount * monthlyDeliveryCount,
          todayDeliveryStatus: todayDelivery ? todayDelivery.status : "Pending",
          todayDeliveryConfirmed: todayDelivery ? todayDelivery.confirmedByUser : false,
        };
      })
    );

    res.json(subscriptionsWithProducts || []);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

// POST - Confirm today's milk delivery
router.post("/:id/confirm-delivery", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    // Fetch subscription
    const subscription = await db.query.milkSubscriptions.findFirst({
      where: and(
        eq(milkSubscriptions.id, subscriptionId),
        eq(milkSubscriptions.userId, userId)
      )
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.status !== "ACTIVE") {
      return res.status(400).json({ message: "Subscription is not active" });
    }

    // Check if delivery record already exists for today
    const existingDelivery = await db.query.subscriptionDeliveries.findFirst({
      where: and(
        eq(subscriptionDeliveries.subscriptionId, subscriptionId),
        eq(subscriptionDeliveries.deliveryDate, todayStr)
      )
    });

    if (existingDelivery) {
      if (existingDelivery.confirmedByUser) {
        return res.status(400).json({ message: "Milk delivery already confirmed for today" });
      }

      const updated = await db
        .update(subscriptionDeliveries)
        .set({
          status: "Delivered",
          confirmedByUser: true,
          confirmedAt: new Date()
        })
        .where(eq(subscriptionDeliveries.id, existingDelivery.id))
        .returning();

      return res.json({ message: "Today's delivery marked as received", delivery: updated[0] });
    } else {
      const newDelivery = await db
        .insert(subscriptionDeliveries)
        .values({
          subscriptionId,
          userId,
          deliveryDate: todayStr,
          quantity: subscription.quantity,
          status: "Delivered",
          confirmedByUser: true,
          confirmedAt: new Date()
        })
        .returning();

      return res.json({ message: "Today's delivery marked as received", delivery: newDelivery[0] });
    }
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(500).json({ message: "Failed to confirm delivery" });
  }
});

// PUT - Update subscription
router.put("/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);
    const { quantity, frequency, deliveryTime } = req.body;

    const updated = await db
      .update(milkSubscriptions)
      .set({ quantity: parseFloat(quantity), frequency, deliveryTime })
      .where(and(eq(milkSubscriptions.id, subscriptionId), eq(milkSubscriptions.userId, userId)))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
});

// PUT - Pause subscription
router.put("/:id/pause", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);

    const updated = await db
      .update(milkSubscriptions)
      .set({ status: "PAUSED" })
      .where(and(eq(milkSubscriptions.id, subscriptionId), eq(milkSubscriptions.userId, userId)))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error pausing subscription:", error);
    res.status(500).json({ message: "Failed to pause subscription" });
  }
});

// PUT - Resume subscription
router.put("/:id/resume", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);

    const updated = await db
      .update(milkSubscriptions)
      .set({ status: "ACTIVE" })
      .where(and(eq(milkSubscriptions.id, subscriptionId), eq(milkSubscriptions.userId, userId)))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({ message: "Failed to resume subscription" });
  }
});

// PUT - Skip tomorrow
router.put("/:id/skip-tomorrow", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(subscriptionDeliveries).values({
      subscriptionId,
      userId,
      deliveryDate: tomorrow.toISOString().split("T")[0],
      quantity: 0,
      status: "SKIPPED",
    });

    res.json({ message: "Tomorrow's delivery skipped" });
  } catch (error) {
    console.error("Error skipping delivery:", error);
    res.status(500).json({ message: "Failed to skip delivery" });
  }
});

// DELETE - Cancel subscription
router.delete("/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const subscriptionId = parseInt(req.params.id);

    const updated = await db
      .update(milkSubscriptions)
      .set({ status: "CANCELLED" })
      .where(and(eq(milkSubscriptions.id, subscriptionId), eq(milkSubscriptions.userId, userId)))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription cancelled" });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
});

// GET - History of deliveries
router.get("/me/history", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const deliveries = await db
      .select()
      .from(subscriptionDeliveries)
      .where(eq(subscriptionDeliveries.userId, userId));

    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

export default router;
