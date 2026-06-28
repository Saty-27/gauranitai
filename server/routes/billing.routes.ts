import { Router } from "express";
import { db } from "../db";
import { bills, milkSubscriptions, orders, orderItems, products, users, subscriptionDeliveries, addresses } from "@shared/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import Razorpay from "razorpay";

const router = Router();

// Lazy initialize Razorpay only when keys are provided
let razorpayInstance: any = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

const toAmount = (value: unknown) => {
  const amount = Number.parseFloat(`${value ?? 0}`);
  return Number.isFinite(amount) ? amount : 0;
};

const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

const getMonthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const normalizeBillStatus = (status?: string | null, amount = 0) => {
  if (amount <= 0) return "NO_DUES";
  const normalized = `${status || "unpaid"}`.toLowerCase();
  if (normalized === "paid") return "PAID";
  if (normalized === "overdue") return "OVERDUE";
  return "PENDING";
};

const getDaysLeft = (dueDate: string | Date) => {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const parseBillItems = (items: unknown): any[] => {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getMonthlyDeliveryCount = (frequency?: string | null) => {
  const normalized = `${frequency || "daily"}`.toLowerCase().trim();
  if (normalized.includes("week")) return 4;
  if (normalized.includes("alternate") || normalized.includes("every other")) return 15;
  if (normalized.includes("month")) return 1;
  return 30;
};

const asDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const countDeliveriesInMonth = (subscription: any, year: number, month: number) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const subscriptionStart = asDate(subscription.startDate) || startOfMonth;
  const subscriptionEnd = asDate(subscription.endDate) || endOfMonth;

  const start = subscriptionStart > startOfMonth ? subscriptionStart : startOfMonth;
  const end = subscriptionEnd < endOfMonth ? subscriptionEnd : endOfMonth;
  if (start > end) return 0;

  const normalized = `${subscription.frequency || "daily"}`.toLowerCase();
  if (normalized.includes("week")) {
    return Math.max(0, Math.ceil(((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7));
  }
  if (normalized.includes("alternate") || normalized.includes("every other")) {
    return Math.max(0, Math.ceil(((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) / 2));
  }
  if (normalized.includes("month")) return 1;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const buildAdjustments = (billLike: any) => {
  const adjustments = [];
  const previousPending = toAmount(billLike.previousPending ?? billLike.previousDue);
  const penalty = toAmount(billLike.penalty);
  const discount = toAmount(billLike.discount);

  if (previousPending > 0) adjustments.push({ type: "Previous Pending", amount: previousPending, direction: "charge" });
  if (penalty > 0) adjustments.push({ type: "Penalty", amount: penalty, direction: "charge" });
  if (discount > 0) adjustments.push({ type: "Discount", amount: discount, direction: "discount" });

  return adjustments;
};

const formatStoredBill = (bill: any) => {
  const amount = toAmount(bill.finalAmount);
  const rawItems = parseBillItems(bill.items);
  const subscriptionItems = rawItems
    .filter((item) => `${item.type || item.description || ""}`.toLowerCase().includes("subscription"))
    .map((item) => ({
      name: item.productName || item.name || item.description || "Subscription delivery",
      quantity: toAmount(item.quantity),
      rate: toAmount(item.pricePerUnit ?? item.price ?? item.rate),
      total: Math.round(toAmount(item.total)),
      date: item.date || null,
    }));
  const orderItemsList = rawItems
    .filter((item) => !`${item.type || item.description || ""}`.toLowerCase().includes("subscription"))
    .map((item) => ({
      name: item.productName || item.name || item.description || (item.orderId ? `Order #${item.orderId}` : "Order"),
      quantity: toAmount(item.quantity || 1),
      rate: toAmount(item.pricePerUnit ?? item.price ?? item.rate),
      total: Math.round(toAmount(item.total)),
      date: item.date || null,
    }));

  return {
    id: bill.id,
    billId: bill.id,
    month: getMonthLabel(Number(bill.year), Number(bill.month)),
    monthNumber: Number(bill.month),
    year: Number(bill.year),
    amount,
    finalAmount: amount,
    subscriptionTotal: toAmount(bill.subscriptionTotal),
    ordersTotal: toAmount(bill.ordersTotal),
    previousDue: toAmount(bill.previousPending),
    previousPending: toAmount(bill.previousPending),
    penalty: toAmount(bill.penalty),
    discount: toAmount(bill.discount),
    status: normalizeBillStatus(bill.status, amount),
    rawStatus: bill.status,
    dueDate: bill.dueDate,
    daysLeft: getDaysLeft(bill.dueDate),
    paidDate: bill.paymentDate ? new Date(bill.paymentDate).toISOString() : "",
    paymentDate: bill.paymentDate,
    paymentMethod: bill.paymentMethod || "",
    notes: bill.notes || "",
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    items: rawItems,
    subscriptionItems,
    orderItems: orderItemsList,
    adjustments: buildAdjustments(bill),
    isGenerated: true,
    isPreview: false,
    // Payment workflow fields
    billPdfUrl: bill.billPdfUrl || null,
    paymentScreenshotUrl: bill.paymentScreenshotUrl || null,
    paymentScreenshotStatus: bill.paymentScreenshotStatus || null,
    paymentScreenshotUploadedAt: bill.paymentScreenshotUploadedAt || null,
  };
};


const addLineItem = (items: any[], nextItem: any) => {
  const key = `${nextItem.name}|${nextItem.rate}|${nextItem.type}`;
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity += nextItem.quantity;
    existing.total += nextItem.total;
    return;
  }
  items.push({ ...nextItem, key });
};

async function buildLiveCurrentBill(userId: string, targetDate = new Date()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const startDateStr = toIsoDate(startDate);
  const endDateStr = toIsoDate(endDate);

  const subscriptionItems: any[] = [];
  const deliveryRows = await db
    .select()
    .from(subscriptionDeliveries)
    .where(
      and(
        eq(subscriptionDeliveries.userId, userId),
        gte(subscriptionDeliveries.deliveryDate, startDateStr),
        lte(subscriptionDeliveries.deliveryDate, endDateStr)
      )
    );

  const billableDeliveries = deliveryRows.filter((delivery) => {
    const status = `${delivery.status || ""}`.toLowerCase();
    return !["missed", "cancelled", "canceled", "skipped"].includes(status) && toAmount(delivery.quantity) > 0;
  });

  if (billableDeliveries.length > 0) {
    for (const delivery of billableDeliveries) {
      const subscription = await db.query.milkSubscriptions.findFirst({
        where: eq(milkSubscriptions.id, delivery.subscriptionId!),
      });
      const product = subscription?.productId
        ? await db.query.products.findFirst({ where: eq(products.id, subscription.productId) })
        : null;
      const rate = toAmount(subscription?.pricePerL || product?.price);
      const quantity = toAmount(delivery.quantity);
      addLineItem(subscriptionItems, {
        type: "subscription",
        name: `${product?.name || "Subscription"} deliveries`,
        quantity,
        rate,
        total: quantity * rate,
        source: "actual-deliveries",
      });
    }
  } else {
    const activeSubscriptions = await db
      .select()
      .from(milkSubscriptions)
      .where(and(eq(milkSubscriptions.userId, userId), eq(milkSubscriptions.status, "ACTIVE")));

    for (const subscription of activeSubscriptions) {
      const product = subscription.productId
        ? await db.query.products.findFirst({ where: eq(products.id, subscription.productId) })
        : null;
      const deliveries = countDeliveriesInMonth(subscription, year, month);
      const rate = toAmount(subscription.pricePerL || product?.price);
      const quantity = toAmount(subscription.quantity) * deliveries;
      if (quantity <= 0 || rate <= 0) continue;

      addLineItem(subscriptionItems, {
        type: "subscription",
        name: `${product?.name || "Subscription"} estimated deliveries`,
        quantity,
        rate,
        total: quantity * rate,
        source: "active-subscription-estimate",
      });
    }
  }

  const monthOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    );

  const orderItemsList: any[] = [];
  for (const order of monthOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    if (items.length === 0) {
      addLineItem(orderItemsList, {
        type: "order",
        name: `Order #${order.id}`,
        quantity: 1,
        rate: toAmount(order.totalAmount),
        total: toAmount(order.totalAmount),
        source: "order",
      });
      continue;
    }

    for (const item of items) {
      const product = item.productId
        ? await db.query.products.findFirst({ where: eq(products.id, item.productId) })
        : null;
      const rate = toAmount(item.price);
      const quantity = toAmount(item.quantity);
      addLineItem(orderItemsList, {
        type: "order",
        name: `${product?.name || "Order item"} (Order #${order.id})`,
        quantity,
        rate,
        total: toAmount(item.totalPrice || rate * quantity),
        source: "order-item",
      });
    }
  }

  const previousBills = await db
    .select()
    .from(bills)
    .where(and(eq(bills.userId, userId), sql`${bills.status} in ('unpaid', 'overdue')`));

  const previousPending = previousBills
    .filter((bill) => Number(bill.year) < year || (Number(bill.year) === year && Number(bill.month) < month))
    .reduce((sum, bill) => sum + toAmount(bill.finalAmount), 0);

  const subscriptionTotal = subscriptionItems.reduce((sum, item) => sum + toAmount(item.total), 0);
  const ordersTotal = orderItemsList.reduce((sum, item) => sum + toAmount(item.total), 0);
  const penalty = 0;
  const discount = 0;
  const finalAmount = Math.max(0, subscriptionTotal + ordersTotal + previousPending + penalty - discount);
  const dueDate = new Date(year, month, 5);

  return {
    id: null,
    billId: null,
    month: getMonthLabel(year, month),
    monthNumber: month,
    year,
    amount: Math.round(finalAmount),
    finalAmount: Math.round(finalAmount),
    subscriptionTotal: Math.round(subscriptionTotal),
    ordersTotal: Math.round(ordersTotal),
    previousDue: Math.round(previousPending),
    previousPending: Math.round(previousPending),
    penalty,
    discount,
    status: normalizeBillStatus("unpaid", finalAmount),
    rawStatus: "preview",
    dueDate: dueDate.toISOString(),
    daysLeft: getDaysLeft(dueDate),
    paidDate: "",
    paymentDate: null,
    paymentMethod: "",
    notes: "",
    createdAt: null,
    updatedAt: null,
    items: [...subscriptionItems, ...orderItemsList],
    subscriptionItems: subscriptionItems.map(({ key, ...item }) => ({ ...item, total: Math.round(item.total) })),
    orderItems: orderItemsList.map(({ key, ...item }) => ({ ...item, total: Math.round(item.total) })),
    adjustments: buildAdjustments({ previousPending, penalty, discount }),
    isGenerated: false,
    isPreview: true,
    calculationSource: billableDeliveries.length > 0 ? "actual-deliveries" : "active-subscription-estimate",
  };
}

// Get today's milk subscription requirements for admin
router.get("/today-requirements", async (req: any, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Get all ACTIVE subscriptions
    const activeSubscriptions = await db
      .select()
      .from(milkSubscriptions)
      .where(eq(milkSubscriptions.status, "ACTIVE"));

    // Aggregate by subscription to get total liters needed
    let totalLiters = 0;
    let totalDeliveries = 0;
    const subscriptionMap = new Map();

    for (const sub of activeSubscriptions) {
      // Check if today is within subscription period
      const startDate = sub.startDate ? new Date(sub.startDate) : null;
      const endDate = sub.endDate ? new Date(sub.endDate) : null;
      
      if (startDate && startDate > today) continue; // Subscription hasn't started yet
      if (endDate && endDate < today) continue; // Subscription has ended

      // Check if today is a delivery day based on frequency
      let isDeliveryDay = false;
      
      if (sub.frequency === "daily") {
        isDeliveryDay = true;
      } else if (sub.frequency === "weekly") {
        // Deliver on same day of week as start date
        if (startDate) {
          const startDayOfWeek = startDate.getDay();
          isDeliveryDay = dayOfWeek === startDayOfWeek;
        }
      } else if (sub.frequency === "alternate") {
        // Alternate every other day from start date
        if (startDate) {
          const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          isDeliveryDay = daysDiff % 2 === 0; // Even days (0, 2, 4, etc.)
        }
      }

      if (!isDeliveryDay) continue;
      if (!sub.userId || !sub.productId) continue;

      // Get user and product details
      const user = await db.query.users.findFirst({
        where: eq(users.id, sub.userId),
      });
      
      const product = await db.query.products.findFirst({
        where: eq(products.id, sub.productId),
      });

      if (user && product) {
        // Get default address for delivery (safely handle missing addresses)
        let defaultAddr = null;
        try {
          const addrs = await db
            .select()
            .from(addresses)
            .where(and(eq(addresses.userId, sub.userId), eq(addresses.isDefault, true)))
            .limit(1);
          defaultAddr = addrs[0] || null;
        } catch (err) {
          console.error("Error fetching address:", err);
        }

        const quantity = Number(sub.quantity || 0);
        totalLiters += quantity;
        totalDeliveries += 1;

        if (!subscriptionMap.has(sub.productId)) {
          subscriptionMap.set(sub.productId, {
            productId: sub.productId,
            productName: product.name || "Unknown",
            totalLiters: 0,
            byArea: new Map(), // Group by area
          });
        }

        const mapEntry = subscriptionMap.get(sub.productId);
        mapEntry.totalLiters += quantity;

        // Group by delivery area (city)
        const area = defaultAddr?.city || "Mumbai"; // Default to Mumbai if no address
        if (!mapEntry.byArea.has(area)) {
          mapEntry.byArea.set(area, []);
        }

        mapEntry.byArea.get(area).push({
          userId: user.id,
          customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          liters: quantity,
          deliveryTime: sub.deliveryTime || "Not specified",
          address: defaultAddr?.address || user.address || "Awaiting address details",
          landmark: defaultAddr?.landmark || "",
          city: defaultAddr?.city || "Mumbai",
          state: defaultAddr?.state || "Maharashtra",
          pincode: defaultAddr?.pincode || "",
          phone: defaultAddr?.phone || user.phone || "",
        });
      }
    }

    // Convert Map to array format for JSON response
    const requirements = Array.from(subscriptionMap.values()).map((req: any) => ({
      productId: req.productId,
      productName: req.productName,
      totalLiters: req.totalLiters,
      byArea: Object.fromEntries(req.byArea),
    }));

    res.json({
      date: todayStr,
      totalLitersNeeded: totalLiters,
      totalDeliveries: totalDeliveries,
      requirements: requirements,
    });
  } catch (error) {
    console.error("Error fetching today's requirements:", error);
    res.status(500).json({ message: "Failed to fetch requirements" });
  }
});

// Get all generated bills for the logged-in customer
router.get("/", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userBills = await db
      .select()
      .from(bills)
      .where(eq(bills.userId, userId))
      .orderBy(desc(bills.year), desc(bills.month), desc(bills.id));

    res.set("Cache-Control", "no-store");
    res.json(userBills.map(formatStoredBill));
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
});

// Get current billing data. Prefer real unpaid/generated bills, otherwise return a live preview.
router.get("/current", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const outstandingBills = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.userId, userId),
          sql`${bills.status} in ('unpaid', 'overdue')`
        )
      )
      .orderBy(desc(bills.year), desc(bills.month), desc(bills.id))
      .limit(1);

    if (outstandingBills.length > 0) {
      res.set("Cache-Control", "no-store");
      return res.json(formatStoredBill(outstandingBills[0]));
    }

    const currentGeneratedBill = await db
      .select()
      .from(bills)
      .where(and(eq(bills.userId, userId), eq(bills.month, month), eq(bills.year, year)))
      .limit(1);

    const response = currentGeneratedBill.length > 0
      ? formatStoredBill(currentGeneratedBill[0])
      : await buildLiveCurrentBill(userId, now);

    res.set("Cache-Control", "no-store");
    res.json(response);
  } catch (error) {
    console.error("Error fetching billing:", error);
    res.status(500).json({ message: "Failed to fetch billing data" });
  }
});

// Get billing history
router.get("/history", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userBills = await db
      .select()
      .from(bills)
      .where(eq(bills.userId, userId))
      .orderBy(desc(bills.year), desc(bills.month), desc(bills.id));

    res.set("Cache-Control", "no-store");
    res.json(userBills.map(formatStoredBill));
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ message: "Failed to fetch billing history" });
  }
});

// Get one generated bill with full details
router.get("/:id", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const billId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(billId)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, billId), eq(bills.userId, userId)),
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.set("Cache-Control", "no-store");
    res.json(formatStoredBill(bill));
  } catch (error) {
    console.error("Error fetching bill details:", error);
    res.status(500).json({ message: "Failed to fetch bill details" });
  }
});

// Create Razorpay payment order
router.post("/pay", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { amount, currency = "INR" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `bill_${userId}_${Date.now()}`,
      payment_capture: 1,
    };

    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(500).json({ message: "Payment service not configured" });
    }

    const response = await instance.orders.create(options);

    res.json({
      orderId: response.id,
      amount: amount,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

// Verify Razorpay payment
router.post("/verify-payment", async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const crypto = require("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment verified - update orders as paid
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);

      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          paymentDate: new Date(),
        })
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.paymentStatus, "pending"),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );

      res.json({
        success: true,
        message: "Payment verified successfully",
        orderId: razorpay_order_id,
      });
    } else {
      res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

export default router;
