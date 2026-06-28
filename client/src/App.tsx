import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Eye,
  Gem,
  Home,
  Leaf,
  Menu,
  MessageCircle,
  Phone,
  Play,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import logoImage from "@assets/gauranitai_logo.png";
import type {
  Banner,
  Blog,
  BlogTopic,
  CareerApplication,
  CareerApplicationStatus,
  CareerJob,
  CareerJobStatus,
  Category,
  ChatMessage,
  ChatThread,
  CustomerSummary,
  CustomerSession,
  DashboardStats,
  Enquiry,
  Faq,
  GalleryItem,
  Lead,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductReview,
  Service,
  SiteSettings,
  Testimonial,
  VideoItem,
  CheckoutSummary,
} from "@shared/gauranitai";

interface BootstrapData {
  settings: SiteSettings;
  banners: Banner[];
  services: Service[];
  products: Product[];
  blogs: Blog[];
  blogTopics: BlogTopic[];
  faqs: Faq[];
  testimonials: Testimonial[];
  categories: Category[];
  gallery: GalleryItem[];
  videos: VideoItem[];
  reviews: ProductReview[];
}

interface GeneratedBlogSearchResult {
  total: number;
  offset: number;
  limit: number;
  categories: string[];
  blogs: Blog[];
}

type AdminModule =
  | "dashboard"
  | "product-categories"
  | "service-categories"
  | "services"
  | "products"
  | "orders"
  | "customers"
  | "enquiries"
  | "leads"
  | "reviews"
  | "product-enquiries"
  | "service-bookings"
  | "chat"
  | "blogs"
  | "blog-topics"
  | "faqs"
  | "testimonials"
  | "banners"
  | "categories"
  | "gallery"
  | "videos"
  | "coupons"
  | "careerJobs"
  | "careerApplications"
  | "adminUsers"
  | "settings";

const emptySettings: SiteSettings = {
  brandName: "Gauranitai",
  tagline: "Professional Polishing & Floor Deep Cleaning",
  logoUrl: "",
  primaryColor: "#0D3E83",
  secondaryColor: "#FFFFFF",
  accentColor: "#C9A24A",
  contact: {
    companyName: "Gauranitai",
    phone: "+91 9142069507",
    whatsappNumber: "919142069507",
    email: "hello@gauranitai.com",
    address: "Mumbai, Maharashtra",
    googleMapLink: "",
    instagramLink: "",
    facebookLink: "",
    youtubeLink: "",
    linkedinLink: "",
    workingHours: "Mon-Sat, 9:00 AM to 7:00 PM",
  },
  payment: {
    codEnabled: true,
    razorpayEnabled: false,
    upiManualEnabled: true,
    bankTransferEnabled: true,
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
  taxDelivery: {
    defaultGstPercentage: 18,
    deliveryCharge: 50,
    deliveryChargeBelow500: 80,
    deliveryChargeAbove500: 50,
    freeDeliveryAbove: 999,
    minimumOrderAmount: 500,
    codEnabled: true,
  },
  seo: {
    siteTitle: "Gauranitai",
    defaultMetaDescription: "Professional marble polishing and floor cleaning services.",
    seoTitle: "Gauranitai",
    seoDescription: "Professional marble polishing and floor cleaning services.",
    seoKeywords: "marble polishing service, floor cleaning service",
    focusKeyword: "marble polishing service",
    openGraphTitle: "Gauranitai",
    openGraphDescription: "Professional marble polishing and floor cleaning services.",
    openGraphImage: "",
    robotsTxt: "User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /login\nDisallow: /checkout\nDisallow: /cart\nDisallow: /my-account",
  },
};

const emptyBootstrap: BootstrapData = {
  settings: emptySettings,
  banners: [],
  services: [],
  products: [],
  blogs: [],
  blogTopics: [],
  faqs: [],
  testimonials: [],
  categories: [],
  gallery: [],
  videos: [],
  reviews: [],
};

function splitLines(value = "") {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mediaImagesFromUrls(value: string, fallbackTitle: string) {
  return splitLines(value).map((url, index) => ({
    id: index + 1,
    url,
    title: `${fallbackTitle} image ${index + 1}`,
    altText: `${fallbackTitle} by Gauranitai`,
    caption: `${fallbackTitle} image ${index + 1}`,
    type: index === 0 ? "cover" : "gallery",
    sortOrder: index + 1,
  }));
}

function faqItemsFromLines(value: string) {
  return splitLines(value).map((line) => {
    const [question, ...answerParts] = line.split("|");
    return { question: question?.trim() || line, answer: answerParts.join("|").trim() || "" };
  }).filter((faq) => faq.question && faq.answer);
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }

  return response.json() as Promise<T>;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

async function uploadAdminImage(file: File) {
  const dataUrl = await fileToDataUrl(file);
  const result = await api<{ url: string }>("/api/admin/uploads/image", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, dataUrl }),
  });
  return result.url;
}

function whatsappLink(settings: SiteSettings) {
  const number = settings.contact.whatsappNumber.replace(/\D/g, "") || "919142069507";
  return `https://api.whatsapp.com/send/?phone=${number}&text&type=phone_number&app_absent=0`;
}

function phoneLink(settings: SiteSettings) {
  const number = settings.contact.phone.replace(/\D/g, "") || "919142069507";
  return `tel:+${number}`;
}

function youtubeVideoId(value = "") {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "i.ytimg.com" || host === "img.youtube.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const viIndex = parts.indexOf("vi");
      if (viIndex >= 0) return parts[viIndex + 1] || "";
    }
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
    if (host.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = ["embed", "shorts", "live", "v"].find((item) => parts.includes(item));
      if (marker) return parts[parts.indexOf(marker) + 1] || "";
    }
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/|\/v\/)([a-zA-Z0-9_-]{6,})/);
    return match?.[1] || "";
  }
  return "";
}

function youtubeThumbnail(videoUrl = "", fallback = "") {
  const id = youtubeVideoId(videoUrl);
  if (!id) return fallback;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function youtubeEmbedUrl(videoUrl = "") {
  const id = youtubeVideoId(videoUrl);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function youtubeExternalUrl(videoUrl = "") {
  const id = youtubeVideoId(videoUrl);
  return id ? `https://www.youtube.com/shorts/${id}` : videoUrl;
}

function videoThumbnail(video: VideoItem) {
  return video.thumbnailUrl || youtubeThumbnail(video.videoUrl, "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=85");
}

function videoWatchUrl(video: VideoItem) {
  const id = youtubeVideoId(video.videoUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : video.videoUrl || "/videos";
}

type LocalCartItem = { productId: number; quantity: number };

function readCart(): LocalCartItem[] {
  try {
    return JSON.parse(localStorage.getItem("gauranitai-cart") || "[]");
  } catch {
    return [];
  }
}

function writeCart(items: LocalCartItem[]) {
  localStorage.setItem("gauranitai-cart", JSON.stringify(items));
  window.dispatchEvent(new Event("gauranitai-cart-updated"));
}

function addToCart(productId: number, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  writeCart(items);
}

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function deliverySlabStart(settings: SiteSettings["taxDelivery"]) {
  return Math.max(0, Number(settings.minimumOrderAmount || 500));
}

function estimatedDeliveryCharge(subtotal: number, settings: SiteSettings["taxDelivery"]) {
  const freeDeliveryAbove = Number(settings.freeDeliveryAbove || 0);
  if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) return 0;
  return subtotal < deliverySlabStart(settings)
    ? Number(settings.deliveryChargeBelow500 || 0)
    : Number(settings.deliveryChargeAbove500 || settings.deliveryCharge || 0);
}

function deliveryMiddleSlabLabel(settings: SiteSettings["taxDelivery"]) {
  const start = deliverySlabStart(settings);
  const freeDeliveryAbove = Number(settings.freeDeliveryAbove || 0);
  if (freeDeliveryAbove > start) return `Delivery ${money(start)} to below ${money(freeDeliveryAbove)}`;
  return `Delivery ${money(start)} and above`;
}

function formatDateTime(value = "") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

const orderStatusOptions: OrderStatus[] = ["Pending", "Confirmed", "Paid", "Processing", "Upcoming Delivery", "Shipped", "Delivered", "Cancelled", "Refunded"];
const paymentStatusOptions: PaymentStatus[] = ["Pending", "COD", "Manual verification pending", "Paid", "Failed"];
const careerJobStatusOptions: CareerJobStatus[] = ["Draft", "Open", "Closed"];
const careerApplicationStatusOptions: CareerApplicationStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected", "Hired"];
const deliveryProgressSteps = ["Pending", "Processing", "Upcoming Delivery", "Delivered"];

function orderStatusMeta(status: string) {
  if (status === "Delivered") return { label: "Delivered", note: "Order delivered successfully.", className: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 3 };
  if (status === "Upcoming Delivery" || status === "Shipped") return { label: status, note: "Order is ready for delivery.", className: "bg-blue-50 text-blue-700 border-blue-200", step: 2 };
  if (status === "Processing" || status === "Paid") return { label: status, note: "Order is being packed and processed.", className: "bg-amber-50 text-amber-700 border-amber-200", step: 1 };
  if (status === "Cancelled" || status === "Refunded") return { label: status, note: "Order is not active.", className: "bg-red-50 text-red-700 border-red-200", step: -1 };
  return { label: status || "Pending", note: "Order received. Admin will process it soon.", className: "bg-[#fffaf0] text-[#805f13] border-[#f4d883]", step: 0 };
}

function OrderStatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function OrderProgress({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  if (meta.step < 0) {
    return (
      <div className={`rounded-2xl border p-4 text-sm font-semibold ${meta.className}`}>
        {meta.note}
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
      {deliveryProgressSteps.map((label, index) => {
        const isDone = index <= meta.step;
        return (
          <div key={label} className="flex items-center gap-3 sm:block">
            <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black sm:mx-auto ${isDone ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-400"}`}>
              {index + 1}
            </div>
            <p className={`text-sm font-black sm:mt-2 sm:text-center ${isDone ? "text-[#0d3e83]" : "text-slate-400"}`}>{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="gauranitai-shine-button inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/10">
      {children}
    </a>
  );
}

function EnergySparkLayer() {
  return (
    <div className="gauranitai-energy-field" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} className="gauranitai-spark" />
      ))}
      <span className="gauranitai-energy-line" />
    </div>
  );
}

function SiteHeader({ data }: { data: BootstrapData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(readCart().reduce((sum, item) => sum + item.quantity, 0));
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const navItems = [
    ["Home", "/"],
    ["About Us", "/about-us"],
    ["Services", "/services"],
    ["Products", "/products"],
    ["Blogs", "/blogs"],
    ["Career", "/career"],
    ["Gallery", "/gallery"],
    ["Videos", "/videos"],
    ["FAQ", "/faq"],
    ["Contact", "/contact"],
    ["My Account", "/my-account"],
  ];

  useEffect(() => {
    const update = () => setCartCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    window.addEventListener("gauranitai-cart-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("gauranitai-cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    const loadCustomer = () => api<{ customer: CustomerSession | null }>("/api/customer/me")
      .then((value) => setCustomer(value.customer))
      .catch(() => setCustomer(null));
    loadCustomer();
    window.addEventListener("gauranitai-customer-updated", loadCustomer);
    return () => window.removeEventListener("gauranitai-customer-updated", loadCustomer);
  }, []);

  async function logoutCustomer() {
    try {
      await api<{ success: boolean }>("/api/customer/logout", { method: "POST" });
    } catch {
      // Session may already be expired; clear local header state either way.
    }
    setCustomer(null);
    window.dispatchEvent(new Event("gauranitai-customer-updated"));
    if (window.location.pathname === "/my-account") window.location.reload();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <img src={logoImage} alt="Gauranitai logo" className="h-12 w-12 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="font-['Cinzel'] text-xl font-semibold tracking-normal text-[#0d3e83]">{data.settings.brandName}</p>
            </div>
          </a>

          <div className="hidden items-center gap-2 lg:flex">
            <a href="/admin" className="inline-flex whitespace-nowrap rounded-full border border-[#0d3e83]/10 bg-white px-4 py-2 text-sm font-bold text-[#0d3e83] shadow-sm">
              Admin
            </a>
            <a href="/my-account" className="inline-flex whitespace-nowrap rounded-full border border-[#0d3e83]/10 bg-white px-4 py-2 text-sm font-bold text-[#0d3e83] shadow-sm">
              {customer ? "My Account" : "Login"}
            </a>
            {customer && (
              <button type="button" onClick={logoutCustomer} className="inline-flex whitespace-nowrap rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 shadow-sm">
                Logout
              </button>
            )}
            <a href="/cart" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#0d3e83]/10 bg-white px-4 py-2 text-sm font-bold text-[#0d3e83] shadow-sm">
              <ShoppingCart className="h-4 w-4" />
              Cart ({cartCount})
            </a>
            <a href={phoneLink(data.settings)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#0d3e83]/15 px-4 py-2 text-sm font-bold text-[#0d3e83]">
              <Phone className="h-4 w-4" />
              Call Now
            </a>
            <a href={whatsappLink(data.settings)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#0d3e83] px-5 py-2.5 text-sm font-bold text-white shadow-sm">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          <div className="flex flex-none items-center gap-2 lg:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d3e83]"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Open navigation menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <a
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0d3e83] text-white shadow-lg shadow-blue-950/10"
              aria-label={`Open cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#c9a24a] px-1 text-[10px] font-black leading-none text-[#092b5c]">
                {cartCount}
              </span>
            </a>
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-1 border-t border-slate-100 py-2.5 lg:flex xl:gap-2">
          {navItems.map(([label, href]) => (
            <a key={label} href={href} className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-[#f7f9fb] hover:text-[#0d3e83] xl:px-4">
              {label}
            </a>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {navItems.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {label}
              </a>
            ))}
            <a href="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0d3e83] hover:bg-slate-50">
              Admin
            </a>
            <a href="/my-account" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0d3e83] hover:bg-slate-50">
              {customer ? "My Account" : "Login"}
            </a>
            {customer && (
              <button type="button" onClick={logoutCustomer} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

function PublicSiteSkeleton() {
  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <SkeletonBlock className="h-7 w-44" />
          </div>
          <div className="hidden gap-3 md:flex">
            <SkeletonBlock className="h-10 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-32 rounded-full" />
          </div>
        </div>
        <div className="mt-16 grid min-h-[70vh] items-center gap-10 lg:grid-cols-2">
          <div>
            <SkeletonBlock className="h-10 w-48 rounded-full" />
            <SkeletonBlock className="mt-8 h-16 w-full max-w-2xl" />
            <SkeletonBlock className="mt-4 h-16 w-5/6" />
            <SkeletonBlock className="mt-8 h-6 w-4/5" />
            <SkeletonBlock className="mt-3 h-6 w-3/5" />
            <div className="mt-8 flex flex-wrap gap-3">
              <SkeletonBlock className="h-12 w-36 rounded-full" />
              <SkeletonBlock className="h-12 w-36 rounded-full" />
              <SkeletonBlock className="h-12 w-40 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="aspect-[4/5] w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}

function HomeLowerSkeleton() {
  return (
    <div className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-52" />
      </div>
    </div>
  );
}

function LazyRender({ children, fallback, delay = 180 }: { children: React.ReactNode; fallback?: React.ReactNode; delay?: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const show = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(show, { timeout: delay + 600 });
      return () => (window as any).cancelIdleCallback(id);
    }
    const timer = globalThis.setTimeout(show, delay);
    return () => globalThis.clearTimeout(timer);
  }, [delay]);

  return ready ? <>{children}</> : <>{fallback || null}</>;
}

function PublicSite() {
  const [data, setData] = useState<BootstrapData>(emptyBootstrap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [homeBlogQuery, setHomeBlogQuery] = useState("");
  const [generatedBlogDetail, setGeneratedBlogDetail] = useState<Blog | null>(null);
  const [generatedBlogLoading, setGeneratedBlogLoading] = useState(false);
  const [generatedBlogError, setGeneratedBlogError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    serviceRequired: "Marble Polishing Service",
    productRequired: "",
    address: "",
    floorType: "",
    approxAreaSqFt: "",
    preferredDate: "",
    preferredTime: "",
    attachmentUrl: "",
    message: "",
  });
  const [submitState, setSubmitState] = useState("");

  function submitHomeBlogSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = homeBlogQuery.trim();
    window.location.href = query ? `/blogs?q=${encodeURIComponent(query)}` : "/blogs";
  }

  useEffect(() => {
    api<BootstrapData>("/api/bootstrap")
      .then((value) => {
        setData(value);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load website data"))
      .finally(() => setLoading(false));
  }, []);

  const path = window.location.pathname;
  const [, routeType, routeSlug] = path.split("/");
  const detail = useMemo(() => {
    const [, type, slug] = path.split("/");
    if (!slug) return null;
    if (type === "services") return { type, row: data.services.find((item) => item.slug === slug) };
    if (type === "products") return { type, row: data.products.find((item) => item.slug === slug) };
    if (type === "blogs" || type === "blog") return { type: "blogs", row: data.blogs.find((item) => item.slug === slug) };
    return null;
  }, [data, path]);
  const isBlogDetailRoute = (routeType === "blogs" || routeType === "blog") && Boolean(routeSlug);

  useEffect(() => {
    if (!isBlogDetailRoute || loading || detail?.row) {
      setGeneratedBlogDetail(null);
      setGeneratedBlogError("");
      setGeneratedBlogLoading(false);
      return;
    }

    setGeneratedBlogLoading(true);
    setGeneratedBlogError("");
    api<Blog>(`/api/blogs/${encodeURIComponent(routeSlug)}`)
      .then((blog) => setGeneratedBlogDetail(blog))
      .catch((err) => {
        setGeneratedBlogDetail(null);
        setGeneratedBlogError(err.message || "Blog not found");
      })
      .finally(() => setGeneratedBlogLoading(false));
  }, [detail?.row, isBlogDetailRoute, loading, routeSlug]);

  async function submitEnquiry() {
    setSubmitState("Sending...");
    try {
      await api<Lead>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          requirementType: form.productRequired ? "Product" : form.serviceRequired ? "Service" : "General",
          attachments: form.attachmentUrl ? [form.attachmentUrl] : [],
        }),
      });
      setSubmitState("Enquiry saved in backend.");
      setForm({ ...form, name: "", phone: "", email: "", address: "", floorType: "", approxAreaSqFt: "", preferredDate: "", preferredTime: "", attachmentUrl: "", message: "" });
    } catch (err: any) {
      setSubmitState(err.message || "Could not submit enquiry");
    }
  }

  if (loading) {
    return <PublicSiteSkeleton />;
  }

  if (path === "/cart") return <CartPage data={data} />;
  if (path === "/checkout") return <CheckoutPage data={data} />;
  if (path === "/order-success") return <OrderSuccessPage data={data} />;
  if (path === "/about-us" || path === "/about") return <AboutPage data={data} />;
  if (path === "/services") return <ServicesPage data={data} />;
  if (path === "/products") return <ProductsPage data={data} />;
  if (path === "/blogs" || path === "/blog") return <BlogsPage data={data} />;
  if (path === "/career" || path === "/careers" || path === "/carer" || path === "/carerl") return <CareerPage data={data} />;
  if (["career", "careers", "carer", "carerl"].includes(routeType) && routeSlug) return <CareerDetailPage data={data} slug={routeSlug} />;
  if (path === "/gallery") return <GalleryPage data={data} />;
  if (path === "/videos") return <VideosPage data={data} />;
  if (path === "/faq") return <FaqPage data={data} />;
  if (path === "/contact") return <ContactPage data={data} />;
  if (path === "/my-account") return <MyAccountPage data={data} />;
  if (["/privacy", "/privacy-policy"].includes(path)) return <PolicyPage data={data} type="privacy" />;
  if (["/terms", "/terms-and-conditions"].includes(path)) return <PolicyPage data={data} type="terms" />;
  if (["/refund", "/refund-policy"].includes(path)) return <PolicyPage data={data} type="refund" />;
  if (["/shipping", "/shipping-policy"].includes(path)) return <PolicyPage data={data} type="shipping" />;
  if (path === "/sitemap") return <SitemapPage data={data} />;

  if (detail?.row) {
    return <DetailPage data={data} detail={detail as any} />;
  }
  if (generatedBlogDetail) {
    return <BlogDetailPage data={data} blog={generatedBlogDetail} />;
  }
  if (isBlogDetailRoute && generatedBlogLoading) {
    return <PublicSiteSkeleton />;
  }
  if (isBlogDetailRoute && generatedBlogError) {
    return <BlogsPage data={data} />;
  }

  const hero = data.banners[0];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <SiteHeader data={data} />

      {error && <div className="bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">{error}</div>}

      <main id="home">
        <HeroSlider data={data} hero={hero} />

        <section id="about" className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">About Gauranitai</p>
              <h2 className="mt-3 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">
                Professional cleaning and polishing for spaces that need lasting care.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-slate-600">
              <p>
                Gauranitai provides professional marble polishing, floor cleaning, stone care, and cleaning product solutions for homes, offices, societies, hotels, shops, and commercial spaces.
              </p>
              <p>
                Our goal is to restore shine, improve cleanliness, and maintain the beauty of floors using proper methods, tools, and quality products.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Proper methods", "Quality products", "Surface-safe care", "Reliable support"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Our Services" title="Floor cleaning, polishing and restoration services" actionHref="/contact" actionText="Request Inspection" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.services.filter((service) => service.isFeatured).slice(0, 6).map((service) => (
                <ServiceBookingCard key={service.id} service={service} onBook={setBookingService} />
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Cleaning Products" title="Practical floor care products for daily cleaning and shine maintenance" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.products.filter((product) => product.isFeatured).slice(0, 6).map((product) => (
                <article key={product.id} className="gauranitai-card-shine overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${product.coverImage})` }} />
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{product.sku}</p>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 line-through">Rs. {product.mainPrice}</p>
                        <p className="text-sm font-black text-[#0d3e83]">Rs. {product.discountPrice}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">{product.shortDescription}</p>
                    <p className={`mt-3 text-sm font-bold ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                      >
                        <ShoppingCart className="h-4 w-4" /> Add to cart
                      </button>
                      <a href={`/products/${product.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#0d3e83]">
                        Details <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LazyRender fallback={<HomeLowerSkeleton />}>
          <WhyChooseSection />
          <ProcessSection />

          <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Gallery" title="Before-after results, product photos, and floor care work" actionHref="/gallery" actionText="View Gallery" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {data.gallery.slice(0, 4).map((item) => (
                <a key={item.id} href="/gallery" className="gauranitai-card-shine overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                  <div className="p-4">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.caption}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <VideoReelSection
          videos={data.videos}
          eyebrow="Watch And Learn"
          title="Marble polishing and floor cleaner videos"
          subtitle="See short YouTube demos for polishing, floor cleaning, machine work, and Lizonex cleaner usage."
        />

          <section id="blogs" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Latest Blogs</p>
              <h2 className="mt-3 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">
                Helpful floor care guides for customers
              </h2>
              <form onSubmit={submitHomeBlogSearch} className="mt-6 flex overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                  <Search className="h-4 w-4 flex-none text-slate-400" />
                  <input
                    value={homeBlogQuery}
                    onChange={(event) => setHomeBlogQuery(event.target.value)}
                    placeholder="Search marble, granite, cleaner..."
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold outline-none placeholder:text-slate-400"
                  />
                </div>
                <button type="submit" className="rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-black text-white shadow-sm">
                  Search
                </button>
              </form>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {data.blogs.slice(0, 4).map((blog) => (
                <BlogCard key={blog.id} blog={blog} compact />
              ))}
            </div>
          </div>
        </section>

          <section className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <Testimonials testimonials={data.testimonials} />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">FAQ</p>
              <div className="mt-5 space-y-3">
                {data.faqs.map((faq, index) => (
                  <div key={faq.id} className="rounded-2xl border border-slate-200 bg-white">
                    <button type="button" className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold text-slate-900" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                      {faq.question}
                      <ChevronDown className={`h-5 w-5 flex-none transition ${openFaq === index ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq === index && <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{faq.answer}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

          <section id="contact" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Contact</p>
              <h2 className="mt-3 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">
                Book a service or enquire about products
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Share your floor type, area, location, and requirement. The Gauranitai team can guide you on the right polishing, cleaning, or product solution.
              </p>
              <div className="mt-8 grid gap-3">
                <a href={phoneLink(data.settings)} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-bold text-slate-800">
                  <Phone className="h-5 w-5 text-[#0d3e83]" /> {data.settings.contact.phone}
                </a>
                <a href={whatsappLink(data.settings)} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
                  <MessageCircle className="h-5 w-5" /> WhatsApp Now
                </a>
              </div>
            </div>

            <form className="rounded-3xl border border-slate-200 bg-[#fbfcfe] p-6 shadow-sm" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Your name" />
                <TextInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="Phone number" />
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Service
                  <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.serviceRequired} onChange={(event) => setForm({ ...form, serviceRequired: event.target.value })}>
                    {data.services.map((service) => (
                      <option key={service.id}>{service.title}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Product
                  <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.productRequired} onChange={(event) => setForm({ ...form, productRequired: event.target.value })}>
                    <option value="">No product selected</option>
                    {data.products.map((product) => (
                      <option key={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="Email address" />
                <TextInput label="Location" value={form.address} onChange={(value) => setForm({ ...form, address: value })} placeholder="Area or city" />
                <TextInput label="Floor Type" value={form.floorType} onChange={(value) => setForm({ ...form, floorType: value })} placeholder="Marble, tile, granite..." />
                <TextInput label="Approx Area (Sq Ft)" value={form.approxAreaSqFt} onChange={(value) => setForm({ ...form, approxAreaSqFt: value })} placeholder="Example: 850" />
                <TextInput label="Preferred Date" value={form.preferredDate} onChange={(value) => setForm({ ...form, preferredDate: value })} placeholder="DD/MM/YYYY" />
                <TextInput label="Preferred Time" value={form.preferredTime} onChange={(value) => setForm({ ...form, preferredTime: value })} placeholder="Morning / evening" />
                <TextInput label="Photo / Video Link (Optional)" value={form.attachmentUrl} onChange={(value) => setForm({ ...form, attachmentUrl: value })} placeholder="Paste Google Drive or image link" />
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                Message
                <textarea className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us about your floor type, area size, or product need" />
              </label>
              <button type="button" onClick={submitEnquiry} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
                Send Enquiry <ArrowRight className="h-4 w-4" />
              </button>
              {submitState && <p className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-[#0d3e83]">{submitState}</p>}
            </form>
          </div>
          </section>
        </LazyRender>
      </main>

      <ServiceBookingModal service={bookingService} onClose={() => setBookingService(null)} />
      <SiteFooter data={data} />
      <FloatingActions settings={data.settings} />
      <CustomerChatWidget />
    </div>
  );
}

function SectionHeading({ eyebrow, title, actionHref, actionText }: { eyebrow: string; title: string; actionHref?: string; actionText?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">{eyebrow}</p>
        <h2 className="mt-3 max-w-4xl font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">{title}</h2>
      </div>
      {actionHref && actionText && (
        <a href={actionHref} className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          {actionText} <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function VideoReelSection({
  videos,
  eyebrow = "Watch Videos",
  title = "Watch service demos and product usage videos",
  subtitle = "Swipe through short YouTube demos for marble polishing, floor cleaning, and Lizonex cleaner usage.",
  actionHref = "/videos",
  actionText = "View All Videos",
}: {
  videos: VideoItem[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const visibleVideos = videos.filter((video) => video.isActive).slice(0, 10);
  if (!visibleVideos.length) return null;

  const scrollReel = (direction: number) => {
    reelRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">{eyebrow}</p>
            <h2 className="mt-3 max-w-4xl font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scrollReel(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d3e83] shadow-sm" aria-label="Previous videos">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scrollReel(1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d3e83] shadow-sm" aria-label="Next videos">
              <ChevronRight className="h-5 w-5" />
            </button>
            {actionHref && actionText && (
              <a href={actionHref} className="hidden rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white shadow-sm sm:inline-flex">
                {actionText}
              </a>
            )}
          </div>
        </div>
        <div ref={reelRef} className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {visibleVideos.map((video, index) => (
            <VideoReelCard key={video.id} video={video} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoReelCard({ video, index }: { video: VideoItem; index: number }) {
  const href = videoWatchUrl(video);
  const thumbnail = videoThumbnail(video);
  const relatedLabel = video.relatedProduct || video.relatedService || "Gauranitai";
  const views = ["1.2k", "1.6k", "2.4k", "3.2k", "3.7k", "4.1k"][index % 6];
  const embedUrl = youtubeEmbedUrl(video.videoUrl);

  return (
    <a
      href={href}
      target={video.videoUrl ? "_blank" : undefined}
      rel={video.videoUrl ? "noreferrer" : undefined}
      className="group w-[76vw] max-w-[320px] flex-none snap-start"
    >
      <div className="relative aspect-[9/14] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-100 shadow-sm">
        {embedUrl ? (
          <img src={thumbnail} alt={video.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${thumbnail})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/90" />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Eye className="h-3.5 w-3.5" /> {views}
        </div>
        <div className="absolute left-1/2 top-1/2 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0d3e83] shadow-lg transition group-hover:scale-110">
          <Play className="ml-1 h-6 w-6 fill-current" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.75)] sm:p-4">
          <div className="rounded-2xl bg-black/62 p-3 shadow-xl backdrop-blur-[2px]">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#f5d77e] sm:text-xs sm:tracking-[0.16em]">{video.videoType === "youtube" ? "YouTube Video" : "Video Demo"}</p>
            <h3 className="mt-1.5 line-clamp-2 text-[0.95rem] font-black leading-5 sm:mt-2 sm:text-xl sm:leading-6">{video.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-white/88 sm:mt-2 sm:text-sm sm:leading-5">{video.description}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="line-clamp-1 text-sm font-black text-slate-900">{relatedLabel}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{video.relatedProduct ? "Product demo" : "Service demo"}</p>
        <span className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white">
          Watch Now
        </span>
      </div>
    </a>
  );
}

type BlogContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bulletList" | "checkList" | "orderedList"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; text: string };

function countWords(value = "") {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parseTable(lines: string[]) {
  const rows = lines
    .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
    .filter((row) => row.length > 1);
  const meaningfulRows = rows.filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));
  return {
    headers: meaningfulRows[0] || [],
    rows: meaningfulRows.slice(1),
  };
}

function parseBlogContent(content = ""): BlogContentBlock[] {
  const blocks: BlogContentBlock[] = [];
  const paragraphLines: string[] = [];
  let listType: "bulletList" | "checkList" | "orderedList" | null = null;
  let listItems: string[] = [];
  let tableLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    paragraphLines.length = 0;
  };
  const flushList = () => {
    if (!listType || !listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };
  const flushTable = () => {
    if (!tableLines.length) return;
    const table = parseTable(tableLines);
    if (table.headers.length) blocks.push({ type: "table", ...table });
    tableLines = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushTable();
  };
  const addListItem = (type: "bulletList" | "checkList" | "orderedList", item: string) => {
    flushParagraph();
    flushTable();
    if (listType !== type) flushList();
    listType = type;
    listItems.push(item);
  };

  String(content || "").split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      return;
    }
    if (line.startsWith("|") && line.endsWith("|")) {
      flushParagraph();
      flushList();
      tableLines.push(line);
      return;
    }
    if (line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "heading", level: 3, text: line.replace(/^###\s+/, "") });
      return;
    }
    if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "heading", level: 2, text: line.replace(/^##\s+/, "") });
      return;
    }
    if (/^- \[[ x]\]\s+/i.test(line)) {
      addListItem("checkList", line.replace(/^- \[[ x]\]\s+/i, ""));
      return;
    }
    if (/^\d+\.\s+/.test(line)) {
      addListItem("orderedList", line.replace(/^\d+\.\s+/, ""));
      return;
    }
    if (line.startsWith("- ")) {
      addListItem("bulletList", line.replace(/^-+\s*/, ""));
      return;
    }
    if (line.startsWith("> ")) {
      flushAll();
      blocks.push({ type: "quote", text: line.replace(/^>\s*/, "") });
      return;
    }
    flushList();
    flushTable();
    paragraphLines.push(line);
  });

  flushAll();
  return blocks;
}

function InlineBlogText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = match[2];
    const isExternal = /^https?:\/\//.test(href);
    parts.push(
      <a key={`${href}-${match.index}`} href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className="font-bold text-[#0d3e83] underline decoration-[#c9a24a]/50 underline-offset-4">
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts.length ? parts : text}</>;
}

function blogContentParts(blog: Blog) {
  const blocks = parseBlogContent(blog.content);
  const paragraphs = blocks.filter((block): block is { type: "paragraph"; text: string } => block.type === "paragraph").map((block) => block.text);
  const listPoints = blocks
    .filter((block): block is { type: "bulletList" | "checkList" | "orderedList"; items: string[] } => block.type === "bulletList" || block.type === "checkList" || block.type === "orderedList")
    .flatMap((block) => block.items);
  const headings = blocks.filter((block): block is { type: "heading"; level: 2 | 3; text: string } => block.type === "heading");
  return {
    intro: paragraphs[0] || blog.shortDescription,
    paragraphs,
    points: listPoints.length ? listPoints : blog.tags,
    headings,
    blocks,
    wordCount: countWords(blog.content),
  };
}

function blogFaqSchemaItems(content = "") {
  const faqSection = String(content).split("## Frequently asked questions")[1] || "";
  return faqSection
    .split("\n### ")
    .map((chunk) => chunk.replace(/^###\s*/, "").trim())
    .filter(Boolean)
    .map((chunk) => {
      const [question, ...answerLines] = chunk.split("\n");
      return {
        question: question?.trim() || "",
        answer: answerLines.join(" ").replace(/^#+\s*/, "").trim(),
      };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, 6);
}

function BlogContentRenderer({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="min-w-0 space-y-7">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return block.level === 2 ? (
            <h2 key={`${block.text}-${index}`} className="max-w-full overflow-wrap-anywhere pt-3 font-['Cinzel'] text-[1.65rem] font-semibold leading-tight tracking-normal text-[#092b5c] sm:text-3xl">
              {block.text}
            </h2>
          ) : (
            <h3 key={`${block.text}-${index}`} className="max-w-full overflow-wrap-anywhere pt-2 text-xl font-black text-slate-900">
              {block.text}
            </h3>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={`${block.text}-${index}`} className="max-w-full overflow-wrap-anywhere text-base leading-8 text-slate-600">
              <InlineBlogText text={block.text} />
            </p>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={`${block.text}-${index}`} className="rounded-2xl border-l-4 border-[#c9a24a] bg-[#fffaf0] p-5 text-base font-semibold leading-8 text-[#6f5310]">
              <InlineBlogText text={block.text} />
            </blockquote>
          );
        }
        if (block.type === "table") {
          return (
            <div key={`table-${index}`} className="-mx-2 rounded-2xl border border-slate-200 sm:mx-0">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] divide-y divide-slate-200 text-left text-sm sm:min-w-full">
                  <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.12em]">
                    <tr>
                      {block.headers.map((header) => <th key={header} className="px-3 py-3 font-black sm:px-4">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${row.join("-")}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${cell}-${cellIndex}`} className="px-3 py-3 font-semibold leading-6 text-slate-600 sm:px-4">
                            <InlineBlogText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        if (block.type === "orderedList") {
          return (
            <ol key={`ordered-${index}`} className="max-w-full space-y-3 pl-6 text-base font-semibold leading-7 text-slate-700">
              {block.items.map((item) => (
                <li key={item} className="overflow-wrap-anywhere list-decimal pl-2">
                  <InlineBlogText text={item} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <div key={`${block.type}-${index}`} className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4 sm:grid-cols-2 sm:p-5">
            {block.items.map((item) => (
              <p key={item} className="flex min-w-0 gap-3 overflow-wrap-anywhere text-sm font-semibold leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                <InlineBlogText text={item} />
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function BlogSeoEffect({ data, blog }: { data: BootstrapData; blog: Blog }) {
  useEffect(() => {
    const upsertMeta = (selector: string, attrs: Record<string, string>) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
        document.head.appendChild(element);
      } else {
        Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
      }
    };
    const title = blog.seoTitle || blog.title;
    const description = blog.seoDescription || blog.shortDescription;
    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: blog.seoKeywords || blog.focusKeyword || "" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: blog.openGraphTitle || title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: blog.openGraphDescription || description });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: blog.openGraphImage || blog.featuredImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });

    const faqItems = blogFaqSchemaItems(blog.content);
    const commerceSchema = blog.category === "Cleaning Products"
      ? {
        "@type": "Product",
        name: "Lizonex Marble, Granite, Tiles & Mosaic Cleaner",
        description: "Floor cleaner for marble, granite, tiles and mosaic surfaces.",
        brand: { "@type": "Brand", name: "Lizonex" },
      }
      : {
        "@type": "Service",
        name: blog.focusKeyword || blog.title,
        serviceType: blog.category,
        areaServed: ["Mumbai", "Navi Mumbai", "Thane"],
        provider: { "@type": "LocalBusiness", name: data.settings.brandName },
      };
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: blog.title,
          description,
          image: blog.featuredImage,
          author: { "@type": "Organization", name: blog.author || data.settings.brandName },
          publisher: { "@type": "Organization", name: data.settings.brandName, logo: { "@type": "ImageObject", url: data.settings.logoUrl } },
          datePublished: blog.publishedAt,
          dateModified: blog.updatedAt,
          mainEntityOfPage: blog.canonicalUrl || `/blogs/${blog.slug}`,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Blogs", item: "/blogs" },
            { "@type": "ListItem", position: 3, name: blog.title, item: blog.canonicalUrl || `/blogs/${blog.slug}` },
          ],
        },
        {
          "@type": "LocalBusiness",
          name: data.settings.brandName,
          telephone: data.settings.contact.phone,
          email: data.settings.contact.email,
          address: data.settings.contact.address,
          areaServed: ["Mumbai", "Navi Mumbai", "Thane"],
        },
        {
          "@type": "Organization",
          name: data.settings.brandName,
          logo: data.settings.logoUrl,
          telephone: data.settings.contact.phone,
          email: data.settings.contact.email,
          sameAs: [
            data.settings.contact.instagramLink,
            data.settings.contact.facebookLink,
            data.settings.contact.youtubeLink,
            data.settings.contact.linkedinLink,
          ].filter(Boolean),
        },
        commerceSchema,
        ...(faqItems.length ? [{
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }] : []),
      ],
    };
    let script = document.getElementById("gauranitai-blog-schema") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "gauranitai-blog-schema";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, [blog, data.settings]);

  return null;
}

function BlogCard({ blog, compact = false }: { blog: Blog; compact?: boolean }) {
  const parts = blogContentParts(blog);
  return (
    <article className="gauranitai-card-shine flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5">
      <a href={`/blogs/${blog.slug}`} className="block overflow-hidden bg-slate-100">
        <img src={blog.featuredImage} alt={blog.imageAlt || blog.title} loading="lazy" className={`w-full object-cover transition duration-500 hover:scale-105 ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`} />
      </a>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c9a24a]">{blog.category}</p>
        <h2 className={`${compact ? "text-lg" : "text-xl"} mt-2 font-black leading-tight text-slate-900`}>{blog.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{parts.intro}</p>
        <div className="mt-4 grid gap-2">
          {parts.points.slice(0, 3).map((point) => (
            <p key={point} className="flex gap-2 text-sm font-semibold leading-5 text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
              {point}
            </p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`/blogs/${blog.slug}`} className="inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
            Read Blog <ArrowRight className="h-4 w-4" />
          </a>
          <a href={`/contact?blog=${encodeURIComponent(blog.title)}`} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            Contact Now
          </a>
        </div>
      </div>
    </article>
  );
}

function BlogDetailPage({ data, blog }: { data: BootstrapData; blog: Blog }) {
  const parts = blogContentParts(blog);
  const relatedBlogs = data.blogs.filter((item) => item.id !== blog.id && item.category === blog.category).slice(0, 3);
  const readingMinutes = Math.max(1, Math.ceil(parts.wordCount / 220));
  const tocHeadings = parts.headings.filter((heading) => heading.level === 2).slice(0, 8);

  return (
    <PageShell data={data}>
      <BlogSeoEffect data={data} blog={blog} />
      <main className="overflow-x-hidden bg-white">
        <article className="min-w-0">
          <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto grid max-w-7xl min-w-0 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
              <div className="min-w-0">
                <a href="/blogs" className="mb-5 inline-flex text-sm font-bold text-slate-600 underline underline-offset-4">Back to Blogs</a>
                <p className="inline-flex max-w-full rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#805f13] sm:text-sm sm:tracking-[0.14em]">{blog.category}</p>
                <h1 className="mt-5 max-w-full overflow-wrap-anywhere font-['Cinzel'] text-[2rem] font-semibold leading-[1.12] tracking-normal text-[#092b5c] sm:text-5xl">{blog.title}</h1>
                <p className="mt-5 max-w-full overflow-wrap-anywhere text-base leading-8 text-slate-600 sm:text-lg">{blog.shortDescription}</p>
                <div className="mt-5 flex min-w-0 flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{parts.wordCount.toLocaleString("en-IN")} words</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{readingMinutes} min read</span>
                </div>
                <div className="mt-6 flex min-w-0 flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="max-w-full overflow-wrap-anywhere rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-600 sm:text-xs sm:tracking-[0.12em]">{tag}</span>
                  ))}
                </div>
                <div className="mt-8 flex min-w-0 flex-wrap gap-3">
                  <a href={`/contact?blog=${encodeURIComponent(blog.title)}`} className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
                    Contact Now <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={whatsappLink(data.settings)} className="inline-flex min-w-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Now
                  </a>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f9fb] shadow-xl shadow-blue-950/5">
                <img src={blog.featuredImage} alt={blog.imageAlt || blog.title} className="aspect-[16/10] h-full w-full object-cover" />
              </div>
            </div>
          </section>

          <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                <BlogContentRenderer blocks={parts.blocks} />
              </div>
              <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
                {tocHeadings.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Inside This Guide</p>
                    <div className="mt-4 grid gap-3">
                      {tocHeadings.map((heading) => (
                        <p key={heading.text} className="overflow-wrap-anywhere rounded-2xl bg-[#f7f9fb] px-4 py-3 text-sm font-black text-slate-700">{heading.text}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Checklist</p>
                  <div className="mt-4 grid gap-3">
                    {parts.points.slice(0, 6).map((point) => (
                      <p key={point} className="flex min-w-0 gap-3 overflow-wrap-anywhere text-sm font-semibold leading-6 text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                        {point}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Need Help?</p>
                  <h2 className="mt-3 font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">Talk to Gauranitai</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">Send your floor photos, location, area size, and problem. We will guide you for polishing, deep cleaning, or the right floor cleaner.</p>
                  <div className="mt-5 grid gap-3">
                    <a href={`/contact?blog=${encodeURIComponent(blog.title)}`} className="inline-flex justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Contact Now</a>
                    <a href={phoneLink(data.settings)} className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0d3e83]">Call Now</a>
                    <a href="/services/marble-polishing-service" className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0d3e83]">Marble Polishing</a>
                    <a href="/products/lizonex-floor-cleaner" className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0d3e83]">Lizonex Cleaner</a>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {relatedBlogs.length > 0 && (
            <section className="px-4 py-14 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <SectionHeading eyebrow="Related Blogs" title="More floor care guides" actionHref="/blogs" actionText="View Blogs" />
                <div className="grid gap-5 md:grid-cols-3">
                  {relatedBlogs.map((item) => <BlogCard key={item.id} blog={item} compact />)}
                </div>
              </div>
            </section>
          )}
        </article>
      </main>
    </PageShell>
  );
}

function CareerPage({ data }: { data: BootstrapData }) {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<CareerJob[]>("/api/career-jobs")
      .then((rows) => {
        setJobs(rows);
        setMessage("");
      })
      .catch((err) => setMessage(err.message || "Could not load career openings"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell data={data}>
      <main className="overflow-x-hidden bg-white">
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#805f13]">Careers</p>
              <h1 className="mt-5 overflow-wrap-anywhere font-['Cinzel'] text-[2.4rem] font-semibold leading-tight text-[#092b5c] sm:text-5xl">
                Build your career with Gauranitai
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Apply for marble polishing, floor cleaning, site supervision, operations, and service support roles. Every vacancy has a separate page with role details, checklist, and a simple resume form.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {["Field service roles", "Supervisor openings", "Cleaner helper jobs", "Mumbai service team"].map((item) => (
                  <p key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f7f9fb] shadow-xl shadow-blue-950/5">
              <div className="aspect-[16/10] bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" />
            </div>
          </div>
        </section>

        <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Open Vacancies" title="Choose the job role and apply with your resume" />
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3">
                <SkeletonBlock className="h-72" />
                <SkeletonBlock className="h-72" />
                <SkeletonBlock className="h-72" />
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => (
                  <article key={job.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c9a24a]">{job.department}</p>
                    <h2 className="mt-3 overflow-wrap-anywhere font-['Cinzel'] text-2xl font-semibold text-[#092b5c]">{job.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{job.shortDescription}</p>
                    <div className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
                      <p>Location: {job.location}</p>
                      <p>Type: {job.jobType}</p>
                      <p>Salary: {job.salaryRange}</p>
                    </div>
                    <div className="mt-5 grid gap-2">
                      {job.checklist.slice(0, 3).map((point) => (
                        <p key={point} className="flex gap-2 text-sm font-semibold leading-6 text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /> {point}
                        </p>
                      ))}
                    </div>
                    <a href={`/career/${job.slug}`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
                      View & Apply <ArrowRight className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
            )}
            {!loading && !jobs.length && <p className="rounded-2xl bg-white p-6 text-sm font-bold text-slate-500">No active vacancies right now. Please check again soon.</p>}
            {message && <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-red-600">{message}</p>}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function CareerDetailPage({ data, slug }: { data: BootstrapData; slug: string }) {
  const [job, setJob] = useState<CareerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyState, setApplyState] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  useEffect(() => {
    api<CareerJob>(`/api/career-jobs/${encodeURIComponent(slug)}`)
      .then((row) => {
        setJob(row);
        setError("");
      })
      .catch((err) => setError(err.message || "Career opening not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  async function submitApplication() {
    if (!job) return;
    setApplyState("Submitting application...");
    try {
      if (!resumeFile) throw new Error("Resume is required.");
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(resumeFile.type)) throw new Error("Resume must be PDF, DOC, or DOCX.");
      if (resumeFile.size > 2 * 1024 * 1024) throw new Error("Resume must be under 2MB.");
      const resumeDataUrl = await fileToDataUrl(resumeFile);
      await api<CareerApplication>("/api/career-applications", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          jobSlug: job.slug,
          resumeDataUrl,
          resumeFileName: resumeFile.name,
        }),
      });
      setApplyState("Application submitted. Gauranitai admin can now see it in Career Applications.");
      setForm({ name: "", phone: "", email: "", message: "" });
      setResumeFile(null);
    } catch (err: any) {
      setApplyState(err.message || "Application failed.");
    }
  }

  if (loading) return <PublicSiteSkeleton />;

  if (!job || error) {
    return (
      <PageShell data={data}>
        <main className="bg-white px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="font-['Cinzel'] text-4xl font-semibold text-[#092b5c]">Career opening not found</h1>
          <a href="/career" className="mt-6 inline-flex rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">View Careers</a>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell data={data}>
      <main className="overflow-x-hidden bg-white">
        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <article className="min-w-0">
              <a href="/career" className="mb-5 inline-flex text-sm font-bold text-slate-600 underline underline-offset-4">Back to Careers</a>
              <p className="inline-flex rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#805f13]">{job.department}</p>
              <h1 className="mt-5 overflow-wrap-anywhere font-['Cinzel'] text-[2.2rem] font-semibold leading-tight text-[#092b5c] sm:text-5xl">{job.title}</h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">{job.shortDescription}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.1em] text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">{job.location}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{job.jobType}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{job.salaryRange}</span>
              </div>
              <button type="button" onClick={() => setApplyOpen(true)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-6 py-3 text-sm font-bold text-white">
                Apply Now <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-10 grid gap-8 rounded-3xl border border-slate-200 bg-[#fbfcfe] p-5 sm:p-8">
                <section>
                  <h2 className="font-['Cinzel'] text-2xl font-semibold text-[#092b5c]">About this role</h2>
                  <p className="mt-4 text-base leading-8 text-slate-600">{job.fullDescription}</p>
                </section>
                <DetailList title="Role Checklist" items={job.checklist} />
                <DetailList title="Responsibilities" items={job.responsibilities} />
                <DetailList title="Requirements" items={job.requirements} />
              </div>
            </article>
            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#c9a24a]">Apply for this job</p>
              <h2 className="mt-3 font-['Cinzel'] text-2xl font-semibold text-[#092b5c]">{job.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Keep your resume ready as PDF, DOC, or DOCX under 2MB.</p>
              <button type="button" onClick={() => setApplyOpen(true)} className="mt-5 inline-flex w-full justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Open Apply Form</button>
            </aside>
          </div>
        </section>

        {applyOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6">
            <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9a24a]">Career Application</p>
                  <h2 className="mt-2 font-['Cinzel'] text-2xl font-semibold text-[#092b5c]">{job.title}</h2>
                </div>
                <button type="button" onClick={() => setApplyOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-700" aria-label="Close application form">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 grid gap-4">
                <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextInput label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
                <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Resume Upload
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#0d3e83] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
                  />
                  <span className="text-xs font-semibold text-slate-500">PDF, DOC, or DOCX only. Maximum size 2MB.</span>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Message
                  <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" placeholder="Experience, preferred area, or note for admin" />
                </label>
                <button type="button" onClick={submitApplication} className="inline-flex justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Submit Application</button>
                {applyState && <p className="rounded-xl bg-[#fffaf0] p-3 text-sm font-bold text-[#805f13]">{applyState}</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}

const serviceImageFallbacks = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=900&q=85",
];

function serviceSliderImages(service: Service) {
  const urls = [service.coverImage, ...service.images.map((image) => image.url), ...serviceImageFallbacks]
    .filter((url): url is string => Boolean(url));
  return Array.from(new Set(urls)).slice(0, 3);
}

function ServiceImageSlider({ service }: { service: Service }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => serviceSliderImages(service), [service]);
  const image = images[activeImage] || images[0];
  const previousImage = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage((current) => (current + 1) % images.length);

  useEffect(() => {
    setActiveImage(0);
  }, [service.id]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={`${service.title} service image`}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/60 to-transparent p-3">
        <div className="flex gap-1.5">
          {images.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`Show ${service.title} image ${index + 1}`}
              className={`h-2 rounded-full transition-all ${activeImage === index ? "w-6 bg-[#f4d883]" : "w-2 bg-white/70"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={previousImage} aria-label="Previous service image" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#092b5c] shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={nextImage} aria-label="Next service image" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#092b5c] shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceBookingCard({ service, onBook }: { service: Service; onBook: (service: Service) => void }) {
  const benefits = (service.benefits.length ? service.benefits : service.suitableFor).slice(0, 3);

  return (
    <article className="gauranitai-card-shine overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfe] shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5">
      <ServiceImageSlider service={service} />
      <div className="p-6">
        <p className="mb-3 inline-flex rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#805f13]">{service.category}</p>
        <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold tracking-normal text-[#092b5c]">{service.title}</h3>
        <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">{service.shortDescription}</p>
        <div className="mt-5 grid gap-2">
          {benefits.map((item) => (
            <p key={item} className="flex gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
              {item}
            </p>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => onBook(service)} className="inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
            Book Now <ArrowRight className="h-4 w-4" />
          </button>
          <a href={`/services/${service.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0d3e83]">
            Details
          </a>
        </div>
      </div>
    </article>
  );
}

const emptyServiceBookingForm = {
  name: "",
  phone: "",
  email: "",
  companyName: "",
  requirement: "",
};

function ServiceBookingModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const [form, setForm] = useState(emptyServiceBookingForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!service) return;
    setForm({ ...emptyServiceBookingForm, requirement: service.title });
    setMessage("");
  }, [service?.id]);

  if (!service) return null;
  const activeService = service;

  async function submit() {
    if (!form.name.trim() || !form.phone.trim()) {
      setMessage("Name and phone number are required.");
      return;
    }
    setMessage("Saving booking request...");
    try {
      await api<Lead>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          companyName: form.companyName,
          requirementType: "Service",
          serviceRequired: activeService.title,
          message: form.requirement,
          source: "website",
          priority: "High",
        }),
      });
      setMessage("Booking request saved in admin dashboard.");
      setForm({ ...emptyServiceBookingForm, requirement: activeService.title });
    } catch (err: any) {
      setMessage(err.message || "Could not save booking request");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="inline-flex rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#805f13]">Service Booking</p>
            <h2 className="mt-3 font-['Cormorant_Garamond'] text-3xl font-semibold tracking-normal text-[#092b5c]">{activeService.title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">This lead will appear in Admin Dashboard and Service Bookings with this service name.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close booking form" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-100 text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <TextInput label="Phone Number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <TextInput label="Company Name" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Requirement
            <textarea
              className="min-h-28 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]"
              value={form.requirement}
              onChange={(event) => setForm({ ...form, requirement: event.target.value })}
              placeholder="Tell us your area, floor type, issue, location, or preferred time."
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-[#f7f9fb] p-4 text-sm">
            <p className="font-black text-slate-900">Service source</p>
            <p className="mt-1 font-semibold text-[#0d3e83]">{activeService.title}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={submit} disabled={message === "Saving booking request..."} className="inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300">
              Book Now <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
              Close
            </button>
          </div>
          {message && <p className="rounded-xl bg-[#f7f9fb] p-3 text-sm font-semibold text-[#0d3e83]">{message}</p>}
        </form>
      </div>
    </div>
  );
}

function HeroSlider({ data, hero }: { data: BootstrapData; hero?: Banner }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const cmsSlides = data.banners
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((banner) => ({
      key: `banner-${banner.id}`,
      eyebrow: banner.badgeText || "Premium Stone Care",
      title: banner.title,
      description: banner.subtitle,
      imageUrl: banner.imageUrl || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
      imageEyebrow: banner.badgeText || "Gauranitai",
      imageTitle: banner.title,
      ctaText: banner.ctaText || "Book Service",
      ctaLink: banner.ctaLink || "/contact",
      mode: "cms",
    }));
  const marbleServices = data.services
    .filter((service) => `${service.title} ${service.category}`.toLowerCase().includes("marble"))
    .slice(0, 4);
  const floorProducts = data.products
    .filter((product) => `${product.name} ${product.category}`.toLowerCase().includes("floor"))
    .slice(0, 3);
  const marbleHero = marbleServices[0] || data.services[0];
  const floorHero = floorProducts[0] || data.products[0];
  const fallbackSlides = [
    {
      key: "main",
      eyebrow: hero?.badgeText || "Premium Stone Care",
      title: hero?.title || "Professional Marble Polishing & Floor Cleaning Services",
      description: hero?.subtitle || "Restore shine, remove dullness, and keep your floors fresh with expert marble polishing, floor cleaning, and stone care solutions.",
      imageUrl: hero?.imageUrl || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
      imageEyebrow: "Clean shine result",
      imageTitle: "Marble and floor care that feels calm, clean and premium.",
      ctaText: "Book Service",
      ctaLink: "/contact",
      mode: "main",
    },
    {
      key: "marble",
      eyebrow: "Marble Polishing",
      title: "Diamond marble polishing, restoration and shine finishing",
      description: "Restore dull marble with proper inspection, deep cleaning, diamond pad polishing, crystallization guidance and finishing care for homes, offices, hotels and societies.",
      imageUrl: marbleHero?.coverImage || data.gallery[0]?.imageUrl || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
      imageEyebrow: "Service Finish",
      imageTitle: "Clean reflection, smoother feel and premium floor shine.",
      ctaText: "Book Marble Polishing",
      ctaLink: `/contact?service=${encodeURIComponent(marbleHero?.title || "Marble Polishing Service")}`,
      mode: "marble",
    },
    {
      key: "floor",
      eyebrow: "Floor Cleaner",
      title: "Floor cleaner products for marble, granite, tile and mosaic",
      description: "Choose practical daily cleaning products for homes, offices, shops, societies and commercial spaces. Keep regular floors fresh, clean and easy to maintain between professional services.",
      imageUrl: floorHero?.coverImage || data.products[0]?.coverImage || "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1200&q=85",
      imageEyebrow: "Daily Cleaning",
      imageTitle: "Fresh, clean floors for everyday home and commercial use.",
      ctaText: "View Floor Cleaners",
      ctaLink: "/products",
      mode: "floor",
    },
  ];
  const slides = cmsSlides.length ? cmsSlides : fallbackSlides;
  const slide = slides[activeSlide] || slides[0];
  const slideVideoId = youtubeVideoId(slide.imageUrl);
  const slideVideoUrl = slideVideoId ? youtubeExternalUrl(slide.imageUrl) : "";
  const slideImageUrl = slideVideoId ? youtubeThumbnail(slide.imageUrl, slide.imageUrl) : slide.imageUrl;

  useEffect(() => {
    if (activeSlide >= slides.length) setActiveSlide(0);
  }, [activeSlide, slides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const previousSlide = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const nextSlide = () => setActiveSlide((current) => (current + 1) % slides.length);

  return (
    <section className="gauranitai-energy-section relative overflow-hidden bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,162,74,0.18),transparent_34%),linear-gradient(135deg,rgba(13,62,131,0.08),transparent_38%)]" />
      <EnergySparkLayer />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]">
        <div key={slide.key} className="min-w-0">
          <div className={`gauranitai-spark-badge mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${slide.key === "floor" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#c9a24a]/30 bg-[#fffaf0] text-[#805f13]"}`}>
            {slide.key === "floor" ? <Droplets className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {slide.eyebrow}
          </div>
          <h1 className="max-w-4xl font-['Cinzel'] text-4xl font-semibold tracking-normal text-[#092b5c] sm:text-5xl lg:text-6xl">{slide.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{slide.description}</p>

          {slide.mode === "cms" && (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href={slide.ctaLink}>
                  {slide.ctaText} <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
                <a href="/products" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800">
                  View Products
                </a>
                <a href={whatsappLink(data.settings)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Now
                </a>
                <a href={phoneLink(data.settings)} className="inline-flex items-center gap-2 rounded-full border border-[#c9a24a]/30 bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#805f13]">
                  <Phone className="h-4 w-4" /> Call Now
                </a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["Homes", Home],
                  ["Offices", Building2],
                  ["Hotels", Gem],
                ].map(([label, Icon]) => (
                  <div key={label as string} className="rounded-xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-[#c9a24a]" />
                    <p className="text-sm font-bold text-slate-700">{label as string}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {slide.mode === "main" && (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href="/contact">
                  Book Service <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
                <a href="/products" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800">
                  View Products
                </a>
                <a href={whatsappLink(data.settings)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Now
                </a>
                <a href={phoneLink(data.settings)} className="inline-flex items-center gap-2 rounded-full border border-[#c9a24a]/30 bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#805f13]">
                  <Phone className="h-4 w-4" /> Call Now
                </a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["Homes", Home],
                  ["Offices", Building2],
                  ["Hotels", Gem],
                ].map(([label, Icon]) => (
                  <div key={label as string} className="rounded-xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-[#c9a24a]" />
                    <p className="text-sm font-bold text-slate-700">{label as string}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {slide.mode === "marble" && (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {["Diamond polishing finish", "Italian marble care", "Dullness and stain improvement", "Residential and commercial floors"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4">
                    <Sparkles className="h-5 w-5 flex-none text-[#c9a24a]" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryButton href={`/contact?service=${encodeURIComponent(marbleHero?.title || "Marble Polishing Service")}`}>
                  Book Marble Polishing <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
                <a href="/services" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#0d3e83]">
                  View Services
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {marbleServices.map((service) => (
                  <a key={service.id} href={`/services/${service.slug}`} className="rounded-full bg-[#f7f9fb] px-4 py-2 text-xs font-bold text-slate-700">
                    {service.title}
                  </a>
                ))}
              </div>
            </>
          )}

          {slide.mode === "floor" && (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {["1L and 5L floor cleaner packs", "Suitable for daily mopping", "For marble, granite, tiles and mosaic", "Useful for homes and high-traffic spaces"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <Droplets className="h-5 w-5 flex-none text-emerald-600" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryButton href="/products">
                  View Floor Cleaners <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
                {floorHero && (
                  <button type="button" onClick={() => addToCart(floorHero.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#0d3e83]">
                    <ShoppingCart className="h-4 w-4" /> Add 1L Cleaner
                  </button>
                )}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {floorProducts.map((product) => (
                  <a key={product.id} href={`/products/${product.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{product.sku}</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{product.name}</p>
                    <p className="mt-2 text-sm font-black text-[#0d3e83]">{money(product.discountPrice)}</p>
                  </a>
                ))}
              </div>
            </>
          )}

          <div className="mt-10 flex items-center gap-3">
            <button type="button" onClick={previousSlide} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d3e83] shadow-sm" aria-label="Previous slide">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-9 bg-[#0d3e83]" : "w-2.5 bg-slate-300"}`}
                  aria-label={`Show ${item.eyebrow} slide`}
                />
              ))}
            </div>
            <button type="button" onClick={nextSlide} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d3e83] shadow-sm" aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <div className="gauranitai-energy-card overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-950/10">
            <div
              key={`${slide.key}-image`}
              className="gauranitai-image-shine relative aspect-[4/5] overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${slideImageUrl})` }}
            >
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#092b5c]/82 via-black/18 to-black/15" />
              {slideVideoUrl ? (
                <a
                  href={slideVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  aria-label={`Play ${slide.imageTitle}`}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-3 text-sm font-black text-[#0d3e83] shadow-xl backdrop-blur">
                    <Play className="h-5 w-5 fill-[#0d3e83]" /> Play Video
                  </span>
                </a>
              ) : null}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 p-4 text-white sm:p-6">
                <div className="rounded-[1.35rem] bg-black/60 p-3 shadow-2xl backdrop-blur-[2px] sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f4d883] sm:text-sm sm:tracking-[0.18em]">{slide.imageEyebrow}</p>
                  <h2 className="mt-1.5 font-['Cormorant_Garamond'] text-2xl font-semibold leading-tight tracking-normal text-white sm:mt-2 sm:text-4xl">{slide.imageTitle}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DualFocusSections({ data }: { data: BootstrapData }) {
  const marbleServices = data.services
    .filter((service) => `${service.title} ${service.category}`.toLowerCase().includes("marble"))
    .slice(0, 4);
  const floorProducts = data.products
    .filter((product) => `${product.name} ${product.category}`.toLowerCase().includes("floor"))
    .slice(0, 3);
  const marbleHero = marbleServices[0] || data.services[0];
  const floorHero = floorProducts[0] || data.products[0];

  return (
    <>
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <p className="inline-flex rounded-full border border-[#c9a24a]/25 bg-[#fffaf0] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-[#805f13]">
              Marble Polishing
            </p>
            <h2 className="mt-5 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-5xl">
              Diamond marble polishing, restoration and shine finishing
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Restore dull marble with proper inspection, deep cleaning, diamond pad polishing, crystallization guidance and finishing care for homes, offices, hotels and societies.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Diamond polishing finish", "Italian marble care", "Dullness and stain improvement", "Residential and commercial floors"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4">
                  <Sparkles className="h-5 w-5 flex-none text-[#c9a24a]" />
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton href={`/contact?service=${encodeURIComponent(marbleHero?.title || "Marble Polishing Service")}`}>
                Book Marble Polishing <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <a href="/services" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#0d3e83]">
                View Services
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {marbleServices.map((service) => (
                <a key={service.id} href={`/services/${service.slug}`} className="rounded-full bg-[#f7f9fb] px-4 py-2 text-xs font-bold text-slate-700">
                  {service.title}
                </a>
              ))}
            </div>
          </div>
          <div className="order-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f7f9fb] shadow-xl shadow-blue-950/5 lg:order-2">
            <div className="relative aspect-[5/4] bg-cover bg-center" style={{ backgroundImage: `url(${marbleHero?.coverImage || data.gallery[0]?.imageUrl || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#092b5c]/75 via-transparent to-white/5" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4d883] sm:text-xs sm:tracking-[0.18em]">Service Finish</p>
                <h3 className="mt-1.5 font-['Cormorant_Garamond'] text-2xl font-semibold leading-tight tracking-normal sm:mt-2 sm:text-4xl">Clean reflection, smoother feel and premium floor shine.</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
            <div className="relative aspect-[5/4] bg-cover bg-center" style={{ backgroundImage: `url(${floorHero?.coverImage || data.products[0]?.coverImage || "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1200&q=85"})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#092b5c]/70 via-transparent to-white/10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4d883] sm:text-xs sm:tracking-[0.18em]">Daily Cleaning</p>
                <h3 className="mt-1.5 font-['Cormorant_Garamond'] text-2xl font-semibold leading-tight tracking-normal sm:mt-2 sm:text-4xl">Fresh, clean floors for everyday home and commercial use.</h3>
              </div>
            </div>
          </div>
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
              Floor Cleaner
            </p>
            <h2 className="mt-5 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-5xl">
              Floor cleaner products for marble, granite, tile and mosaic
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Choose practical daily cleaning products for homes, offices, shops, societies and commercial spaces. Keep regular floors fresh, clean and easy to maintain between professional services.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["1L and 5L floor cleaner packs", "Suitable for daily mopping", "For marble, granite, tiles and mosaic", "Useful for homes and high-traffic spaces"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Droplets className="h-5 w-5 flex-none text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton href="/products">
                View Floor Cleaners <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              {floorHero && (
                <button type="button" onClick={() => addToCart(floorHero.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#0d3e83]">
                  <ShoppingCart className="h-4 w-4" /> Add 1L Cleaner
                </button>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {floorProducts.map((product) => (
                <a key={product.id} href={`/products/${product.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{product.sku}</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{product.name}</p>
                  <p className="mt-2 text-sm font-black text-[#0d3e83]">{money(product.discountPrice)}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function WhyChooseSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Why Choose Us</p>
          <h2 className="mt-3 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">
            Service-focused work with clean, trustworthy execution
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Trained team", BadgeCheck],
              ["Marble-safe methods", ShieldCheck],
              ["Premium finish", Sparkles],
              ["Clean product guidance", Leaf],
            ].map(([label, Icon]) => (
              <div key={label as string} className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                <Icon className="mb-4 h-6 w-6 text-[#c9a24a]" />
                <p className="font-bold text-slate-900">{label as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[#092b5c] p-6 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f4d883]">Before & After</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-slate-800">
              <div className="aspect-[4/5] bg-[url('https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-75 grayscale" />
              <p className="p-4 text-sm font-bold text-slate-200">Before: dull surface</p>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white">
              <div className="aspect-[4/5] bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
              <p className="p-4 text-sm font-bold text-[#092b5c]">After: clean shine</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = ["Floor inspection", "Area protection", "Deep cleaning", "Polishing treatment", "Shine finishing", "Care guidance"];
  return (
    <section className="bg-[#f7f9fb] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Our Process" title="Simple steps from inspection to maintenance guidance" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#0d3e83] text-sm font-black text-white">{index + 1}</p>
              <p className="font-bold text-slate-800">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const testimonial = testimonials[0];
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Testimonials</p>
      <h2 className="mt-3 font-['Cinzel'] text-3xl font-semibold tracking-normal text-[#092b5c] sm:text-4xl">
        Trusted by homes and commercial spaces
      </h2>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex gap-1 text-[#c9a24a]">
          {[1, 2, 3, 4, 5].map((item) => (
            <Star key={item} className="h-5 w-5 fill-current" />
          ))}
        </div>
        <p className="text-lg leading-8 text-slate-700">{testimonial?.review || "Gauranitai helped us restore a clean floor shine with professional service."}</p>
        <p className="mt-5 font-bold text-[#092b5c]">{testimonial?.customerName || "Customer"}</p>
      </div>
    </div>
  );
}

function SiteFooter({ data }: { data: BootstrapData }) {
  const quickLinks = [
    ["Home", "/"],
    ["About Us", "/about-us"],
    ["Services", "/services"],
    ["Products", "/products"],
    ["Blogs", "/blogs"],
    ["Career", "/career"],
    ["Contact", "/contact"],
  ];
  const legalLinks = [
    ["Privacy Policy", "/privacy-policy"],
    ["Terms & Conditions", "/terms-and-conditions"],
    ["Refund Policy", "/refund-policy"],
    ["Shipping Policy", "/shipping-policy"],
    ["Sitemap Page", "/sitemap"],
    ["Sitemap XML", "/sitemap.xml"],
  ];

  return (
    <footer className="bg-[#092b5c] px-4 pb-32 pt-12 text-white sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_1fr]">
        <div>
          <img src={logoImage} alt="Gauranitai logo" className="mb-4 h-14 w-14 rounded-full bg-white object-contain" />
          <h2 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-white">{data.settings.brandName}</h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-200">{data.settings.tagline}</p>
        </div>
        <div>
          <p className="mb-4 font-bold text-[#f4d883]">Quick Links</p>
          <div className="grid gap-2 text-sm text-slate-200">
            {quickLinks.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-white">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 font-bold text-[#f4d883]">Services</p>
          <div className="grid gap-2 text-sm text-slate-200">
            {data.services.slice(0, 4).map((service) => (
              <a key={service.id} href={`/services/${service.slug}`} className="hover:text-white">
                {service.title}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 font-bold text-[#f4d883]">Products</p>
          <div className="grid gap-2 text-sm text-slate-200">
            {data.products.slice(0, 4).map((product) => (
              <a key={product.id} href={`/products/${product.slug}`} className="hover:text-white">
                {product.name}
              </a>
            ))}
          </div>
          <p className="mb-4 mt-6 font-bold text-[#f4d883]">Legal</p>
          <div className="grid gap-2 text-sm text-slate-200">
            {legalLinks.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-white">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 font-bold text-[#f4d883]">Contact</p>
          <p className="text-sm leading-7 text-slate-200">{data.settings.contact.phone}</p>
          <p className="text-sm leading-7 text-slate-200">{data.settings.contact.email}</p>
          <p className="text-sm leading-7 text-slate-200">{data.settings.contact.address}</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 break-words border-t border-white/10 pt-6 text-sm text-slate-300 [overflow-wrap:anywhere] md:flex-row md:items-center md:justify-between">
        <span>Copyright Gauranitai. All rights reserved.</span>
        <span className="text-slate-400">Professional marble polishing, floor cleaning, and Lizonex cleaner products.</span>
      </div>
    </footer>
  );
}

function FloatingActions({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <a href={whatsappLink(settings)} className="gauranitai-soft-pulse fixed bottom-6 right-4 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-950/25 lg:flex" aria-label="WhatsApp Gauranitai">
        <MessageCircle className="h-6 w-6" />
      </a>
      <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white p-2 lg:hidden">
        <a href={phoneLink(settings)} className="flex items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-4 py-3 text-sm font-bold text-white">
          <Phone className="h-4 w-4" /> Call Now
        </a>
        <a href={whatsappLink(settings)} className="ml-2 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>
    </>
  );
}

function PageShell({ data, children }: { data: BootstrapData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24 text-slate-900 lg:pb-0">
      <SiteHeader data={data} />
      {children}
      <SiteFooter data={data} />
      <FloatingActions settings={data.settings} />
      <CustomerChatWidget />
    </div>
  );
}

function PageHero({ eyebrow, title, subtitle, imageUrl }: { eyebrow: string; title: string; subtitle: string; imageUrl?: string }) {
  return (
    <section className="gauranitai-energy-section relative overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-8">
      <EnergySparkLayer />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="gauranitai-spark-badge inline-flex rounded-full border border-[#c9a24a]/25 bg-[#fffaf0] px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#805f13]">{eyebrow}</p>
          <h1 className="mt-3 font-['Cinzel'] text-4xl font-semibold tracking-normal text-[#092b5c] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{subtitle}</p>
        </div>
        <div className="gauranitai-energy-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
          <div
            className="gauranitai-image-shine aspect-[16/9] bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85"})` }}
          />
        </div>
      </div>
    </section>
  );
}

function AboutPage({ data }: { data: BootstrapData }) {
  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="About Gauranitai"
          title="Professional floor cleaning and stone care with a calm premium finish"
          subtitle="Gauranitai provides marble polishing, floor cleaning, stone care, and cleaning product solutions for homes, offices, societies, hotels, shops, and commercial spaces."
          imageUrl={data.banners[0]?.imageUrl}
        />
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
            {[
              ["Mission", "Restore shine, improve cleanliness, and protect the beauty of floors with proper methods and quality products."],
              ["Vision", "Build a trusted cleaning and polishing brand for residential and commercial spaces."],
              ["Service Quality", "Use trained handling, floor-safe care, clear communication, and practical maintenance guidance."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c9a24a]">{title}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <VideoReelSection
          videos={data.videos}
          eyebrow="Work Videos"
          title="See how Gauranitai handles polishing and cleaning work"
          subtitle="Short YouTube videos help customers understand the process, result quality, and product usage before booking."
        />
        <WhyChooseSection />
        <ProcessSection />
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Customer Trust" title="Reliable service for homes, offices, societies, hotels, shops, and commercial floors" actionHref="/contact" actionText="Contact Gauranitai" />
            <div className="grid gap-4 md:grid-cols-4">
              {["Marble polishing", "Floor deep cleaning", "Stone restoration", "Daily care products"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                  <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-600" />
                  <p className="font-bold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function ServicesPage({ data }: { data: BootstrapData }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const categories = useMemo(() => ["All", ...Array.from(new Set(data.services.map((service) => service.category)))], [data.services]);
  const services = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.services.filter((service) => {
      const matchesCategory = category === "All" || service.category === category;
      const matchesQuery = !needle || `${service.title} ${service.shortDescription} ${service.category}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, data.services, query]);

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Services"
          title="All marble polishing, floor cleaning, and stone care services"
          subtitle="Browse professional services for residential and commercial floors, then open any service detail page for process, benefits, FAQs, and booking options."
          imageUrl={data.services[0]?.coverImage}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-[#0d3e83]" />
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-700"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceBookingCard key={service.id} service={service} onBook={setBookingService} />
              ))}
            </div>
            {!services.length && <p className="mt-8 rounded-2xl bg-white p-8 text-center font-semibold text-slate-500">No services found.</p>}
          </div>
        </section>
      </main>
      <ServiceBookingModal service={bookingService} onClose={() => setBookingService(null)} />
    </PageShell>
  );
}

function ProductsPage({ data }: { data: BootstrapData }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const categories = useMemo(() => ["All", ...Array.from(new Set(data.products.map((product) => product.category)))], [data.products]);
  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = data.products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = !needle || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
    return [...rows].sort((a, b) => {
      if (sort === "price-low") return a.discountPrice - b.discountPrice;
      if (sort === "price-high") return b.discountPrice - a.discountPrice;
      if (sort === "stock") return b.stock - a.stock;
      return Number(b.isFeatured) - Number(a.isFeatured);
    });
  }, [category, data.products, query, sort]);

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Products"
          title="Cleaning and floor care products"
          subtitle="Shop floor cleaner, marble cleaner, granite cleaner, tile cleaner, mosaic cleaner, and heavy-duty cleaning products with live stock and checkout."
          imageUrl={data.products[0]?.coverImage}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or SKU" className="rounded-xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-[#0d3e83]" />
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-[#0d3e83]">
                <option value="featured">Featured first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="stock">Stock: high to low</option>
              </select>
              <div className="flex max-w-full gap-2 overflow-x-auto">
                {categories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-700"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="gauranitai-card-shine overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${product.coverImage})` }} />
                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{product.category}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 line-through">{money(product.mainPrice)}</p>
                        <p className="text-base font-black text-[#0d3e83]">{money(product.discountPrice)}</p>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">{product.shortDescription}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className={`font-bold ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>{product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}</span>
                      <span className="font-bold text-slate-500">{product.unit}</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" disabled={product.stock <= 0} onClick={() => addToCart(product.id)} className="inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                        <ShoppingCart className="h-4 w-4" /> Add to cart
                      </button>
                      <a href={`/products/${product.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#0d3e83]">
                        Details <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!products.length && <p className="mt-8 rounded-2xl bg-white p-8 text-center font-semibold text-slate-500">No products found.</p>}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function BlogsPage({ data }: { data: BootstrapData }) {
  const initialBlogParams = new URLSearchParams(window.location.search);
  const [category, setCategory] = useState(initialBlogParams.get("category") || "All");
  const [query, setQuery] = useState(initialBlogParams.get("q") || "");
  const [generatedResult, setGeneratedResult] = useState<GeneratedBlogSearchResult>({ total: 0, offset: 0, limit: 120, categories: [], blogs: [] });
  const [generatedLoading, setGeneratedLoading] = useState(true);
  const normalizedQuery = query.trim().toLowerCase();

  const categories = useMemo(() => {
    const values = new Set<string>();
    data.blogs.forEach((blog) => blog.category && values.add(blog.category));
    data.blogTopics.forEach((topic) => topic.category && values.add(topic.category));
    generatedResult.categories.forEach((item) => item && values.add(item));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [data.blogTopics, data.blogs, generatedResult.categories]);

  const blogs = useMemo(() => {
    return data.blogs.filter((blog) => {
      const matchesCategory = category === "All" || blog.category === category;
      const searchText = [
        blog.title,
        blog.slug,
        blog.category,
        blog.shortDescription,
        blog.content,
        blog.focusKeyword,
        blog.seoTitle,
        blog.seoDescription,
        blog.seoKeywords,
        blog.imageAlt,
        ...(Array.isArray(blog.tags) ? blog.tags : []),
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, data.blogs, normalizedQuery]);

  const topicIdeas = useMemo(() => {
    return data.blogTopics.filter((topic) => {
      const matchesCategory = category === "All" || topic.category === category;
      const searchText = [topic.title, topic.category, topic.focusKeyword, topic.suggestedSlug, topic.priority, topic.status].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, data.blogTopics, normalizedQuery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (category !== "All") params.set("category", category);
    else params.delete("category");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [category, query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("limit", "120");
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    setGeneratedLoading(true);
    api<GeneratedBlogSearchResult>(`/api/blogs/generated?${params.toString()}`, { signal: controller.signal })
      .then(setGeneratedResult)
      .catch((err) => {
        if (err.name !== "AbortError") setGeneratedResult({ total: 0, offset: 0, limit: 120, categories: [], blogs: [] });
      })
      .finally(() => setGeneratedLoading(false));
    return () => controller.abort();
  }, [category, query]);

  function clearBlogSearch() {
    setQuery("");
    setCategory("All");
  }

  function submitBlogSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  const hasSearch = Boolean(normalizedQuery || category !== "All");
  const totalMatches = blogs.length + topicIdeas.length + generatedResult.total;

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Blogs"
          title="Floor care guides and cleaning tips"
          subtitle="Read simple, useful guides about marble polishing, floor cleaning, granite care, tile cleaning, and product maintenance."
          imageUrl={data.blogs[0]?.featuredImage}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <form onSubmit={submitBlogSearch} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-[#0d3e83]">
                  <Search className="h-5 w-5 flex-none text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search marble polishing, floor cleaner, Mumbai, granite, tile..."
                    className="min-w-0 flex-1 py-3 font-semibold outline-none placeholder:text-slate-400"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="Clear search">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d3e83] px-6 py-3 font-black text-white">
                  <Search className="h-4 w-4" /> Search Blogs
                </button>
              </form>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => (
                  <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-700"}`}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
                <span>
                  {hasSearch ? `Found ${totalMatches.toLocaleString("en-IN")} result${totalMatches === 1 ? "" : "s"}: ${blogs.length} manual blog${blogs.length === 1 ? "" : "s"}, ${generatedResult.total.toLocaleString("en-IN")} generated SEO blog${generatedResult.total === 1 ? "" : "s"}, and ${topicIdeas.length} topic idea${topicIdeas.length === 1 ? "" : "s"}.` : `Search ${data.blogs.length} manual blogs, ${generatedResult.total.toLocaleString("en-IN")} generated SEO blogs, and ${data.blogTopics.length} SEO topic ideas.`}
                </span>
                {hasSearch && (
                  <button type="button" onClick={clearBlogSearch} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0d3e83]">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            <div id="blog-results" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
            {!blogs.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">No published blogs found for this search.</p>}
            <div className="mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Generated SEO Blogs</p>
                  <h2 className="mt-2 font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">5000+ location and intent-based blog pages</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                  {generatedLoading ? "Loading..." : `Showing ${generatedResult.blogs.length} of ${generatedResult.total.toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {generatedResult.blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
              {!generatedLoading && !generatedResult.blogs.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">No generated SEO blogs matched this search.</p>}
            </div>
            {topicIdeas.length > 0 && (
              <div className="mt-12">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">SEO Topic Ideas</p>
                    <h2 className="mt-2 font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">Matching blog ideas from admin list</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">{topicIdeas.length} ideas</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topicIdeas.slice(0, 18).map((topic) => (
                    <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#fff7e4] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#9a6d12]">{topic.priority}</span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{topic.status}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-black leading-6 text-slate-900">{topic.title}</h3>
                      <p className="mt-3 text-sm font-semibold text-slate-500">{topic.category}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Focus keyword: <span className="font-bold text-[#0d3e83]">{topic.focusKeyword}</span>
                      </p>
                      <p className="mt-3 break-words rounded-xl bg-[#f7f9fb] p-3 text-xs font-semibold text-slate-500">/{topic.suggestedSlug}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {!totalMatches && <p className="mt-6 rounded-2xl bg-[#fff7e4] p-6 text-center font-semibold text-[#8a6414]">Try a different keyword like marble polishing, floor cleaner, granite, tile, Mumbai, Dadar, Bandra, or office cleaning.</p>}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function ContactLeadForm({ data }: { data: BootstrapData }) {
  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service") || data.services[0]?.title || "";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    requirementType: "Service",
    serviceRequired: requestedService,
    productRequired: "",
    address: "",
    floorType: "",
    approxAreaSqFt: "",
    preferredDate: "",
    preferredTime: "",
    attachmentUrl: "",
    message: "",
  });
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("Sending...");
    try {
      await api<Lead>("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          attachments: form.attachmentUrl ? [form.attachmentUrl] : [],
        }),
      });
      setMessage("Your enquiry has been saved.");
      setForm({ ...form, name: "", phone: "", email: "", companyName: "", address: "", floorType: "", approxAreaSqFt: "", preferredDate: "", preferredTime: "", attachmentUrl: "", message: "" });
    } catch (err: any) {
      setMessage(err.message || "Could not submit enquiry");
    }
  }

  return (
    <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <TextInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <TextInput label="Company Name" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Requirement
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.requirementType} onChange={(event) => setForm({ ...form, requirementType: event.target.value, serviceRequired: event.target.value === "Service" ? data.services[0]?.title || "" : "", productRequired: event.target.value === "Product" ? data.products[0]?.name || "" : "" })}>
            <option>Service</option>
            <option>Product</option>
            <option>General</option>
          </select>
        </label>
        {form.requirementType === "Service" ? (
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Service
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.serviceRequired} onChange={(event) => setForm({ ...form, serviceRequired: event.target.value })}>
              {data.services.map((service) => (
                <option key={service.id}>{service.title}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Product
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.productRequired} onChange={(event) => setForm({ ...form, productRequired: event.target.value })}>
              {form.requirementType === "General" && <option value="">General enquiry</option>}
              {data.products.map((product) => (
                <option key={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
        )}
        <TextInput label="Address / Area" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        {form.requirementType === "Service" && (
          <>
            <TextInput label="Floor Type" value={form.floorType} onChange={(value) => setForm({ ...form, floorType: value })} />
            <TextInput label="Approx Area (Sq Ft)" value={form.approxAreaSqFt} onChange={(value) => setForm({ ...form, approxAreaSqFt: value })} />
            <TextInput label="Preferred Date" value={form.preferredDate} onChange={(value) => setForm({ ...form, preferredDate: value })} />
            <TextInput label="Preferred Time" value={form.preferredTime} onChange={(value) => setForm({ ...form, preferredTime: value })} />
            <TextInput label="Photo / Video Link (Optional)" value={form.attachmentUrl} onChange={(value) => setForm({ ...form, attachmentUrl: value })} />
          </>
        )}
      </div>
      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        Message
        <textarea className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      </label>
      <button type="button" onClick={submit} className="mt-5 inline-flex w-full justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
        Send Enquiry
      </button>
      {message && <p className="mt-4 rounded-xl bg-[#f7f9fb] p-3 text-sm font-semibold text-[#0d3e83]">{message}</p>}
    </form>
  );
}

function ContactPage({ data }: { data: BootstrapData }) {
  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Contact"
          title="Book service or enquire about products"
          subtitle="Share your requirement, floor type, location, and product need. The Gauranitai team will respond with suitable guidance."
          imageUrl={data.gallery[0]?.imageUrl || data.banners[0]?.imageUrl}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl bg-[#092b5c] p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f4d883]">Gauranitai Contact</p>
              <div className="mt-6 grid gap-4">
                <a href={phoneLink(data.settings)} className="rounded-2xl bg-white/10 p-4 font-bold text-white">{data.settings.contact.phone}</a>
                <a href={whatsappLink(data.settings)} className="rounded-2xl bg-emerald-500 p-4 font-bold text-white">WhatsApp Now</a>
                <a href={`mailto:${data.settings.contact.email}`} className="rounded-2xl bg-white/10 p-4 font-bold text-white">{data.settings.contact.email}</a>
                <p className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-100">{data.settings.contact.address}</p>
                <p className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-slate-100">{data.settings.contact.workingHours}</p>
              </div>
              {data.settings.contact.googleMapLink && (
                <a href={data.settings.contact.googleMapLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[#092b5c]">
                  Open Map
                </a>
              )}
            </div>
            <ContactLeadForm data={data} />
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function MyAccountPage({ data }: { data: BootstrapData }) {
  const [login, setLogin] = useState({ name: "", phone: "", email: "", orderNumber: "" });
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);

  async function loadOrders() {
    try {
      const rows = await api<Order[]>("/api/customer/orders");
      setOrders(rows);
      setMessage(rows.length ? `${rows.length} order found in your history.` : "No previous orders found for this login.");
    } catch (err: any) {
      setOrders([]);
      setMessage(err.message || "Could not find orders");
    }
  }

  useEffect(() => {
    api<{ customer: CustomerSession | null }>("/api/customer/me")
      .then(async (value) => {
        setCustomer(value.customer);
        if (value.customer) await loadOrders();
      })
      .catch(() => setCustomer(null))
      .finally(() => setChecking(false));
  }, []);

  async function loginCustomer() {
    setMessage("Logging in...");
    try {
      const value = await api<{ customer: CustomerSession }>("/api/customer/login", {
        method: "POST",
        body: JSON.stringify(login),
      });
      setCustomer(value.customer);
      window.dispatchEvent(new Event("gauranitai-customer-updated"));
      await loadOrders();
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    }
  }

  async function logoutCustomer() {
    await api<{ success: boolean }>("/api/customer/logout", { method: "POST" });
    setCustomer(null);
    setOrders([]);
    window.dispatchEvent(new Event("gauranitai-customer-updated"));
    setMessage("Logged out.");
  }

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="My Account"
          title="Customer login, order history, and support chat"
          subtitle="Login with your order phone, email, or order number to view your full order history and chat directly with admin."
          imageUrl={data.products[0]?.coverImage}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-slate-900">{customer ? "Customer Profile" : "Customer Login"}</h2>
              {checking ? (
                <p className="mt-5 rounded-2xl bg-[#f7f9fb] p-5 text-sm font-semibold text-slate-500">Checking login...</p>
              ) : customer ? (
                <div className="mt-5 grid gap-4">
                  <div className="min-w-0 overflow-hidden rounded-2xl bg-[#f7f9fb] p-4">
                    <p className="text-sm font-bold text-slate-500">Logged in as</p>
                    <p className="mt-1 break-words text-lg font-black uppercase leading-tight text-[#0d3e83] [overflow-wrap:anywhere] sm:text-xl">{customer.name}</p>
                    <div className="mt-2 flex min-w-0 flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <span className="break-all">{customer.phone || "-"}</span>
                      <span className="hidden text-slate-300 sm:inline">|</span>
                      <span className="break-all">{customer.email || "-"}</span>
                    </div>
                  </div>
                  <button type="button" onClick={loadOrders} className="rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Refresh Order History</button>
                  <button type="button" onClick={logoutCustomer} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Logout</button>
                  <CustomerChatPanel customer={customer} />
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  <TextInput label="Name" value={login.name} onChange={(value) => setLogin({ ...login, name: value })} />
                  <TextInput label="Phone" value={login.phone} onChange={(value) => setLogin({ ...login, phone: value })} />
                  <TextInput label="Email" value={login.email} onChange={(value) => setLogin({ ...login, email: value })} />
                  <TextInput label="Order Number (Optional)" value={login.orderNumber} onChange={(value) => setLogin({ ...login, orderNumber: value })} />
                  <button type="button" onClick={loginCustomer} className="rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Login & View History</button>
                  <p className="rounded-2xl bg-[#f7f9fb] p-4 text-sm font-semibold text-slate-500">Login is required before order history and website chat are shown.</p>
                </div>
              )}
              {message && <p className="mt-4 rounded-xl bg-[#f7f9fb] p-3 text-sm font-semibold text-[#0d3e83]">{message}</p>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">My Order History</h2>
              <div className="mt-5 grid gap-4">
                {customer && orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all font-black text-slate-900">{order.orderNumber}</p>
                        <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">{order.customerName} | {order.phone}</p>
                      </div>
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>
                    <div className="mt-4">
                      <OrderProgress status={order.orderStatus} />
                      <p className="mt-3 text-sm font-semibold text-slate-500">{orderStatusMeta(order.orderStatus).note}</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {orderItems(order).map((item) => {
                        const product = data.products.find((row) => row.id === item.productId);
                        return (
                          <div key={`${order.id}-${item.id}`} className="flex items-center gap-3 rounded-xl bg-white p-3">
                            {product && <img src={product.coverImage} alt={product.imageAltText} className="h-14 w-14 rounded-xl object-cover" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-slate-900">{item.productName}</p>
                              <p className="text-sm text-slate-500">Qty {item.quantity} | GST {money(item.gstAmount)}</p>
                            </div>
                            <p className="font-black text-[#0d3e83]">{money(item.totalPrice)}</p>
                          </div>
                        );
                      })}
                    </div>
                    {order.orderStatus === "Delivered" && orderItems(order).length > 0 && (
                      <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="font-black text-emerald-900">Share product review</p>
                        {orderItems(order).map((item) => (
                          <ProductReviewForm key={`${order.id}-${item.productId}-review`} order={order} productId={item.productId} productName={item.productName} />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                      <Info label="Payment" value={order.paymentStatus} />
                      <Info label="Delivery" value={money(order.deliveryCharge)} />
                      <Info label="Total" value={money(order.totalAmount)} />
                    </div>
                    <a href="/products" className="mt-5 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#0d3e83]">Reorder</a>
                  </article>
                ))}
                {!customer && <p className="rounded-2xl bg-[#f7f9fb] p-8 text-center font-semibold text-slate-500">Login first to see your order history.</p>}
                {customer && !orders.length && <p className="rounded-2xl bg-[#f7f9fb] p-8 text-center font-semibold text-slate-500">No orders found for this login.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function CustomerChatPanel({ customer }: { customer: CustomerSession }) {
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  function appendMessage(chatMessage: ChatMessage) {
    setMessages((current) => current.some((item) => item.id === chatMessage.id) ? current : [...current, chatMessage]);
  }

  function updateThread(chatThread: ChatThread) {
    setThread(chatThread);
    setStatus("");
  }

  useEffect(() => {
    let cancelled = false;
    setStatus("Loading chat...");
    Promise.all([
      api<ChatThread>("/api/customer/chat/thread"),
      api<ChatMessage[]>("/api/customer/chat/messages"),
    ])
      .then(([chatThread, chatMessages]) => {
        if (cancelled) return;
        setThread(chatThread);
        setMessages(chatMessages);
        setStatus("");
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.message || "Could not load chat");
      });

    const nextSocket = io({ path: "/socket.io", withCredentials: true });
    setSocket(nextSocket);
    nextSocket.on("connect", () => {
      nextSocket.emit("customer:join", {}, (response: any) => {
        if (response?.thread) updateThread(response.thread);
        if (response?.messages) setMessages(response.messages);
        if (response?.error) setStatus(response.error);
      });
    });
    nextSocket.on("connect_error", () => {
      setStatus("Live chat is reconnecting. Messages can still be sent.");
    });
    nextSocket.on("chat:message", (chatMessage: ChatMessage) => {
      appendMessage(chatMessage);
    });
    nextSocket.on("chat:thread", updateThread);
    return () => {
      cancelled = true;
      nextSocket.disconnect();
    };
  }, [customer.phone, customer.email]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage() {
    const message = text.trim();
    if (!message) return;
    setText("");
    if (socket?.connected) {
      socket.emit("chat:send", { message }, (response: any) => {
        if (response?.error) setStatus(response.error);
        if (response?.thread) updateThread(response.thread);
        if (response?.message) appendMessage(response.message);
      });
      return;
    }
    try {
      const result = await api<{ thread: ChatThread; message: ChatMessage }>("/api/customer/chat/messages", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      updateThread(result.thread);
      appendMessage(result.message);
    } catch (err: any) {
      setStatus(err.message || "Could not send message");
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">Website Chat</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Admin can reply directly here.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{thread?.status || "Open"}</span>
      </div>
      <div ref={messagesRef} className="mt-4 flex h-64 flex-col gap-3 overflow-auto overflow-x-hidden rounded-2xl bg-[#f7f9fb] p-3">
        {messages.map((chatMessage) => (
          <div key={chatMessage.id} className={`max-w-[86%] rounded-2xl p-3 text-sm shadow-sm ${chatMessage.senderType === "user" ? "ml-auto bg-[#0d3e83] text-white" : "bg-white text-slate-700"}`}>
            <p className="text-xs font-black opacity-75">{chatMessage.senderName}</p>
            <p className="mt-1 break-words leading-6 [overflow-wrap:anywhere]">{chatMessage.message}</p>
          </div>
        ))}
        {!messages.length && <p className="m-auto text-center text-sm font-semibold text-slate-500">Start a conversation with admin.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Type your message" className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0d3e83]" />
        <button type="button" onClick={sendMessage} className="rounded-full bg-[#0d3e83] px-4 py-3 text-sm font-bold text-white">Send</button>
      </div>
      {status && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">{status}</p>}
    </div>
  );
}

function CustomerChatWidget() {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [open, setOpen] = useState(false);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    api<{ customer: CustomerSession | null }>("/api/customer/me")
      .then((value) => setCustomer(value.customer))
      .catch(() => setCustomer(null));
  }, []);

  if (path === "/my-account" || path.startsWith("/admin")) return null;

  if (!customer) {
    return (
      <a href="/my-account" className="fixed bottom-24 right-4 z-50 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-[#0d3e83] shadow-xl shadow-blue-950/10 ring-1 ring-slate-200 lg:right-5">
        <MessageCircle className="h-4 w-4" /> Login to chat
      </a>
    );
  }

  return (
    <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)]">
      {open ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-blue-950/15">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-black text-slate-900">Gauranitai Support</p>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <CustomerChatPanel customer={customer} />
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="ml-auto flex items-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-950/15">
          <MessageCircle className="h-4 w-4" /> Chat
        </button>
      )}
    </div>
  );
}

function ProductReviewForm({ order, productId, productName }: { order: Order; productId: number; productName: string }) {
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");

  async function submitReview() {
    setMessage("Submitting review...");
    try {
      await api<ProductReview>("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          productId,
          phone: order.phone,
          email: order.email,
          rating: Number(rating),
          review,
        }),
      });
      setReview("");
      setMessage("Review sent for admin approval.");
    } catch (err: any) {
      setMessage(err.message || "Could not submit review");
    }
  }

  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-sm font-bold text-slate-900">{productName}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr_auto] sm:items-start">
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#0d3e83]">
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <textarea value={review} onChange={(event) => setReview(event.target.value)} placeholder="Write your review" className="min-h-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#0d3e83]" />
        <button type="button" onClick={submitReview} className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
          Submit
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-bold text-[#0d3e83]">{message}</p>}
    </div>
  );
}

function CartPage({ data }: { data: BootstrapData }) {
  const [items, setItems] = useState<LocalCartItem[]>(readCart());
  const cartRows = items
    .map((item) => ({ item, product: data.products.find((product) => product.id === item.productId) }))
    .filter((row): row is { item: LocalCartItem; product: Product } => !!row.product);
  const subtotal = cartRows.reduce((sum, row) => sum + row.product.discountPrice * row.item.quantity, 0);
  const deliverySettings = data.settings.taxDelivery;
  const lowerDeliverySlab = deliverySlabStart(deliverySettings);
  const estimatedDelivery = estimatedDeliveryCharge(subtotal, deliverySettings);

  function updateQuantity(productId: number, quantity: number) {
    const next = items
      .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
      .filter((item) => item.quantity > 0);
    setItems(next);
    writeCart(next);
  }

  function remove(productId: number) {
    const next = items.filter((item) => item.productId !== productId);
    setItems(next);
    writeCart(next);
  }

  return (
    <PageShell data={data}>
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Cart" title="Review cleaning products before checkout" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {cartRows.map(({ item, product }) => (
              <div key={product.id} className="flex flex-col gap-4 border-b border-slate-100 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <img src={product.coverImage} alt={product.imageAltText} className="h-24 w-24 rounded-2xl object-cover" />
                  <div>
                    <p className="font-black text-slate-900">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{product.sku} | {product.unit} | Stock {product.stock}</p>
                    <p className="mt-2 text-sm"><span className="line-through text-slate-400">{money(product.mainPrice)}</span> <span className="font-black text-[#0d3e83]">{money(product.discountPrice)}</span></p>
                    <p className="mt-1 text-sm text-slate-500">GST estimate: {money(product.discountPrice * item.quantity * (product.gstPercentage / 100))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input className="w-20 rounded-xl border border-slate-200 px-3 py-2 font-bold" type="number" min={1} max={product.stock} value={item.quantity} onChange={(event) => updateQuantity(product.id, Number(event.target.value))} />
                  <button onClick={() => remove(product.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">Remove</button>
                </div>
              </div>
            ))}
            {!cartRows.length && <p className="p-8 text-center font-semibold text-slate-500">Your cart is empty.</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xl font-black text-slate-900">Cart Summary</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div className="flex justify-between"><span>Estimated delivery</span><b>{money(estimatedDelivery)}</b></div>
              <div className="flex justify-between"><span>Delivery below {money(lowerDeliverySlab)}</span><b>{money(deliverySettings.deliveryChargeBelow500)}</b></div>
              <div className="flex justify-between"><span>{deliveryMiddleSlabLabel(deliverySettings)}</span><b>{money(deliverySettings.deliveryChargeAbove500)}</b></div>
              <div className="flex justify-between"><span>Free delivery from</span><b>{money(deliverySettings.freeDeliveryAbove)}</b></div>
            </div>
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              No minimum order block. Orders below {money(lowerDeliverySlab)} can still checkout; delivery charge is calculated dynamically from admin settings.
            </p>
            <a href="/checkout" className={`mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-bold text-white ${cartRows.length ? "bg-[#0d3e83]" : "pointer-events-none bg-slate-300"}`}>Proceed to checkout</a>
            <a href="/products" className="mt-3 inline-flex w-full justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0d3e83]">Continue shopping</a>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function CheckoutPage({ data }: { data: BootstrapData }) {
  const [cartItems] = useState<LocalCartItem[]>(readCart());
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
    orderNotes: "",
    couponCode: "",
  });

  useEffect(() => {
    api<CheckoutSummary>("/api/checkout/summary", {
      method: "POST",
      body: JSON.stringify({ items: cartItems, couponCode: form.couponCode }),
    })
      .then(setSummary)
      .catch((err) => setMessage(err.message || "Could not calculate order"));
  }, [form.couponCode]);

  useEffect(() => {
    api<{ customer: CustomerSession | null }>("/api/customer/me")
      .then((value) => setCustomer(value.customer))
      .catch(() => setCustomer(null))
      .finally(() => setCustomerLoading(false));
  }, []);

  useEffect(() => {
    if (!customer) return;
    setForm((current) => ({
      ...current,
      customerName: current.customerName || customer.name,
      phone: current.phone || customer.phone,
      email: current.email || customer.email,
    }));
  }, [customer]);

  async function loginForCheckout() {
    setMessage("Checking customer login...");
    try {
      const value = await api<{ customer: CustomerSession }>("/api/customer/login", {
        method: "POST",
        body: JSON.stringify({
          name: form.customerName,
          phone: form.phone,
          email: form.email,
        }),
      });
      setCustomer(value.customer);
      window.dispatchEvent(new Event("gauranitai-customer-updated"));
      setMessage("Login verified. You can place the order now.");
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    }
  }

  async function placeOrder() {
    if (!customer) {
      setMessage("Login first to place your order securely.");
      return;
    }
    setMessage("Creating order...");
    try {
      const order = await api<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...form, items: cartItems }),
      });
      writeCart([]);
      window.location.href = `/order-success?order=${order.orderNumber}`;
    } catch (err: any) {
      setMessage(err.message || "Could not create order");
    }
  }

  return (
    <PageShell data={data}>
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Checkout" title="Place your cleaning product order" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`mb-5 rounded-2xl border p-4 ${customer ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-[#fffaf0]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-black ${customer ? "text-emerald-800" : "text-[#805f13]"}`}>
                    {customerLoading ? "Checking login..." : customer ? "Secure login verified" : "Login protection required"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {customer ? `${customer.name} | ${customer.phone || customer.email}` : "Enter name, phone or email below, then verify login before placing order."}
                  </p>
                </div>
                {!customer && (
                  <button type="button" onClick={loginForCheckout} disabled={customerLoading} className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                    Login & Continue
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["customerName", "phone", "email", "address", "city", "state", "pincode", "couponCode"] as const).map((field) => (
                <TextInput
                  key={field}
                  label={field === "couponCode" ? "Coupon Code (Optional)" : field}
                  value={form[field]}
                  onChange={(value) => setForm({ ...form, [field]: value })}
                />
              ))}
              <div className="grid gap-2 text-sm font-bold text-slate-700">
                Payment Method
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-black text-emerald-800">
                  COD only
                  <p className="mt-1 text-xs font-semibold text-emerald-700">Online payment methods are hidden for now.</p>
                </div>
              </div>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              Order Notes
              <textarea className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.orderNotes} onChange={(event) => setForm({ ...form, orderNotes: event.target.value })} />
            </label>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xl font-black text-slate-900">Payable Summary</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{money(summary?.subtotal || 0)}</b></div>
              <div className="flex justify-between"><span>GST</span><b>{money(summary?.gstAmount || 0)}</b></div>
              <div className="flex justify-between"><span>Delivery</span><b>{money(summary?.deliveryCharge || 0)}</b></div>
              <div className="flex justify-between"><span>Coupon</span><b>-{money(summary?.couponDiscount || 0)}</b></div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-lg"><span>Total</span><b>{money(summary?.totalAmount || 0)}</b></div>
            </div>
            {summary && !summary.canCheckout && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{summary.message}</p>}
            <button onClick={placeOrder} disabled={!customer || !summary?.canCheckout || !cartItems.length} className="mt-5 inline-flex w-full justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300">Place Order</button>
            {message && <p className="mt-4 rounded-xl bg-[#f7f9fb] p-3 text-sm font-semibold text-[#0d3e83]">{message}</p>}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function OrderSuccessPage({ data }: { data: BootstrapData }) {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || "";
  const [status, setStatus] = useState<{ orderNumber: string; orderStatus: OrderStatus; paymentStatus: PaymentStatus; updatedAt: string; createdAt: string } | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    api<{ orderNumber: string; orderStatus: OrderStatus; paymentStatus: PaymentStatus; updatedAt: string; createdAt: string }>(`/api/orders/status/${encodeURIComponent(orderNumber)}`)
      .then((value) => {
        setStatus(value);
        setMessage("");
      })
      .catch((err) => setMessage(err.message || "Could not load order status"));
  }, [orderNumber]);

  const visibleStatus = status?.orderStatus || "Pending";
  return (
    <PageShell data={data}>
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <h1 className="mt-5 font-['Cinzel'] text-4xl font-semibold text-[#092b5c]">Order placed successfully</h1>
          <p className="mt-4 text-slate-600">Order number: <b>{orderNumber || "Created"}</b></p>
          <div className="mt-5 flex justify-center">
            <OrderStatusBadge status={visibleStatus} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">{orderStatusMeta(visibleStatus).note}</p>
          <div className="mt-6 text-left">
            <OrderProgress status={visibleStatus} />
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f9fb] p-4 text-left text-sm sm:grid-cols-2">
            <Info label="Payment" value={status?.paymentStatus || "Pending"} />
            <Info label="Last update" value={status?.updatedAt ? new Date(status.updatedAt).toLocaleString("en-IN") : "-"} />
          </div>
          {message && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/my-account" className="inline-flex rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Track Order</a>
            <a href="/" className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0d3e83]">Back to home</a>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function GalleryPage({ data }: { data: BootstrapData }) {
  return (
    <PageShell data={data}>
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Gallery" title="Before-after photos, product photos, and floor care work" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.gallery.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
              <div className="p-5">
                <p className="font-black text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}

function VideosPage({ data }: { data: BootstrapData }) {
  return (
    <PageShell data={data}>
      <main className="bg-[#f7f9fb]">
        <VideoReelSection
          videos={data.videos}
          eyebrow="Video Library"
          title="Watch Gauranitai service and product demos"
          subtitle="YouTube links added from admin are automatically converted into clean video thumbnails and watch cards."
          actionHref=""
          actionText=""
        />
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="All Videos" title="YouTube demos, product usage and floor care process" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.videos.map((video) => (
                <article key={video.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <a href={videoWatchUrl(video)} target={video.videoUrl ? "_blank" : undefined} rel={video.videoUrl ? "noreferrer" : undefined} className="group relative block aspect-video overflow-hidden bg-slate-100">
                    <img src={videoThumbnail(video)} alt={video.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute left-1/2 top-1/2 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0d3e83] shadow-lg">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </span>
                  </a>
                  <div className="p-5">
                    <p className="font-black text-slate-900">{video.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{video.description}</p>
                    <p className="mt-3 rounded-xl bg-[#f7f9fb] p-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {video.relatedProduct || video.relatedService || "Gauranitai Video"}
                    </p>
                    {video.videoUrl ? (
                      <a href={videoWatchUrl(video)} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">Open YouTube video</a>
                    ) : (
                      <p className="mt-4 rounded-xl bg-[#fff7e4] p-3 text-sm font-semibold text-[#8a6414]">Admin can paste a YouTube URL for this video.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function FaqPage({ data }: { data: BootstrapData }) {
  return (
    <PageShell data={data}>
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="space-y-3">
          {data.faqs.map((faq) => (
            <div key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-black text-slate-900">{faq.question}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}

function PolicyPage({ data, type }: { data: BootstrapData; type: string }) {
  const titles: Record<string, string> = {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refund: "Return / Refund Policy",
    shipping: "Shipping Policy",
  };
  const updatedAt = "Updated June 2026";
  const policySections: Record<string, Array<{ title: string; points: string[] }>> = {
    privacy: [
      { title: "Information We Collect", points: ["Name, phone number, email, address, service requirement, product order details, floor photos shared by the customer, and enquiry messages.", "Customer login/session details used for order history, service booking history, and chat support.", "Basic website usage data such as browser, page visits, and form activity when analytics tools are enabled."] },
      { title: "How We Use Information", points: ["To respond to marble polishing, floor cleaning, product enquiry, booking, order, delivery, and support requests.", "To contact customers through phone, email, WhatsApp, or website chat for service coordination and order updates.", "To improve product listings, blog content, customer support, stock planning, and local service communication."] },
      { title: "Payments, Cookies, and Third Parties", points: ["Payment information may be processed by third-party payment or banking providers when online payment is enabled.", "Cookies/session storage may be used for cart, login, admin security, and website experience.", "We do not sell customer personal data. Information is shared only when needed for service, delivery, payment, legal, or support purposes."] },
      { title: "Your Rights", points: ["You can request correction of your contact details.", "You can ask for support regarding your enquiry, order, or booking data.", `For privacy support, contact ${data.settings.contact.email} or ${data.settings.contact.phone}.`] },
    ],
    terms: [
      { title: "Service Booking Terms", points: ["Service prices and results depend on floor type, area size, current condition, stains, scratches, access, furniture movement, and site inspection.", "Marble polishing, crystallization, restoration, and deep cleaning results can vary based on previous chemical use, stone age, and damage level.", "Customers should provide accurate location, floor photos, area details, and access timing before booking."] },
      { title: "Product Purchase Terms", points: ["Product prices, stock, taxes, delivery charges, and offers may change from time to time.", "Use floor cleaner only as instructed. Do not mix with bleach, acid, or unknown chemicals.", "Test cleaning product on a hidden area when the surface is sensitive, old, or previously treated."] },
      { title: "Customer Responsibility", points: ["Remove delicate items before service work where possible.", "Keep children, pets, and unrelated visitors away from wet or active work areas.", "Check the work and ask maintenance questions during handover."] },
      { title: "Limitation", points: ["Gauranitai is not responsible for pre-existing stone damage, hidden cracks, weak joints, or results affected by previous improper chemical treatment.", "Support is provided through the contact details shown on this website."] },
    ],
    refund: [
      { title: "Product Refunds", points: ["Refund or replacement requests are reviewed for damaged, wrong, or genuine product issues.", "Opened or heavily used cleaning products may not be eligible unless there is a verified quality issue.", "Customers should share order details, photos, and issue description quickly after delivery."] },
      { title: "Service Refunds", points: ["Service results are discussed based on site condition and scope before work begins.", "If a service concern appears after completion, customers should contact support with photos and booking details.", "Refunds or corrections are reviewed case by case depending on scope, condition, and service notes."] },
    ],
    shipping: [
      { title: "Delivery Areas", points: ["Cleaning products may be delivered in available service/delivery areas around Mumbai, Navi Mumbai, Thane, and nearby regions.", "Delivery timing depends on stock, location, order size, and delivery schedule.", "Bulk or society/commercial orders may need separate coordination."] },
      { title: "Delivery Charges", points: ["Delivery charges are calculated during checkout or confirmed during manual order support.", "COD can be available where enabled by admin settings.", "Customers must provide correct phone number, address, pincode, and delivery instructions."] },
    ],
  };

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Policy"
          title={titles[type] || "Policy"}
          subtitle={`This page explains how Gauranitai handles ${titles[type]?.toLowerCase() || "policy"} matters for cleaning products, floor cleaning services, marble polishing bookings, customer support, orders, and communication.`}
          imageUrl={data.banners[0]?.imageUrl}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              {updatedAt}. For urgent support, contact <a href={phoneLink(data.settings)} className="font-black text-[#0d3e83]">{data.settings.contact.phone}</a> or <a href={`mailto:${data.settings.contact.email}`} className="font-black text-[#0d3e83]">{data.settings.contact.email}</a>.
            </div>
            <div className="grid gap-5">
              {(policySections[type] || policySections.privacy).map((section) => (
                <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">{section.title}</h2>
                  <div className="mt-5 grid gap-3">
                    {section.points.map((point) => (
                      <p key={point} className="flex gap-3 text-sm font-semibold leading-7 text-slate-600">
                        <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-emerald-600" />
                        {point}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function SitemapPage({ data }: { data: BootstrapData }) {
  const [generatedSitemapBlogs, setGeneratedSitemapBlogs] = useState<Blog[]>([]);
  const [generatedSitemapTotal, setGeneratedSitemapTotal] = useState(0);

  useEffect(() => {
    api<GeneratedBlogSearchResult>("/api/blogs/generated?limit=5200")
      .then((result) => {
        setGeneratedSitemapBlogs(result.blogs);
        setGeneratedSitemapTotal(result.total);
      })
      .catch(() => {
        setGeneratedSitemapBlogs([]);
        setGeneratedSitemapTotal(0);
      });
  }, []);

  const sections = [
    {
      title: "Main Pages",
      links: [
        ["Home", "/", "Homepage hero, services, products, videos, blogs, FAQ, and contact."],
        ["About Us", "/about-us", "Company profile and Gauranitai service positioning."],
        ["Services", "/services", "All marble polishing, floor cleaning, and stone care services."],
        ["Products", "/products", "Lizonex floor cleaner product listing."],
        ["Blogs", "/blogs", "Long-form SEO floor care guides."],
        ["Career", "/career", "Open vacancies and job application form."],
        ["Contact", "/contact", "Service booking and product enquiry form."],
      ],
    },
    {
      title: "Service Pages",
      links: data.services.map((service) => [service.title, `/services/${service.slug}`, service.shortDescription]),
    },
    {
      title: "Product Pages",
      links: data.products.map((product) => [product.name, `/products/${product.slug}`, product.shortDescription]),
    },
    {
      title: "Blog Pages",
      links: data.blogs.map((blog) => [blog.title, `/blogs/${blog.slug}`, blog.shortDescription]),
    },
    {
      title: "Media, Support & Legal",
      links: [
        ["Gallery", "/gallery", "Project and work images."],
        ["Videos", "/videos", "YouTube service and product videos."],
        ["FAQ", "/faq", "Common questions and answers."],
        ["Privacy Policy", "/privacy-policy", "Customer data and privacy details."],
        ["Terms & Conditions", "/terms-and-conditions", "Service and product usage terms."],
        ["Refund Policy", "/refund-policy", "Refund and replacement review details."],
        ["Shipping Policy", "/shipping-policy", "Product delivery information."],
        ["XML Sitemap", "/sitemap.xml", "Search engine XML sitemap with image tags."],
      ],
    },
  ];
  const imageItems = [
    ...data.banners.map((item) => ({ title: item.title, url: item.imageUrl, href: "/" })),
    ...data.services.map((item) => ({ title: item.title, url: item.coverImage, href: `/services/${item.slug}` })),
    ...data.products.map((item) => ({ title: item.name, url: item.coverImage, href: `/products/${item.slug}` })),
    ...data.blogs.map((item) => ({ title: item.title, url: item.featuredImage, href: `/blogs/${item.slug}` })),
    ...data.gallery.map((item) => ({ title: item.title, url: item.imageUrl, href: "/gallery" })),
    ...data.videos.map((item) => ({ title: item.title, url: item.thumbnailUrl, href: "/videos" })),
  ].filter((item, index, rows) => item.url && rows.findIndex((row) => row.url === item.url) === index);

  return (
    <PageShell data={data}>
      <main>
        <PageHero
          eyebrow="Sitemap"
          title="All Gauranitai website links"
          subtitle="Browse every public page in one clean place, including services, products, blogs, media, policy pages, and the search-engine XML sitemap."
          imageUrl={data.banners[2]?.imageUrl || data.banners[0]?.imageUrl}
        />
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              {sections.map((section) => (
                <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">{section.title}</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {section.links.map(([label, href, description]) => (
                      <a key={href} href={href} className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4 transition hover:-translate-y-0.5 hover:border-[#0d3e83]/30 hover:shadow-sm">
                        <span className="font-black text-[#0d3e83]">{label}</span>
                        <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">{description}</span>
                      </a>
                    ))}
                  </div>
                </article>
              ))}
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">Generated SEO Blog Pages</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Location, service, intent, floor type, and property-type blog pages generated from the SEO brief.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">{generatedSitemapTotal.toLocaleString("en-IN")} pages</span>
                </div>
                <div className="mt-5 max-h-[620px] overflow-auto rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {generatedSitemapBlogs.map((blog) => (
                      <a key={blog.slug} href={`/blogs/${blog.slug}`} className="rounded-xl bg-white p-3 text-sm font-bold leading-6 text-[#0d3e83] shadow-sm hover:underline">
                        {blog.title}
                        <span className="mt-1 block text-xs font-semibold text-slate-500">{blog.category}</span>
                      </a>
                    ))}
                  </div>
                  {!generatedSitemapBlogs.length && <p className="p-6 text-center text-sm font-semibold text-slate-500">Loading generated blog links...</p>}
                </div>
              </article>
            </div>
            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c9a24a]">Search Engine File</p>
              <h2 className="mt-3 font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">XML Sitemap</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">The XML sitemap includes public URLs with last modified date, change frequency, priority, and image sitemap tags.</p>
              <a href="/sitemap.xml" className="mt-5 inline-flex w-full justify-center rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Open Sitemap XML</a>
            </aside>
          </div>
        </section>
        <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Image Sitemap" title="Images included across the public website" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {imageItems.map((item) => (
                <a key={item.url} href={item.href} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5">
                  <img src={item.url} alt={item.title} loading="lazy" className="aspect-[16/11] w-full object-cover" />
                  <span className="block p-4 text-sm font-black leading-6 text-slate-800">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function DetailPage({ data, detail }: { data: BootstrapData; detail: { type: string; row: Service | Product | Blog } }) {
  const row = detail.row as any;
  const title = row.title || row.name;
  const mediaUrl = row.coverImage || row.featuredImage || row.images?.[0]?.url || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85";
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryImages = (row.images || []).length ? row.images : [{ id: 0, url: mediaUrl, title, altText: title, caption: title }];
  const hasVideo = Boolean(row.youtubeUrl || row.localVideoUrl);
  const productReviews = detail.type === "products" ? data.reviews.filter((review) => review.productId === row.id && review.status === "Published") : [];
  const relatedRows = detail.type === "products"
    ? data.products.filter((product) => product.category === row.category && product.id !== row.id).slice(0, 3)
    : detail.type === "services"
      ? data.services.filter((service) => service.category === row.category && service.id !== row.id).slice(0, 3)
      : [];

  function buyNow() {
    addToCart(row.id, quantity);
    window.location.href = "/checkout";
  }

  if (detail.type === "blogs") {
    return <BlogDetailPage data={data} blog={row as Blog} />;
  }

  if (detail.type === "products") {
    const product = row as Product;
    const activeImage = galleryImages[activeImageIndex]?.url || mediaUrl;
    const highlights = (product.benefits?.length ? product.benefits : product.suitableSurfaces || []).slice(0, 4);

    return (
      <div className="min-h-screen bg-white text-slate-900">
        <SiteHeader data={data} />
        <main className="px-4 py-10 sm:px-6 lg:px-8">
          <article className="mx-auto max-w-7xl">
            <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
              <section className="min-w-0 lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f9fb]">
                  <div className="relative aspect-[4/5] max-h-[760px] bg-white">
                    <img src={activeImage} alt={product.imageAltText || title} className="h-full w-full object-contain" />
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-lg"
                          aria-label="Previous product image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((current) => (current + 1) % galleryImages.length)}
                          className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-slate-900 text-white shadow-lg"
                          aria-label="Next product image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {galleryImages.length > 1 && (
                  <div className="mt-4 flex min-w-0 gap-3 overflow-x-auto pb-2">
                    {galleryImages.map((item: any, index: number) => (
                      <button
                        key={`${item.id}-${item.url}`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`h-24 w-24 flex-none overflow-hidden rounded-2xl border bg-white ${activeImageIndex === index ? "border-[#0d3e83] ring-2 ring-[#0d3e83]/20" : "border-slate-200"}`}
                        aria-label={`Show product image ${index + 1}`}
                      >
                        <img src={item.url} alt={item.altText || title} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="min-w-0">
                <a href="/products" className="mb-5 inline-flex text-sm font-bold text-slate-600 underline underline-offset-4">Back to Products</a>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="inline-flex rounded-full bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#805f13]">{product.category}</p>
                  <p className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">COD Available</p>
                </div>
                <h1 className="mt-5 font-['Cinzel'] text-4xl font-semibold tracking-normal text-[#092b5c] sm:text-5xl">{title}</h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">{product.shortDescription}</p>

                {highlights.length > 0 && (
                  <div className="mt-7 grid gap-3 border-y border-slate-200 py-5 sm:grid-cols-2">
                    {highlights.map((item) => (
                      <p key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="h-5 w-5 flex-none rounded-full bg-emerald-50 p-0.5 text-emerald-600" />
                        {item}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-7 grid gap-3 rounded-3xl bg-[#f7f9fb] p-5 sm:grid-cols-2">
                  <Info label="SKU" value={product.sku} />
                  <Info label="Stock" value={product.stock > 0 ? `${product.stock} ${product.unit}` : "Out of stock"} />
                  <Info label="MRP" value={money(product.mainPrice)} />
                  <Info label="Discount Price" value={money(product.discountPrice)} />
                  <Info label="GST" value={`${product.gstPercentage}%`} />
                  <Info label="Final Estimate" value={money(product.finalPayablePrice)} />
                </div>

                <div className="mt-7">
                  <p className="mb-3 text-sm font-black text-slate-900">Pack Size</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border-2 border-[#0d3e83] bg-white p-4 text-center">
                      <p className="text-lg font-black text-slate-900">{product.packSize || product.unit}</p>
                      <p className="mt-1 text-sm font-black text-[#0d3e83]">{money(product.discountPrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-[150px_minmax(190px,1fr)_minmax(130px,0.8fr)]">
                  <label className="flex h-14 min-w-0 items-center justify-between gap-4 rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700">
                    Qty
                    <input className="w-16 bg-transparent text-center font-black outline-none" type="number" min={1} max={product.stock} value={quantity} onChange={(event) => setQuantity(Math.min(product.stock, Math.max(1, Number(event.target.value) || 1)))} />
                  </label>
                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product.id, quantity)}
                    className="inline-flex h-14 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#0d3e83] px-6 text-sm font-black text-white disabled:bg-slate-300"
                  >
                    <ShoppingCart className="h-5 w-5" /> Add to cart
                  </button>
                  <button type="button" disabled={product.stock <= 0} onClick={buyNow} className="inline-flex h-14 min-w-0 items-center justify-center whitespace-nowrap rounded-full bg-slate-950 px-6 text-sm font-black text-white disabled:bg-slate-300">
                    Buy Now
                  </button>
                </div>

                <div className="mt-6 grid gap-3 rounded-3xl bg-emerald-50 p-5 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow-sm">₹</div>
                    <p className="font-black text-emerald-900">COD Available</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="font-black text-emerald-900">Fast Delivery</p>
                  </div>
                </div>

                <div className="mt-7 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <details open className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between bg-[#fffaf0] px-5 py-4 font-black text-slate-900">
                      Overview <span className="text-xl">-</span>
                    </summary>
                    <p className="px-5 py-4 text-sm leading-7 text-slate-600">{product.fullDescription || product.shortDescription}</p>
                  </details>
                  {product.usageInstructions && (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-black text-slate-900">
                        How To Use <span className="text-xl">+</span>
                      </summary>
                      <p className="px-5 pb-4 text-sm leading-7 text-slate-600">{product.usageInstructions}</p>
                    </details>
                  )}
                  {product.safetyInstructions?.length > 0 && (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-black text-slate-900">
                        Safety Instructions <span className="text-xl">+</span>
                      </summary>
                      <div className="grid gap-3 px-5 pb-4">
                        {product.safetyInstructions.map((item) => (
                          <p key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                            {item}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                <a href={whatsappLink(data.settings)} className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Now
                </a>
              </section>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <DetailList title="Benefits" items={product.benefits || []} />
              <DetailList title="Suitable Surfaces" items={product.suitableSurfaces || []} />
            </div>

            {productReviews.length > 0 && (
              <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black text-slate-900">Customer Reviews</h2>
                <div className="mt-4 grid gap-3">
                  {productReviews.map((review) => (
                    <div key={review.id} className="rounded-xl bg-[#f7f9fb] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{review.customerName}</p>
                        <p className="text-sm font-black text-[#c9a24a]">{review.rating}/5</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {relatedRows.length > 0 && (
              <section className="mt-12">
                <h2 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c]">Related Products</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {relatedRows.map((item: any) => (
                    <a key={item.id} href={`/products/${item.slug}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="aspect-[4/3] bg-[#f7f9fb]">
                        <img src={item.coverImage} alt={item.imageAltText || item.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm font-black text-[#0d3e83]">{money(item.discountPrice)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </article>
        </main>
        <SiteFooter data={data} />
        <FloatingActions settings={data.settings} />
        <CustomerChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <SiteHeader data={data} />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
          <div className="aspect-[16/7] bg-cover bg-center" style={{ backgroundImage: `url(${mediaUrl})` }} />
          <div className="p-6 sm:p-10">
            <p className="mb-4 inline-flex rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#805f13]">{row.category}</p>
            <h1 className="font-['Cinzel'] text-4xl font-semibold tracking-normal text-[#092b5c]">{title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{row.shortDescription}</p>
            {detail.type === "products" && (
              <div className="mt-6 grid gap-3 rounded-2xl bg-[#f7f9fb] p-5 sm:grid-cols-4">
                <Info label="SKU" value={row.sku} />
                <Info label="MRP" value={money(row.mainPrice)} />
                <Info label="Discount Price" value={money(row.discountPrice)} />
                <Info label="Final Estimate" value={money(row.finalPayablePrice)} />
                <Info label="Stock" value={row.stock > 0 ? `${row.stock} ${row.unit}` : "Out of stock"} />
              </div>
            )}
            {detail.type === "services" && (
              <div className="mt-6 grid gap-3 rounded-2xl bg-[#f7f9fb] p-5 sm:grid-cols-3">
                <Info label="Starting price" value={row.startingPrice ? `${money(row.startingPrice)} ${row.priceUnit}` : "Request quote"} />
                <Info label="Estimated time" value={row.estimatedTime || "Depends on area"} />
                <Info label="Featured" value={row.isFeatured ? "Yes" : "No"} />
              </div>
            )}
            <div className="mt-8 prose max-w-none text-slate-700">
              <p>{row.fullDescription || row.content}</p>
            </div>
            {detail.type === "products" && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {galleryImages.map((item: any) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfe]">
                    <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${item.url})` }} />
                    <p className="p-3 text-sm font-bold text-slate-700">{item.caption || item.title}</p>
                  </div>
                ))}
              </div>
            )}
            {detail.type === "products" && (
              <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4">
                <Info label="GST" value={`${row.gstPercentage}% (${money(row.gstAmount)})`} />
                <Info label="Product delivery" value={money(row.deliveryCharge)} />
                <Info label="Minimum quantity" value={String(row.minimumOrderQuantity || 1)} />
                <Info label="Pack size" value={row.packSize} />
              </div>
            )}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <DetailList title="Benefits" items={row.benefits || row.tags || []} />
              <DetailList title={detail.type === "services" ? "Process" : "Suitable For"} items={row.processSteps || row.suitableSurfaces || row.tags || []} />
            </div>
            {detail.type === "products" && row.usageInstructions && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                <h2 className="font-bold text-slate-900">How to use</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{row.usageInstructions}</p>
              </div>
            )}
            {detail.type === "products" && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <DetailList title="Safety Instructions" items={row.safetyInstructions || []} />
                <div className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                  <h2 className="font-bold text-slate-900">Product Information</h2>
                  <div className="mt-4 divide-y divide-slate-100">
                    {(row.infoTable || []).map((info: any) => (
                      <div key={info.label} className="flex justify-between gap-4 py-3 text-sm">
                        <span className="font-bold text-slate-600">{info.label}</span>
                        <span className="text-slate-600">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {detail.type === "services" && (
              <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
                <Info label="Suitable for" value={(row.suitableFor || []).slice(0, 2).join(", ") || "Homes and businesses"} />
                <Info label="Service areas" value={(row.serviceAreas || []).slice(0, 2).join(", ") || "Nearby areas"} />
                <Info label="Tools" value={(row.toolsUsed || []).slice(0, 2).join(", ") || "Professional tools"} />
              </div>
            )}
            {hasVideo && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
                <h2 className="font-bold text-slate-900">Video Demo</h2>
                <a href={row.youtubeUrl || row.localVideoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
                  Open Video <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
            {row.faqs?.length > 0 && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">FAQ</h2>
                <div className="mt-4 grid gap-3">
                  {row.faqs.map((faq: any) => (
                    <div key={faq.question} className="rounded-xl bg-[#f7f9fb] p-4">
                      <p className="font-bold text-slate-900">{faq.question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.type === "products" && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-900">Customer Reviews</h2>
                <div className="mt-4 grid gap-3">
                  {productReviews.map((review) => (
                    <div key={review.id} className="rounded-xl bg-[#f7f9fb] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{review.customerName}</p>
                        <p className="text-sm font-black text-[#c9a24a]">{review.rating}/5</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>
                    </div>
                  ))}
                  {!productReviews.length && <p className="rounded-xl bg-[#f7f9fb] p-4 text-sm font-semibold text-slate-500">No published reviews yet.</p>}
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {detail.type === "products" && (
                <>
                  <label className="flex min-h-12 flex-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                    Qty
                    <input className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-bold" type="number" min={1} max={row.stock} value={quantity} onChange={(event) => setQuantity(Math.min(row.stock, Math.max(1, Number(event.target.value) || 1)))} />
                  </label>
                  <button
                    type="button"
                    disabled={row.stock <= 0}
                    onClick={() => addToCart(row.id, quantity)}
                    className="inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to cart
                  </button>
                  <button type="button" disabled={row.stock <= 0} onClick={buyNow} className="inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300">
                    Buy Now
                  </button>
                </>
              )}
              {detail.type === "services" && <PrimaryButton href={`/contact?service=${encodeURIComponent(title)}`}>Book Service</PrimaryButton>}
              <a href={whatsappLink(data.settings)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                <MessageCircle className="h-4 w-4" /> WhatsApp Now
              </a>
            </div>
            {relatedRows.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-black text-slate-900">Related {detail.type === "products" ? "products" : "services"}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {relatedRows.map((item: any) => (
                    <a key={item.id} href={`/${detail.type}/${item.slug}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfe]">
                      <div className="aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: `url(${item.coverImage})` }} />
                      <div className="p-4">
                        <p className="font-bold text-slate-900">{item.title || item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
      <SiteFooter data={data} />
      <FloatingActions settings={data.settings} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-black text-[#0d3e83]">{value}</p>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <p key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

const adminModules: Array<{ id: AdminModule; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "product-categories", label: "Product Categories" },
  { id: "service-categories", label: "Service Categories" },
  { id: "services", label: "Services" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "enquiries", label: "Enquiries" },
  { id: "leads", label: "Lead CRM" },
  { id: "product-enquiries", label: "Product Enquiries" },
  { id: "service-bookings", label: "Service Bookings" },
  { id: "chat", label: "Chat Inbox" },
  { id: "reviews", label: "Product Reviews" },
  { id: "blogs", label: "Blogs" },
  { id: "blog-topics", label: "Blog Topics" },
  { id: "careerJobs", label: "Career Jobs" },
  { id: "careerApplications", label: "Career Applications" },
  { id: "faqs", label: "FAQs" },
  { id: "testimonials", label: "Testimonials" },
  { id: "banners", label: "Banners" },
  { id: "gallery", label: "Gallery" },
  { id: "videos", label: "Videos" },
  { id: "coupons", label: "Coupons / Offers" },
  { id: "settings", label: "Settings" },
  { id: "adminUsers", label: "Admin Users" },
];

function AdminLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("admin@gauranitai.com");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");

  async function login() {
    setMessage("Logging in...");
    try {
      const value = await api<{ user: any }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(value.user);
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-blue-950/5">
        <img src={logoImage} alt="Gauranitai logo" className="mx-auto h-20 w-20 rounded-full object-contain" />
        <h1 className="mt-5 text-center font-['Cinzel'] text-3xl font-semibold text-[#092b5c]">Gauranitai Admin</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Protected admin panel for products, services, orders, leads, CMS and settings.</p>
        <div className="mt-6 grid gap-4">
          <TextInput label="Email" value={email} onChange={setEmail} />
          <TextInput label="Password" value={password} onChange={setPassword} />
          <button onClick={login} className="rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Login</button>
        </div>
        <p className="mt-4 rounded-xl bg-[#fffaf0] p-3 text-xs font-bold text-[#805f13]">Development login: admin@gauranitai.com / admin123</p>
        {message && <p className="mt-3 text-sm font-semibold text-[#0d3e83]">{message}</p>}
      </div>
    </div>
  );
}

function adminEndpoint(module: AdminModule) {
  if (module === "product-categories" || module === "service-categories") return "categories";
  if (module === "product-enquiries" || module === "service-bookings") return "leads";
  return module;
}

function filterAdminRows(module: AdminModule, rows: any[]) {
  if (module === "product-categories") return rows.filter((row) => row.type === "product");
  if (module === "service-categories") return rows.filter((row) => row.type === "service");
  if (module === "product-enquiries") return rows.filter((row) => row.requirementType === "Product");
  if (module === "service-bookings") return rows.filter((row) => row.requirementType === "Service");
  if (module === "banners") return rows.slice().sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
  return rows;
}

function AdminApp() {
  const [adminUser, setAdminUser] = useState<any | undefined>(undefined);
  const [active, setActive] = useState<AdminModule>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(emptySettings);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<{ user: any | null }>("/api/admin/me")
      .then((value) => setAdminUser(value.user))
      .catch(() => setAdminUser(null));
  }, []);

  async function loadDashboard() {
    const value = await api<DashboardStats>("/api/admin/dashboard");
    setStats(value);
  }

  async function loadModule(module: AdminModule = active) {
    setMessage("");
    if (module === "dashboard") {
      await loadDashboard();
      return;
    }
    if (module === "settings") {
      const value = await api<SiteSettings>("/api/admin/settings");
      setSettings(value);
      setForm(flattenSettings(value));
      return;
    }
    if (module === "chat") {
      const value = await api<ChatThread[]>("/api/admin/chat/threads");
      setRows(value);
      setForm({});
      setEditingId(null);
      return;
    }
    const value = await api<any[]>(`/api/admin/${adminEndpoint(module)}`);
    const filteredRows = filterAdminRows(module, value);
    setRows(filteredRows);
    if (module === "orders" && filteredRows[0]) {
      setForm(rowToForm(module, filteredRows[0]));
      setEditingId(filteredRows[0].id);
      return;
    }
    setForm(defaultForm(module));
    setEditingId(null);
  }

  useEffect(() => {
    if (adminUser) {
      loadModule(active).catch((err) => setMessage(err.message || "Failed to load admin data"));
    }
  }, [active, adminUser]);

  function editRow(row: any) {
    setEditingId(row.id);
    setForm(rowToForm(active, row));
  }

  async function saveRow() {
    setMessage("Saving...");
    try {
      if (active === "settings") {
        await api<SiteSettings>("/api/admin/settings", {
          method: "PUT",
          body: JSON.stringify(unflattenSettings(form, settings)),
        });
        setMessage("Settings saved.");
        await loadModule(active);
        return;
      }
      const payload = formToPayload(active, form);
      const endpoint = adminEndpoint(active);
      const url = editingId ? `/api/admin/${endpoint}/${editingId}` : `/api/admin/${endpoint}`;
      await api(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Saved successfully.");
      await loadModule(active);
    } catch (err: any) {
      setMessage(err.message || "Save failed");
    }
  }

  async function deleteRow(id: number) {
    if (!window.confirm("Delete this item?")) return;
    await api(`/api/admin/${adminEndpoint(active)}/${id}`, { method: "DELETE" });
    await loadModule(active);
  }

  async function logoutAdmin() {
    setMessage("Logging out...");
    try {
      await api<{ success: boolean }>("/api/admin/logout", { method: "POST" });
    } catch {
      // If the session is already gone, still return to the login screen.
    }
    setAdminUser(null);
    setMessage("");
  }

  if (adminUser === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-sm font-bold text-slate-600">Checking admin session...</div>;
  }

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden h-dvh w-72 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white p-5 lg:flex">
        <a href="/" className="flex flex-none items-center gap-3">
          <img src={logoImage} alt="Gauranitai logo" className="h-12 w-12 rounded-full object-contain" />
          <div>
            <p className="font-['Cinzel'] text-xl font-semibold tracking-normal text-[#0d3e83]">Gauranitai</p>
            <p className="text-xs font-semibold text-slate-500">Admin Panel</p>
          </div>
        </a>
        <nav className="mt-8 grid flex-none gap-2 pb-10">
          {adminModules.map((module) => (
            <button key={module.id} onClick={() => setActive(module.id)} className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${active === module.id ? "bg-[#0d3e83] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {module.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Gauranitai logo" className="h-11 w-11 rounded-full object-contain lg:hidden" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c9a24a]">Admin Panel</p>
                <h1 className="font-['Cinzel'] text-2xl font-semibold tracking-normal text-[#092b5c] sm:text-3xl">
                  {adminModules.find((item) => item.id === active)?.label}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/" className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">View Website</a>
              <button onClick={() => loadModule(active)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">Refresh</button>
              <button onClick={logoutAdmin} className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600">Logout</button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {adminModules.map((module) => (
              <button key={module.id} onClick={() => setActive(module.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${active === module.id ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-700"}`}>
                {module.label}
              </button>
            ))}
          </div>
        </header>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          {active === "dashboard" ? (
            <DashboardView stats={stats} />
          ) : (
            <AdminModuleView
              active={active}
              rows={rows}
              form={form}
              setForm={setForm}
              editingId={editingId}
              setEditingId={setEditingId}
              saveRow={saveRow}
              editRow={editRow}
              deleteRow={deleteRow}
            />
          )}
          {message && <p className="mt-5 rounded-xl bg-white p-4 text-sm font-bold text-[#0d3e83] shadow-sm">{message}</p>}
        </section>
      </main>
    </div>
  );
}

function orderItems(order: Partial<Order> | null | undefined) {
  return Array.isArray(order?.items) ? order.items : [];
}

function orderProductNames(order: Partial<Order>) {
  const names = orderItems(order).map((item) => item.productName).filter(Boolean);
  return names.length ? names.join(", ") : "No products";
}

function orderItemCount(order: Partial<Order>) {
  return orderItems(order).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function sameCustomerOrders(order: Order, orders: Order[]) {
  const phone = order.phone.replace(/\D/g, "");
  return orders.filter((row) => row.id !== order.id && (row.phone.replace(/\D/g, "") === phone || row.email.toLowerCase() === order.email.toLowerCase()));
}

function OrderDetailPanel({ order, orders }: { order: Order; orders: Order[] }) {
  const previousOrders = sameCustomerOrders(order, orders);
  const customerTotalSpend = [order, ...previousOrders].reduce((sum, row) => sum + row.totalAmount, 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c9a24a]">Order Detail</p>
          <h3 className="mt-1 text-2xl font-black text-slate-900">{order.orderNumber}</h3>
          <p className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <a href={`/api/admin/orders/${order.id}/invoice`} target="_blank" rel="noreferrer" className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
            Invoice
          </a>
        </div>
      </div>

      <div className="mt-5">
        <OrderProgress status={order.orderStatus} />
        <p className="mt-3 text-sm font-semibold text-slate-500">{orderStatusMeta(order.orderStatus).note}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Customer" value={order.customerName || "Customer"} />
        <Info label="Phone" value={order.phone || "-"} />
        <Info label="Email" value={order.email || "-"} />
        <Info label="Address" value={`${order.address}, ${order.city}, ${order.state} ${order.pincode}`} />
        <Info label="Payment" value={order.paymentStatus} />
        <Info label="Order status" value={order.orderStatus} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        {orderItems(order).map((item) => (
          <div key={item.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[64px_1fr_auto] md:items-center">
            <img src={item.productImage || "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=300&q=80"} alt={item.productName} className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="font-black text-slate-900">{item.productName}</p>
              <p className="mt-1 text-sm text-slate-500">SKU {item.sku} | Qty {item.quantity} | GST {money(item.gstAmount)}</p>
            </div>
            <p className="font-black text-[#0d3e83]">{money(item.totalPrice)}</p>
          </div>
        ))}
        {!orderItems(order).length && <p className="p-5 text-center text-sm font-semibold text-slate-500">No product items available for this order.</p>}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Info label="Subtotal" value={money(order.subtotal)} />
        <Info label="GST" value={money(order.gstAmount)} />
        <Info label="Delivery" value={money(order.deliveryCharge)} />
        <Info label="Total" value={money(order.totalAmount)} />
      </div>

      <div className="mt-6 rounded-2xl bg-[#f7f9fb] p-5">
        <p className="font-black text-slate-900">Previous Orders by This Customer</p>
        <p className="mt-2 text-sm text-slate-600">Order count: {previousOrders.length + 1} | Total spend: {money(customerTotalSpend)}</p>
        {previousOrders.length ? (
          <div className="mt-4 grid gap-2">
            {previousOrders.slice(0, 5).map((row) => (
              <div key={row.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-white p-3 text-sm">
                <span className="font-bold text-slate-900">{row.orderNumber}</span>
                <span className="text-slate-500">{orderProductNames(row)}</span>
                <span className="font-black text-[#0d3e83]">{money(row.totalAmount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-slate-500">No previous orders found.</p>
        )}
      </div>

      {order.adminNotes && <p className="mt-5 rounded-xl bg-[#fffaf0] p-4 text-sm font-semibold text-[#805f13]">Admin notes: {order.adminNotes}</p>}
    </div>
  );
}

function AdminCustomersView({ initialRows }: { initialRows: CustomerSummary[] }) {
  const [customers, setCustomers] = useState<CustomerSummary[]>(initialRows);
  const [selectedId, setSelectedId] = useState<number | null>(initialRows[0]?.id || null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    setCustomers(initialRows);
    setSelectedId((current) => current && initialRows.some((row) => row.id === current) ? current : initialRows[0]?.id || null);
  }, [initialRows]);

  const filteredCustomers = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return customers;
    return customers.filter((customer) => [
      customer.customerName,
      customer.phone,
      customer.email,
      customer.city,
      customer.state,
      customer.lastOrderNumber,
      customer.isLoggedIn ? "logged in" : "logged out",
      customer.isBlocked ? "blocked" : "active",
    ].join(" ").toLowerCase().includes(text));
  }, [customers, query]);

  const activeCustomer = (selectedId ? customers.find((customer) => customer.id === selectedId) : null) || filteredCustomers[0] || customers[0] || null;

  useEffect(() => {
    setNotesDraft(activeCustomer?.adminNotes || "");
  }, [activeCustomer?.id, activeCustomer?.adminNotes]);

  const totals = {
    customers: customers.length,
    loggedIn: customers.filter((customer) => customer.isLoggedIn).length,
    blocked: customers.filter((customer) => customer.isBlocked).length,
    spend: customers.reduce((sum, customer) => sum + Number(customer.totalSpend || 0), 0),
  };
  const activeCustomerOrders = activeCustomer?.orders || [];

  function replaceCustomer(updated: CustomerSummary) {
    setCustomers((current) => current.map((customer) => customer.id === updated.id ? updated : customer));
    setSelectedId(updated.id);
  }

  async function toggleBlock(customer: CustomerSummary) {
    const nextBlocked = !customer.isBlocked;
    const blockReason = nextBlocked ? window.prompt("Reason for blocking this customer?", customer.blockReason || "Blocked by admin") || "Blocked by admin" : "";
    setMessage(nextBlocked ? "Blocking customer..." : "Unblocking customer...");
    try {
      const updated = await api<CustomerSummary>(`/api/admin/customers/${customer.id}/access`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked: nextBlocked, blockReason, adminNotes: customer.adminNotes }),
      });
      replaceCustomer(updated);
      setMessage(nextBlocked ? "Customer blocked. They cannot login, chat, or place orders." : "Customer unblocked.");
    } catch (err: any) {
      setMessage(err.message || "Customer access update failed");
    }
  }

  async function saveNotes() {
    if (!activeCustomer) return;
    setMessage("Saving customer notes...");
    try {
      const updated = await api<CustomerSummary>(`/api/admin/customers/${activeCustomer.id}/access`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked: activeCustomer.isBlocked, blockReason: activeCustomer.blockReason, adminNotes: notesDraft }),
      });
      replaceCustomer(updated);
      setMessage("Customer notes saved.");
    } catch (err: any) {
      setMessage(err.message || "Could not save notes");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Customers", totals.customers],
          ["Logged In", totals.loggedIn],
          ["Blocked", totals.blocked],
          ["Total Spend", money(totals.spend)],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{label as string}</p>
            <p className="mt-3 text-2xl font-black text-[#0d3e83]">{value as string | number}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Customers ({filteredCustomers.length})</h2>
              <p className="mt-1 text-sm text-slate-500">Track login state, customer spend, order history, and account access.</p>
            </div>
            <a href="/api/admin/customers/export.csv" className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">Export Customers CSV</a>
          </div>

          <label className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f7f9fb] px-4 py-3 focus-within:border-[#0d3e83]">
            <Search className="h-4 w-4 flex-none text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, email, order, login or block status" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" />
            {query && <button type="button" onClick={() => setQuery("")} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">Clear</button>}
          </label>

          <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[1150px] w-full text-left text-sm">
              <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  {["Customer", "Login", "Access", "Orders", "Total Spend", "Last Order", "Location", "Action"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} onClick={() => setSelectedId(customer.id)} className={`cursor-pointer border-t border-slate-100 ${activeCustomer?.id === customer.id ? "bg-blue-50/70" : "hover:bg-[#f7f9fb]"}`}>
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900">{customer.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{customer.phone || "-"} | {customer.email || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${customer.isLoggedIn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{customer.isLoggedIn ? "Logged in" : "Logged out"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${customer.isBlocked ? "bg-red-50 text-red-600" : "bg-[#fffaf0] text-[#805f13]"}`}>{customer.isBlocked ? "Blocked" : "Active"}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{customer.orderCount || customer.orders?.length || 0}</td>
                    <td className="px-4 py-3 font-black text-[#0d3e83]">{money(Number(customer.totalSpend || 0))}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.lastOrderNumber || "-"}<br /><span className="text-xs text-slate-400">{formatDateTime(customer.lastOrderDate)}</span></td>
                    <td className="px-4 py-3 text-slate-600">{[customer.city, customer.state].filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={(event) => { event.stopPropagation(); toggleBlock(customer); }} className={`rounded-full px-4 py-2 text-xs font-black ${customer.isBlocked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {customer.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredCustomers.length && <p className="p-6 text-center font-semibold text-slate-500">No customers found.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {activeCustomer ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c9a24a]">Customer Detail</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{activeCustomer.customerName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{activeCustomer.phone || "-"} | {activeCustomer.email || "-"}</p>
                </div>
                <button type="button" onClick={() => toggleBlock(activeCustomer)} className={`rounded-full px-4 py-2 text-sm font-black ${activeCustomer.isBlocked ? "bg-emerald-600 text-white" : "bg-red-50 text-red-600"}`}>
                  {activeCustomer.isBlocked ? "Unblock User" : "Block User"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Login status" value={activeCustomer.isLoggedIn ? "Logged in" : "Logged out"} />
                <Info label="Access status" value={activeCustomer.isBlocked ? `Blocked: ${activeCustomer.blockReason || "No reason"}` : "Active"} />
                <Info label="Total orders" value={String(activeCustomer.orderCount || activeCustomerOrders.length)} />
                <Info label="Total spend" value={money(Number(activeCustomer.totalSpend || 0))} />
                <Info label="Average order" value={money(Number(activeCustomer.averageOrderValue || 0))} />
                <Info label="Last order" value={activeCustomer.lastOrderNumber || "-"} />
                <Info label="Last login" value={formatDateTime(activeCustomer.lastLoginAt)} />
                <Info label="Last logout" value={formatDateTime(activeCustomer.lastLogoutAt)} />
              </div>

              <div className="mt-5 rounded-2xl bg-[#f7f9fb] p-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Admin Notes
                  <textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" />
                </label>
                <button type="button" onClick={saveNotes} className="mt-3 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">Save Notes</button>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-black text-slate-900">All Orders ({activeCustomerOrders.length})</h3>
                <div className="mt-3 max-h-[42vh] overflow-auto rounded-xl border border-slate-200">
                  {activeCustomerOrders.map((order) => (
                    <div key={order.id} className="border-b border-slate-100 p-4 last:border-b-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#0d3e83]">{order.orderNumber}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <OrderStatusBadge status={order.orderStatus} />
                          <p className="mt-2 font-black text-slate-900">{money(order.totalAmount)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{orderProductNames(order)}</p>
                      <p className="mt-1 text-xs text-slate-500">Items: {orderItemCount(order)} | Payment: {order.paymentStatus}</p>
                    </div>
                  ))}
                  {!activeCustomerOrders.length && <p className="p-6 text-center text-sm font-semibold text-slate-500">No orders yet for this customer.</p>}
                </div>
              </div>

              {message && <p className="mt-4 rounded-xl bg-[#fffaf0] p-3 text-sm font-bold text-[#805f13]">{message}</p>}
            </>
          ) : (
            <p className="rounded-2xl bg-[#f7f9fb] p-8 text-center font-semibold text-slate-500">Select a customer.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminCareerApplicationsView({
  rows,
  form,
  setForm,
  editingId,
  setEditingId,
  saveRow,
  editRow,
  deleteRow,
}: {
  rows: CareerApplication[];
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  editingId: number | null;
  setEditingId: (value: number | null) => void;
  saveRow: () => void;
  editRow: (row: CareerApplication) => void;
  deleteRow: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((application) => [
      application.name,
      application.jobTitle,
      application.phone,
      application.email,
      application.resumeFileName,
      application.status,
      application.message,
      application.adminNotes,
    ].join(" ").toLowerCase().includes(text));
  }, [query, rows]);
  const activeApplication = editingId ? rows.find((application) => application.id === editingId) || null : null;
  const totals = careerApplicationStatusOptions.map((status) => ({
    status,
    count: rows.filter((application) => application.status === status).length,
  }));

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  function closeEditor() {
    setEditingId(null);
    setForm(defaultForm("careerApplications"));
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {totals.map(({ status, count }) => (
          <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{status}</p>
            <p className="mt-2 text-3xl font-black text-[#0d3e83]">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Career Applications ({filteredRows.length})</h2>
              <p className="mt-1 text-sm text-slate-500">Review applicants, open uploaded resumes, and update hiring status.</p>
            </div>
          </div>

          <label className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f7f9fb] px-4 py-3 focus-within:border-[#0d3e83]">
            <Search className="h-4 w-4 flex-none text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applicant, job, phone, email, resume or status"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                Clear
              </button>
            )}
          </label>

          <div className="mt-5 grid gap-4">
            {filteredRows.map((application) => (
              <article key={application.id} className={`rounded-2xl border p-4 transition ${editingId === application.id ? "border-[#0d3e83] bg-blue-50/60" : "border-slate-200 bg-white"}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{application.name || "Applicant"}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${careerStatusClass(application.status)}`}>
                        {application.status || "New"}
                      </span>
                    </div>
                    <p className="mt-2 font-bold text-[#0d3e83]">{application.jobTitle || "Career application"}</p>
                    <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 md:grid-cols-2">
                      <span>Phone: {application.phone || "-"}</span>
                      <span>Email: {application.email || "-"}</span>
                      <span>Applied: {formatDateTime(application.createdAt)}</span>
                      <span className="truncate">Resume: {application.resumeFileName || "Not uploaded"}</span>
                    </div>
                    {application.message && (
                      <p className="mt-3 rounded-xl bg-[#f7f9fb] p-3 text-sm leading-6 text-slate-600">{application.message}</p>
                    )}
                    {application.adminNotes && (
                      <p className="mt-3 rounded-xl bg-[#fffaf0] p-3 text-sm font-semibold leading-6 text-[#805f13]">Admin notes: {application.adminNotes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {application.resumeUrl ? (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white"
                      >
                        <Eye className="h-4 w-4" /> View Resume
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">No Resume</span>
                    )}
                    <button type="button" onClick={() => editRow(application)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                      Update
                    </button>
                    <button type="button" onClick={() => deleteRow(application.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!filteredRows.length && <p className="rounded-2xl bg-[#f7f9fb] p-8 text-center font-semibold text-slate-500">No career applications found.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-900">Application Status</h2>
          {activeApplication ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Updating {activeApplication.name || "applicant"} for {activeApplication.jobTitle || "selected job"}.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Status
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]"
                    value={form.status || "New"}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    {careerApplicationStatusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Admin Notes
                  <textarea
                    className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]"
                    value={form.adminNotes || ""}
                    onChange={(event) => updateField("adminNotes", event.target.value)}
                    placeholder="Add internal hiring notes"
                  />
                </label>
                <button type="button" onClick={saveRow} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
                  <Save className="h-4 w-4" /> Save Application Update
                </button>
                <button type="button" onClick={closeEditor} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700">
                  Close
                </button>
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-[#f7f9fb] p-5 text-sm font-semibold leading-6 text-slate-500">
              Click Update on any application to change its status or add admin notes. Resume files open directly from the application card.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function careerStatusClass(status: CareerApplicationStatus | string) {
  if (status === "Hired") return "bg-emerald-50 text-emerald-700";
  if (status === "Shortlisted") return "bg-blue-50 text-[#0d3e83]";
  if (status === "Rejected") return "bg-red-50 text-red-600";
  if (status === "Reviewed") return "bg-[#fffaf0] text-[#805f13]";
  return "bg-slate-100 text-slate-600";
}

function DashboardView({ stats }: { stats: DashboardStats | null }) {
  const [activeTab, setActiveTab] = useState("Latest Orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const cards = [
    ["Total Products", stats?.totalProducts || 0],
    ["Total Services", stats?.totalServices || 0],
    ["Total Orders", stats?.totalOrders || 0],
    ["New Orders", stats?.newOrders || 0],
    ["Pending Orders", stats?.pendingOrders || 0],
    ["Processing Orders", stats?.processingOrders || 0],
    ["Upcoming Delivery", stats?.upcomingDeliveryOrders || 0],
    ["Delivered Orders", stats?.deliveredOrders || 0],
    ["Cancelled Orders", stats?.cancelledOrders || 0],
    ["Total Leads", stats?.totalLeads || 0],
    ["New Leads", stats?.newLeads || 0],
    ["Service Bookings", stats?.totalServiceBookings || 0],
    ["Total Reviews", stats?.totalReviews || 0],
    ["Pending Reviews", stats?.pendingReviews || 0],
    ["Revenue Today", stats?.revenueToday || 0],
    ["Monthly Revenue", stats?.monthlyRevenue || 0],
    ["Low Stock Products", stats?.lowStockProducts || 0],
    ["Out of Stock", stats?.outOfStockProducts || 0],
  ];
  const tabs = ["Latest Orders", "Latest Service Bookings", "Latest Product Enquiries", "Latest Reviews", "Low Stock Products", "Recent Customers"];
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ["Export Orders", "/api/admin/orders/export.csv"],
          ["Export Products", "/api/admin/products/export.csv"],
          ["Export Leads", "/api/admin/leads/export.csv"],
          ["Export Service Bookings", "/api/admin/service-bookings/export.csv"],
          ["Export Customers", "/api/admin/customers/export.csv"],
        ].map(([label, href]) => (
          <a key={href} href={href} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0d3e83] shadow-sm">
            {label}
          </a>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{label as string}</p>
            <p className="mt-3 text-4xl font-black text-[#0d3e83]">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-[#0d3e83] text-white" : "bg-slate-100 text-slate-700"}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Latest Orders" && (
          <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  {["Order ID", "Customer", "Phone", "Products", "Total", "Payment", "Status", "Date", "Action"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.latestOrders || []).map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-[#0d3e83]">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{order.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{order.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{orderProductNames(order)}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{money(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{order.paymentStatus}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3"><button onClick={() => setSelectedOrder(order)} className="rounded-full bg-[#0d3e83] px-3 py-1.5 text-xs font-bold text-white">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(stats?.latestOrders || []).length && <p className="p-6 text-center font-semibold text-slate-500">No orders yet.</p>}
          </div>
        )}

        {activeTab === "Latest Service Bookings" && (
          <LeadMiniTable rows={stats?.latestServiceBookings || []} />
        )}
        {activeTab === "Latest Product Enquiries" && (
          <LeadMiniTable rows={stats?.latestProductEnquiries || []} />
        )}
        {activeTab === "Latest Reviews" && (
          <ReviewMiniTable rows={stats?.latestReviews || []} />
        )}
        {activeTab === "Low Stock Products" && (
          <StockMiniTable rows={(stats?.productStockOverview || []).filter((product) => product.stock <= product.lowStockAlert)} />
        )}
        {activeTab === "Recent Customers" && (
          <div className="mt-5 grid gap-3">
            {(stats?.recentCustomers || []).map((customer) => (
              <div key={`${customer.phone}-${customer.email}`} className="grid gap-3 rounded-xl bg-[#f7f9fb] p-4 md:grid-cols-5 md:items-center">
                <p className="font-black text-slate-900">{customer.customerName}</p>
                <p className="text-sm text-slate-600">{customer.phone}</p>
                <p className="text-sm text-slate-600">{customer.email}</p>
                <p className="text-sm font-bold text-slate-700">{customer.orderCount} orders</p>
                <p className="text-sm font-black text-[#0d3e83]">{money(customer.totalSpend)}</p>
              </div>
            ))}
            {!(stats?.recentCustomers || []).length && <p className="p-6 text-center font-semibold text-slate-500">No customers yet.</p>}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="mt-6">
          <OrderDetailPanel order={selectedOrder} orders={stats?.latestOrders || []} />
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Latest enquiries</h2>
          <div className="mt-5 space-y-3">
            {(stats?.latestEnquiries || []).map((row) => (
              <div key={row.id} className="rounded-xl bg-[#f7f9fb] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-900">{row.name}</p>
                  <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#805f13]">{row.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{row.serviceRequired || row.productRequired}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Product stock overview</h2>
          <div className="mt-5 space-y-4">
            {(stats?.productStockOverview || []).map((product) => (
              <div key={product.id}>
                <div className="mb-2 flex justify-between text-sm font-bold">
                  <span>{product.name}</span>
                  <span>{product.stock} {product.unit}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-[#0d3e83]" style={{ width: `${Math.min(100, product.stock)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadMiniTable({ rows }: { rows: Lead[] }) {
  return (
    <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            {["Lead ID", "Name", "Company", "Phone", "Service / Requirement", "Source", "Status", "Priority"].map((heading) => (
              <th key={heading} className="px-4 py-3 font-black">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <tr key={lead.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-black text-[#0d3e83]">{lead.leadNumber}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{lead.name}</td>
              <td className="px-4 py-3 text-slate-600">{lead.companyName || "-"}</td>
              <td className="px-4 py-3 text-slate-600">{lead.phone}</td>
              <td className="px-4 py-3">
                <p className="font-bold text-slate-900">{lead.serviceRequired || lead.productRequired || lead.requirementType}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#c9a24a]">{lead.requirementType}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{lead.source}</td>
              <td className="px-4 py-3 text-slate-600">{lead.status}</td>
              <td className="px-4 py-3 text-slate-600">{lead.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-6 text-center font-semibold text-slate-500">No records yet.</p>}
    </div>
  );
}

function ReviewMiniTable({ rows }: { rows: ProductReview[] }) {
  return (
    <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
      <table className="min-w-[780px] w-full text-left text-sm">
        <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            {["Product", "Customer", "Rating", "Review", "Status", "Date"].map((heading) => (
              <th key={heading} className="px-4 py-3 font-black">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((review) => (
            <tr key={review.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-bold text-slate-900">{review.productName}</td>
              <td className="px-4 py-3 text-slate-600">{review.customerName}</td>
              <td className="px-4 py-3 font-black text-[#c9a24a]">{review.rating}/5</td>
              <td className="px-4 py-3 text-slate-600">{review.review}</td>
              <td className="px-4 py-3 text-slate-600">{review.status}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(review.createdAt).toLocaleDateString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-6 text-center font-semibold text-slate-500">No reviews yet.</p>}
    </div>
  );
}

function StockMiniTable({ rows }: { rows: DashboardStats["productStockOverview"] }) {
  return (
    <div className="mt-5 grid gap-3">
      {rows.map((product) => (
        <div key={product.id} className="grid gap-2 rounded-xl bg-[#f7f9fb] p-4 md:grid-cols-4 md:items-center">
          <p className="font-black text-slate-900">{product.name}</p>
          <p className="text-sm text-slate-500">{product.sku}</p>
          <p className="text-sm font-bold text-slate-700">Stock {product.stock} {product.unit}</p>
          <p className="text-sm font-bold text-red-600">Alert at {product.lowStockAlert}</p>
        </div>
      ))}
      {!rows.length && <p className="p-6 text-center font-semibold text-slate-500">No low stock products.</p>}
    </div>
  );
}

function ProductImageUploadPanel({
  form,
  setForm,
  setMessage,
}: {
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  setMessage: (value: string) => void;
}) {
  const galleryUrls = splitLines(form.imageUrls);

  async function uploadCover(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setMessage("Uploading cover image...");
    try {
      const url = await uploadAdminImage(file);
      setForm({ ...form, coverImage: url });
      setMessage("Cover image uploaded.");
    } catch (err: any) {
      setMessage(err.message || "Cover image upload failed");
    }
  }

  async function uploadGallery(files: FileList | null) {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    setMessage(`Uploading ${selectedFiles.length} gallery image${selectedFiles.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls = [];
      for (const file of selectedFiles) {
        uploadedUrls.push(await uploadAdminImage(file));
      }
      const nextUrls = [...galleryUrls, ...uploadedUrls].filter(Boolean);
      setForm({ ...form, imageUrls: nextUrls.join("\n") });
      setMessage(`${uploadedUrls.length} gallery image${uploadedUrls.length > 1 ? "s" : ""} uploaded.`);
    } catch (err: any) {
      setMessage(err.message || "Gallery upload failed");
    }
  }

  function removeGalleryUrl(url: string) {
    setForm({ ...form, imageUrls: galleryUrls.filter((item) => item !== url).join("\n") });
  }

  return (
    <div className="mb-5 grid min-w-0 gap-4 overflow-hidden rounded-xl border border-slate-200 bg-[#f7f9fb] p-4">
      <div>
        <p className="text-sm font-black text-slate-900">Product Images</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Upload a cover image and multiple gallery images. PNG, JPG, WEBP or GIF up to 5MB each.</p>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
          Cover Image Upload
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadCover(event.target.files)} className="block w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 file:mr-3 file:max-w-full file:rounded-full file:border-0 file:bg-[#0d3e83] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
          Gallery Images Upload
          <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadGallery(event.target.files)} className="block w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 file:mr-3 file:max-w-full file:rounded-full file:border-0 file:bg-[#0d3e83] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
        </label>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Cover</p>
          {form.coverImage ? (
            <img src={form.coverImage} alt="Product cover preview" className="h-36 w-full rounded-2xl border border-slate-200 object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-bold text-slate-400">No cover</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Gallery</p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {galleryUrls.map((url) => (
              <div key={url} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={url} alt="Product gallery preview" className="h-28 w-full object-cover" />
                <button type="button" onClick={() => removeGalleryUrl(url)} className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-black text-red-600 shadow">
                  Remove
                </button>
              </div>
            ))}
            {!galleryUrls.length && <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-bold text-slate-400 sm:col-span-2 2xl:col-span-3">No gallery images</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminChatInbox({ initialThreads }: { initialThreads: ChatThread[] }) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [selectedId, setSelectedId] = useState<number | null>(initialThreads[0]?.id || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const selectedThread = threads.find((thread) => thread.id === selectedId) || null;
  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) => (
      [
        thread.customerName,
        thread.phone,
        thread.email,
        thread.lastMessage,
        thread.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    ));
  }, [threads, searchQuery]);

  useEffect(() => {
    setThreads(initialThreads);
    if (!selectedId && initialThreads[0]) setSelectedId(initialThreads[0].id);
  }, [initialThreads]);

  useEffect(() => {
    if (threads.length && (!selectedId || !threads.some((thread) => thread.id === selectedId))) {
      setSelectedId(threads[0].id);
    }
  }, [threads, selectedId]);

  function upsertThread(thread: ChatThread) {
    setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]);
  }

  function appendMessage(chatMessage: ChatMessage) {
    setMessages((current) => current.some((item) => item.id === chatMessage.id) ? current : [...current, chatMessage]);
  }

  useEffect(() => {
    const nextSocket = io({ path: "/socket.io", withCredentials: true });
    setSocket(nextSocket);
    nextSocket.on("connect", () => {
      nextSocket.emit("admin:join", {}, (response: any) => {
        if (response?.threads) {
          setThreads(response.threads);
          setSelectedId((current) => current || response.threads?.[0]?.id || null);
        }
        if (response?.error) setMessage(response.error);
      });
    });
    nextSocket.on("connect_error", () => setMessage("Live chat is reconnecting. Replies will still save."));
    nextSocket.on("chat:thread", (thread: ChatThread) => {
      upsertThread(thread);
      setSelectedId((current) => current || thread.id);
    });
    return () => {
      nextSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    api<ChatMessage[]>(`/api/admin/chat/threads/${selectedId}/messages`)
      .then((chatMessages) => {
        setMessages(chatMessages);
        setThreads((current) => current.map((thread) => thread.id === selectedId ? { ...thread, unreadForAdmin: 0 } : thread));
      })
      .catch((err) => setMessage(err.message || "Could not load messages"));
    socket?.emit("chat:join-thread", { threadId: selectedId }, (response: any) => {
      if (response?.thread) upsertThread({ ...response.thread, unreadForAdmin: 0 });
      if (response?.messages) setMessages(response.messages);
      if (response?.error) setMessage(response.error);
    });
  }, [selectedId, socket]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (chatMessage: ChatMessage) => {
      if (chatMessage.threadId !== selectedId) return;
      appendMessage(chatMessage);
    };
    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [selectedId, socket]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !selectedId) return;
    setReply("");
    if (socket?.connected) {
      socket.emit("chat:send", { threadId: selectedId, message: text }, (response: any) => {
        if (response?.error) setMessage(response.error);
        if (response?.thread) upsertThread(response.thread);
        if (response?.message) appendMessage(response.message);
      });
      return;
    }
    try {
      const result = await api<{ thread: ChatThread; message: ChatMessage }>(`/api/admin/chat/threads/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      upsertThread(result.thread);
      appendMessage(result.message);
    } catch (err: any) {
      setMessage(err.message || "Could not send reply");
    }
  }

  async function updateStatus(status: ChatThread["status"]) {
    if (!selectedId) return;
    const thread = await api<ChatThread>(`/api/admin/chat/threads/${selectedId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]);
  }

  function openFirstSearchResult() {
    if (filteredThreads[0]) setSelectedId(filteredThreads[0].id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Chat Inbox</h2>
            <p className="mt-1 text-sm text-slate-500">Reply directly to logged-in website users.</p>
          </div>
          <span className="rounded-full bg-[#f7f9fb] px-3 py-1 text-xs font-black text-[#0d3e83]">{threads.length}</span>
        </div>
        <div className="mt-5">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f7f9fb] px-4 py-3 focus-within:border-[#0d3e83]">
            <Search className="h-4 w-4 flex-none text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") openFirstSearchResult();
              }}
              placeholder="Search user name, phone, email or message"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                Clear
              </button>
            )}
          </label>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {searchQuery.trim() ? `${filteredThreads.length} user${filteredThreads.length === 1 ? "" : "s"} found` : "Search and click any user to open chat."}
          </p>
        </div>
        <div className="mt-5 grid max-h-[70vh] gap-3 overflow-auto">
          {filteredThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedId(thread.id)}
              className={`rounded-2xl border p-4 text-left transition ${selectedId === thread.id ? "border-[#0d3e83] bg-blue-50" : "border-slate-200 bg-white hover:bg-[#f7f9fb]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-900">{thread.customerName}</p>
                {thread.unreadForAdmin > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">{thread.unreadForAdmin}</span>}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">{thread.phone || thread.email}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{thread.lastMessage || "No messages yet."}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#c9a24a]">{thread.status}</p>
            </button>
          ))}
          {!threads.length && <p className="rounded-2xl bg-[#f7f9fb] p-6 text-center text-sm font-semibold text-slate-500">No user chats yet.</p>}
          {threads.length > 0 && !filteredThreads.length && <p className="rounded-2xl bg-[#f7f9fb] p-6 text-center text-sm font-semibold text-slate-500">No user found for this search.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {selectedThread ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedThread.customerName}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedThread.phone || "-"} | {selectedThread.email || "-"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => updateStatus("Open")} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Open</button>
                <button type="button" onClick={() => updateStatus("Resolved")} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Resolved</button>
              </div>
            </div>
            <div ref={messagesRef} className="mt-5 flex h-[48vh] flex-col gap-3 overflow-auto rounded-2xl bg-[#f7f9fb] p-4">
              {messages.map((chatMessage) => (
                <div key={chatMessage.id} className={`max-w-[82%] rounded-2xl p-3 text-sm shadow-sm ${chatMessage.senderType === "admin" ? "ml-auto bg-[#0d3e83] text-white" : "bg-white text-slate-700"}`}>
                  <p className="text-xs font-black opacity-75">{chatMessage.senderName}</p>
                  <p className="mt-1 leading-6">{chatMessage.message}</p>
                  <p className="mt-1 text-[11px] opacity-60">{new Date(chatMessage.createdAt).toLocaleString("en-IN")}</p>
                </div>
              ))}
              {!messages.length && <p className="m-auto text-sm font-semibold text-slate-500">No messages in this conversation.</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendReply()} placeholder="Type admin reply" className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-[#0d3e83]" />
              <button type="button" onClick={sendReply} className="rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">Send</button>
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-[#f7f9fb] p-10 text-center font-semibold text-slate-500">Select a chat thread.</p>
        )}
        {message && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
      </div>
    </div>
  );
}

function AdminBannerCMS({
  rows,
  form,
  setForm,
  editingId,
  setEditingId,
  saveRow,
  editRow,
  deleteRow,
}: {
  rows: Banner[];
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  editingId: number | null;
  setEditingId: (value: number | null) => void;
  saveRow: () => void;
  editRow: (row: Banner) => void;
  deleteRow: (id: number) => void;
}) {
  const [message, setMessage] = useState("");
  const sortedRows = rows.slice().sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));

  function startNewBanner() {
    setEditingId(null);
    const lastBanner = sortedRows[sortedRows.length - 1];
    setForm({
      ...defaultForm("banners"),
      displayOrder: String((lastBanner?.displayOrder || 0) + 1),
    });
    setMessage("");
  }

  async function uploadBannerImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setMessage("Uploading banner image...");
    try {
      const url = await uploadAdminImage(file);
      setForm({ ...form, imageUrl: url });
      setMessage("Banner image uploaded.");
    } catch (err: any) {
      setMessage(err.message || "Banner image upload failed");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">{editingId ? "Edit banner" : "Add homepage banner"}</h2>
            <p className="mt-1 text-sm text-slate-500">Create unlimited hero slider banners for the homepage.</p>
          </div>
          <button type="button" onClick={startNewBanner} className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
            Add New Banner
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f9fb]">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="Banner preview" className="aspect-[16/7] w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center text-sm font-bold text-slate-400">Banner preview</div>
          )}
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
            Banner Image Upload
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadBannerImage(event.target.files)} className="block w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 file:mr-3 file:max-w-full file:rounded-full file:border-0 file:bg-[#0d3e83] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
          </label>
          <TextInput label="Image URL" value={form.imageUrl || ""} onChange={(value) => setForm({ ...form, imageUrl: value })} />
          <TextInput label="Title" value={form.title || ""} onChange={(value) => setForm({ ...form, title: value })} />
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Subtitle
            <textarea className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.subtitle || ""} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Badge Text" value={form.badgeText || ""} onChange={(value) => setForm({ ...form, badgeText: value })} />
            <TextInput label="Display Order" value={form.displayOrder || "0"} onChange={(value) => setForm({ ...form, displayOrder: value })} />
            <TextInput label="CTA Text" value={form.ctaText || ""} onChange={(value) => setForm({ ...form, ctaText: value })} />
            <TextInput label="CTA Link" value={form.ctaLink || ""} onChange={(value) => setForm({ ...form, ctaLink: value })} />
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Status
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form.isActive || "true"} onChange={(event) => setForm({ ...form, isActive: event.target.value })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <button type="button" onClick={saveRow} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
            <Save className="h-4 w-4" /> {editingId ? "Update Banner" : "Create Banner"}
          </button>
          {message && <p className="rounded-xl bg-[#fffaf0] p-3 text-sm font-bold text-[#805f13]">{message}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Homepage Banners ({sortedRows.length})</h2>
            <p className="mt-1 text-sm text-slate-500">Active banners appear in the homepage hero slider by display order.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {sortedRows.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfe]">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <img src={banner.imageUrl || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80"} alt={banner.title} className="h-full min-h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c9a24a]">Order {banner.displayOrder}</p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">{banner.title}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${banner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{banner.subtitle}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#805f13]">{banner.badgeText || "No badge"}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0d3e83]">{banner.ctaText || "No CTA"}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{banner.ctaLink || "-"}</span>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => editRow(banner)} className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">Edit</button>
                    <button type="button" onClick={() => deleteRow(banner.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!sortedRows.length && <p className="rounded-2xl bg-[#f7f9fb] p-8 text-center font-semibold text-slate-500">No banners yet. Create your first homepage banner.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminModuleView(props: {
  active: AdminModule;
  rows: any[];
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  editingId: number | null;
  setEditingId: (value: number | null) => void;
  saveRow: () => void;
  editRow: (row: any) => void;
  deleteRow: (id: number) => void;
}) {
  const { active, rows, form, setForm, editingId, setEditingId, saveRow, editRow, deleteRow } = props;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [localMessage, setLocalMessage] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const exportLinks: Partial<Record<AdminModule, Array<{ label: string; href: string }>>> = {
    products: [
      { label: "Export Products CSV", href: "/api/admin/products/export.csv" },
      { label: "Download Import Template", href: "/api/admin/products/import-template.csv" },
    ],
    orders: [{ label: "Export Orders CSV", href: "/api/admin/orders/export.csv" }],
    customers: [{ label: "Export Customers CSV", href: "/api/admin/customers/export.csv" }],
    leads: [{ label: "Export Leads CSV", href: "/api/admin/leads/export.csv" }],
    "service-bookings": [{ label: "Export Service Bookings CSV", href: "/api/admin/service-bookings/export.csv" }],
    "product-enquiries": [{ label: "Export Product Enquiries CSV", href: "/api/admin/product-enquiries/export.csv" }],
    reviews: [{ label: "Export Reviews CSV", href: "/api/admin/reviews/export.csv" }],
  };
  const showProductForm = active !== "products" || productFormOpen || editingId !== null;

  function startNewProduct() {
    setEditingId(null);
    setForm(defaultForm("products"));
    setProductFormOpen(true);
    setLocalMessage("");
  }

  function editAdminRow(row: any) {
    if (active === "products") setProductFormOpen(true);
    editRow(row);
  }

  async function importProductsFromCsv() {
    const csv = window.prompt("Paste product CSV content from the import template. You can open the template in Excel, edit it, then paste the CSV here.");
    if (!csv) return;
    setLocalMessage("Importing products...");
    try {
      const result = await api<{ createdCount: number }>("/api/admin/products/import.csv", {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      setLocalMessage(`${result.createdCount} products imported. Refresh the module to see them.`);
    } catch (err: any) {
      setLocalMessage(err.message || "Product import failed");
    }
  }

  if (active === "chat") {
    return <AdminChatInbox initialThreads={rows as ChatThread[]} />;
  }

  if (active === "banners") {
    return (
      <AdminBannerCMS
        rows={rows as Banner[]}
        form={form}
        setForm={setForm}
        editingId={editingId}
        setEditingId={setEditingId}
        saveRow={saveRow}
        editRow={editRow}
        deleteRow={deleteRow}
      />
    );
  }

  if (active === "blog-topics") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">SEO Blog Topic Suggestions ({rows.length})</h2>
        <div className="mt-5 max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
          {rows.map((topic: BlogTopic) => (
            <div key={topic.id} className="border-b border-slate-100 p-4 last:border-b-0">
              <p className="font-bold text-slate-900">{topic.title}</p>
              <p className="mt-1 text-sm text-slate-500">{topic.category} | {topic.focusKeyword}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "orders") {
    const orderRows = rows as Order[];
    const activeOrder = selectedOrder ? orderRows.find((row) => row.id === selectedOrder.id) || null : orderRows[0] || null;
    const selectOrderForUpdate = (order: Order) => {
      setSelectedOrder(order);
      editRow(order);
    };
    return (
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Orders ({orderRows.length})</h2>
              <p className="mt-1 text-sm text-slate-500">Customer, product, payment, status, and invoice details.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(exportLinks.orders || []).map((link) => (
                <a key={link.href} href={link.href} className="rounded-full bg-[#0d3e83] px-4 py-2 text-sm font-bold text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-[#f7f9fb] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  {["Order ID", "Customer", "Phone", "Email", "Products count", "Product names", "Total", "Payment", "Status", "Date", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderRows.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-[#0d3e83]">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{order.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{order.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{order.email}</td>
                    <td className="px-4 py-3 text-slate-600">{orderItemCount(order)}</td>
                    <td className="px-4 py-3 text-slate-600">{orderProductNames(order)}</td>
                    <td className="px-4 py-3 font-black text-slate-900">{money(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{order.paymentStatus}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => selectOrderForUpdate(order)} className="rounded-full bg-[#0d3e83] px-3 py-1.5 text-xs font-bold text-white">View</button>
                        <button onClick={() => selectOrderForUpdate(order)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orderRows.length && <p className="p-6 text-center font-semibold text-slate-500">No orders yet.</p>}
          </div>
        </div>

        {activeOrder && <OrderDetailPanel order={activeOrder} orders={orderRows} />}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">{editingId ? "Update order status" : "Order status editor"}</h2>
          <p className="mt-1 text-sm text-slate-500">Select any order row, change the status, and save the update directly.</p>
          <p className="mt-3 rounded-2xl bg-[#f7f9fb] p-3 text-sm font-semibold text-slate-600">
            Flow: Pending to Processing to Upcoming Delivery to Delivered. Use Cancelled when the order should not be delivered.
          </p>
          <div className="mt-5">
            <DynamicForm active={active} form={form} setForm={setForm} />
            <button onClick={saveRow} disabled={!editingId} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300">
              <Save className="h-4 w-4" /> Save Order Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (active === "customers") {
    return <AdminCustomersView initialRows={rows as CustomerSummary[]} />;
  }

  if (active === "careerApplications") {
    return (
      <AdminCareerApplicationsView
        rows={rows as CareerApplication[]}
        form={form}
        setForm={setForm}
        editingId={editingId}
        setEditingId={setEditingId}
        saveRow={saveRow}
        editRow={editRow}
        deleteRow={deleteRow}
      />
    );
  }

  return (
    <div className={`grid gap-6 ${active === "products" && showProductForm ? "2xl:grid-cols-[minmax(720px,0.95fr)_minmax(420px,1.05fr)]" : "xl:grid-cols-[0.8fr_1.2fr]"}`}>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {active === "products" && !showProductForm ? (
          <div className="grid gap-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">Product Manager</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Click Add New Product to open the full product form with pricing, stock, SEO, cover image, and gallery image uploads.</p>
            </div>
            <button onClick={startNewProduct} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
              <ShoppingCart className="h-4 w-4" /> Add New Product
            </button>
            <div className="grid gap-2 rounded-xl bg-[#f7f9fb] p-3">
              <p className="text-sm font-bold text-slate-700">Import / Export</p>
              <div className="flex flex-wrap gap-2">
                {(exportLinks.products || []).map((link) => (
                  <a key={link.href} href={link.href} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#0d3e83] shadow-sm">
                    {link.label}
                  </a>
                ))}
                <button onClick={importProductsFromCsv} className="rounded-full bg-[#0d3e83] px-3 py-2 text-xs font-bold text-white">
                  Import Products CSV
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">{active === "products" ? editingId ? "Edit product" : "Add new product" : editingId ? "Edit item" : "Add item"}</h2>
              {(editingId || active === "products") && (
                <button onClick={() => { setEditingId(null); setForm(defaultForm(active)); if (active === "products") setProductFormOpen(false); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {active === "products" ? "Close" : "New"}
                </button>
              )}
            </div>
            {active === "products" && (
              <div className="mb-5 grid gap-2 rounded-xl bg-[#f7f9fb] p-3">
                <p className="text-sm font-bold text-slate-700">Import / Export</p>
                <div className="flex flex-wrap gap-2">
                  {(exportLinks.products || []).map((link) => (
                    <a key={link.href} href={link.href} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#0d3e83] shadow-sm">
                      {link.label}
                    </a>
                  ))}
                  <button onClick={importProductsFromCsv} className="rounded-full bg-[#0d3e83] px-3 py-2 text-xs font-bold text-white">
                    Import Products CSV
                  </button>
                </div>
              </div>
            )}
            {active === "products" && <ProductImageUploadPanel form={form} setForm={setForm} setMessage={setLocalMessage} />}
            <DynamicForm active={active} form={form} setForm={setForm} />
            <button onClick={saveRow} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0d3e83] px-5 py-3 text-sm font-bold text-white">
              <Save className="h-4 w-4" /> Save
            </button>
            {localMessage && <p className="mt-4 rounded-xl bg-[#fffaf0] p-3 text-sm font-bold text-[#805f13]">{localMessage}</p>}
          </>
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">Records ({rows.length})</h2>
          {exportLinks[active]?.length ? (
            <div className="flex flex-wrap gap-2">
              {exportLinks[active]?.map((link) => (
                <a key={link.href} href={link.href} className="rounded-full bg-[#0d3e83] px-3 py-2 text-xs font-bold text-white">
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-5 max-h-[72vh] overflow-auto rounded-xl border border-slate-200">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-slate-900">{row.orderNumber || row.leadNumber || row.jobTitle || row.title || row.name || row.question || row.customerName || row.companyName || row.code || `Item #${row.id}`}</p>
                <p className="mt-1 text-sm text-slate-500">{row.category || row.sku || row.phone || row.email || row.serviceUsed || row.type || row.status || row.orderStatus}</p>
                {row.resumeUrl && (
                  <a href={row.resumeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#0d3e83] underline underline-offset-4">
                    Open resume
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => editAdminRow(row)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">{active === "products" ? "Edit Product" : "Edit"}</button>
                <button onClick={() => deleteRow(row.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!rows.length && <p className="p-6 text-sm font-semibold text-slate-500">No records yet.</p>}
        </div>
      </div>
    </div>
  );
}

const singleAdminImageFields = new Set(["coverImage", "featuredImage", "imageUrl", "image", "thumbnailUrl", "logoUrl", "openGraphImage"]);
const multiAdminImageFields = new Set(["imageUrls"]);
const adminFieldLabels: Record<string, string> = {
  defaultGstPercentage: "Default GST percentage",
  deliveryCharge: "Fallback delivery charge",
  deliveryChargeBelow500: "Delivery charge below slab amount",
  deliveryChargeAbove500: "Delivery charge after slab amount",
  freeDeliveryAbove: "Free delivery from amount",
  minimumOrderAmount: "Delivery slab amount",
};

function adminFieldLabel(field: string) {
  return adminFieldLabels[field] || field;
}

function AdminImageInput({
  field,
  value,
  multiple,
  onChange,
}: {
  field: string;
  value: string;
  multiple: boolean;
  onChange: (value: string) => void;
}) {
  const [message, setMessage] = useState("");
  const urls = multiple ? splitLines(value) : splitLines(value).slice(0, 1);

  async function uploadFiles(files: FileList | null) {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    setMessage(`Uploading ${selectedFiles.length} image${selectedFiles.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        uploadedUrls.push(await uploadAdminImage(file));
      }
      onChange(multiple ? [...urls, ...uploadedUrls].join("\n") : uploadedUrls[0]);
      setMessage(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded.`);
    } catch (err: any) {
      setMessage(err.message || "Image upload failed");
    }
  }

  function removeUrl(url: string) {
    onChange(urls.filter((item) => item !== url).join("\n"));
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfe] p-4">
      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#0d3e83]">{multiple ? "URL + local images" : "URL + local image"}</span>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500">{field}</span>
        </div>
        {multiple ? (
          <textarea
            className="min-h-24 min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]"
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste one image URL per line, or upload local images below."
          />
        ) : (
          <input
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]"
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste image URL, or upload a local image below."
          />
        )}
        <input
          type="file"
          multiple={multiple}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => uploadFiles(event.target.files)}
          className="block w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 file:mr-3 file:max-w-full file:rounded-full file:border-0 file:bg-[#0d3e83] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
        />
        {urls.length ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {urls.map((url) => (
              <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={url} alt={`${field} preview`} className="h-36 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <p className="truncate text-xs font-semibold text-slate-500">{url}</p>
                  <button type="button" onClick={() => removeUrl(url)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-bold text-slate-400">No image selected</div>
        )}
        {message && <p className="rounded-xl bg-[#fffaf0] p-3 text-xs font-bold text-[#805f13]">{message}</p>}
      </div>
    </div>
  );
}

function DynamicForm({ active, form, setForm }: { active: AdminModule; form: Record<string, string>; setForm: (value: Record<string, string>) => void }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const fieldSets: Record<string, string[]> = {
    services: ["title", "category", "startingPrice", "priceUnit", "discountPrice", "shortDescription", "fullDescription", "benefits", "processSteps", "suitableFor", "toolsUsed", "estimatedTime", "serviceAreas", "coverImage", "imageUrls", "videoType", "youtubeUrl", "localVideoUrl", "faqItems", "seoTitle", "seoDescription", "seoKeywords", "isFeatured", "isActive"],
    products: ["name", "category", "sku", "hsnCode", "mainPrice", "discountPrice", "gstPercentage", "deliveryCharge", "unit", "packSize", "minimumOrderAmount", "minimumOrderQuantity", "stock", "lowStockAlert", "shortDescription", "fullDescription", "benefits", "usageInstructions", "suitableSurfaces", "safetyInstructions", "ingredients", "storageInstructions", "videoType", "youtubeUrl", "localVideoUrl", "faqItems", "htmlContent", "seoTitle", "seoDescription", "seoKeywords", "isFeatured", "isBestSeller", "isNewLaunch", "isActive"],
    orders: ["orderStatus", "paymentStatus", "adminNotes"],
    reviews: ["orderNumber", "productName", "customerName", "phone", "email", "rating", "review", "status", "adminNotes"],
    leads: ["name", "phone", "email", "companyName", "requirementType", "productRequired", "serviceRequired", "address", "floorType", "approxAreaSqFt", "preferredDate", "preferredTime", "source", "status", "priority", "assignedTo", "followUpDate", "adminNotes", "message"],
    "product-enquiries": ["name", "phone", "email", "companyName", "requirementType", "productRequired", "address", "source", "status", "priority", "assignedTo", "followUpDate", "adminNotes", "message"],
    "service-bookings": ["name", "phone", "email", "companyName", "requirementType", "serviceRequired", "address", "floorType", "approxAreaSqFt", "preferredDate", "preferredTime", "source", "status", "priority", "assignedTo", "followUpDate", "adminNotes", "message"],
    blogs: ["title", "category", "shortDescription", "content", "featuredImage", "imageAlt", "focusKeyword", "author", "tags", "seoTitle", "seoDescription", "seoKeywords", "status"],
    enquiries: ["name", "phone", "email", "serviceRequired", "productRequired", "address", "message", "status", "adminNotes"],
    faqs: ["category", "question", "answer", "displayOrder", "isActive"],
    testimonials: ["customerName", "rating", "review", "image", "serviceUsed", "location", "isActive"],
    banners: ["title", "subtitle", "imageUrl", "ctaText", "ctaLink", "badgeText", "displayOrder", "isActive"],
    categories: ["name", "type", "description", "image", "icon", "seoTitle", "seoDescription", "seoKeywords", "sortOrder", "isActive"],
    "product-categories": ["name", "type", "description", "image", "icon", "seoTitle", "seoDescription", "seoKeywords", "sortOrder", "isActive"],
    "service-categories": ["name", "type", "description", "image", "icon", "seoTitle", "seoDescription", "seoKeywords", "sortOrder", "isActive"],
    gallery: ["title", "imageUrl", "altText", "caption", "category", "sortOrder", "isActive"],
    videos: ["title", "videoType", "videoUrl", "thumbnailUrl", "description", "relatedProduct", "relatedService", "isActive"],
    coupons: ["code", "discountType", "discountValue", "minimumOrder", "maximumDiscount", "expiryDate", "usageLimit", "isActive"],
    careerJobs: ["title", "department", "location", "jobType", "salaryRange", "shortDescription", "fullDescription", "checklist", "responsibilities", "requirements", "seoTitle", "seoDescription", "seoKeywords", "status", "isActive"],
    careerApplications: ["jobTitle", "name", "phone", "email", "resumeUrl", "resumeFileName", "message", "status", "adminNotes"],
    adminUsers: ["name", "email", "role", "password", "isActive"],
    settings: ["brandName", "tagline", "logoUrl", "phone", "whatsappNumber", "email", "address", "googleMapLink", "instagramLink", "facebookLink", "youtubeLink", "linkedinLink", "workingHours", "codEnabled", "razorpayEnabled", "upiManualEnabled", "bankTransferEnabled", "upiId", "bankName", "accountNumber", "ifscCode", "defaultGstPercentage", "deliveryCharge", "deliveryChargeBelow500", "deliveryChargeAbove500", "freeDeliveryAbove", "minimumOrderAmount", "siteTitle", "defaultMetaDescription", "openGraphImage", "robotsTxt"],
  };

  return (
    <div className="grid gap-4">
      {(fieldSets[active] || []).map((field) => {
        const isLong = ["shortDescription", "fullDescription", "benefits", "processSteps", "suitableFor", "toolsUsed", "serviceAreas", "content", "tags", "message", "adminNotes", "answer", "review", "subtitle", "safetyInstructions", "suitableSurfaces", "usageInstructions", "seoDescription", "htmlContent", "robotsTxt", "imageUrls", "faqItems", "checklist", "responsibilities", "requirements"].includes(field);
        const selectOptions = active === "orders" && field === "orderStatus" ? orderStatusOptions
          : active === "orders" && field === "paymentStatus" ? paymentStatusOptions
            : active === "careerJobs" && field === "status" ? careerJobStatusOptions
              : active === "careerApplications" && field === "status" ? careerApplicationStatusOptions
                : null;
        const isSingleImage = singleAdminImageFields.has(field);
        const isMultiImage = multiAdminImageFields.has(field);
        return (
          <label key={field} className="grid gap-2 text-sm font-bold text-slate-700">
            {adminFieldLabel(field)}
            {isSingleImage || isMultiImage ? (
              <AdminImageInput field={field} value={form[field] || ""} multiple={isMultiImage} onChange={(value) => update(field, value)} />
            ) : selectOptions ? (
              <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form[field] || ""} onChange={(event) => update(field, event.target.value)}>
                {selectOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : isLong ? (
              <textarea className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form[field] || ""} onChange={(event) => update(field, event.target.value)} />
            ) : (
              <input className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-[#0d3e83]" value={form[field] || ""} onChange={(event) => update(field, event.target.value)} />
            )}
          </label>
        );
      })}
    </div>
  );
}

function defaultForm(active: AdminModule): Record<string, string> {
  if (active === "services") return { title: "", category: "Marble Polishing", startingPrice: "0", priceUnit: "custom quote", discountPrice: "0", shortDescription: "", fullDescription: "", benefits: "", processSteps: "", suitableFor: "Homes\nOffices\nSocieties", toolsUsed: "", estimatedTime: "", serviceAreas: "", coverImage: "", imageUrls: "", videoType: "none", youtubeUrl: "", localVideoUrl: "", faqItems: "", seoTitle: "", seoDescription: "", seoKeywords: "", isFeatured: "true", isActive: "true" };
  if (active === "products") return { name: "", category: "Floor Cleaner", sku: "", hsnCode: "", mainPrice: "0", discountPrice: "0", gstPercentage: "18", deliveryCharge: "0", unit: "1L", packSize: "1L", minimumOrderAmount: "500", minimumOrderQuantity: "1", stock: "0", lowStockAlert: "20", shortDescription: "", fullDescription: "", benefits: "", usageInstructions: "", suitableSurfaces: "", safetyInstructions: "", ingredients: "", storageInstructions: "", coverImage: "", imageUrls: "", videoType: "none", youtubeUrl: "", localVideoUrl: "", faqItems: "", htmlContent: "", seoTitle: "", seoDescription: "", seoKeywords: "", isFeatured: "false", isBestSeller: "false", isNewLaunch: "false", isActive: "true" };
  if (active === "blogs") return { title: "", category: "Floor Cleaning", shortDescription: "", content: "", author: "Gauranitai Experts", tags: "", seoTitle: "", seoDescription: "", seoKeywords: "", status: "draft" };
  if (active === "enquiries") return { name: "", phone: "", email: "", serviceRequired: "", productRequired: "", address: "", message: "", status: "New", adminNotes: "" };
  if (active === "leads" || active === "product-enquiries" || active === "service-bookings") return { name: "", phone: "", email: "", companyName: "", requirementType: active === "product-enquiries" ? "Product" : active === "service-bookings" ? "Service" : "General", productRequired: "", serviceRequired: "", address: "", floorType: "", approxAreaSqFt: "", preferredDate: "", preferredTime: "", source: "manual", status: "New", priority: "Medium", assignedTo: "", followUpDate: "", adminNotes: "", message: "" };
  if (active === "orders") return { orderStatus: "Pending", paymentStatus: "COD", adminNotes: "" };
  if (active === "reviews") return { orderNumber: "", productName: "", customerName: "", phone: "", email: "", rating: "5", review: "", status: "Pending", adminNotes: "" };
  if (active === "faqs") return { category: "General", question: "", answer: "", displayOrder: "0", isActive: "true" };
  if (active === "testimonials") return { customerName: "", rating: "5", review: "", image: "", serviceUsed: "", location: "", isActive: "true" };
  if (active === "banners") return { title: "", subtitle: "", imageUrl: "", ctaText: "Book Service", ctaLink: "/contact", badgeText: "", displayOrder: "0", isActive: "true" };
  if (active === "categories" || active === "product-categories" || active === "service-categories") return { name: "", type: active === "product-categories" ? "product" : active === "service-categories" ? "service" : "service", description: "", image: "", icon: "", seoTitle: "", seoDescription: "", seoKeywords: "", sortOrder: "0", isActive: "true" };
  if (active === "gallery") return { title: "", imageUrl: "", altText: "", caption: "", category: "Before After", sortOrder: "0", isActive: "true" };
  if (active === "videos") return { title: "", videoType: "youtube", videoUrl: "", thumbnailUrl: "", description: "", relatedProduct: "", relatedService: "", isActive: "true" };
  if (active === "coupons") return { code: "", discountType: "flat", discountValue: "0", minimumOrder: "0", maximumDiscount: "0", expiryDate: "", usageLimit: "0", isActive: "true" };
  if (active === "careerJobs") return { title: "", department: "Service Team", location: "Mumbai", jobType: "Full Time", salaryRange: "As per experience", shortDescription: "", fullDescription: "", checklist: "", responsibilities: "", requirements: "", seoTitle: "", seoDescription: "", seoKeywords: "", status: "Open", isActive: "true" };
  if (active === "careerApplications") return { jobTitle: "", name: "", phone: "", email: "", resumeUrl: "", resumeFileName: "", message: "", status: "New", adminNotes: "" };
  if (active === "adminUsers") return { name: "", email: "", role: "Admin", password: "", isActive: "true" };
  return {};
}

function rowToForm(active: AdminModule, row: any): Record<string, string> {
  if (active === "services") return { ...defaultForm(active), ...stringifyRow(row), benefits: (row.benefits || []).join("\n"), processSteps: (row.processSteps || []).join("\n"), suitableFor: (row.suitableFor || []).join("\n"), toolsUsed: (row.toolsUsed || []).join("\n"), serviceAreas: (row.serviceAreas || []).join("\n"), imageUrls: (row.images || []).map((image: any) => image.url).join("\n"), faqItems: (row.faqs || []).map((faq: any) => `${faq.question} | ${faq.answer}`).join("\n") };
  if (active === "products") return { ...defaultForm(active), ...stringifyRow(row), benefits: (row.benefits || []).join("\n"), suitableSurfaces: (row.suitableSurfaces || []).join("\n"), safetyInstructions: (row.safetyInstructions || []).join("\n"), imageUrls: (row.images || []).map((image: any) => image.url).join("\n"), faqItems: (row.faqs || []).map((faq: any) => `${faq.question} | ${faq.answer}`).join("\n") };
  if (active === "blogs") return { ...defaultForm(active), ...row, tags: (row.tags || []).join("\n") };
  if (active === "careerJobs") return { ...defaultForm(active), ...stringifyRow(row), checklist: (row.checklist || []).join("\n"), responsibilities: (row.responsibilities || []).join("\n"), requirements: (row.requirements || []).join("\n") };
  return Object.fromEntries(Object.entries({ ...defaultForm(active), ...row }).map(([key, value]) => [key, String(value ?? "")]));
}

function formToPayload(active: AdminModule, form: Record<string, string>) {
  if (active === "services") {
    const imageUrls = form.imageUrls || form.coverImage;
    const images = mediaImagesFromUrls(imageUrls, form.title || "Gauranitai service");
    return { ...form, startingPrice: Number(form.startingPrice || 0), discountPrice: Number(form.discountPrice || 0), coverImage: form.coverImage || images[0]?.url || "", benefits: splitLines(form.benefits), processSteps: splitLines(form.processSteps), suitableFor: splitLines(form.suitableFor), toolsUsed: splitLines(form.toolsUsed), serviceAreas: splitLines(form.serviceAreas), videoType: form.youtubeUrl ? "youtube" : form.localVideoUrl ? "local" : "none", isFeatured: toBool(form.isFeatured), isActive: toBool(form.isActive), images, faqs: faqItemsFromLines(form.faqItems) };
  }
  if (active === "products") {
    const discountPrice = Number(form.discountPrice || 0);
    const gstPercentage = Number(form.gstPercentage || 0);
    const deliveryCharge = Number(form.deliveryCharge || 0);
    const gstAmount = Math.round(discountPrice * (gstPercentage / 100));
    const imageUrls = form.imageUrls || form.coverImage;
    const images = mediaImagesFromUrls(imageUrls, form.name || "Gauranitai product");
    return { ...form, mainPrice: Number(form.mainPrice || 0), discountPrice, gstPercentage, gstAmount, deliveryCharge, finalPayablePrice: discountPrice + gstAmount + deliveryCharge, minimumOrderAmount: Number(form.minimumOrderAmount || 0), minimumOrderQuantity: Number(form.minimumOrderQuantity || 1), stock: Number(form.stock || 0), lowStockAlert: Number(form.lowStockAlert || 0), coverImage: form.coverImage || images[0]?.url || "", videoType: form.youtubeUrl ? "youtube" : form.localVideoUrl ? "local" : "none", benefits: splitLines(form.benefits), suitableSurfaces: splitLines(form.suitableSurfaces), safetyInstructions: splitLines(form.safetyInstructions), isFeatured: toBool(form.isFeatured), isBestSeller: toBool(form.isBestSeller), isNewLaunch: toBool(form.isNewLaunch), isActive: toBool(form.isActive), images, infoTable: [], faqs: faqItemsFromLines(form.faqItems) };
  }
  if (active === "blogs") return { ...form, tags: splitLines(form.tags) };
  if (active === "careerJobs") return { ...form, checklist: splitLines(form.checklist), responsibilities: splitLines(form.responsibilities), requirements: splitLines(form.requirements), isActive: toBool(form.isActive), status: form.status || "Open" };
  if (active === "careerApplications") return { ...form, status: form.status || "New" };
  if (active === "reviews") return { ...form, rating: Number(form.rating || 5) };
  if (active === "faqs") return { ...form, displayOrder: Number(form.displayOrder || 0), isActive: toBool(form.isActive) };
  if (active === "testimonials") return { ...form, rating: Number(form.rating || 5), isActive: toBool(form.isActive) };
  if (active === "banners") return { ...form, displayOrder: Number(form.displayOrder || 0), isActive: toBool(form.isActive) };
  if (active === "categories" || active === "product-categories" || active === "service-categories") return { ...form, type: active === "product-categories" ? "product" : active === "service-categories" ? "service" : form.type, sortOrder: Number(form.sortOrder || 0), isActive: toBool(form.isActive) };
  if (active === "gallery") return { ...form, sortOrder: Number(form.sortOrder || 0), isActive: toBool(form.isActive) };
  if (active === "videos") return { ...form, isActive: toBool(form.isActive) };
  if (active === "coupons") return { ...form, discountValue: Number(form.discountValue || 0), minimumOrder: Number(form.minimumOrder || 0), maximumDiscount: Number(form.maximumDiscount || 0), usageLimit: Number(form.usageLimit || 0), isActive: toBool(form.isActive), usedCount: 0 };
  if (active === "adminUsers") return { ...form, isActive: toBool(form.isActive) };
  return form;
}

function toBool(value: string) {
  return value === "true" || value === "yes" || value === "1";
}

function stringifyRow(row: any) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "")]));
}

function flattenSettings(settings: SiteSettings): Record<string, string> {
  return {
    brandName: settings.brandName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl || "",
    phone: settings.contact.phone,
    whatsappNumber: settings.contact.whatsappNumber,
    email: settings.contact.email,
    address: settings.contact.address,
    googleMapLink: settings.contact.googleMapLink,
    instagramLink: settings.contact.instagramLink,
    facebookLink: settings.contact.facebookLink,
    youtubeLink: settings.contact.youtubeLink,
    linkedinLink: settings.contact.linkedinLink,
    workingHours: settings.contact.workingHours,
    codEnabled: String(settings.payment.codEnabled),
    razorpayEnabled: String(settings.payment.razorpayEnabled),
    upiManualEnabled: String(settings.payment.upiManualEnabled),
    bankTransferEnabled: String(settings.payment.bankTransferEnabled),
    upiId: settings.payment.upiId,
    bankName: settings.payment.bankName,
    accountNumber: settings.payment.accountNumber,
    ifscCode: settings.payment.ifscCode,
    defaultGstPercentage: String(settings.taxDelivery.defaultGstPercentage),
    deliveryCharge: String(settings.taxDelivery.deliveryCharge),
    deliveryChargeBelow500: String(settings.taxDelivery.deliveryChargeBelow500),
    deliveryChargeAbove500: String(settings.taxDelivery.deliveryChargeAbove500),
    freeDeliveryAbove: String(settings.taxDelivery.freeDeliveryAbove),
    minimumOrderAmount: String(settings.taxDelivery.minimumOrderAmount),
    siteTitle: settings.seo.siteTitle,
    defaultMetaDescription: settings.seo.defaultMetaDescription,
    openGraphImage: settings.seo.openGraphImage || "",
    robotsTxt: settings.seo.robotsTxt,
  };
}

function unflattenSettings(form: Record<string, string>, settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    brandName: form.brandName,
    tagline: form.tagline,
    logoUrl: form.logoUrl || settings.logoUrl || "",
    contact: {
      ...settings.contact,
      phone: form.phone,
      whatsappNumber: form.whatsappNumber,
      email: form.email,
      address: form.address,
      googleMapLink: form.googleMapLink,
      instagramLink: form.instagramLink,
      facebookLink: form.facebookLink,
      youtubeLink: form.youtubeLink,
      linkedinLink: form.linkedinLink,
      workingHours: form.workingHours,
    },
    payment: {
      ...settings.payment,
      codEnabled: toBool(form.codEnabled),
      razorpayEnabled: toBool(form.razorpayEnabled),
      upiManualEnabled: toBool(form.upiManualEnabled),
      bankTransferEnabled: toBool(form.bankTransferEnabled),
      upiId: form.upiId,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      ifscCode: form.ifscCode,
    },
    taxDelivery: {
      ...settings.taxDelivery,
      defaultGstPercentage: Number(form.defaultGstPercentage || settings.taxDelivery.defaultGstPercentage),
      deliveryCharge: Number(form.deliveryCharge || settings.taxDelivery.deliveryCharge),
      deliveryChargeBelow500: Number(form.deliveryChargeBelow500 || settings.taxDelivery.deliveryChargeBelow500),
      deliveryChargeAbove500: Number(form.deliveryChargeAbove500 || settings.taxDelivery.deliveryChargeAbove500),
      freeDeliveryAbove: Number(form.freeDeliveryAbove || settings.taxDelivery.freeDeliveryAbove),
      minimumOrderAmount: Number(form.minimumOrderAmount || settings.taxDelivery.minimumOrderAmount),
    },
    seo: {
      ...settings.seo,
      siteTitle: form.siteTitle,
      defaultMetaDescription: form.defaultMetaDescription,
      openGraphImage: form.openGraphImage || settings.seo.openGraphImage || "",
      robotsTxt: form.robotsTxt,
    },
  };
}

function App() {
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <PublicSite />;
}

export default App;
