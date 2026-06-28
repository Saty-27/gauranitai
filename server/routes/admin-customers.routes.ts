import { Router } from "express";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  addresses,
  adminCustomerNotes,
  bills,
  customerActivityLogs,
  deliveryAssignments,
  deliveryPartners,
  milkSubscriptions,
  orderItems,
  orders,
  products,
  subscriptionDeliveries,
  supportTickets,
  ticketMessages,
  users,
} from "@shared/schema";
import { requireAdminAccess } from "../middleware/auth";

const router = Router();

type CustomerId = string;

let crmTablesReady = false;

const ensureCrmTables = async () => {
  if (crmTablesReady) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_customer_notes (
      id SERIAL PRIMARY KEY,
      customer_id VARCHAR NOT NULL REFERENCES users(id),
      note_text TEXT NOT NULL,
      added_by_admin_id VARCHAR REFERENCES users(id),
      added_by_admin_name VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customer_activity_logs (
      id SERIAL PRIMARY KEY,
      customer_id VARCHAR NOT NULL REFERENCES users(id),
      type VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description TEXT,
      metadata JSONB,
      actor_id VARCHAR REFERENCES users(id),
      actor_name VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_admin_customer_notes_customer_id ON admin_customer_notes(customer_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_customer_activity_logs_customer_id ON customer_activity_logs(customer_id)`);

  crmTablesReady = true;
};

const numberValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const moneyString = (value: number) => value.toFixed(2);

const toDateKey = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value.split("T")[0];
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return null;
};

const makeName = (user: any) =>
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  user?.email ||
  user?.phone ||
  "Unknown Customer";

const makeOrderCode = (id: number) => `ORD${String(id).padStart(4, "0")}`;
const makeInvoiceCode = (id: number) => `INV${String(id).padStart(4, "0")}`;
const makeSubscriptionCode = (id: number) => `SUB${String(id).padStart(4, "0")}`;

const getAdminActor = (req: any) => ({
  actorId: req.user?.id || req.user?.claims?.sub || null,
  actorName: req.user?.claims?.email || (req.session?.isAdminLoggedIn ? "Admin" : "Admin"),
});

const addActivityLog = async (
  customerId: CustomerId,
  type: string,
  title: string,
  description: string,
  req: any,
  metadata: Record<string, unknown> = {},
) => {
  await ensureCrmTables();
  const actor = getAdminActor(req);
  await db.insert(customerActivityLogs).values({
    customerId,
    type,
    title,
    description,
    metadata,
    actorId: actor.actorId || undefined,
    actorName: actor.actorName,
  });
};

const getCustomer = async (customerId: CustomerId) => {
  return db.query.users.findFirst({
    where: eq(users.id, customerId),
  });
};

const getCustomerAddresses = async (customerId: CustomerId) => {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, customerId));
};

const getDefaultAddress = (customerAddresses: any[]) =>
  customerAddresses.find((address) => address.isDefault) || customerAddresses[0] || null;

const getDetailedOrders = async (customerId: CustomerId) => {
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, customerId))
    .orderBy(desc(orders.createdAt));

  const orderIds = customerOrders.map((order) => order.id);
  const itemRows = orderIds.length
    ? await db
        .select({ item: orderItems, product: products })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds))
    : [];

  const itemsByOrder = new Map<number, any[]>();
  for (const row of itemRows) {
    const id = row.item.orderId;
    if (!id) continue;
    const current = itemsByOrder.get(id) || [];
    current.push({
      ...row.item,
      product: row.product,
      productName: row.product?.name || `Product #${row.item.productId}`,
      unit: row.product?.unit || "",
    });
    itemsByOrder.set(id, current);
  }

  return customerOrders.map((order) => {
    const items = itemsByOrder.get(order.id) || [];
    const totalQuantity = items.reduce((sum, item) => sum + numberValue(item.quantity), 0);
    const productsOrdered = items.length
      ? items.map((item) => `${item.productName} x ${item.quantity}`).join(", ")
      : order.liters
        ? `${order.liters}L milk order`
        : "Order items unavailable";

    return {
      ...order,
      orderCode: makeOrderCode(order.id),
      products: items,
      productsOrdered,
      quantity: totalQuantity || numberValue(order.liters),
      orderAmount: moneyString(numberValue(order.totalAmount)),
      deliveryStatus: order.status,
      deliveryDate: order.deliveryDate,
      invoiceUrl: null,
    };
  });
};

const getDetailedSubscriptions = async (customerId: CustomerId) => {
  const customerSubscriptions = await db
    .select({ subscription: milkSubscriptions, product: products })
    .from(milkSubscriptions)
    .leftJoin(products, eq(milkSubscriptions.productId, products.id))
    .where(eq(milkSubscriptions.userId, customerId))
    .orderBy(desc(milkSubscriptions.createdAt));

  const subscriptionIds = customerSubscriptions.map((row) => row.subscription.id);
  const deliveryRows = subscriptionIds.length
    ? await db
        .select()
        .from(subscriptionDeliveries)
        .where(inArray(subscriptionDeliveries.subscriptionId, subscriptionIds))
    : [];

  return customerSubscriptions.map(({ subscription, product }) => {
    const relatedDeliveries = deliveryRows.filter((delivery) => delivery.subscriptionId === subscription.id);
    const deliveredRows = relatedDeliveries.filter((delivery) => `${delivery.status}`.toLowerCase() === "delivered");
    const pendingRows = relatedDeliveries.filter((delivery) => `${delivery.status}`.toLowerCase() === "pending");
    const quantity = numberValue(subscription.quantity);
    const price = numberValue(subscription.pricePerL || product?.price);
    const createdAt = subscription.createdAt ? new Date(subscription.createdAt) : null;
    const createdHour = createdAt ? createdAt.getHours() : null;
    const isBeforeCutoff = createdHour === null ? null : createdHour < 21;

    return {
      ...subscription,
      subscriptionCode: makeSubscriptionCode(subscription.id),
      product,
      productName: product?.name || `Product #${subscription.productId}`,
      dailyQuantity: quantity,
      subscriptionType: subscription.frequency,
      deliveryStartDate: subscription.startDate,
      createdDateTime: subscription.createdAt,
      cutoffStatus: isBeforeCutoff === null ? "unknown" : isBeforeCutoff ? "before_9_pm" : "after_9_pm",
      cutoffMessage:
        isBeforeCutoff === null
          ? "Cut-off information is unavailable for this subscription."
          : isBeforeCutoff
            ? "This subscription was created before 9 PM, so delivery starts from the next day."
            : "This subscription was created after 9 PM, so delivery starts from the day after tomorrow.",
      totalDeliveredQuantity: deliveredRows.reduce((sum, delivery) => sum + numberValue(delivery.quantity), 0),
      totalPendingQuantity: pendingRows.reduce((sum, delivery) => sum + numberValue(delivery.quantity || quantity), 0),
      monthlyAmount: moneyString(quantity * price * 30),
      deliveriesCount: relatedDeliveries.length,
    };
  });
};

const isSubscriptionDueOn = (subscription: any, dateKey: string) => {
  if (`${subscription.status}`.toUpperCase() !== "ACTIVE") return false;

  const startKey = toDateKey(subscription.startDate);
  const endKey = toDateKey(subscription.endDate);
  if (startKey && startKey > dateKey) return false;
  if (endKey && endKey < dateKey) return false;

  const frequency = `${subscription.frequency || "daily"}`.toLowerCase();
  if (frequency === "daily") return true;

  if (!startKey) return false;
  const targetDate = new Date(`${dateKey}T00:00:00`);
  const startDate = new Date(`${startKey}T00:00:00`);

  if (frequency === "weekly") {
    return targetDate.getDay() === startDate.getDay();
  }

  if (frequency === "alternate") {
    const days = Math.floor((targetDate.getTime() - startDate.getTime()) / 86400000);
    return days >= 0 && days % 2 === 0;
  }

  return true;
};

const getDetailedDeliveries = async (customerId: CustomerId) => {
  const deliveries = await db
    .select({
      delivery: subscriptionDeliveries,
      subscription: milkSubscriptions,
      product: products,
    })
    .from(subscriptionDeliveries)
    .leftJoin(milkSubscriptions, eq(subscriptionDeliveries.subscriptionId, milkSubscriptions.id))
    .leftJoin(products, eq(milkSubscriptions.productId, products.id))
    .where(eq(subscriptionDeliveries.userId, customerId))
    .orderBy(desc(subscriptionDeliveries.deliveryDate));

  const assignmentRows = await db
    .select({
      assignment: deliveryAssignments,
      partner: deliveryPartners,
    })
    .from(deliveryAssignments)
    .leftJoin(deliveryPartners, eq(deliveryAssignments.partnerId, deliveryPartners.id))
    .where(eq(deliveryAssignments.status, "delivered"));

  return deliveries.map(({ delivery, subscription, product }) => {
    const relatedAssignment = assignmentRows.find(
      (row) =>
        row.assignment.subscriptionId === delivery.subscriptionId &&
        toDateKey(row.assignment.assignmentDate) === toDateKey(delivery.deliveryDate),
    );
    const required = numberValue(subscription?.quantity || delivery.quantity);
    const status = `${delivery.status || "pending"}`.toLowerCase();
    const delivered = status === "delivered" ? numberValue(delivery.quantity || required) : 0;

    return {
      ...delivery,
      subscriptionCode: delivery.subscriptionId ? makeSubscriptionCode(delivery.subscriptionId) : "N/A",
      productName: product?.name || `Product #${subscription?.productId || ""}`.trim() || "Subscription product",
      quantityRequired: required,
      quantityDelivered: delivered,
      deliveryStatus: delivery.status || "pending",
      confirmedByUser: status === "delivered" ? true : null,
      confirmedTime: status === "delivered" ? delivery.createdAt : null,
      deliveryPartner: relatedAssignment?.partner?.fullName || relatedAssignment?.partner?.phone || null,
      adminRemarks: relatedAssignment?.assignment?.failedReason || null,
    };
  });
};

const getTodayDelivery = async (customerId: CustomerId, subscriptionsData?: any[], deliveriesData?: any[]) => {
  const todayKey = new Date().toISOString().split("T")[0];
  const subscriptions =
    subscriptionsData ||
    (await getDetailedSubscriptions(customerId));
  const deliveries =
    deliveriesData ||
    (await getDetailedDeliveries(customerId));

  const dueSubscriptions = subscriptions.filter((subscription) => isSubscriptionDueOn(subscription, todayKey));
  const todayDeliveries = deliveries.filter((delivery) => toDateKey(delivery.deliveryDate) === todayKey);

  const scheduledRequired = dueSubscriptions.reduce((sum, subscription) => sum + numberValue(subscription.quantity), 0);
  const recordedRequired = todayDeliveries.reduce((sum, delivery) => sum + numberValue(delivery.quantityRequired), 0);
  const required = Math.max(scheduledRequired, recordedRequired);
  const delivered = todayDeliveries.reduce((sum, delivery) => sum + numberValue(delivery.quantityDelivered), 0);
  const remaining = Math.max(required - delivered, 0);

  let status = "Pending";
  if (required === 0) status = "No Delivery Scheduled";
  else if (delivered >= required) status = "Delivered";
  else if (delivered > 0) status = "Partial Delivered";

  const lastDelivered = todayDeliveries.find((delivery) => numberValue(delivery.quantityDelivered) > 0);

  return {
    date: todayKey,
    required,
    delivered,
    remaining,
    status,
    confirmedByUser: lastDelivered?.confirmedByUser || false,
    confirmedTime: lastDelivered?.confirmedTime || null,
  };
};

const getBills = async (customerId: CustomerId) => {
  return db
    .select()
    .from(bills)
    .where(eq(bills.userId, customerId))
    .orderBy(desc(bills.year), desc(bills.month));
};

const getPayments = async (customerId: CustomerId) => {
  const customerBills = await getBills(customerId);
  return customerBills.map((bill) => {
    const total = numberValue(bill.finalAmount);
    const paid = bill.status === "paid" ? total : 0;
    const pending = Math.max(total - paid, 0);
    return {
      invoiceId: makeInvoiceCode(bill.id),
      billId: bill.id,
      billingMonth: `${bill.month}/${bill.year}`,
      billingPeriod: `${bill.month}/${bill.year}`,
      totalMilkQuantity: Array.isArray(bill.items)
        ? bill.items.reduce((sum: number, item: any) => sum + numberValue(item.quantity), 0)
        : 0,
      subscriptionAmount: moneyString(numberValue(bill.subscriptionTotal)),
      orderAmount: moneyString(numberValue(bill.ordersTotal)),
      discount: moneyString(numberValue(bill.discount)),
      paidAmount: moneyString(paid),
      pendingAmount: moneyString(pending),
      paymentMethod: bill.paymentMethod || "N/A",
      paymentStatus: bill.status,
      paymentDate: bill.paymentDate,
      invoiceDownloadUrl: `/api/bills/${bill.id}/pdf`,
      dueDate: bill.dueDate,
      finalAmount: moneyString(total),
      previousPending: moneyString(numberValue(bill.previousPending)),
    };
  });
};

const getComplaints = async (customerId: CustomerId) => {
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, customerId))
    .orderBy(desc(supportTickets.createdAt));

  if (!tickets.length) return [];

  const ticketIds = tickets.map((ticket) => ticket.id);
  const messages = await db
    .select()
    .from(ticketMessages)
    .where(inArray(ticketMessages.ticketId, ticketIds));

  return tickets.map((ticket) => {
    const ticketThread = messages
      .filter((message) => message.ticketId === ticket.id)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    const adminReply = [...ticketThread].reverse().find((message) => message.userId !== customerId);
    const isResolved = ["resolved", "closed"].includes(`${ticket.status}`.toLowerCase());

    return {
      complaintId: ticket.id,
      date: ticket.createdAt,
      subject: ticket.subject,
      message: ticket.description,
      status: ticket.status,
      adminReply: adminReply?.message || null,
      resolvedDate: isResolved ? ticket.updatedAt : null,
      priority: ticket.priority,
      category: ticket.category,
    };
  });
};

const getNotes = async (customerId: CustomerId) => {
  await ensureCrmTables();
  return db
    .select()
    .from(adminCustomerNotes)
    .where(eq(adminCustomerNotes.customerId, customerId))
    .orderBy(desc(adminCustomerNotes.createdAt));
};

const getStoredActivity = async (customerId: CustomerId) => {
  await ensureCrmTables();
  return db
    .select()
    .from(customerActivityLogs)
    .where(eq(customerActivityLogs.customerId, customerId))
    .orderBy(desc(customerActivityLogs.createdAt));
};

const getActivity = async (customerId: CustomerId) => {
  const [customer, detailedOrders, detailedSubscriptions, deliveries, payments, complaints, notes, stored] =
    await Promise.all([
      getCustomer(customerId),
      getDetailedOrders(customerId),
      getDetailedSubscriptions(customerId),
      getDetailedDeliveries(customerId),
      getPayments(customerId),
      getComplaints(customerId),
      getNotes(customerId),
      getStoredActivity(customerId),
    ]);

  const events: any[] = [];

  if (customer?.createdAt) {
    events.push({
      type: "Account Created",
      title: "Customer account created",
      description: `${makeName(customer)} joined Gauranitai.`,
      createdAt: customer.createdAt,
    });
  }

  detailedOrders.forEach((order) => {
    events.push({
      type: "Order Placed",
      title: `Order ${order.orderCode} placed`,
      description: `${order.productsOrdered} for ₹${order.orderAmount}.`,
      createdAt: order.createdAt,
    });
  });

  detailedSubscriptions.forEach((subscription) => {
    events.push({
      type: "Subscription Created",
      title: `${subscription.productName} subscription created`,
      description: `${subscription.quantity} ${subscription.product?.unit || "unit"} ${subscription.frequency}.`,
      createdAt: subscription.createdAt,
    });
  });

  deliveries.forEach((delivery) => {
    if (`${delivery.deliveryStatus}`.toLowerCase() !== "pending") {
      events.push({
        type: "Milk Delivered",
        title: `${delivery.productName} delivery ${delivery.deliveryStatus}`,
        description: `${delivery.quantityDelivered}/${delivery.quantityRequired} delivered.`,
        createdAt: delivery.confirmedTime || delivery.createdAt || delivery.deliveryDate,
      });
    }
  });

  payments.forEach((payment) => {
    if (payment.paymentDate) {
      events.push({
        type: "Payment Made",
        title: `Payment marked ${payment.paymentStatus}`,
        description: `Invoice ${payment.invoiceId}: ₹${payment.paidAmount} paid, ₹${payment.pendingAmount} pending.`,
        createdAt: payment.paymentDate,
      });
    } else {
      events.push({
        type: "Invoice Generated",
        title: `Invoice ${payment.invoiceId} generated`,
        description: `Bill amount ₹${payment.finalAmount}.`,
        createdAt: payment.dueDate,
      });
    }
  });

  complaints.forEach((complaint) => {
    events.push({
      type: "Complaint Created",
      title: complaint.subject,
      description: complaint.message,
      createdAt: complaint.date,
    });
  });

  notes.forEach((note) => {
    events.push({
      type: "Admin Note Added",
      title: "Admin note added",
      description: note.noteText,
      createdAt: note.createdAt,
      actorName: note.addedByAdminName,
    });
  });

  stored.forEach((activity) => events.push(activity));

  return events
    .filter((event) => event.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
};

const getCustomerSummary = async (
  customer: any,
  detailedOrders: any[],
  detailedSubscriptions: any[],
  deliveries: any[],
  payments: any[],
) => {
  const activeSubscriptions = detailedSubscriptions.filter((sub) => `${sub.status}`.toUpperCase() === "ACTIVE");
  const totalSpent = detailedOrders
    .filter((order) => `${order.paymentStatus}`.toLowerCase() === "paid")
    .reduce((sum, order) => sum + numberValue(order.totalAmount), 0);
  const orderTotal = detailedOrders.reduce((sum, order) => sum + numberValue(order.totalAmount), 0);
  const pendingDues = payments.reduce((sum, payment) => sum + numberValue(payment.pendingAmount), 0);
  const totalLitersDelivered = deliveries.reduce((sum, delivery) => sum + numberValue(delivery.quantityDelivered), 0);
  const todayKey = new Date().toISOString().split("T")[0];
  const lastDelivery =
    deliveries.find((delivery) => {
      const status = `${delivery.deliveryStatus}`.toLowerCase();
      const deliveryDate = toDateKey(delivery.deliveryDate);
      return deliveryDate && deliveryDate <= todayKey && status !== "pending" && status !== "upcoming";
    }) || deliveries[0];

  return {
    totalOrders: detailedOrders.length,
    totalSubscriptions: detailedSubscriptions.length,
    activeSubscriptions: activeSubscriptions.length,
    totalAmountSpent: moneyString(totalSpent || orderTotal),
    pendingAmount: moneyString(pendingDues),
    walletBalance: moneyString(numberValue(customer.walletBalance)),
    totalLitersDelivered,
    lastDeliveryStatus: lastDelivery
      ? `${lastDelivery.deliveryStatus} on ${toDateKey(lastDelivery.deliveryDate) || "latest delivery"}`
      : "No deliveries yet",
  };
};

const getCustomerProfile = async (customerId: CustomerId) => {
  const customer = await getCustomer(customerId);
  if (!customer) return null;

  const [customerAddresses, detailedOrders, detailedSubscriptions, deliveries, payments, complaints, notes] =
    await Promise.all([
      getCustomerAddresses(customerId),
      getDetailedOrders(customerId),
      getDetailedSubscriptions(customerId),
      getDetailedDeliveries(customerId),
      getPayments(customerId),
      getComplaints(customerId),
      getNotes(customerId),
    ]);

  const summary = await getCustomerSummary(customer, detailedOrders, detailedSubscriptions, deliveries, payments);
  const todayDelivery = await getTodayDelivery(customerId, detailedSubscriptions, deliveries);
  const activity = await getActivity(customerId);
  const defaultAddress = getDefaultAddress(customerAddresses);
  const previousPending = payments.reduce((sum, payment) => sum + numberValue(payment.previousPending), 0);
  const currentMonthBill = payments[0] ? numberValue(payments[0].finalAmount) : 0;
  const outstandingBalance = numberValue(summary.pendingAmount);

  return {
    customer: {
      id: customer.id,
      customerId: customer.id,
      name: makeName(customer),
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      alternatePhone: defaultAddress?.phone && defaultAddress.phone !== customer.phone ? defaultAddress.phone : null,
      accountCreatedDate: customer.createdAt,
      lastLoginDate: null,
      status: customer.isActive ? "Active" : "Blocked",
      role: customer.role,
      walletBalance: moneyString(numberValue(customer.walletBalance)),
    },
    contact: {
      fullName: makeName(customer),
      email: customer.email,
      phone: customer.phone,
      alternatePhone: defaultAddress?.phone && defaultAddress.phone !== customer.phone ? defaultAddress.phone : null,
    },
    addresses: customerAddresses,
    defaultAddress,
    summary,
    todayDelivery,
    orders: detailedOrders,
    subscriptions: detailedSubscriptions,
    deliveries,
    payments,
    invoices: payments,
    complaints,
    notes,
    dues: {
      outstandingBalance: moneyString(outstandingBalance),
      currentMonthBill: moneyString(currentMonthBill),
      previousPending: moneyString(previousPending),
      totalPayable: moneyString(outstandingBalance),
      lastPaymentDate: payments.find((payment) => payment.paymentDate)?.paymentDate || null,
      nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    },
    activity,
  };
};

router.use(requireAdminAccess);

router.get("/", async (_req, res) => {
  try {
    const allCustomers = await db.query.users.findMany({
      where: ne(users.role, "admin"),
      orderBy: [desc(users.createdAt)],
    });

    const customersWithStats = await Promise.all(
      allCustomers.map(async (customer) => {
        const [customerOrders, customerSubscriptions, customerBills] = await Promise.all([
          db.select().from(orders).where(eq(orders.userId, customer.id)),
          db.select().from(milkSubscriptions).where(eq(milkSubscriptions.userId, customer.id)),
          db.select().from(bills).where(eq(bills.userId, customer.id)),
        ]);

        const totalSpending = customerOrders.reduce((sum, order) => sum + numberValue(order.totalAmount), 0);
        const pendingAmount = customerBills.reduce((sum, bill) => {
          if (bill.status === "paid") return sum;
          return sum + numberValue(bill.finalAmount);
        }, 0);

        return {
          id: customer.id,
          name: makeName(customer),
          phone: customer.phone || "N/A",
          email: customer.email || "N/A",
          orderCount: customerOrders.length,
          subscriptionCount: customerSubscriptions.length,
          activeSubscriptionCount: customerSubscriptions.filter((sub) => `${sub.status}`.toUpperCase() === "ACTIVE").length,
          totalSpending: moneyString(totalSpending),
          pendingAmount: moneyString(pendingAmount),
          joinedDate: customer.createdAt,
          status: customer.isActive ? "Active" : "Blocked",
        };
      }),
    );

    res.json(customersWithStats);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

router.get("/:customerId", async (req, res) => {
  try {
    const profile = await getCustomerProfile(req.params.customerId);
    if (!profile) return res.status(404).json({ message: "Customer not found" });
    res.json(profile);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).json({ message: "Failed to fetch customer details" });
  }
});

router.get("/:customerId/orders", async (req, res) => {
  try {
    res.json(await getDetailedOrders(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: "Failed to fetch customer orders" });
  }
});

router.get("/:customerId/subscriptions", async (req, res) => {
  try {
    res.json(await getDetailedSubscriptions(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch customer subscriptions" });
  }
});

router.get("/:customerId/deliveries", async (req, res) => {
  try {
    res.json(await getDetailedDeliveries(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer deliveries:", error);
    res.status(500).json({ message: "Failed to fetch customer deliveries" });
  }
});

router.get("/:customerId/payments", async (req, res) => {
  try {
    res.json(await getPayments(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ message: "Failed to fetch customer payments" });
  }
});

router.get("/:customerId/invoices", async (req, res) => {
  try {
    res.json(await getPayments(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({ message: "Failed to fetch customer invoices" });
  }
});

router.get("/:customerId/complaints", async (req, res) => {
  try {
    res.json(await getComplaints(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer complaints:", error);
    res.status(500).json({ message: "Failed to fetch customer complaints" });
  }
});

router.get("/:customerId/activity", async (req, res) => {
  try {
    res.json(await getActivity(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer activity:", error);
    res.status(500).json({ message: "Failed to fetch customer activity" });
  }
});

router.get("/:customerId/notes", async (req, res) => {
  try {
    res.json(await getNotes(req.params.customerId));
  } catch (error) {
    console.error("Error fetching customer notes:", error);
    res.status(500).json({ message: "Failed to fetch customer notes" });
  }
});

router.post("/:customerId/notes", async (req: any, res) => {
  try {
    await ensureCrmTables();
    const customer = await getCustomer(req.params.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const noteText = `${req.body.noteText || req.body.text || ""}`.trim();
    if (!noteText) return res.status(400).json({ message: "Note text is required" });

    const actor = getAdminActor(req);
    const [note] = await db
      .insert(adminCustomerNotes)
      .values({
        customerId: req.params.customerId,
        noteText,
        addedByAdminId: actor.actorId || undefined,
        addedByAdminName: actor.actorName,
      })
      .returning();

    await addActivityLog(req.params.customerId, "Admin Note Added", "Admin note added", noteText, req);

    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating customer note:", error);
    res.status(500).json({ message: "Failed to create customer note" });
  }
});

router.put("/:customerId/notes/:noteId", async (req: any, res) => {
  try {
    await ensureCrmTables();
    const noteText = `${req.body.noteText || req.body.text || ""}`.trim();
    if (!noteText) return res.status(400).json({ message: "Note text is required" });

    const [updated] = await db
      .update(adminCustomerNotes)
      .set({ noteText, updatedAt: new Date() })
      .where(and(eq(adminCustomerNotes.id, Number(req.params.noteId)), eq(adminCustomerNotes.customerId, req.params.customerId)))
      .returning();

    if (!updated) return res.status(404).json({ message: "Note not found" });

    await addActivityLog(req.params.customerId, "Admin Note Updated", "Admin note updated", noteText, req);
    res.json(updated);
  } catch (error) {
    console.error("Error updating customer note:", error);
    res.status(500).json({ message: "Failed to update customer note" });
  }
});

router.delete("/:customerId/notes/:noteId", async (req: any, res) => {
  try {
    await ensureCrmTables();
    const deleted = await db
      .delete(adminCustomerNotes)
      .where(and(eq(adminCustomerNotes.id, Number(req.params.noteId)), eq(adminCustomerNotes.customerId, req.params.customerId)))
      .returning();

    if (!deleted.length) return res.status(404).json({ message: "Note not found" });

    await addActivityLog(req.params.customerId, "Admin Note Deleted", "Admin note deleted", deleted[0].noteText, req);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer note:", error);
    res.status(500).json({ message: "Failed to delete customer note" });
  }
});

router.put("/:customerId/status", async (req: any, res) => {
  try {
    const status = `${req.body.status || ""}`.toLowerCase();
    if (!["active", "blocked", "unblocked"].includes(status)) {
      return res.status(400).json({ message: "Status must be active, blocked, or unblocked" });
    }

    const isActive = status === "active" || status === "unblocked";
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, req.params.customerId))
      .returning();

    if (!updated) return res.status(404).json({ message: "Customer not found" });

    await addActivityLog(
      req.params.customerId,
      isActive ? "Customer Activated" : "Customer Blocked",
      isActive ? "Customer account activated" : "Customer account blocked",
      isActive
        ? "Customer can place orders, create subscriptions, and confirm deliveries."
        : "Customer cannot place new orders, create subscriptions, or mark deliveries as received.",
      req,
      { status },
    );

    res.json({ id: updated.id, status: updated.isActive ? "Active" : "Blocked" });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({ message: "Failed to update customer status" });
  }
});

router.put("/:customerId/address", async (req: any, res) => {
  try {
    const customer = await getCustomer(req.params.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const existingAddressId = req.body.id ? Number(req.body.id) : null;
    const addressPayload = {
      userId: req.params.customerId,
      type: req.body.type || "home",
      address: req.body.address || "",
      landmark: req.body.landmark || null,
      city: req.body.city || null,
      state: req.body.state || null,
      pincode: req.body.pincode || null,
      phone: req.body.phone || null,
      isDefault: req.body.isDefault ?? true,
    };

    if (!addressPayload.address.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    let updatedAddress;
    if (existingAddressId) {
      [updatedAddress] = await db
        .update(addresses)
        .set(addressPayload)
        .where(and(eq(addresses.id, existingAddressId), eq(addresses.userId, req.params.customerId)))
        .returning();
    } else {
      [updatedAddress] = await db.insert(addresses).values(addressPayload).returning();
    }

    if (!updatedAddress) return res.status(404).json({ message: "Address not found" });

    await addActivityLog(
      req.params.customerId,
      "Address Updated",
      "Customer delivery address updated",
      updatedAddress.address,
      req,
      { addressId: updatedAddress.id },
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error("Error updating customer address:", error);
    res.status(500).json({ message: "Failed to update customer address" });
  }
});

export default router;
