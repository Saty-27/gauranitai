import { Router } from "express";
import { db } from "../db";
import { orders, orderItems, products, cartItems, cart as cartTable } from "@shared/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createOrderSchema = z.object({
  items: z.array(z.any()).optional(),
  total: z.number(),
  paymentMethod: z.enum(["cash", "razorpay", "cod", "upi", "card", "netbanking"]).default("cod"),
  paymentStatus: z.string().default("pending"),
  userInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string(),
    address: z.string(),
    email: z.string().optional(),
  }).optional(),
});

// Create order
router.post("/", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    const payload = createOrderSchema.parse(req.body);

    let cartItemsList: Array<{ productId: number; quantity: number; price: string }> = [];
    let totalAmount = 0;
    let deliveryAddress = payload.userInfo?.address || "Delivery Address";

    if (userId) {
      const userCarts = await db.select().from(cartTable).where(eq(cartTable.userId, userId));
      if (userCarts.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const dbCartItems = (
        await Promise.all(
          userCarts.map((userCart) =>
            db.query.cartItems.findMany({
              where: eq(cartItems.cartId, userCart.id),
            })
          )
        )
      ).flat();

      if (dbCartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      for (const item of dbCartItems) {
        if (!item.productId) continue;
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const price = product ? product.price || "0" : "0";
        cartItemsList.push({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          price: price.toString(),
        });
        totalAmount += Number(price) * Number(item.quantity || 0);
      }

      await Promise.all(userCarts.map((userCart) => db.delete(cartItems).where(eq(cartItems.cartId, userCart.id))));
    } else {
      if (!payload.items || payload.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      for (const item of payload.items) {
        const prodId = Number(item.productId);
        const qty = Number(item.quantity || 0);
        if (isNaN(prodId) || qty <= 0) continue;

        const product = await db.query.products.findFirst({
          where: eq(products.id, prodId),
        });
        if (!product) continue;

        const price = product.price || "0";
        cartItemsList.push({
          productId: prodId,
          quantity: qty,
          price: price.toString(),
        });
        totalAmount += Number(price) * qty;
      }

      if (cartItemsList.length === 0) {
        return res.status(400).json({ message: "Cart is empty or invalid" });
      }

      const info = payload.userInfo;
      const firstName = info?.firstName || "Guest";
      const lastName = info?.lastName || "User";
      const phone = info?.phone || "N/A";
      const email = info?.email || "N/A";
      const rawAddress = info?.address || "Delivery Address";
      deliveryAddress = `Guest: ${firstName} ${lastName} | Phone: ${phone} | Email: ${email} | Address: ${rawAddress}`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split("T")[0];

    let paymentMethod = payload.paymentMethod;
    if (paymentMethod === "cash") paymentMethod = "cod";

    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: userId || null,
        totalAmount: totalAmount.toFixed(2),
        deliveryAddress,
        paymentMethod,
        paymentStatus: payload.paymentStatus,
        status: "PLACED",
        deliveryDate: todayDate,
        liters: cartItemsList.reduce((sum, item) => sum + item.quantity, 0),
      })
      .returning();

    for (const item of cartItemsList) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: (Number(item.price) * item.quantity).toFixed(2),
      });

      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });
      
      if (product) {
        const newStock = Math.max(0, Number(product.stock || 0) - item.quantity);
        await db
          .update(products)
          .set({ stock: newStock })
          .where(eq(products.id, item.productId));
      }
    }

    res.set("Cache-Control", "no-store");
    res.status(201).json({ ...newOrder, cartCleared: true });
  } catch (error: any) {
    console.error("Error creating order:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid order data" });
    }
    res.status(500).json({ message: "Failed to create order" });
  }
});

// GET orders
router.get("/", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    const idsQuery = req.query.ids as string;

    let userOrders: any[] = [];
    if (userId) {
      userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId));
    } else if (idsQuery) {
      const ids = idsQuery.split(",").map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        userOrders = await db
          .select()
          .from(orders)
          .where(and(inArray(orders.id, ids), isNull(orders.userId)));
      }
    } else {
      return res.json([]);
    }

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = item.productId
              ? await db.query.products.findFirst({
                  where: eq(products.id, item.productId),
                })
              : null;
            return { ...item, product };
          })
        );
        
        return { ...order, items: itemsWithProducts };
      })
    );

    res.set("Cache-Control", "no-store");
    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// GET single order
router.get("/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    const orderId = parseInt(req.params.id);

    let orderRecord = null;
    if (userId) {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
      orderRecord = order;
    } else {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), isNull(orders.userId)));
      orderRecord = order;
    }

    if (!orderRecord) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = item.productId
          ? await db.query.products.findFirst({
              where: eq(products.id, item.productId),
            })
          : null;
        return { ...item, product };
      })
    );

    res.set("Cache-Control", "no-store");
    res.json({ ...orderRecord, items: itemsWithProducts });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

export default router;
