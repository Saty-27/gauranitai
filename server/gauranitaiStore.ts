import fs from "fs/promises";
import path from "path";
import type {
  AdminUser,
  Banner,
  Blog,
  BlogTopic,
  CareerApplication,
  CareerJob,
  Category,
  ChatMessage,
  ChatThread,
  CheckoutInput,
  CheckoutSummary,
  CustomerAccount,
  CustomerSession,
  Coupon,
  CustomerSummary,
  DashboardStats,
  Enquiry,
  Faq,
  GalleryItem,
  GauranitaiData,
  Lead,
  MediaImage,
  Order,
  OrderItem,
  Product,
  ProductReview,
  Service,
  SiteSettings,
  Testimonial,
  VideoItem,
} from "@shared/gauranitai";
import { createSeedData, serviceMediaByTitle, slugify } from "./gauranitaiSeed";

type CollectionMap = {
  services: Service;
  products: Product;
  blogs: Blog;
  blogTopics: BlogTopic;
  enquiries: Enquiry;
  leads: Lead;
  orders: Order;
  reviews: ProductReview;
  faqs: Faq;
  testimonials: Testimonial;
  banners: Banner;
  categories: Category;
  gallery: GalleryItem;
  videos: VideoItem;
  coupons: Coupon;
  careerJobs: CareerJob;
  careerApplications: CareerApplication;
  adminUsers: AdminUser;
};

type CollectionName = keyof CollectionMap;

const dataDirectory = path.resolve(process.cwd(), "server", "data");
const dataFile = path.join(dataDirectory, "gauranitai-data.json");
const placeholderVideoUrl = ["https://www.youtube.com/watch?v=", "d", "Qw4", "w9", "Wg", "XcQ"].join("");

async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(createSeedData(), null, 2), "utf-8");
  }
}

function nextId(rows: Array<{ id: number }>) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

function withTimestamps<T extends object>(value: T, isCreate: boolean) {
  const stamp = new Date().toISOString();
  return {
    ...value,
    ...(isCreate ? { createdAt: stamp } : {}),
    updatedAt: stamp,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePhone(value = "") {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function customerKeyFrom(name = "", phone = "", email = "") {
  const phoneDigits = normalizePhone(phone);
  if (phoneDigits) return `phone:${phoneDigits}`;
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) return `email:${normalizedEmail}`;
  return `name:${name.trim().toLowerCase() || "customer"}`;
}

function findCustomerAccount(data: GauranitaiData, name = "", phone = "", email = "") {
  const phoneDigits = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const key = customerKeyFrom(name, phone, email);
  return data.customers.find((customer) => {
    const matchesPhone = phoneDigits && normalizePhone(customer.phone) === phoneDigits;
    const matchesEmail = normalizedEmail && normalizeEmail(customer.email) === normalizedEmail;
    return matchesPhone || matchesEmail || customer.customerKey === key;
  });
}

function upsertCustomerAccount(data: GauranitaiData, payload: { name?: string; customerName?: string; phone?: string; email?: string }, patch: Partial<CustomerAccount> = {}) {
  const stamp = new Date().toISOString();
  const customerName = String(payload.customerName || payload.name || "Customer").trim() || "Customer";
  const phone = normalizePhone(payload.phone || "");
  const email = normalizeEmail(payload.email || "");
  const existing = findCustomerAccount(data, customerName, phone, email);

  if (existing) {
    existing.customerName = customerName || existing.customerName;
    existing.phone = phone || existing.phone;
    existing.email = email || existing.email;
    existing.customerKey = customerKeyFrom(existing.customerName, existing.phone, existing.email);
    Object.assign(existing, patch, { updatedAt: stamp });
    return existing;
  }

  const customer: CustomerAccount = {
    id: nextId(data.customers),
    customerKey: customerKeyFrom(customerName, phone, email),
    customerName,
    phone,
    email,
    isLoggedIn: false,
    isBlocked: false,
    blockReason: "",
    adminNotes: "",
    lastLoginAt: "",
    lastLogoutAt: "",
    createdAt: stamp,
    updatedAt: stamp,
    ...patch,
  };
  data.customers.unshift(customer);
  return customer;
}

function assertCustomerNotBlocked(data: GauranitaiData, name = "", phone = "", email = "") {
  const customer = findCustomerAccount(data, name, phone, email);
  if (customer?.isBlocked) {
    throw new Error(customer.blockReason || "This customer account is blocked. Please contact Gauranitai support.");
  }
}

function removePlaceholderVideoUrls<T extends Record<string, any>>(rows: T[] = []) {
  return rows.map((row) => {
    const next: Record<string, any> = { ...row };
    const hasPlaceholder = next["youtubeUrl"] === placeholderVideoUrl || next["videoUrl"] === placeholderVideoUrl;
    if (next["youtubeUrl"] === placeholderVideoUrl) next["youtubeUrl"] = "";
    if (next["videoUrl"] === placeholderVideoUrl) next["videoUrl"] = "";
    if (hasPlaceholder && "youtubeUrl" in next && "videoType" in next) next["videoType"] = "none";
    return next as T;
  });
}

function isYoutubeThumbnail(url = "") {
  return url.includes("i.ytimg.com") || url.includes("img.youtube.com");
}

function applyCuratedServiceMedia(services: Service[] = []) {
  return services.map((service) => {
    const media = serviceMediaByTitle[service.title];
    if (!media || !isYoutubeThumbnail(service.coverImage)) return service;
    const urls = Array.from(new Set([media.coverImage, ...media.gallery])).slice(0, 3);
    return {
      ...service,
      coverImage: media.coverImage,
      images: urls.map((url, index): MediaImage => {
        const type: MediaImage["type"] = index === 0 ? "cover" : index === 1 ? "gallery" : "beforeAfter";
        return {
          id: index + 1,
          url,
          title: index === 0 ? `${service.title} cover` : `${service.title} image ${index + 1}`,
          altText: index === 0 ? `${service.title} service cover image` : `${service.title} service work image ${index + 1}`,
          caption: service.shortDescription,
          type,
          sortOrder: index + 1,
        };
      }),
      openGraphImage: media.coverImage,
    };
  });
}

function enrichOrdersWithProductImages(orders: Order[] = [], products: Product[] = []) {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const product = products.find((row) => row.id === item.productId);
      return {
        ...item,
        productImage: item.productImage || product?.coverImage || product?.images?.[0]?.url || "",
      };
    }),
  }));
}

function mergeData(raw: Partial<GauranitaiData>): GauranitaiData {
  const seed = createSeedData();
  const merged = {
    ...seed,
    ...raw,
    products: raw.products?.[0] && "mainPrice" in raw.products[0] ? raw.products as Product[] : seed.products,
    services: raw.services?.[0] && "startingPrice" in raw.services[0] ? raw.services as Service[] : seed.services,
    categories: raw.categories?.[0] && "slug" in raw.categories[0] ? raw.categories as Category[] : seed.categories,
    blogs: raw.blogs?.[0] && "featuredImage" in raw.blogs[0] ? raw.blogs as Blog[] : seed.blogs,
    blogTopics: raw.blogTopics?.[0] && "title" in raw.blogTopics[0] ? raw.blogTopics as BlogTopic[] : seed.blogTopics,
    enquiries: raw.enquiries || [],
    leads: raw.leads || [],
    orders: raw.orders || [],
    reviews: raw.reviews || [],
    faqs: raw.faqs?.[0] && "isActive" in raw.faqs[0] ? raw.faqs as Faq[] : seed.faqs,
    testimonials: raw.testimonials?.[0] && "isActive" in raw.testimonials[0] ? raw.testimonials as Testimonial[] : seed.testimonials,
    banners: raw.banners?.[0] && "isActive" in raw.banners[0] ? raw.banners as Banner[] : seed.banners,
    gallery: raw.gallery || seed.gallery,
    videos: raw.videos || seed.videos,
    coupons: raw.coupons || seed.coupons,
    careerJobs: raw.careerJobs?.[0] && "title" in raw.careerJobs[0] ? raw.careerJobs as CareerJob[] : seed.careerJobs,
    careerApplications: raw.careerApplications || [],
    adminUsers: raw.adminUsers || seed.adminUsers,
    customers: raw.customers || [],
    chatThreads: raw.chatThreads || [],
    chatMessages: raw.chatMessages || [],
    settings: {
      ...seed.settings,
      ...(raw.settings || {}),
      contact: { ...seed.settings.contact, ...(raw.settings?.contact || {}) },
      payment: { ...seed.settings.payment, ...(raw.settings?.payment || {}) },
      taxDelivery: { ...seed.settings.taxDelivery, ...(raw.settings?.taxDelivery || {}) },
      seo: { ...seed.settings.seo, ...(raw.settings?.seo || {}) },
    },
  };
  return {
    ...merged,
    products: removePlaceholderVideoUrls(merged.products) as Product[],
    services: applyCuratedServiceMedia(removePlaceholderVideoUrls(merged.services) as Service[]),
    videos: removePlaceholderVideoUrls(merged.videos) as VideoItem[],
    orders: enrichOrdersWithProductImages(merged.orders, merged.products),
    chatThreads: merged.chatThreads || [],
    chatMessages: merged.chatMessages || [],
  };
}

export class GauranitaiStore {
  async read(): Promise<GauranitaiData> {
    await ensureDataFile();
    const raw = JSON.parse(await fs.readFile(dataFile, "utf-8")) as Partial<GauranitaiData>;
    const data = mergeData(raw);
    await this.write(data);
    return data;
  }

  async write(data: GauranitaiData) {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
  }

  async reset() {
    const data = createSeedData();
    await this.write(data);
    return data;
  }

  async customerLogin(payload: Partial<CustomerSession> & { orderNumber?: string }): Promise<CustomerSession> {
    const data = await this.read();
    const phone = normalizePhone(payload.phone || "");
    const email = normalizeEmail(payload.email || "");
    const orderNumber = String(payload.orderNumber || "").trim().toLowerCase();
    const matchingOrder = data.orders.find((order) => {
      const matchesPhone = phone && normalizePhone(order.phone) === phone;
      const matchesEmail = email && normalizeEmail(order.email) === email;
      const matchesOrder = orderNumber && order.orderNumber.toLowerCase() === orderNumber;
      return matchesPhone || matchesEmail || matchesOrder;
    });
    const session: CustomerSession = {
      name: String(payload.name || matchingOrder?.customerName || "Customer").trim(),
      phone: phone || normalizePhone(matchingOrder?.phone || ""),
      email: email || normalizeEmail(matchingOrder?.email || ""),
    };
    if (!session.phone && !session.email) throw new Error("Enter phone number or email to login");
    assertCustomerNotBlocked(data, session.name, session.phone, session.email);
    const stamp = new Date().toISOString();
    upsertCustomerAccount(data, session, {
      isLoggedIn: true,
      lastLoginAt: stamp,
      updatedAt: stamp,
    });
    await this.write(data);
    return session;
  }

  async customerLogout(customer: CustomerSession): Promise<void> {
    const data = await this.read();
    const account = findCustomerAccount(data, customer.name, customer.phone, customer.email);
    if (account) {
      const stamp = new Date().toISOString();
      account.isLoggedIn = false;
      account.lastLogoutAt = stamp;
      account.updatedAt = stamp;
      await this.write(data);
    }
  }

  async ensureCustomerAllowed(customer: CustomerSession): Promise<void> {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
  }

  async customerOrders(customer: CustomerSession): Promise<Order[]> {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    return data.orders
      .filter((order) => {
        const matchesPhone = phone && normalizePhone(order.phone) === phone;
        const matchesEmail = email && normalizeEmail(order.email) === email;
        return matchesPhone || matchesEmail;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getOrCreateChatThread(customer: CustomerSession): Promise<ChatThread> {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    const existing = data.chatThreads.find((thread) => {
      const matchesPhone = phone && normalizePhone(thread.phone) === phone;
      const matchesEmail = email && normalizeEmail(thread.email) === email;
      return matchesPhone || matchesEmail;
    });
    if (existing) return existing;

    const stamp = new Date().toISOString();
    const thread: ChatThread = {
      id: nextId(data.chatThreads),
      customerName: customer.name || "Customer",
      phone,
      email,
      status: "Open",
      lastMessage: "",
      lastSender: "system",
      unreadForAdmin: 0,
      unreadForUser: 0,
      createdAt: stamp,
      updatedAt: stamp,
    };
    data.chatThreads.unshift(thread);
    await this.write(data);
    return thread;
  }

  async listChatThreads(): Promise<ChatThread[]> {
    const data = await this.read();
    return [...data.chatThreads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getChatThread(threadId: number): Promise<ChatThread | undefined> {
    const data = await this.read();
    return data.chatThreads.find((thread) => thread.id === threadId);
  }

  async chatMessages(threadId: number): Promise<ChatMessage[]> {
    const data = await this.read();
    return data.chatMessages
      .filter((message) => message.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addChatMessage(threadId: number, senderType: ChatMessage["senderType"], senderName: string, message: string): Promise<{ thread: ChatThread; message: ChatMessage }> {
    const text = message.trim();
    if (!text) throw new Error("Message is required");
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) throw new Error("Chat thread not found");

    const stamp = new Date().toISOString();
    const chatMessage: ChatMessage = {
      id: nextId(data.chatMessages),
      threadId,
      senderType,
      senderName,
      message: text,
      createdAt: stamp,
    };
    data.chatMessages.push(chatMessage);
    thread.lastMessage = text;
    thread.lastSender = senderType;
    thread.status = "Open";
    thread.updatedAt = stamp;
    if (senderType === "user") thread.unreadForAdmin += 1;
    if (senderType === "admin") thread.unreadForUser += 1;
    await this.write(data);
    return { thread, message: chatMessage };
  }

  async markChatRead(threadId: number, side: "admin" | "user"): Promise<ChatThread | undefined> {
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) return undefined;
    if (side === "admin") thread.unreadForAdmin = 0;
    if (side === "user") thread.unreadForUser = 0;
    thread.updatedAt = new Date().toISOString();
    await this.write(data);
    return thread;
  }

  async updateChatStatus(threadId: number, status: ChatThread["status"]): Promise<ChatThread | undefined> {
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) return undefined;
    thread.status = status;
    thread.updatedAt = new Date().toISOString();
    await this.write(data);
    return thread;
  }

  async list<K extends CollectionName>(collection: K): Promise<Array<CollectionMap[K]>> {
    const data = await this.read();
    return data[collection] as Array<CollectionMap[K]>;
  }

  async listActive<K extends CollectionName>(collection: K): Promise<Array<CollectionMap[K]>> {
    const rows = await this.list(collection);
    return rows.filter((row: any) => row.isActive === true || row.status === "published");
  }

  async getById<K extends CollectionName>(collection: K, id: number): Promise<CollectionMap[K] | undefined> {
    const rows = await this.list(collection);
    return rows.find((row) => row.id === id);
  }

  async getBySlug<K extends "services" | "products" | "blogs" | "careerJobs">(collection: K, slug: string): Promise<CollectionMap[K] | undefined> {
    const rows = await this.list(collection);
    return rows.find((row: any) => row.slug === slug);
  }

  async create<K extends CollectionName>(collection: K, payload: Partial<CollectionMap[K]>): Promise<CollectionMap[K]> {
    const data = await this.read();
    const rows = data[collection] as Array<any>;
    const id = nextId(rows);
    const sourceName = String((payload as any).title || (payload as any).name || (payload as any).code || `${collection}-${id}`);
    const row = withTimestamps(
      {
        ...payload,
        id,
        slug: (payload as any).slug || (["services", "products", "blogs", "categories", "careerJobs"].includes(collection) ? slugify(sourceName) : undefined),
        isActive: (payload as any).isActive ?? true,
        status: (payload as any).status || (collection === "blogs" ? "draft" : undefined),
      },
      true,
    );

    rows.unshift(row);
    await this.write(data);
    return row as unknown as CollectionMap[K];
  }

  async update<K extends CollectionName>(collection: K, id: number, payload: Partial<CollectionMap[K]>): Promise<CollectionMap[K] | undefined> {
    const data = await this.read();
    const rows = data[collection] as Array<any>;
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return undefined;

    const sourceName = String((payload as any).title || (payload as any).name || rows[index].title || rows[index].name || rows[index].code || "");
    const updated = withTimestamps(
      {
        ...rows[index],
        ...payload,
        slug: (payload as any).slug || rows[index].slug || (sourceName ? slugify(sourceName) : undefined),
      },
      false,
    );

    rows[index] = updated;
    await this.write(data);
    return updated as CollectionMap[K];
  }

  async remove<K extends CollectionName>(collection: K, id: number): Promise<boolean> {
    const data = await this.read();
    const rows = data[collection] as Array<any>;
    const nextRows = rows.filter((row) => row.id !== id);
    if (nextRows.length === rows.length) return false;
    (data as any)[collection] = nextRows;
    await this.write(data);
    return true;
  }

  async findAdmin(email: string, password: string): Promise<AdminUser | undefined> {
    const users = await this.list("adminUsers");
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password && user.isActive);
  }

  async createEnquiry(payload: Partial<Enquiry>): Promise<Enquiry> {
    const enquiry = await this.create("enquiries", {
      name: payload.name || "",
      phone: payload.phone || "",
      email: payload.email || "",
      serviceRequired: payload.serviceRequired || "",
      productRequired: payload.productRequired || "",
      address: payload.address || "",
      message: payload.message || "",
      adminNotes: "",
      status: "New",
    });

    await this.createLead({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      requirementType: enquiry.serviceRequired ? "Service" : enquiry.productRequired ? "Product" : "General",
      productRequired: enquiry.productRequired,
      serviceRequired: enquiry.serviceRequired,
      address: enquiry.address,
      message: enquiry.message,
      source: "website",
    });

    return enquiry;
  }

  async createLead(payload: Partial<Lead>): Promise<Lead> {
    const data = await this.read();
    const id = nextId(data.leads);
    const stamp = new Date().toISOString();
    const lead: Lead = {
      id,
      leadNumber: `LEAD-${String(id).padStart(5, "0")}`,
      name: payload.name || "",
      phone: payload.phone || "",
      email: payload.email || "",
      companyName: payload.companyName || "",
      requirementType: payload.requirementType || "General",
      productRequired: payload.productRequired || "",
      serviceRequired: payload.serviceRequired || "",
      message: payload.message || "",
      address: payload.address || "",
      floorType: payload.floorType || "",
      approxAreaSqFt: payload.approxAreaSqFt || "",
      preferredDate: payload.preferredDate || "",
      preferredTime: payload.preferredTime || "",
      source: payload.source || "website",
      status: payload.status || "New",
      priority: payload.priority || "Medium",
      assignedTo: payload.assignedTo || "",
      followUpDate: payload.followUpDate || "",
      adminNotes: payload.adminNotes || "",
      attachments: payload.attachments || [],
      timeline: [{ date: stamp, note: "Lead created" }],
      createdAt: stamp,
      updatedAt: stamp,
    };
    data.leads.unshift(lead);
    await this.write(data);
    return lead;
  }

  syncCustomerAccounts(data: GauranitaiData) {
    for (const order of data.orders) {
      upsertCustomerAccount(data, {
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
      });
    }
  }

  buildCustomers(data: GauranitaiData): CustomerSummary[] {
    this.syncCustomerAccounts(data);
    const customerMap = new Map<string, CustomerSummary>();

    for (const account of data.customers) {
      customerMap.set(account.customerKey, {
        id: account.id,
        customerKey: account.customerKey,
        customerName: account.customerName,
        phone: account.phone,
        email: account.email,
        isLoggedIn: account.isLoggedIn,
        isBlocked: account.isBlocked,
        blockReason: account.blockReason,
        adminNotes: account.adminNotes,
        lastLoginAt: account.lastLoginAt,
        lastLogoutAt: account.lastLogoutAt,
        orderCount: 0,
        totalSpend: 0,
        averageOrderValue: 0,
        firstOrderDate: "",
        lastOrderDate: "",
        lastOrderNumber: "",
        lastOrderStatus: "",
        lastOrderTotal: 0,
        city: "",
        state: "",
        orders: [],
      });
    }

    for (const order of data.orders) {
      const account = findCustomerAccount(data, order.customerName, order.phone, order.email) || upsertCustomerAccount(data, {
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
      });
      const key = account.customerKey;
      const current = customerMap.get(key) || {
        id: account.id,
        customerKey: key,
        customerName: account.customerName,
        phone: account.phone,
        email: account.email,
        isLoggedIn: account.isLoggedIn,
        isBlocked: account.isBlocked,
        blockReason: account.blockReason,
        adminNotes: account.adminNotes,
        lastLoginAt: account.lastLoginAt,
        lastLogoutAt: account.lastLogoutAt,
        orderCount: 0,
        totalSpend: 0,
        averageOrderValue: 0,
        firstOrderDate: "",
        lastOrderDate: "",
        lastOrderNumber: "",
        lastOrderStatus: "",
        lastOrderTotal: 0,
        city: "",
        state: "",
        orders: [],
      };

      current.customerName = account.customerName || order.customerName;
      current.phone = account.phone || order.phone;
      current.email = account.email || order.email;
      current.orderCount += 1;
      current.totalSpend = round(current.totalSpend + order.totalAmount);
      current.firstOrderDate = !current.firstOrderDate || order.createdAt < current.firstOrderDate ? order.createdAt : current.firstOrderDate;
      current.orders.push(order);
      if (!current.lastOrderDate || order.createdAt > current.lastOrderDate) {
        current.lastOrderDate = order.createdAt;
        current.lastOrderNumber = order.orderNumber;
        current.lastOrderStatus = order.orderStatus;
        current.lastOrderTotal = order.totalAmount;
        current.city = order.city;
        current.state = order.state;
      }
      customerMap.set(key, current);
    }

    return Array.from(customerMap.values())
      .map((customer) => ({
        ...customer,
        totalSpend: round(customer.totalSpend),
        averageOrderValue: customer.orderCount ? round(customer.totalSpend / customer.orderCount) : 0,
        orders: customer.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
      .sort((a, b) => {
        const aDate = a.lastOrderDate || a.lastLoginAt || a.lastLogoutAt || "";
        const bDate = b.lastOrderDate || b.lastLoginAt || b.lastLogoutAt || "";
        return bDate.localeCompare(aDate);
      });
  }

  async listCustomers(): Promise<CustomerSummary[]> {
    const data = await this.read();
    const customers = this.buildCustomers(data);
    await this.write(data);
    return customers;
  }

  async updateCustomerAccess(id: number, payload: { isBlocked?: boolean; blockReason?: string; adminNotes?: string }): Promise<CustomerSummary | undefined> {
    const data = await this.read();
    this.syncCustomerAccounts(data);
    const account = data.customers.find((customer) => customer.id === id);
    if (!account) return undefined;
    const stamp = new Date().toISOString();
    if (typeof payload.isBlocked === "boolean") {
      account.isBlocked = payload.isBlocked;
      if (payload.isBlocked) account.isLoggedIn = false;
      account.blockReason = payload.isBlocked ? String(payload.blockReason || account.blockReason || "Blocked by admin") : "";
    }
    if (payload.adminNotes !== undefined) account.adminNotes = String(payload.adminNotes || "");
    account.updatedAt = stamp;
    await this.write(data);
    return this.buildCustomers(data).find((customer) => customer.id === id);
  }

  async createProductReview(payload: Partial<ProductReview> & { orderNumber?: string }): Promise<ProductReview> {
    const data = await this.read();
    const orderNumber = String(payload.orderNumber || "").trim().toLowerCase();
    const phoneDigits = String(payload.phone || "").replace(/\D/g, "");
    const email = String(payload.email || "").trim().toLowerCase();
    const order = data.orders.find((row) => {
      const matchesOrder = row.orderNumber.toLowerCase() === orderNumber;
      const matchesPhone = phoneDigits && row.phone.replace(/\D/g, "") === phoneDigits;
      const matchesEmail = email && row.email.toLowerCase() === email;
      return matchesOrder && (matchesPhone || matchesEmail);
    });
    if (!order) throw new Error("Order not found for this customer.");
    if (order.orderStatus !== "Delivered") throw new Error("Reviews can be submitted after the order is delivered.");

    const productId = Number(payload.productId || 0);
    const item = order.items.find((row) => row.productId === productId);
    if (!item) throw new Error("This product is not part of the selected order.");

    const alreadyReviewed = data.reviews.some((review) => review.orderId === order.id && review.productId === productId);
    if (alreadyReviewed) throw new Error("Review already submitted for this product and order.");

    const rating = Math.min(5, Math.max(1, Number(payload.rating || 5)));
    const stamp = new Date().toISOString();
    const review: ProductReview = {
      id: nextId(data.reviews),
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId,
      productName: item.productName,
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      rating,
      review: String(payload.review || "").trim(),
      status: "Pending",
      adminNotes: "",
      createdAt: stamp,
      updatedAt: stamp,
    };

    data.reviews.unshift(review);
    await this.write(data);
    return review;
  }

  calculateSummary(data: GauranitaiData, input: Pick<CheckoutInput, "items" | "couponCode">): CheckoutSummary {
    const subtotal = input.items.reduce((sum, item) => {
      const product = data.products.find((row) => row.id === item.productId);
      return product ? sum + product.discountPrice * item.quantity : sum;
    }, 0);
    const gstAmount = input.items.reduce((sum, item) => {
      const product = data.products.find((row) => row.id === item.productId);
      return product ? sum + product.discountPrice * item.quantity * (product.gstPercentage / 100) : sum;
    }, 0);
    const deliverySettings = data.settings.taxDelivery;
    const deliverySlabStart = Math.max(0, Number(deliverySettings.minimumOrderAmount || 500));
    let deliveryCharge = deliverySettings.deliveryCharge;
    if (deliverySettings.freeDeliveryAbove > 0 && subtotal >= deliverySettings.freeDeliveryAbove) {
      deliveryCharge = 0;
    } else if (subtotal < deliverySlabStart) {
      deliveryCharge = deliverySettings.deliveryChargeBelow500;
    } else {
      deliveryCharge = deliverySettings.deliveryChargeAbove500 || deliverySettings.deliveryCharge;
    }

    const coupon = input.couponCode
      ? data.coupons.find((row) => row.code.toLowerCase() === input.couponCode?.toLowerCase() && row.isActive)
      : undefined;
    let couponDiscount = 0;
    if (coupon && subtotal >= coupon.minimumOrder) {
      couponDiscount = coupon.discountType === "flat" ? coupon.discountValue : subtotal * (coupon.discountValue / 100);
      couponDiscount = Math.min(couponDiscount, coupon.maximumDiscount || couponDiscount);
    }

    const totalAmount = Math.max(0, subtotal + gstAmount + deliveryCharge - couponDiscount);
    const canCheckout = input.items.length > 0;
    return {
      subtotal: round(subtotal),
      gstAmount: round(gstAmount),
      deliveryCharge: round(deliveryCharge),
      couponDiscount: round(couponDiscount),
      totalAmount: round(totalAmount),
      minimumOrderAmount: data.settings.taxDelivery.minimumOrderAmount,
      freeDeliveryAbove: data.settings.taxDelivery.freeDeliveryAbove,
      canCheckout,
      message: canCheckout ? "Ready for checkout" : "Please add products to continue.",
    };
  }

  async checkoutSummary(input: Pick<CheckoutInput, "items" | "couponCode">): Promise<CheckoutSummary> {
    return this.calculateSummary(await this.read(), input);
  }

  async createOrder(input: CheckoutInput): Promise<Order> {
    const data = await this.read();
    if (!input.items.length) throw new Error("Cart is empty");
    if (input.paymentMethod !== "COD") throw new Error("Only COD payment is available right now");
    assertCustomerNotBlocked(data, input.customerName, input.phone, input.email);

    for (const item of input.items) {
      const product = data.products.find((row) => row.id === item.productId);
      if (!product) throw new Error("Product not found");
      if (!product.isActive) throw new Error(`${product.name} is inactive`);
      if (item.quantity < product.minimumOrderQuantity) throw new Error(`Minimum quantity for ${product.name} is ${product.minimumOrderQuantity}`);
      if (item.quantity > product.stock) throw new Error(`${product.name} has only ${product.stock} units available`);
    }

    const summary = this.calculateSummary(data, input);
    if (!summary.canCheckout) throw new Error(summary.message);

    const id = nextId(data.orders);
    const stamp = new Date().toISOString();
    const orderItems: OrderItem[] = input.items.map((item, index) => {
      const product = data.products.find((row) => row.id === item.productId)!;
      const itemSubtotal = product.discountPrice * item.quantity;
      const gstAmount = round(itemSubtotal * (product.gstPercentage / 100));
      return {
        id: index + 1,
        orderId: id,
        productId: product.id,
        productName: product.name,
        productImage: product.coverImage || product.images?.[0]?.url || "",
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.mainPrice,
        discountPrice: product.discountPrice,
        gstPercentage: product.gstPercentage,
        gstAmount,
        deliveryCharge: 0,
        totalPrice: round(itemSubtotal + gstAmount),
      };
    });

    const stockDeductionLog = input.items.map((item) => {
      const product = data.products.find((row) => row.id === item.productId)!;
      product.stock -= item.quantity;
      return { productId: product.id, sku: product.sku, quantity: item.quantity, date: stamp };
    });

    const order: Order = {
      id,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      items: orderItems,
      subtotal: summary.subtotal,
      gstAmount: summary.gstAmount,
      deliveryCharge: summary.deliveryCharge,
      couponCode: input.couponCode || "",
      couponDiscount: summary.couponDiscount,
      totalAmount: summary.totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "COD" ? "COD" : "Manual verification pending",
      orderStatus: "Pending",
      orderNotes: input.orderNotes || "",
      adminNotes: "",
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`,
      stockDeductionLog,
      createdAt: stamp,
      updatedAt: stamp,
    };

    data.orders.unshift(order);
    upsertCustomerAccount(data, {
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
    });
    await this.write(data);
    return order;
  }

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const data = await this.read();
    data.settings = {
      ...data.settings,
      ...settings,
      contact: { ...data.settings.contact, ...(settings.contact || {}) },
      payment: { ...data.settings.payment, ...(settings.payment || {}) },
      taxDelivery: { ...data.settings.taxDelivery, ...(settings.taxDelivery || {}) },
      seo: { ...data.settings.seo, ...(settings.seo || {}) },
    };
    await this.write(data);
    return data.settings;
  }

  async dashboardStats(): Promise<DashboardStats> {
    const data = await this.read();
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    const latestEnquiries = [...data.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const latestLeads = [...data.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const latestOrders = [...data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const latestReviews = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const latestServiceBookings = data.leads
      .filter((row) => row.requirementType === "Service")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
    const latestProductEnquiries = data.leads
      .filter((row) => row.requirementType === "Product")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
    const recentCustomers = this.buildCustomers(data).slice(0, 10);

    return {
      totalServices: data.services.length,
      totalProducts: data.products.length,
      totalOrders: data.orders.length,
      newOrders: data.orders.filter((row) => row.orderStatus === "Confirmed" || row.orderStatus === "Pending").length,
      pendingOrders: data.orders.filter((row) => ["Pending", "Confirmed"].includes(row.orderStatus)).length,
      processingOrders: data.orders.filter((row) => row.orderStatus === "Processing").length,
      upcomingDeliveryOrders: data.orders.filter((row) => ["Upcoming Delivery", "Shipped"].includes(row.orderStatus)).length,
      deliveredOrders: data.orders.filter((row) => row.orderStatus === "Delivered").length,
      cancelledOrders: data.orders.filter((row) => row.orderStatus === "Cancelled").length,
      totalLeads: data.leads.length,
      totalProductEnquiries: data.leads.filter((row) => row.requirementType === "Product").length,
      totalServiceBookings: data.leads.filter((row) => row.requirementType === "Service").length,
      newLeads: data.leads.filter((row) => row.status === "New").length,
      pendingFollowUps: data.leads.filter((row) => row.status === "Follow-up").length,
      totalReviews: data.reviews.length,
      pendingReviews: data.reviews.filter((row) => row.status === "Pending").length,
      revenueToday: round(data.orders.filter((row) => row.createdAt.startsWith(today)).reduce((sum, row) => sum + row.totalAmount, 0)),
      monthlyRevenue: round(data.orders.filter((row) => row.createdAt.startsWith(month)).reduce((sum, row) => sum + row.totalAmount, 0)),
      lowStockProducts: data.products.filter((row) => row.stock > 0 && row.stock <= row.lowStockAlert).length,
      outOfStockProducts: data.products.filter((row) => row.stock <= 0).length,
      publishedBlogs: data.blogs.filter((row) => row.status === "published").length,
      latestEnquiries,
      latestLeads,
      latestOrders,
      latestReviews,
      latestServiceBookings,
      latestProductEnquiries,
      recentCustomers,
      productStockOverview: data.products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        unit: product.unit,
        lowStockAlert: product.lowStockAlert,
      })),
    };
  }
}

export const gauranitaiStore = new GauranitaiStore();
