import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuthRoutes } from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import addressRoutes from "./routes/address.routes";
import orderRoutes from "./routes/order.routes";
import supportRoutes from "./routes/support.routes";
import offersRoutes from "./routes/offers.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import adminOrdersRoutes from "./routes/admin-orders.routes";
import adminSubscriptionsRoutes from "./routes/admin-subscriptions.routes";
import adminCustomersRoutes from "./routes/admin-customers.routes";
import billingRoutes from "./routes/billing.routes";
import adminBillingRoutes from "./routes/admin-billing.routes";
import rbacRoutes from "./routes/rbac.routes";
import bannersRoutes from "./routes/banners.routes";
import { requireAdminAccess } from "./middleware/auth";
import homepageRoutes from "./routes/homepage.routes";
import cmsRoutes from "./routes/cms.routes";
import { setupContactSubmissionsRoutes } from "./routes/contact-submissions.routes";
import { startDeliveryScheduler } from "./jobs/auto-delivery";
import blogRoutes from "./routes/blog.routes";
import videoBlogRoutes from "./routes/video-blog.routes";
import imageGalleryRoutes from "./routes/image-gallery.routes";
import videoGalleryRoutes from "./routes/video-gallery.routes";
import mediaUploadRoutes from "./routes/media.routes";
import adminUsersRoutes from "./routes/admin-users.routes";
import passwordResetRoutes from "./routes/password-reset.routes";
import chatRoutes from "./routes/chat.routes";
import customSubscriptionRoutes from "./routes/custom-subscriptions.routes";
import userSubscriptionRoutes from "./routes/user-subscriptions.routes";


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Simple email/password auth routes (login/signup)
  setupAuthRoutes(app);
  
  // Contact submissions routes (public + admin)
  setupContactSubmissionsRoutes(app);

  // Start auto-delivery scheduler
  startDeliveryScheduler();

  // Domain-specific routes FIRST (before rbacRoutes catch-all)
  app.use('/api/cart', cartRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin/users', adminUsersRoutes);
  app.use('/api/auth', passwordResetRoutes);
  app.use('/api/chat', chatRoutes);
  app.get('/api/admin/orders', requireAdminAccess, async (req: any, res) => {
    try {
      const { orders, users, orderItems, products } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq, inArray } = await import('drizzle-orm');
      const status = req.query.status as string;
      
      let allOrders = await db.select().from(orders);
      if (status) {
        allOrders = allOrders.filter((o: any) => o.status === status);
      }
      
      const orderIds = allOrders.map((o) => o.id);
      const allItems = orderIds.length 
        ? await db
            .select({ item: orderItems, product: products })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(inArray(orderItems.orderId, orderIds))
        : [];
      
      const itemsMap = new Map<number, any[]>();
      for (const row of allItems) {
        if (!row.item.orderId) continue;
        const current = itemsMap.get(row.item.orderId) || [];
        current.push({
          ...row.item,
          product: row.product,
        });
        itemsMap.set(row.item.orderId, current);
      }
      
      const withDetails = await Promise.all(
        allOrders.map(async (order: any) => {
          let customer = null;
          if (order.userId) {
            customer = await db.query.users.findFirst({
              where: eq(users.id, order.userId),
            });
          } else {
            const addr = order.deliveryAddress || "";
            if (addr.startsWith("Guest:")) {
              const parts = addr.split(" | ");
              const namePart = parts.find((p: string) => p.startsWith("Guest:"))?.replace("Guest:", "").trim() || "";
              const phonePart = parts.find((p: string) => p.startsWith("Phone:"))?.replace("Phone:", "").trim() || "";
              const emailPart = parts.find((p: string) => p.startsWith("Email:"))?.replace("Email:", "").trim() || "";
              const addressPart = parts.find((p: string) => p.startsWith("Address:"))?.replace("Address:", "").trim() || addr;
              
              const [firstName = "Guest", lastName = "User"] = namePart.split(" ");
              customer = {
                firstName,
                lastName,
                phone: phonePart,
                email: emailPart === "N/A" ? "" : emailPart,
                address: addressPart,
              };
            }
          }
          const items = itemsMap.get(order.id) || [];
          return { ...order, customer, items };
        })
      );
      
      res.json(withDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/admin/orders/:id/update-status', requireAdminAccess, async (req: any, res) => {
    try {
      const { orders } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      const orderId = parseInt(req.params.id);
      const { status, paymentStatus } = req.body;
      
      const updated = await storage.updateOrderStatus(orderId, status);
      
      if (paymentStatus) {
        await storage.updateOrderPayment(orderId, { paymentStatus });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/admin/orders/:id', requireAdminAccess, async (req: any, res) => {
    try {
      const { orders, orderItems } = await import('@shared/schema');
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      const orderId = parseInt(req.params.id);
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      const deleted = await db.delete(orders).where(eq(orders.id, orderId)).returning();
      if (!deleted.length) return res.status(404).json({ message: "Order not found" });
      res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });
  app.use('/api/admin/customers', adminCustomersRoutes);
  app.use('/api/admin/billing', adminBillingRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/offers', offersRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/admin/subscriptions', adminSubscriptionsRoutes);
  app.use('/api/custom-subscriptions', customSubscriptionRoutes);
  app.use('/api/user-subscriptions', userSubscriptionRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/banners', bannersRoutes);
  app.use('/api/homepage', homepageRoutes);
  app.use('/api/cms', cmsRoutes);
  app.use('/api', blogRoutes);
  app.use('/api', videoBlogRoutes);
  app.use('/api', imageGalleryRoutes);
  app.use('/api', videoGalleryRoutes);
  app.use('/api/admin/media', mediaUploadRoutes);

  // User payment screenshot upload (authenticated users only)
  app.use('/api/media', mediaUploadRoutes);

  // User submits screenshot URL to their bill
  app.post('/api/billing/:billId/submit-screenshot', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: 'Not authenticated' });

      const billId = parseInt(req.params.billId);
      const { screenshotUrl } = req.body;

      if (!screenshotUrl) return res.status(400).json({ message: 'screenshotUrl is required' });

      const { bills } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('./db');

      // Verify bill belongs to user
      const bill = await db.select().from(bills).where(eq(bills.id, billId));
      if (!bill.length || bill[0].userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updated = await db.update(bills).set({
        paymentScreenshotUrl: screenshotUrl,
        paymentScreenshotStatus: 'pending_review',
        paymentScreenshotUploadedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(bills.id, billId)).returning();

      res.json({ success: true, bill: updated[0] });
    } catch (error) {
      console.error('Error submitting screenshot:', error);
      res.status(500).json({ message: 'Failed to submit screenshot' });
    }
  });

  // RBAC-protected routes LAST - catches remaining /api/* routes
  app.use('/api', rbacRoutes);

  // Auth user endpoint - returns real user data from database
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Notification routes - REAL DATABASE OPERATIONS
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // PDF invoice download route
  app.get('/api/bills/:billId/pdf', async (req: any, res) => {
    try {
      const billId = parseInt(req.params.billId);
      const { getBillInvoiceData } = await import('./utils/generateInvoice');
      const { generateInvoicePDF } = await import('./utils/generateInvoicePDF');
      
      const invoiceData = await getBillInvoiceData(billId);
      if (!invoiceData) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Check authorization
      const userId = req.session?.userId;
      const isAdmin = req.session?.isAdminLoggedIn;
      
      const { bills } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('./db');
      const billRecord = await db.select().from(bills).where(eq(bills.id, billId));
      
      if (!billRecord.length) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      if (!isAdmin && billRecord[0].userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to download this invoice' });
      }

      generateInvoicePDF(invoiceData, res);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ message: 'Failed to generate invoice PDF' });
    }
  });

  // Mark bill as paid (cash payment)
  app.post('/api/billing/:billId/mark-paid', async (req: any, res) => {
    try {
      const billId = parseInt(req.params.billId);
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      const { bills } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('./db');
      const bill = await db.select().from(bills).where(eq(bills.id, billId));
      
      if (!bill.length || bill[0].userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updated = await db.update(bills).set({
        status: 'paid',
        paymentDate: new Date(),
        paymentMethod: 'cash'
      }).where(eq(bills.id, billId)).returning();

      res.json(updated[0]);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      res.status(500).json({ message: 'Failed to mark bill as paid' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
