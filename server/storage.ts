import {
  users,
  categories,
  products,
  orders,
  orderItems,
  milkSubscriptions,
  vendors,
  deliveryPartners,
  notifications,
  cart,
  cartItems,
  drivers,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type MilkSubscription,
  type InsertMilkSubscription,
  type Vendor,
  type InsertVendor,
  type DeliveryPartner,
  type InsertDeliveryPartner,
  type Notification,
  type InsertNotification,
  type CartItem,
  type Driver,
  type InsertDriver,
  passwordResetRequests,
  passwordResetTokens,
  chatThreads,
  chatMessages,
  type PasswordResetRequest,
  type InsertPasswordResetRequest,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type ChatThread,
  type InsertChatThread,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, isNull, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  
  // Order operations
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  decrementProductStock(productId: number, quantity: number): Promise<void>;
  updateVendorRequirement(vendorId: number, liters: number): Promise<void>;
  recordStockMovement(movement: any): Promise<void>;
  getOrdersForDelivery(deliveryPartnerId: number): Promise<Order[]>;
  
  // Order items operations
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Milk subscription operations
  getMilkSubscriptionByUser(userId: string): Promise<MilkSubscription | undefined>;
  createMilkSubscription(subscription: InsertMilkSubscription): Promise<MilkSubscription>;
  updateMilkSubscription(id: number, subscription: Partial<InsertMilkSubscription>): Promise<MilkSubscription>;
  
  // Vendor operations
  getVendors(): Promise<Vendor[]>;
  getVendorByUser(userId: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Delivery partner operations
  getDeliveryPartners(): Promise<DeliveryPartner[]>;
  getDeliveryPartnerByUser(userId: string): Promise<DeliveryPartner | undefined>;
  createDeliveryPartner(partner: InsertDeliveryPartner): Promise<DeliveryPartner>;
  
  // Vendor supply operations
  
  // Notification operations
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // Cart operations
  addToCart(userId: string, productId: number, quantity: number): Promise<CartItem>;
  getCartItems(userId: string): Promise<any[]>;
  clearCart(userId: string): Promise<void>;
  
  // Inward log operations
  createInwardLog(inwardLog: any): Promise<any>;
  
  // Vendor approval
  approveVendor(vendorId: number): Promise<Vendor>;
  
  // Admin order management
  getAllOrders(): Promise<Order[]>;
  assignDeliveryPartner(orderId: number, deliveryPartnerId: number): Promise<Order>;
  updateOrderPayment(orderId: number, paymentData: { paymentStatus?: string; paymentMethod?: string; paymentDate?: Date }): Promise<Order>;
  
  // Driver management
  addDriver(driver: InsertDriver): Promise<Driver>;
  getDriversByVendor(vendorId: number): Promise<Driver[]>;
  getAllStockMovements(): Promise<any[]>;
  getStockMovementsByProduct(productId: number): Promise<any[]>;
  
  // Subscription management - get all subscriptions
  getAllSubscriptions(): Promise<(MilkSubscription & { user?: User })[]>;

  // Banner operations
  getBanners(): Promise<any[]>;
  getActiveBanners(): Promise<any[]>;
  createBanner(banner: any): Promise<any>;
  updateBanner(id: number, banner: any): Promise<any>;
  deleteBanner(id: number): Promise<void>;

  // Homepage CMS operations
  getEthosCards(): Promise<any[]>;
  getActiveEthosCards(): Promise<any[]>;
  getStatsCounters(): Promise<any[]>;
  getActiveStatsCounters(): Promise<any[]>;
  getFAQs(): Promise<any[]>;
  getActiveFAQs(): Promise<any[]>;
  getNewsletterSettings(): Promise<any | null>;
  getFooterSettings(): Promise<any | null>;
  updateNewsletterSettings(settings: any): Promise<any>;
  updateFooterSettings(settings: any): Promise<any>;

  // CMS Settings operations
  getAboutUsSettings(): Promise<any | null>;
  getContactSettings(): Promise<any | null>;
  getTermsOfServiceSettings(): Promise<any | null>;
  getPrivacyPolicySettings(): Promise<any | null>;
  updateAboutUsSettings(settings: any): Promise<any>;
  updateContactSettings(settings: any): Promise<any>;
  updateTermsOfServiceSettings(settings: any): Promise<any>;
  updatePrivacyPolicySettings(settings: any): Promise<any>;
  getSiteSettings(): Promise<any | null>;
  updateSiteSettings(settings: any): Promise<any>;

  // User Management
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(userData: any): Promise<User>;

  // Password reset operations
  createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest>;
  getPasswordResetRequests(): Promise<PasswordResetRequest[]>;
  getPasswordResetRequestById(id: number): Promise<PasswordResetRequest | undefined>;
  updatePasswordResetRequestStatus(id: number, status: string, resolvedAt?: Date): Promise<PasswordResetRequest>;
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;

  // Chat Support operations
  getOrCreateChatThread(userId: string): Promise<ChatThread>;
  getChatThreadById(id: number): Promise<ChatThread | undefined>;
  getChatThreads(): Promise<(ChatThread & { user?: User })[]>;
  getChatMessages(threadId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatThreadStatus(id: number, status: string): Promise<ChatThread>;
  incrementUnreadCount(threadId: number, forRole: "admin" | "user"): Promise<void>;
  resetUnreadCount(threadId: number, forRole: "admin" | "user"): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Create user with password (for simple auth)
  async createUserWithPassword(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const result = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error("Category not found");
    }
    
    return result[0];
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.isActive, true)))
      .orderBy(asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const result = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
      
    if (!result || result.length === 0) {
      throw new Error("Product not found");
    }
    
    return result[0];
  }

  // Order operations
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    const [updatedOrder] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    // If status changed to DELIVERED, decrement stock for each item
    // We check if it wasn't already delivered to avoid double counting
    if (status.toUpperCase() === 'DELIVERED' && order && order.status.toUpperCase() !== 'DELIVERED') {
      const items = await this.getOrderItemsByOrder(id);
      for (const item of items) {
        if (item.productId) {
          await this.decrementProductStock(item.productId, item.quantity);
          
          // Record movement
          await this.recordStockMovement({
            productId: item.productId,
            type: 'OUT',
            reason: 'ORDER_DELIVERED',
            quantity: item.quantity,
            previousStock: 0, // Would need more queries to get exact
            newStock: 0,
            notes: `Order #${id} delivered`
          });
        }
      }
    }
    
    return updatedOrder;
  }

  async decrementProductStock(productId: number, quantity: number): Promise<void> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (product) {
      const newStock = Math.max(0, (product.stock || 0) - quantity);
      await db.update(products)
        .set({ stock: newStock })
        .where(eq(products.id, productId));
    }
  }

  async updateVendorRequirement(vendorId: number, liters: number): Promise<void> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
    if (vendor) {
      const currentCirculated = vendor.circulatedLiters || 0;
      const currentRequirement = vendor.requirementToday || 0;
      
      const newCirculated = currentCirculated + liters;
      const newRequirement = Math.max(0, currentRequirement - liters);
      
      await db.update(vendors)
        .set({ 
          circulatedLiters: newCirculated,
          requirementToday: newRequirement
        })
        .where(eq(vendors.id, vendorId));
    }
  }

  async recordStockMovement(movement: any): Promise<void> {
    // For now, log to console as the table doesn't exist in schema
    // In a real app, this would insert into a stock_movements table
    console.log("📦 Stock Movement Recorded:", movement);
  }

  async getOrdersForDelivery(deliveryPartnerId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.deliveryPartnerId, deliveryPartnerId))
      .orderBy(asc(orders.deliveryDate));
  }

  // Order items operations
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Milk subscription operations
  async getMilkSubscriptionByUser(userId: string): Promise<MilkSubscription | undefined> {
    const [subscription] = await db.select().from(milkSubscriptions)
      .where(and(eq(milkSubscriptions.userId, userId), eq(milkSubscriptions.status, "ACTIVE")));
    return subscription;
  }

  async createMilkSubscription(subscription: InsertMilkSubscription): Promise<MilkSubscription> {
    const [newSubscription] = await db.insert(milkSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateMilkSubscription(id: number, subscription: Partial<InsertMilkSubscription>): Promise<MilkSubscription> {
    const [updatedSubscription] = await db.update(milkSubscriptions)
      .set(subscription)
      .where(eq(milkSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Vendor operations
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(asc(vendors.businessName));
  }

  async getVendorByUser(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  // Delivery partner operations
  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    return await db.select().from(deliveryPartners);
  }

  async getDeliveryPartnerByUser(userId: string): Promise<DeliveryPartner | undefined> {
    const [partner] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.userId, userId));
    return partner;
  }

  async createDeliveryPartner(partner: InsertDeliveryPartner): Promise<DeliveryPartner> {
    const [newPartner] = await db.insert(deliveryPartners).values(partner).returning();
    return newPartner;
  }

  // Notification operations
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  // Cart operations
  async addToCart(userId: string, productId: number, quantity: number): Promise<CartItem> {
    // Get or create cart for user
    let userCart = await db.select().from(cart).where(eq(cart.userId, userId)).limit(1);
    let cartId: number;
    
    if (userCart.length === 0) {
      const [newCart] = await db.insert(cart).values({ userId }).returning();
      cartId = newCart.id;
    } else {
      cartId = userCart[0].id;
    }
    
    // Get product price
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if item already in cart
    const existingItem = await db.select().from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
      .limit(1);
    
    if (existingItem.length > 0) {
      // Update quantity
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: (existingItem[0].quantity || 0) + quantity })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db.insert(cartItems)
        .values({ cartId, productId, quantity, price: product.price })
        .returning();
      return newItem;
    }
  }
  
  async getCartItems(userId: string): Promise<any[]> {
    // Get user's cart
    const userCart = await db.select().from(cart).where(eq(cart.userId, userId)).limit(1);
    
    if (userCart.length === 0) {
      return [];
    }
    
    // Get cart items with product details
    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        productName: products.name,
        productImage: products.imageUrl,
        productUnit: products.unit
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, userCart[0].id));
    
    return items;
  }
  
  async clearCart(userId: string): Promise<void> {
    const userCart = await db.select().from(cart).where(eq(cart.userId, userId)).limit(1);
    
    if (userCart.length > 0) {
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
    }
  }
  
  // Inward log operations (deprecated - table removed from schema)
  async createInwardLog(inwardLog: any): Promise<any> {
    // Inward logs functionality deprecated - table not in active schema
    // Return empty object for backwards compatibility
    return {};
  }
  
  // Vendor approval
  async approveVendor(vendorId: number): Promise<Vendor> {
    const [updatedVendor] = await db.update(vendors)
      .set({ isVerified: true })
      .where(eq(vendors.id, vendorId))
      .returning();
    return updatedVendor;
  }
  
  // Admin order management
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  
  async assignDeliveryPartner(orderId: number, deliveryPartnerId: number): Promise<Order> {
    // Validate delivery partner exists and is available
    const [partner] = await db.select().from(deliveryPartners).where(
      and(eq(deliveryPartners.id, deliveryPartnerId), eq(deliveryPartners.isAvailable, true))
    );
    if (!partner) {
      throw new Error("Delivery partner not found or not available");
    }
    
    // Validate order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      throw new Error("Order not found");
    }
    
    const result = await db.update(orders)
      .set({ deliveryPartnerId })
      .where(eq(orders.id, orderId))
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error("Failed to update order");
    }
    
    return result[0];
  }
  
  async updateOrderPayment(orderId: number, paymentData: { paymentStatus?: string; paymentMethod?: string; paymentDate?: Date }): Promise<Order> {
    // Validate order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Validate payment status transitions if provided
    if (paymentData.paymentStatus) {
      const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validStatuses.includes(paymentData.paymentStatus)) {
        throw new Error("Invalid payment status");
      }
    }
    
    const result = await db.update(orders)
      .set(paymentData)
      .where(eq(orders.id, orderId))
      .returning();
      
    if (!result || result.length === 0) {
      throw new Error("Failed to update order payment");
    }
    
    return result[0];
  }
  
  // Driver management
  async addDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }
  
  async getDriversByVendor(vendorId: number): Promise<Driver[]> {
    return await db.select().from(drivers)
      .where(eq(drivers.vendorId, vendorId))
      .orderBy(desc(drivers.createdAt));
  }

  async getAllStockMovements(): Promise<any[]> {
    return [];
  }

  async getStockMovementsByProduct(productId: number): Promise<any[]> {
    return [];
  }
  
  // Customer management - get all customers
  async getAllCustomers(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, 'customer'))
      .orderBy(desc(users.createdAt));
  }
  
  // Subscription management - get all subscriptions
  async getAllSubscriptions(): Promise<(MilkSubscription & { user?: User })[]> {
    const allSubscriptions = await db.select().from(milkSubscriptions)
      .orderBy(desc(milkSubscriptions.createdAt));
    
    // Enrich with user data
    const enrichedSubscriptions = await Promise.all(
      allSubscriptions.map(async (sub) => {
        const user = sub.userId ? await this.getUser(sub.userId) : undefined;
        return { ...sub, user };
      })
    );
    
    return enrichedSubscriptions;
  }
  
  // Admin stats
  async getAdminStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    totalVendors: number;
    totalDeliveryPartners: number;
    lowStockProducts: number;
  }> {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const allVendors = await db.select().from(vendors);
    const allDeliveryPartners = await db.select().from(deliveryPartners);
    const allCustomers = await db.select().from(users).where(eq(users.role, 'customer'));
    
    const totalRevenue = allOrders.reduce((sum: number, order: any) => {
      return sum + (parseFloat(order.totalAmount) || 0);
    }, 0);
    
    const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').length;
    const completedOrders = allOrders.filter((o: any) => o.status === 'completed').length;
    const lowStockProducts = allProducts.filter((p: any) => p.stock && p.stock <= 50).length;
    
    return {
      totalOrders: allOrders.length,
      pendingOrders,
      completedOrders,
      totalRevenue: Math.round(totalRevenue),
      totalCustomers: allCustomers.length,
      totalProducts: allProducts.length,
      totalVendors: allVendors.length,
      totalDeliveryPartners: allDeliveryPartners.length,
      lowStockProducts,
    };
  }

  // Banner operations
  async getBanners(): Promise<any[]> {
    const { banners } = await import("@shared/schema");
    return await db.select().from(banners).orderBy(asc(banners.displayOrder));
  }

  async getActiveBanners(): Promise<any[]> {
    const { banners } = await import("@shared/schema");
    const now = new Date();
    return await db.select().from(banners).where(
      and(
        eq(banners.isActive, true),
        or(isNull(banners.startDate), lte(banners.startDate, now)),
        or(isNull(banners.endDate), gte(banners.endDate, now))
      )
    ).orderBy(asc(banners.displayOrder));
  }

  async createBanner(bannerData: any): Promise<any> {
    const { banners } = await import("@shared/schema");
    const [banner] = await db.insert(banners).values(bannerData).returning();
    return banner;
  }

  async updateBanner(id: number, bannerData: any): Promise<any> {
    const { banners } = await import("@shared/schema");
    const [banner] = await db.update(banners)
      .set({ ...bannerData, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: number): Promise<void> {
    const { banners } = await import("@shared/schema");
    await db.delete(banners).where(eq(banners.id, id));
  }

  // Homepage CMS operations
  async getEthosCards(): Promise<any[]> {
    const { ethosCards } = await import("@shared/schema");
    return await db.select().from(ethosCards).orderBy(asc(ethosCards.displayOrder));
  }

  async getActiveEthosCards(): Promise<any[]> {
    const { ethosCards } = await import("@shared/schema");
    return await db.select().from(ethosCards).where(eq(ethosCards.isActive, true)).orderBy(asc(ethosCards.displayOrder));
  }

  async getStatsCounters(): Promise<any[]> {
    const { statsCounters } = await import("@shared/schema");
    return await db.select().from(statsCounters).orderBy(asc(statsCounters.displayOrder));
  }

  async getActiveStatsCounters(): Promise<any[]> {
    const { statsCounters } = await import("@shared/schema");
    return await db.select().from(statsCounters).where(eq(statsCounters.isActive, true)).orderBy(asc(statsCounters.displayOrder));
  }

  async getFAQs(): Promise<any[]> {
    const { faqs } = await import("@shared/schema");
    return await db.select().from(faqs).orderBy(asc(faqs.displayOrder));
  }

  async getActiveFAQs(): Promise<any[]> {
    const { faqs } = await import("@shared/schema");
    return await db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(asc(faqs.displayOrder));
  }

  async getNewsletterSettings(): Promise<any | null> {
    const { newsletterSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(newsletterSettings).limit(1);
    return settings || null;
  }

  async getFooterSettings(): Promise<any | null> {
    const { footerSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(footerSettings).limit(1);
    return settings || null;
  }

  async updateNewsletterSettings(settingsData: any): Promise<any> {
    const { newsletterSettings } = await import("@shared/schema");
    const existing = await this.getNewsletterSettings();
    if (existing) {
      const [updated] = await db.update(newsletterSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(newsletterSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(newsletterSettings).values(settingsData).returning();
      return created;
    }
  }

  async updateFooterSettings(settingsData: any): Promise<any> {
    const { footerSettings } = await import("@shared/schema");
    const existing = await this.getFooterSettings();
    if (existing) {
      const [updated] = await db.update(footerSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(footerSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(footerSettings).values(settingsData).returning();
      return created;
    }
  }

  // CMS Settings operations
  async getAboutUsSettings(): Promise<any | null> {
    const { aboutUsSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(aboutUsSettings).limit(1);
    return settings || null;
  }

  async getContactSettings(): Promise<any | null> {
    const { contactSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(contactSettings).limit(1);
    return settings || null;
  }

  async getTermsOfServiceSettings(): Promise<any | null> {
    const { termsOfServiceSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(termsOfServiceSettings).limit(1);
    return settings || null;
  }

  async getPrivacyPolicySettings(): Promise<any | null> {
    const { privacyPolicySettings } = await import("@shared/schema");
    const [settings] = await db.select().from(privacyPolicySettings).limit(1);
    return settings || null;
  }

  async updateAboutUsSettings(settingsData: any): Promise<any> {
    const { aboutUsSettings } = await import("@shared/schema");
    const existing = await this.getAboutUsSettings();
    if (existing) {
      const [updated] = await db.update(aboutUsSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(aboutUsSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(aboutUsSettings).values(settingsData).returning();
      return created;
    }
  }

  async updateContactSettings(settingsData: any): Promise<any> {
    const { contactSettings } = await import("@shared/schema");
    const existing = await this.getContactSettings();
    if (existing) {
      const [updated] = await db.update(contactSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(contactSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(contactSettings).values(settingsData).returning();
      return created;
    }
  }

  async updateTermsOfServiceSettings(settingsData: any): Promise<any> {
    const { termsOfServiceSettings } = await import("@shared/schema");
    const existing = await this.getTermsOfServiceSettings();
    if (existing) {
      const [updated] = await db.update(termsOfServiceSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(termsOfServiceSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(termsOfServiceSettings).values(settingsData).returning();
      return created;
    }
  }

  async updatePrivacyPolicySettings(settingsData: any): Promise<any> {
    const { privacyPolicySettings } = await import("@shared/schema");
    const existing = await this.getPrivacyPolicySettings();
    if (existing) {
      const [updated] = await db.update(privacyPolicySettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(privacyPolicySettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(privacyPolicySettings).values(settingsData).returning();
      return created;
    }
  }

  async getSiteSettings(): Promise<any | null> {
    const { siteSettings } = await import("@shared/schema");
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings || null;
  }

  async updateSiteSettings(settingsData: any): Promise<any> {
    const { siteSettings } = await import("@shared/schema");
    const existing = await this.getSiteSettings();
    if (existing) {
      const [updated] = await db.update(siteSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(siteSettings).values(settingsData).returning();
      return created;
    }
  }

  // User Management Implementations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Password reset operations Implementations
  async createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [created] = await db.insert(passwordResetRequests).values(request).returning();
    return created;
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return await db.select().from(passwordResetRequests).orderBy(desc(passwordResetRequests.createdAt));
  }

  async getPasswordResetRequestById(id: number): Promise<PasswordResetRequest | undefined> {
    const [request] = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, id));
    return request;
  }

  async updatePasswordResetRequestStatus(id: number, status: string, resolvedAt?: Date): Promise<PasswordResetRequest> {
    const [updated] = await db.update(passwordResetRequests)
      .set({ status, resolvedAt })
      .where(eq(passwordResetRequests.id, id))
      .returning();
    return updated;
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [created] = await db.insert(passwordResetTokens).values(token).returning();
    return created;
  }

  async getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return token;
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
  }

  // Chat Support operations Implementations
  async getOrCreateChatThread(userId: string): Promise<ChatThread> {
    const [existing] = await db.select().from(chatThreads).where(eq(chatThreads.userId, userId));
    if (existing) {
      return existing;
    }
    const [created] = await db.insert(chatThreads).values({ userId, status: "pending" }).returning();
    return created;
  }

  async getChatThreadById(id: number): Promise<ChatThread | undefined> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    return thread;
  }

  async getChatThreads(): Promise<(ChatThread & { user?: User })[]> {
    const allThreads = await db.select().from(chatThreads).orderBy(desc(chatThreads.updatedAt));
    const threadsWithUser: (ChatThread & { user?: User })[] = [];
    for (const thread of allThreads) {
      const [user] = await db.select().from(users).where(eq(users.id, thread.userId));
      threadsWithUser.push({
        ...thread,
        user,
      });
    }
    return threadsWithUser;
  }

  async getChatMessages(threadId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.threadId, threadId)).orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    // Update lastMessage and updatedAt in thread
    await db.update(chatThreads)
      .set({ lastMessage: message.message, updatedAt: new Date() })
      .where(eq(chatThreads.id, message.threadId));
    return created;
  }

  async updateChatThreadStatus(id: number, status: string): Promise<ChatThread> {
    const [updated] = await db.update(chatThreads).set({ status }).where(eq(chatThreads.id, id)).returning();
    return updated;
  }

  async incrementUnreadCount(threadId: number, forRole: "admin" | "user"): Promise<void> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, threadId));
    if (thread) {
      if (forRole === "admin") {
        await db.update(chatThreads).set({ unreadForAdmin: thread.unreadForAdmin + 1 }).where(eq(chatThreads.id, threadId));
      } else {
        await db.update(chatThreads).set({ unreadForUser: thread.unreadForUser + 1 }).where(eq(chatThreads.id, threadId));
      }
    }
  }

  async resetUnreadCount(threadId: number, forRole: "admin" | "user"): Promise<void> {
    if (forRole === "admin") {
      await db.update(chatThreads).set({ unreadForAdmin: 0 }).where(eq(chatThreads.id, threadId));
    } else {
      await db.update(chatThreads).set({ unreadForUser: 0 }).where(eq(chatThreads.id, threadId));
    }
  }
}


export const storage = new DatabaseStorage();
