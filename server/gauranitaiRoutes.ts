import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import { gauranitaiStore } from "./gauranitaiStore";
import { buildRobotsTxt, buildSitemapXml, publicBaseUrlFromRequest } from "./seoSitemap";
import { generatedBlogImageSvg, getGeneratedSeoBlog, searchGeneratedSeoBlogs } from "./generatedSeoBlogs";

const router = Router();
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const adminCollections = [
  "services",
  "products",
  "orders",
  "leads",
  "reviews",
  "blogs",
  "faqs",
  "testimonials",
  "banners",
  "categories",
  "gallery",
  "videos",
  "coupons",
  "careerJobs",
  "careerApplications",
  "adminUsers",
] as const;

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function rateLimit(label: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ip = forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${label}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Too many attempts. Please try again shortly." });
    }
    return next();
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as any).session?.adminUser) return next();
  return res.status(401).json({ message: "Admin login required" });
}

function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if ((req as any).session?.customer) return next();
  return res.status(401).json({ message: "Customer login required" });
}

function validateEnquiry(body: any) {
  const errors: string[] = [];
  if (!body?.name || String(body.name).trim().length < 2) errors.push("Name is required");
  if (!body?.phone || String(body.phone).trim().length < 7) errors.push("Phone number is required");
  if (!body?.serviceRequired && !body?.productRequired && String(body?.requirementType || "") !== "General") errors.push("Select a service or product requirement");
  return errors;
}

function sanitizeAdminUser(row: any) {
  const { password: _password, ...safe } = row;
  return safe;
}

function normalizeSearch(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function blogSearchText(row: any) {
  return [
    row.title,
    row.slug,
    row.category,
    row.shortDescription,
    row.content,
    row.focusKeyword,
    row.seoTitle,
    row.seoDescription,
    row.seoKeywords,
    row.imageAlt,
    ...(Array.isArray(row.tags) ? row.tags : []),
  ].join(" ").toLowerCase();
}

function topicSearchText(row: any) {
  return [row.title, row.category, row.focusKeyword, row.suggestedSlug, row.priority, row.status].join(" ").toLowerCase();
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function sendCsv(res: Response, filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
}

function parseCsvRows(csv: string) {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];
        if (char === '"' && inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
}

function rowsToObjects(csv: string) {
  const rows = parseCsvRows(csv);
  const headers = rows[0]?.map((header) => header.trim()) || [];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function sanitizeUploadName(fileName: string) {
  return path.basename(fileName || "gauranitai-product-image").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

async function saveDataUrlImage(dataUrl: string, fileName: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
  if (!match) throw new Error("Upload must be a PNG, JPG, WEBP, or GIF image.");
  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw new Error("Image file is empty.");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Image must be 5MB or smaller.");

  const uploadDirectory = path.resolve(process.cwd(), "attached_assets", "uploads");
  await fs.mkdir(uploadDirectory, { recursive: true });
  const safeName = sanitizeUploadName(fileName).replace(/\.[^.]+$/, "");
  const finalName = `${Date.now()}-${safeName || "gauranitai-product-image"}.${extension}`;
  await fs.writeFile(path.join(uploadDirectory, finalName), buffer);
  return `/assets/uploads/${finalName}`;
}

async function saveDataUrlResume(dataUrl: string, fileName: string) {
  const match = dataUrl.match(/^data:(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,(.+)$/i);
  if (!match) throw new Error("Resume must be PDF, DOC, or DOCX.");
  const extensionMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw new Error("Resume file is empty.");
  if (buffer.length > 2 * 1024 * 1024) throw new Error("Resume must be 2MB or smaller.");

  const uploadDirectory = path.resolve(process.cwd(), "attached_assets", "uploads", "resumes");
  await fs.mkdir(uploadDirectory, { recursive: true });
  const safeName = sanitizeUploadName(fileName).replace(/\.[^.]+$/, "");
  const finalName = `${Date.now()}-${safeName || "resume"}.${extensionMap[mimeType] || "pdf"}`;
  await fs.writeFile(path.join(uploadDirectory, finalName), buffer);
  return `/assets/uploads/resumes/${finalName}`;
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Gauranitai API", timestamp: new Date().toISOString() });
});

router.post("/admin/login", rateLimit("admin-login", 10, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await gauranitaiStore.findAdmin(String(email || ""), String(password || ""));
    if (!user) return res.status(401).json({ message: "Invalid admin credentials" });
    (req as any).session.adminUser = sanitizeAdminUser(user);
    res.json({ user: sanitizeAdminUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/logout", requireAdmin, (req, res) => {
  (req as any).session.destroy(() => res.json({ success: true }));
});

router.get("/admin/me", (req, res) => {
  res.json({ user: (req as any).session?.adminUser || null });
});

router.post("/customer/login", rateLimit("customer-login", 20, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const customer = await gauranitaiStore.customerLogin(req.body || {});
    (req as any).session.customer = customer;
    res.json({ customer });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Customer login failed" });
  }
});

router.post("/customer/logout", requireCustomer, async (req, res, next) => {
  try {
    await gauranitaiStore.customerLogout((req as any).session.customer);
    delete (req as any).session.customer;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/customer/me", async (req, res) => {
  const customer = (req as any).session?.customer || null;
  if (!customer) return res.json({ customer: null });
  try {
    await gauranitaiStore.ensureCustomerAllowed(customer);
    return res.json({ customer });
  } catch (error: any) {
    delete (req as any).session.customer;
    return res.status(403).json({ customer: null, message: error.message || "Customer account is blocked" });
  }
});

router.get("/customer/orders", requireCustomer, async (req, res, next) => {
  try {
    res.json(await gauranitaiStore.customerOrders((req as any).session.customer));
  } catch (error) {
    next(error);
  }
});

router.get("/customer/chat/thread", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread((req as any).session.customer);
    await gauranitaiStore.markChatRead(thread.id, "user");
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

router.get("/customer/chat/messages", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread((req as any).session.customer);
    await gauranitaiStore.markChatRead(thread.id, "user");
    res.json(await gauranitaiStore.chatMessages(thread.id));
  } catch (error) {
    next(error);
  }
});

router.post("/customer/chat/messages", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread((req as any).session.customer);
    const result = await gauranitaiStore.addChatMessage(thread.id, "user", (req as any).session.customer.name || "Customer", String(req.body?.message || ""));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Could not send message" });
  }
});

router.get("/admin/chat/threads", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listChatThreads());
  } catch (error) {
    next(error);
  }
});

router.get("/admin/chat/threads/:id/messages", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid chat thread" });
    const thread = await gauranitaiStore.getChatThread(id);
    if (!thread) return res.status(404).json({ message: "Chat thread not found" });
    await gauranitaiStore.markChatRead(id, "admin");
    res.json(await gauranitaiStore.chatMessages(id));
  } catch (error) {
    next(error);
  }
});

router.post("/admin/chat/threads/:id/messages", requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid chat thread" });
    const result = await gauranitaiStore.addChatMessage(id, "admin", (req as any).session.adminUser?.name || "Admin", String(req.body?.message || ""));
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Could not send message" });
  }
});

router.put("/admin/chat/threads/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid chat thread" });
    const status = req.body?.status === "Resolved" ? "Resolved" : "Open";
    const thread = await gauranitaiStore.updateChatStatus(id, status);
    if (!thread) return res.status(404).json({ message: "Chat thread not found" });
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

router.get("/bootstrap", async (_req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.json({
      settings: data.settings,
      banners: data.banners.filter((row) => row.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
      services: data.services.filter((row) => row.isActive),
      products: data.products.filter((row) => row.isActive),
      blogs: data.blogs.filter((row) => row.status === "published"),
      blogTopics: data.blogTopics,
      reviews: data.reviews.filter((row) => row.status === "Published"),
      faqs: data.faqs.filter((row) => row.isActive),
      testimonials: data.testimonials.filter((row) => row.isActive),
      categories: data.categories.filter((row) => row.isActive),
      gallery: data.gallery.filter((row) => row.isActive),
      videos: data.videos.filter((row) => row.isActive),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/settings", async (_req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.json(data.settings);
  } catch (error) {
    next(error);
  }
});

router.get("/services", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("services"));
  } catch (error) {
    next(error);
  }
});

router.get("/services/:slug", async (req, res, next) => {
  try {
    const row = await gauranitaiStore.getBySlug("services", req.params.slug);
    if (!row || !row.isActive) return res.status(404).json({ message: "Service not found" });
    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("products"));
  } catch (error) {
    next(error);
  }
});

router.get("/products/:slug", async (req, res, next) => {
  try {
    const row = await gauranitaiStore.getBySlug("products", req.params.slug);
    if (!row || !row.isActive) return res.status(404).json({ message: "Product not found" });
    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.get("/blogs", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("blogs"));
  } catch (error) {
    next(error);
  }
});

router.get("/blogs/search", async (req, res, next) => {
  try {
    const query = normalizeSearch(req.query.q);
    const category = String(req.query.category || "All").trim();
    const data = await gauranitaiStore.read();
    const categoryMatches = (row: any) => category === "All" || !category || row.category === category;
    const queryMatches = (text: string) => !query || text.includes(query);
    const blogs = data.blogs
      .filter((row) => row.status === "published")
      .filter((row) => categoryMatches(row) && queryMatches(blogSearchText(row)));
    const topics = data.blogTopics.filter((row) => categoryMatches(row) && queryMatches(topicSearchText(row)));

    const generated = searchGeneratedSeoBlogs({ q: req.query.q, category, limit: req.query.limit || 60, offset: req.query.offset || 0 });

    res.json({
      query,
      category,
      counts: {
        blogs: blogs.length,
        topics: topics.length,
        generatedBlogs: generated.total,
        total: blogs.length + topics.length + generated.total,
      },
      blogs,
      topics,
      generatedBlogs: generated.blogs,
      generatedCategories: generated.categories,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/blogs/generated", async (req, res, next) => {
  try {
    res.json(searchGeneratedSeoBlogs({ q: req.query.q, category: req.query.category, limit: req.query.limit, offset: req.query.offset }));
  } catch (error) {
    next(error);
  }
});

router.get("/blogs/:slug", async (req, res, next) => {
  try {
    const row = await gauranitaiStore.getBySlug("blogs", req.params.slug);
    if (!row || row.status !== "published") {
      const generated = getGeneratedSeoBlog(req.params.slug);
      if (!generated) return res.status(404).json({ message: "Blog not found" });
      return res.json(generated);
    }
    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.get("/blog-images/:slug.svg", (req, res) => {
  res.type("image/svg+xml").setHeader("Cache-Control", "public, max-age=86400");
  res.send(generatedBlogImageSvg(req.params.slug));
});

router.get("/faqs", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("faqs"));
  } catch (error) {
    next(error);
  }
});

router.get("/gallery", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("gallery"));
  } catch (error) {
    next(error);
  }
});

router.get("/videos", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("videos"));
  } catch (error) {
    next(error);
  }
});

router.get("/career-jobs", async (_req, res, next) => {
  try {
    const rows = (await gauranitaiStore.list("careerJobs"))
      .filter((job) => job.isActive && job.status === "Open")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/career-jobs/:slug", async (req, res, next) => {
  try {
    const row = await gauranitaiStore.getBySlug("careerJobs", req.params.slug);
    if (!row || !row.isActive || row.status !== "Open") return res.status(404).json({ message: "Career opening not found" });
    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.post("/career-applications", rateLimit("career-application", 8, 10 * 60 * 1000), async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const jobSlug = String(body.jobSlug || "").trim();
    const resumeDataUrl = String(body.resumeDataUrl || "");
    const resumeFileName = String(body.resumeFileName || "resume.pdf");
    if (name.length < 2) return res.status(400).json({ message: "Name is required." });
    if (phone.replace(/\D/g, "").length < 7) return res.status(400).json({ message: "Phone number is required." });
    if (!email.includes("@")) return res.status(400).json({ message: "Valid email is required." });
    const job = jobSlug ? await gauranitaiStore.getBySlug("careerJobs", jobSlug) : undefined;
    if (!job || !job.isActive || job.status !== "Open") return res.status(404).json({ message: "Career opening not found." });
    const resumeUrl = await saveDataUrlResume(resumeDataUrl, resumeFileName);
    const application = await gauranitaiStore.create("careerApplications", {
      jobId: job.id,
      jobTitle: job.title,
      jobSlug: job.slug,
      name,
      phone,
      email,
      resumeUrl,
      resumeFileName,
      message: String(body.message || "").trim(),
      status: "New",
      adminNotes: "",
    });
    res.status(201).json(application);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Application submission failed." });
  }
});

router.get("/testimonials", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("testimonials"));
  } catch (error) {
    next(error);
  }
});

router.get("/reviews", async (req, res, next) => {
  try {
    const productId = req.query.productId ? Number(req.query.productId) : null;
    const data = await gauranitaiStore.read();
    const rows = data.reviews.filter((row) => row.status === "Published" && (!productId || row.productId === productId));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/reviews", rateLimit("reviews", 10, 10 * 60 * 1000), async (req, res) => {
  try {
    const reviewText = String(req.body?.review || "").trim();
    if (reviewText.length < 5) return res.status(400).json({ message: "Review text is required" });
    const review = await gauranitaiStore.createProductReview(req.body);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Could not submit review" });
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listActive("categories"));
  } catch (error) {
    next(error);
  }
});

router.post("/enquiries", rateLimit("enquiries", 12, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const enquiry = await gauranitaiStore.createEnquiry(req.body);
    res.status(201).json(enquiry);
  } catch (error) {
    next(error);
  }
});

router.post("/leads", rateLimit("leads", 12, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const lead = await gauranitaiStore.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

router.post("/checkout/summary", rateLimit("checkout-summary", 60, 10 * 60 * 1000), async (req, res, next) => {
  try {
    res.json(await gauranitaiStore.checkoutSummary(req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/orders", requireCustomer, rateLimit("orders", 10, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const order = await gauranitaiStore.createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Could not create order" });
  }
});

router.get("/orders/status/:orderNumber", async (req, res, next) => {
  try {
    const orderNumber = String(req.params.orderNumber || "").trim().toLowerCase();
    const data = await gauranitaiStore.read();
    const order = data.orders.find((row) => row.orderNumber.toLowerCase() === orderNumber);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
      createdAt: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/orders/lookup", rateLimit("order-lookup", 30, 10 * 60 * 1000), async (req, res, next) => {
  try {
    const { phone, email, orderNumber } = req.body || {};
    const phoneDigits = String(phone || "").replace(/\D/g, "");
    const emailText = String(email || "").trim().toLowerCase();
    const orderText = String(orderNumber || "").trim().toLowerCase();
    if (!phoneDigits && !emailText && !orderText) return res.status(400).json({ message: "Enter phone, email, or order number" });

    const data = await gauranitaiStore.read();
    const rows = data.orders.filter((order) => {
      const matchesPhone = phoneDigits && order.phone.replace(/\D/g, "").includes(phoneDigits);
      const matchesEmail = emailText && order.email.toLowerCase() === emailText;
      const matchesOrder = orderText && order.orderNumber.toLowerCase() === orderText;
      return matchesPhone || matchesEmail || matchesOrder;
    });
    res.json(rows.slice(0, 20));
  } catch (error) {
    next(error);
  }
});

router.get("/policies/:type", (req, res) => {
  const titles: Record<string, string> = {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refund: "Return / Refund Policy",
    shipping: "Shipping Policy",
  };
  const title = titles[req.params.type] || "Policy";
  res.json({
    title,
    content: `${title} for Gauranitai. This page explains customer information, orders, service bookings, payments, shipping, and support policies for cleaning products and marble polishing services.`,
  });
});

router.get("/robots.txt", async (_req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("text/plain").send(buildRobotsTxt(data, publicBaseUrlFromRequest(_req)));
  } catch (error) {
    next(error);
  }
});

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("application/xml").send(buildSitemapXml(data, publicBaseUrlFromRequest(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/dashboard", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.dashboardStats());
  } catch (error) {
    next(error);
  }
});

router.get("/admin/blog-topics", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.list("blogTopics"));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.json(data.settings);
  } catch (error) {
    next(error);
  }
});

router.put("/admin/settings", requireAdmin, async (req, res, next) => {
  try {
    res.json(await gauranitaiStore.updateSettings(req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/admin/reset-seed", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.reset());
  } catch (error) {
    next(error);
  }
});

router.post("/admin/uploads/image", requireAdmin, async (req, res) => {
  try {
    const dataUrl = String(req.body?.dataUrl || "");
    const fileName = String(req.body?.fileName || "gauranitai-product-image");
    const url = await saveDataUrlImage(dataUrl, fileName);
    res.status(201).json({ url });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Image upload failed" });
  }
});

router.get("/admin/products/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const products = await gauranitaiStore.list("products");
    sendCsv(
      res,
      "gauranitai-products.csv",
      ["Product name", "Category", "SKU", "Main price", "Discount price", "GST", "Delivery charge", "Unit", "Pack size", "Stock", "Status", "Short description", "SEO title", "SEO description", "Created date"],
      products.map((product) => [
        product.name,
        product.category,
        product.sku,
        product.mainPrice,
        product.discountPrice,
        product.gstPercentage,
        product.deliveryCharge,
        product.unit,
        product.packSize,
        product.stock,
        product.isActive ? "Active" : "Inactive",
        product.shortDescription,
        product.seoTitle,
        product.seoDescription,
        product.createdAt,
      ]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/products/import-template.csv", requireAdmin, (_req, res) => {
  sendCsv(
    res,
    "gauranitai-product-import-template.csv",
    ["name", "category", "sku", "mainPrice", "discountPrice", "gstPercentage", "deliveryCharge", "unit", "packSize", "stock", "shortDescription", "seoTitle", "seoDescription"],
    [["Example Floor Cleaner 1L", "Floor Cleaner", "EXAMPLE-FLOOR-1L", 249, 199, 18, 50, "1L", "1L", 100, "Short product description", "SEO title", "SEO description"]],
  );
});

router.post("/admin/products/import.csv", requireAdmin, async (req, res, next) => {
  try {
    const csv = String(req.body?.csv || "");
    const rows = rowsToObjects(csv);
    const errors: string[] = [];
    const created = [];
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const line = index + 2;
      if (!row.name) errors.push(`Line ${line}: product name is required`);
      if (!row.sku) errors.push(`Line ${line}: SKU is required`);
      if (!row.category) errors.push(`Line ${line}: category is required`);
      if (!Number(row.discountPrice || 0)) errors.push(`Line ${line}: discountPrice must be greater than 0`);
      if (errors.length) continue;
      const discountPrice = Number(row.discountPrice || 0);
      const gstPercentage = Number(row.gstPercentage || 18);
      const deliveryCharge = Number(row.deliveryCharge || 0);
      const gstAmount = Math.round(discountPrice * (gstPercentage / 100));
      created.push(await gauranitaiStore.create("products", {
        name: row.name,
        category: row.category,
        sku: row.sku,
        hsnCode: row.hsnCode || "3402",
        mainPrice: Number(row.mainPrice || discountPrice),
        discountPrice,
        gstPercentage,
        gstAmount,
        deliveryCharge,
        finalPayablePrice: discountPrice + gstAmount + deliveryCharge,
        unit: row.unit || row.packSize || "1L",
        packSize: row.packSize || row.unit || "1L",
        minimumOrderAmount: Number(row.minimumOrderAmount || 0),
        minimumOrderQuantity: Number(row.minimumOrderQuantity || 1),
        stock: Number(row.stock || 0),
        lowStockAlert: Number(row.lowStockAlert || 20),
        shortDescription: row.shortDescription || "",
        fullDescription: row.fullDescription || row.shortDescription || "",
        benefits: row.benefits ? String(row.benefits).split("|").map((item) => item.trim()).filter(Boolean) : [],
        usageInstructions: row.usageInstructions || "",
        suitableSurfaces: row.suitableSurfaces ? String(row.suitableSurfaces).split("|").map((item) => item.trim()).filter(Boolean) : [],
        safetyInstructions: row.safetyInstructions ? String(row.safetyInstructions).split("|").map((item) => item.trim()).filter(Boolean) : [],
        ingredients: row.ingredients || "",
        storageInstructions: row.storageInstructions || "",
        warrantyGuarantee: row.warrantyGuarantee || "",
        images: [],
        coverImage: row.coverImage || "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=85",
        videoType: "none",
        youtubeUrl: "",
        localVideoUrl: "",
        htmlContent: "",
        infoTable: [],
        faqs: [],
        imageTitle: `${row.name} product image`,
        imageAltText: `${row.name} by Gauranitai`,
        seoTitle: row.seoTitle || `${row.name} | Gauranitai`,
        seoDescription: row.seoDescription || row.shortDescription || "",
        seoKeywords: row.seoKeywords || `${row.category}, Gauranitai`,
        isFeatured: false,
        isBestSeller: false,
        isNewLaunch: false,
        isActive: true,
      }));
    }
    if (errors.length) return res.status(400).json({ message: errors.join("; "), createdCount: created.length });
    res.status(201).json({ createdCount: created.length, products: created });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/orders/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const orders = await gauranitaiStore.list("orders");
    sendCsv(
      res,
      "gauranitai-orders.csv",
      ["Order ID", "Customer name", "Customer phone", "Customer email", "Products count", "Product names", "Total amount", "Payment status", "Order status", "Order date"],
      orders.map((order) => [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.email,
        order.items.reduce((sum, item) => sum + item.quantity, 0),
        order.items.map((item) => item.productName).join(" | "),
        order.totalAmount,
        order.paymentStatus,
        order.orderStatus,
        order.createdAt,
      ]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/leads/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await gauranitaiStore.list("leads");
    sendCsv(
      res,
      "gauranitai-leads.csv",
      ["Lead ID", "Name", "Phone", "Email", "Requirement Type", "Product", "Service", "Status", "Priority", "Follow Up", "Assigned To", "Source"],
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.requirementType, row.productRequired, row.serviceRequired, row.status, row.priority, row.followUpDate, row.assignedTo, row.source]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/service-bookings/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const rows = (await gauranitaiStore.list("leads")).filter((row) => row.requirementType === "Service");
    sendCsv(
      res,
      "gauranitai-service-bookings.csv",
      ["Lead ID", "Name", "Phone", "Email", "Service", "Floor type", "Approx area", "Preferred date", "Preferred time", "Status", "Priority", "Address"],
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.serviceRequired, row.floorType, row.approxAreaSqFt, row.preferredDate, row.preferredTime, row.status, row.priority, row.address]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/product-enquiries/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const rows = (await gauranitaiStore.list("leads")).filter((row) => row.requirementType === "Product");
    sendCsv(
      res,
      "gauranitai-product-enquiries.csv",
      ["Lead ID", "Name", "Phone", "Email", "Product", "Status", "Priority", "Follow Up", "Address", "Message"],
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.productRequired, row.status, row.priority, row.followUpDate, row.address, row.message]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/reviews/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await gauranitaiStore.list("reviews");
    sendCsv(
      res,
      "gauranitai-product-reviews.csv",
      ["Order ID", "Product", "Customer", "Phone", "Email", "Rating", "Review", "Status", "Admin notes", "Date"],
      rows.map((row) => [row.orderNumber, row.productName, row.customerName, row.phone, row.email, row.rating, row.review, row.status, row.adminNotes, row.createdAt]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/customers/export.csv", requireAdmin, async (_req, res, next) => {
  try {
    const customers = await gauranitaiStore.listCustomers();
    sendCsv(
      res,
      "gauranitai-customers.csv",
      ["Customer name", "Phone", "Email", "Login status", "Block status", "Order count", "Total spend", "Average order", "Last order date", "Last order number", "Last order status", "City", "State", "Admin notes"],
      customers.map((row) => [row.customerName, row.phone, row.email, row.isLoggedIn ? "Logged in" : "Logged out", row.isBlocked ? "Blocked" : "Active", row.orderCount, row.totalSpend, row.averageOrderValue, row.lastOrderDate, row.lastOrderNumber, row.lastOrderStatus, row.city, row.state, row.adminNotes]),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/admin/customers", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.listCustomers());
  } catch (error) {
    next(error);
  }
});

router.put("/admin/customers/:id/access", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid customer id" });
    const customer = await gauranitaiStore.updateCustomerAccess(id, req.body || {});
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

adminCollections.forEach((collection) => {
  router.get(`/admin/${collection}`, requireAdmin, async (_req, res, next) => {
    try {
      const rows = await gauranitaiStore.list(collection);
      res.json(collection === "adminUsers" ? rows.map(sanitizeAdminUser) : rows);
    } catch (error) {
      next(error);
    }
  });

  router.get(`/admin/${collection}/:id`, requireAdmin, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid id" });
      const row = await gauranitaiStore.getById(collection, id);
      if (!row) return res.status(404).json({ message: "Item not found" });
      res.json(collection === "adminUsers" ? sanitizeAdminUser(row) : row);
    } catch (error) {
      next(error);
    }
  });

  router.post(`/admin/${collection}`, requireAdmin, async (req, res, next) => {
    try {
      const row = await gauranitaiStore.create(collection, req.body);
      res.status(201).json(collection === "adminUsers" ? sanitizeAdminUser(row) : row);
    } catch (error) {
      next(error);
    }
  });

  router.put(`/admin/${collection}/:id`, requireAdmin, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid id" });
      const row = await gauranitaiStore.update(collection, id, req.body);
      if (!row) return res.status(404).json({ message: "Item not found" });
      res.json(collection === "adminUsers" ? sanitizeAdminUser(row) : row);
    } catch (error) {
      next(error);
    }
  });

  router.delete(`/admin/${collection}/:id`, requireAdmin, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid id" });
      const deleted = await gauranitaiStore.remove(collection, id);
      if (!deleted) return res.status(404).json({ message: "Item not found" });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
});

router.get("/admin/enquiries", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await gauranitaiStore.list("enquiries"));
  } catch (error) {
    next(error);
  }
});

router.put("/admin/enquiries/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const row = await gauranitaiStore.update("enquiries", id, req.body);
    if (!row) return res.status(404).json({ message: "Enquiry not found" });
    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/enquiries/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const deleted = await gauranitaiStore.remove("enquiries", id);
    if (!deleted) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/orders/:id/invoice", requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const order = await gauranitaiStore.getById("orders", id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.type("text/plain").send([
      `Invoice: ${order.invoiceNumber}`,
      `Order: ${order.orderNumber}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Total: Rs. ${order.totalAmount}`,
      `Payment: ${order.paymentStatus}`,
      `Date: ${order.createdAt}`,
    ].join("\n"));
  } catch (error) {
    next(error);
  }
});

export default router;
