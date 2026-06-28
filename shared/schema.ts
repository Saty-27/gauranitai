import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  address: text("address"),
  gender: varchar("gender"),
  dob: date("dob"),
  role: varchar("role").notNull().default("customer"), // customer, admin, marketing_staff
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// New Floor Care & Marble Polishing Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  category: varchar("category").notNull(), // References categories.name or custom category
  sku: varchar("sku").unique().notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  unit: varchar("unit"), // 1L, 5L, etc.
  stock: integer("stock").default(0),
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  benefits: text("benefits"), // Bullet points
  usageInstructions: text("usage_instructions"),
  suitableSurfaces: text("suitable_surfaces"),
  safetyInstructions: text("safety_instructions"),
  images: jsonb("images").default([]), // Array of image URLs
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  status: varchar("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Floor Care & Marble Polishing Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  category: varchar("category").notNull(), // Marble Polishing, Floor Cleaning, etc.
  shortDescription: text("short_description"),
  fullDescription: text("full_description"),
  benefits: jsonb("benefits").default([]), // Array of benefits/bullet points
  processSteps: jsonb("process_steps").default([]), // Array of steps: { step: number, title: string, desc: string }
  suitableFor: text("suitable_for"), // Marble, Granite, Tiles etc.
  image: varchar("image"),
  faqs: jsonb("faqs").default([]), // Array of FAQs: { q: string, a: string }
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  status: varchar("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog System
export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  category: varchar("category").notNull(),
  image: varchar("image"),
  shortDescription: text("short_description").notNull(),
  content: text("content").notNull(),
  author: varchar("author").default("Gauranitai Experts"),
  tags: jsonb("tags").default([]), // Array of strings
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  status: varchar("status").notNull().default("Draft"), // Draft, Published
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEO Blog Topic Suggestions (300-400 topics for admin panel reference)
export const blogTopicsSuggestions = pgTable("blog_topics_suggestions", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  category: varchar("category").notNull(),
  focusKeywords: text("focus_keywords"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enquiry / Booking Schema
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  serviceRequired: varchar("service_required"), // If service enquiry
  productRequired: varchar("product_required"), // If product purchase enquiry
  address: text("address"),
  message: text("message"),
  status: varchar("status").notNull().default("New"), // New, Contacted, In Progress, Completed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart tables
export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => cart.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity"),
  price: decimal("price", { precision: 10, scale: 2 }),
  addedAt: timestamp("added_at").defaultNow(),
});

// Addresses for users
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // home, work, other
  address: text("address").notNull(),
  landmark: varchar("landmark"),
  city: varchar("city"),
  state: varchar("state"),
  pincode: varchar("pincode"),
  phone: varchar("phone"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Homepage Banners - Admin managed hero carousel
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title"),
  subtitle: text("subtitle"),
  imageUrl: varchar("image_url"),
  imageUrlTablet: varchar("image_url_tablet"),
  imageUrlMobile: varchar("image_url_mobile"),
  ctaText: varchar("cta_text"),
  ctaLink: varchar("cta_link"),
  badgeText: varchar("badge_text"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  showOverlay: boolean("show_overlay").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQs - Frequently Asked Questions
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull().default("General"),
  question: varchar("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").default(0),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter Settings
export const newsletterSettings = pgTable("newsletter_settings", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull().default("Subscribe to Floor Care Tips"),
  subtitle: text("subtitle"),
  ctaText: varchar("cta_text").default("Subscribe"),
  placeholderText: varchar("placeholder_text").default("Enter your email address"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Footer Settings
export const footerSettings = pgTable("footer_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").default("Gauranitai"),
  tagline: varchar("tagline").default("Professional Polishing & Floor Deep Cleaning"),
  description: text("description"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  socialLinks: jsonb("social_links"), // { facebook: "url", instagram: "url" }
  footerLinks: jsonb("footer_links"), // { services: [...], company: [...] }
  copyrightText: varchar("copyright_text"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// About Us Settings
export const aboutUsSettings = pgTable("about_us_settings", {
  id: serial("id").primaryKey(),
  heroTitle: varchar("hero_title").default("About Gauranitai"),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: varchar("hero_image_url"),
  heroCtaText: varchar("hero_cta_text"),
  heroCtaLink: varchar("hero_cta_link"),
  storyHeading: varchar("story_heading"),
  storyDescription: text("story_description"),
  storyImageUrl: varchar("story_image_url"),
  valuesTitle: varchar("values_title").default("Our Core Values"),
  values: jsonb("values"), // Array of { title, description }
  processTitle: varchar("process_title").default("How We Work"),
  processSteps: jsonb("process_steps"), // Array of { title, description }
  ctaHeading: varchar("cta_heading"),
  ctaSubheading: text("cta_subheading"),
  ctaButtonText: varchar("cta_button_text"),
  ctaButtonLink: varchar("cta_button_link"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact Settings
export const contactSettings = pgTable("contact_settings", {
  id: serial("id").primaryKey(),
  heroTitle: varchar("hero_title").default("Contact Us"),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: varchar("hero_image_url"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  businessHours: text("business_hours"),
  socialLinks: jsonb("social_links"),
  mapEmbedUrl: text("map_embed_url"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Terms of Service Settings
export const termsOfServiceSettings = pgTable("terms_of_service_settings", {
  id: serial("id").primaryKey(),
  title: varchar("title").default("Terms of Service"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  content: text("content"),
  sections: jsonb("sections"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy Policy Settings
export const privacyPolicySettings = pgTable("privacy_policy_settings", {
  id: serial("id").primaryKey(),
  title: varchar("title").default("Privacy Policy"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  content: text("content"),
  sections: jsonb("sections"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  brandName: varchar("brand_name").notNull().default("Gauranitai"),
  logoUrl: varchar("logo_url"),
  faviconUrl: varchar("favicon_url"),
  primaryColor: varchar("primary_color").default("#0D3E83"),
  secondaryColor: varchar("secondary_color").default("#FFF9F2"),
  upiId: varchar("upi_id"),
  bankName: varchar("bank_name"),
  accountNumber: varchar("account_number"),
  ifscCode: varchar("ifsc_code"),
  qrCodeUrl: text("qr_code_url"),
  isOnlinePaymentEnabled: boolean("is_online_payment_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auth & Chat Support Tables
export const passwordResetRequests = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  email: varchar("email").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  tokenHash: varchar("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, active, resolved
  lastMessage: text("last_message"),
  unreadForAdmin: integer("unread_for_admin").notNull().default(0),
  unreadForUser: integer("unread_for_user").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  senderId: varchar("sender_id"),
  senderRole: varchar("sender_role").notNull(), // user, admin
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const cartRelations = relations(cart, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItems.cartId],
    references: [cart.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertAddressSchema = createInsertSchema(addresses);
export const insertProductSchema = createInsertSchema(products);
export const insertServiceSchema = createInsertSchema(services);
export const insertBlogSchema = createInsertSchema(blogs);
export const insertBlogTopicsSuggestionsSchema = createInsertSchema(blogTopicsSuggestions);
export const insertEnquirySchema = createInsertSchema(enquiries);
export const insertBannerSchema = createInsertSchema(banners);
export const insertSiteSettingsSchema = createInsertSchema(siteSettings);
export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequests);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const insertChatThreadSchema = createInsertSchema(chatThreads);
export const insertChatMessageSchema = createInsertSchema(chatMessages);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = Partial<User> & { id: string };
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type Blog = typeof blogs.$inferSelect;
export type InsertBlog = typeof blogs.$inferInsert;
export type BlogTopicsSuggestions = typeof blogTopicsSuggestions.$inferSelect;
export type InsertBlogTopicsSuggestions = typeof blogTopicsSuggestions.$inferInsert;
export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = typeof enquiries.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type ChatThread = typeof chatThreads.$inferSelect;
export type InsertChatThread = typeof chatThreads.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
