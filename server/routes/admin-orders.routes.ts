import { Router } from "express";
import { db } from "../db";
import { orders, orderItems, products, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import { storage } from "../storage";

const router = Router();

console.log("🛠️ Admin Orders Routes file loaded!");

// Admin: Get all orders with filtering
router.get("/", requireAdminAccess, async (req: any, res) => {
  try {

    const status = req.query.status as string;
    let allOrders = await db.select().from(orders);

    if (status) {
      allOrders = allOrders.filter((o) => o.status === status);
    }

    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Admin: Get order details with items
router.get("/:id", requireAdminAccess, async (req: any, res) => {
  try {

    const orderId = parseInt(req.params.id);
    const order = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId!),
        });
        return { ...item, product };
      })
    );

    res.json({ ...order[0], items: itemsWithProducts });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// Admin: Update order status
router.post("/:id/update-status", requireAdminAccess, async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, paymentStatus } = req.body;

    const updated = await storage.updateOrderStatus(orderId, status);

    if (paymentStatus) {
      await storage.updateOrderPayment(orderId, { paymentStatus });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
});

// Admin: Delete order
router.delete("/:id", requireAdminAccess, async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Delete order items first (foreign key constraint)
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Delete the order
    const deleted = await db.delete(orders).where(eq(orders.id, orderId)).returning();

    if (!deleted.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;
