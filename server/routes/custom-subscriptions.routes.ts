import { Router } from "express";
import { db } from "../db";
import { customSubscriptionPlans, products } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

// 1. PUBLIC: Get all active custom subscription plans (featured first, then sortOrder, then id)
router.get("/", async (req, res) => {
  try {
    const plans = await db.select().from(customSubscriptionPlans);
    
    // Sort logic: featured first (true > false), then sortOrder asc, then id desc
    const sortedPlans = plans.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      const sortDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (sortDiff !== 0) return sortDiff;
      
      return b.id - a.id;
    });

    // Populate with product details if linked
    const plansWithProducts = await Promise.all(
      sortedPlans.map(async (plan) => {
        let product = null;
        if (plan.productId) {
          product = await db.query.products.findFirst({
            where: eq(products.id, plan.productId),
          }) || null;
        }
        return { ...plan, product };
      })
    );

    res.json(plansWithProducts);
  } catch (error) {
    console.error("Error fetching custom subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch custom subscriptions" });
  }
});

// 2. PUBLIC: Get single plan details
router.get("/:id", async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const plan = await db.query.customSubscriptionPlans.findFirst({
      where: eq(customSubscriptionPlans.id, planId),
    });

    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    let product = null;
    if (plan.productId) {
      product = await db.query.products.findFirst({
        where: eq(products.id, plan.productId),
      }) || null;
    }

    res.json({ ...plan, product });
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    res.status(500).json({ message: "Failed to fetch subscription plan" });
  }
});

// 3. ADMIN: Create custom subscription plan
router.post("/", requireAdminAccess, async (req, res) => {
  try {
    const {
      title,
      productId,
      customProductName,
      image,
      quantity,
      unitType,
      price,
      originalPrice,
      frequency,
      shortDescription,
      detailedDescription,
      benefits,
      deliveryTimeSlot,
      durationOptions,
      status,
      isFeatured,
      sortOrder,
    } = req.body;

    if (!title || !quantity || !unitType || !price || !frequency) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    const parsedProductId = productId && !isNaN(parseInt(productId)) ? parseInt(productId) : null;
    const parsedSortOrder = sortOrder && !isNaN(parseInt(sortOrder)) ? parseInt(sortOrder) : 0;

    const newPlan = await db.insert(customSubscriptionPlans).values({
      title,
      productId: parsedProductId,
      customProductName: customProductName || null,
      image: image || null,
      quantity,
      unitType,
      price: price.toString(),
      originalPrice: originalPrice ? originalPrice.toString() : null,
      frequency,
      shortDescription: shortDescription || null,
      detailedDescription: detailedDescription || null,
      benefits: benefits || [],
      deliveryTimeSlot: deliveryTimeSlot || null,
      durationOptions: durationOptions || [],
      status: status || "active",
      isFeatured: !!isFeatured,
      sortOrder: parsedSortOrder,
    }).returning();
    res.status(201).json({ message: "Subscription plan created successfully", plan: newPlan[0] });
  } catch (error) {
    console.error("Error creating custom subscription plan:", error);
    res.status(500).json({ message: "Failed to create subscription plan" });
  }
});

// 4. ADMIN: Update custom subscription plan
router.put("/:id", requireAdminAccess, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const {
      title,
      productId,
      customProductName,
      image,
      quantity,
      unitType,
      price,
      originalPrice,
      frequency,
      shortDescription,
      detailedDescription,
      benefits,
      deliveryTimeSlot,
      durationOptions,
      status,
      isFeatured,
      sortOrder,
    } = req.body;

    if (!title || !quantity || !unitType || !price || !frequency) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const updated = await db.update(customSubscriptionPlans)
      .set({
        title,
        productId: productId ? parseInt(productId) : null,
        customProductName: customProductName || null,
        image: image || null,
        quantity,
        unitType,
        price: price.toString(),
        originalPrice: originalPrice ? originalPrice.toString() : null,
        frequency,
        shortDescription: shortDescription || null,
        detailedDescription: detailedDescription || null,
        benefits: benefits || [],
        deliveryTimeSlot: deliveryTimeSlot || null,
        durationOptions: durationOptions || [],
        status: status || "active",
        isFeatured: !!isFeatured,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        updatedAt: new Date(),
      })
      .where(eq(customSubscriptionPlans.id, planId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res.json({ message: "Subscription plan updated successfully", plan: updated[0] });
  } catch (error) {
    console.error("Error updating custom subscription plan:", error);
    res.status(500).json({ message: "Failed to update subscription plan" });
  }
});

// 5. ADMIN: Activate / Deactivate plan
router.patch("/:id/status", requireAdminAccess, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || (status !== "active" && status !== "inactive")) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await db.update(customSubscriptionPlans)
      .set({ status, updatedAt: new Date() })
      .where(eq(customSubscriptionPlans.id, planId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res.json({ message: `Subscription plan marked as ${status}`, plan: updated[0] });
  } catch (error) {
    console.error("Error changing status of subscription plan:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// 6. ADMIN: Mark Featured / Unfeatured
router.patch("/:id/featured", requireAdminAccess, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { isFeatured } = req.body;

    const updated = await db.update(customSubscriptionPlans)
      .set({ isFeatured: !!isFeatured, updatedAt: new Date() })
      .where(eq(customSubscriptionPlans.id, planId))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res.json({ message: isFeatured ? "Subscription plan featured" : "Subscription plan unfeatured", plan: updated[0] });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({ message: "Failed to update featured status" });
  }
});

// 7. ADMIN: Delete custom subscription plan
router.delete("/:id", requireAdminAccess, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const deleted = await db.delete(customSubscriptionPlans)
      .where(eq(customSubscriptionPlans.id, planId))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res.json({ message: "Subscription plan deleted successfully", plan: deleted[0] });
  } catch (error) {
    console.error("Error deleting custom subscription plan:", error);
    res.status(500).json({ message: "Failed to delete subscription plan" });
  }
});

export default router;
