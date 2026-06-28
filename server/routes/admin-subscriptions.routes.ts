import { Router } from "express";
import { db } from "../db";
import { milkSubscriptions, subscriptionDeliveries, users, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

// Admin: Get all subscriptions
router.get("/", requireAdminAccess, async (req: any, res) => {
  try {

    const allSubs = await db.select().from(milkSubscriptions);
    
    const withDetails = await Promise.all(
      allSubs.map(async (sub) => {
        const customer = await db.query.users.findFirst({
          where: eq(users.id, sub.userId!),
        });
        const product = await db.query.products.findFirst({
          where: eq(products.id, sub.productId!),
        });
        return { ...sub, customer, product };
      })
    );

    res.json(withDetails);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

// Admin: Get expected daily milk requirement
router.get("/today/requirement", requireAdminAccess, async (req: any, res) => {
  try {

    const today = new Date().toISOString().split("T")[0];
    const deliveries = await db
      .select()
      .from(subscriptionDeliveries)
      .where(eq(subscriptionDeliveries.deliveryDate, today));

    const totalRequired = deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0);

    res.json({
      date: today,
      totalRequired,
      deliveryCount: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error("Error fetching daily requirement:", error);
    res.status(500).json({ message: "Failed to fetch daily requirement" });
  }
});

// Admin: Pause/Resume subscription
router.patch("/:id/status", requireAdminAccess, async (req: any, res) => {
  try {

    const subId = parseInt(req.params.id);
    const { status } = req.body;

    const updated = await db
      .update(milkSubscriptions)
      .set({ status })
      .where(eq(milkSubscriptions.id, subId))
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

// Admin: Create subscription for a customer
router.post("/", requireAdminAccess, async (req: any, res) => {
  try {
    const { userId, productId, quantity, frequency, deliveryTime, pricePerL } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ message: "Customer and Product are required" });
    }

    const productIdInt = parseInt(productId);
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

    const newSub = await db.insert(milkSubscriptions).values({
      userId,
      productId: productIdInt,
      quantity: parseInt(quantity || "1"),
      frequency: frequency || "daily",
      deliveryTime: deliveryTime || "7-8 AM",
      startDate: tomorrowStr,
      status: "ACTIVE",
      pricePerL: pricePerL !== undefined && pricePerL !== "" ? pricePerL.toString() : product.price,
    }).returning();

    res.status(201).json({ message: "Subscription created", subscription: newSub[0] });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription" });
  }
});

// Admin: Update subscription
router.put("/:id", requireAdminAccess, async (req: any, res) => {
  try {
    const subId = parseInt(req.params.id);
    const { userId, productId, quantity, frequency, deliveryTime, pricePerL } = req.body;

    const productIdInt = parseInt(productId);
    const product = await db.query.products.findFirst({
      where: eq(products.id, productIdInt),
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = await db
      .update(milkSubscriptions)
      .set({
        userId,
        productId: productIdInt,
        quantity: parseInt(quantity || "1"),
        frequency: frequency || "daily",
        deliveryTime: deliveryTime || "7-8 AM",
        pricePerL: pricePerL !== undefined && pricePerL !== "" ? pricePerL.toString() : product.price,
      })
      .where(eq(milkSubscriptions.id, subId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription updated", subscription: updated[0] });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
});


// Admin: Delete subscription
router.delete("/:id", requireAdminAccess, async (req: any, res) => {
  try {

    const subId = parseInt(req.params.id);
    const deleted = await db.delete(milkSubscriptions).where(eq(milkSubscriptions.id, subId)).returning();

    if (!deleted.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription deleted", subscription: deleted[0] });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Failed to delete subscription" });
  }
});

// Admin: Get subscription dashboard metrics summary
router.get("/dashboard-summary", requireAdminAccess, async (req: any, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const tomorrowDate = new Date(tomorrowStr);

    // Get all subscriptions
    const allSubs = await db.select().from(milkSubscriptions);

    // Active subscriptions count
    const activeSubs = allSubs.filter(s => s.status === "ACTIVE");
    const activeSubscriptionsCount = activeSubs.length;

    // Today Required Milk
    // Active subscriptions starting today or in the past
    const todayActive = activeSubs.filter(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      return start && start <= todayDate;
    });
    const todayRequired = todayActive.reduce((sum, s) => sum + parseFloat(s.quantity.toString()), 0);

    // Tomorrow Required Milk
    // Active subscriptions starting tomorrow or in the past
    const tomorrowActive = activeSubs.filter(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      return start && start <= tomorrowDate;
    });
    const tomorrowRequired = tomorrowActive.reduce((sum, s) => sum + parseFloat(s.quantity.toString()), 0);

    // Today Delivered Milk
    // Sum of deliveries today where status is 'Delivered'
    const todayDeliveries = await db
      .select()
      .from(subscriptionDeliveries)
      .where(eq(subscriptionDeliveries.deliveryDate, todayStr));
    
    const todayDelivered = todayDeliveries
      .filter(d => d.status?.toLowerCase() === "delivered")
      .reduce((sum, d) => sum + parseFloat((d.quantity || 0).toString()), 0);

    // Today Remaining Milk
    const todayRemaining = Math.max(0, todayRequired - todayDelivered);

    // Pending Deliveries Today count
    // Count of deliveries today where status is 'Pending' or no record exists yet for active subscription
    const deliveredSubIds = new Set(
      todayDeliveries
        .filter(d => d.status?.toLowerCase() === "delivered")
        .map(d => d.subscriptionId)
    );
    const pendingDeliveriesTodayCount = todayActive.filter(s => !deliveredSubIds.has(s.id)).length;

    res.json({
      todayRequired,
      todayDelivered,
      todayRemaining,
      tomorrowRequired,
      activeSubscriptionsCount,
      pendingDeliveriesTodayCount
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
});

// Admin: Get daily delivery tracking list
router.get("/deliveries", requireAdminAccess, async (req: any, res) => {
  try {
    const dateParam = req.query.date as string;
    const queryDateStr = dateParam || new Date().toISOString().split("T")[0];
    const queryDate = new Date(queryDateStr);

    // Get all subscriptions
    const allSubs = await db.select().from(milkSubscriptions);

    // Get actual deliveries for this date
    const actualDeliveries = await db
      .select()
      .from(subscriptionDeliveries)
      .where(eq(subscriptionDeliveries.deliveryDate, queryDateStr));

    // Map deliveries by subscriptionId for easy lookup
    const deliveryMap = new Map(actualDeliveries.map(d => [d.subscriptionId, d]));

    // Construct the combined delivery records
    const trackingList = await Promise.all(
      allSubs
        .filter(sub => {
          // If a delivery record exists, we show it
          if (deliveryMap.has(sub.id)) return true;

          // Otherwise, only show if subscription is active and has started by queryDate
          if (sub.status !== "ACTIVE") return false;
          const start = sub.startDate ? new Date(sub.startDate) : null;
          return start && start <= queryDate;
        })
        .map(async sub => {
          const customer = await db.query.users.findFirst({
            where: eq(users.id, sub.userId!),
          });
          const product = await db.query.products.findFirst({
            where: eq(products.id, sub.productId!),
          });

          const delivery = deliveryMap.get(sub.id);

          return {
            id: delivery?.id || `virtual-${sub.id}`,
            subscriptionId: sub.id,
            customerId: sub.userId,
            customerName: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "Unknown Customer",
            productName: product ? product.name : "Unknown Product",
            quantity: delivery ? (delivery.quantity || 0) : sub.quantity,
            status: delivery ? delivery.status : "Pending",
            confirmedByUser: delivery ? delivery.confirmedByUser : false,
            confirmedAt: delivery ? delivery.confirmedAt : null,
            deliveryDate: queryDateStr
          };
        })
    );

    // Sort: customer name, then product name
    trackingList.sort((a, b) => a.customerName.localeCompare(b.customerName));

    res.json(trackingList);
  } catch (error) {
    console.error("Error fetching deliveries list:", error);
    res.status(500).json({ message: "Failed to fetch deliveries list" });
  }
});

export default router;
