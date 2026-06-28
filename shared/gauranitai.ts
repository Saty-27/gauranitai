export type ActiveStatus = "active" | "inactive";
export type PublishStatus = "draft" | "published";
export type EnquiryStatus = "New" | "Contacted" | "In Progress" | "Completed";
export type LeadStatus = "New" | "Contacted" | "Quotation Sent" | "Follow-up" | "Converted" | "Lost";
export type LeadPriority = "Low" | "Medium" | "High";
export type RequirementType = "Product" | "Service" | "General";
export type PaymentMethod = "COD" | "Razorpay" | "UPI Manual" | "Bank Transfer";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "COD" | "Manual verification pending";
export type OrderStatus = "Pending" | "Confirmed" | "Paid" | "Processing" | "Upcoming Delivery" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
export type ReviewStatus = "Pending" | "Published" | "Rejected";
export type CareerJobStatus = "Draft" | "Open" | "Closed";
export type CareerApplicationStatus = "New" | "Reviewed" | "Shortlisted" | "Rejected" | "Hired";

export interface SeoFields {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
}

export interface MediaImage {
  id: number;
  url: string;
  title: string;
  altText: string;
  caption: string;
  type: "cover" | "gallery" | "thumbnail" | "lifestyle" | "usage" | "beforeAfter";
  sortOrder: number;
}

export interface InfoTableRow {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Category extends SeoFields {
  id: number;
  name: string;
  slug: string;
  type: "product" | "service" | "blog" | "faq" | "gallery" | "video";
  description: string;
  image: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product extends SeoFields {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: string;
  sku: string;
  hsnCode: string;
  mainPrice: number;
  discountPrice: number;
  gstPercentage: number;
  gstAmount: number;
  deliveryCharge: number;
  finalPayablePrice: number;
  unit: string;
  packSize: string;
  minimumOrderAmount: number;
  minimumOrderQuantity: number;
  stock: number;
  lowStockAlert: number;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  usageInstructions: string;
  suitableSurfaces: string[];
  safetyInstructions: string[];
  ingredients: string;
  storageInstructions: string;
  warrantyGuarantee: string;
  images: MediaImage[];
  coverImage: string;
  videoType: "youtube" | "local" | "none";
  youtubeUrl: string;
  localVideoUrl: string;
  htmlContent: string;
  infoTable: InfoTableRow[];
  faqs: FaqItem[];
  imageTitle: string;
  imageAltText: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewLaunch: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service extends SeoFields {
  id: number;
  title: string;
  slug: string;
  categoryId: number;
  category: string;
  shortDescription: string;
  fullDescription: string;
  startingPrice: number;
  priceUnit: "per sq ft" | "per visit" | "custom quote";
  discountPrice: number;
  images: MediaImage[];
  coverImage: string;
  videoType: "youtube" | "local" | "none";
  youtubeUrl: string;
  localVideoUrl: string;
  benefits: string[];
  processSteps: string[];
  suitableFor: string[];
  toolsUsed: string[];
  estimatedTime: string;
  serviceAreas: string[];
  faqs: FaqItem[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog extends SeoFields {
  id: number;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  content: string;
  featuredImage: string;
  imageAlt: string;
  tags: string[];
  author: string;
  status: PublishStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTopic {
  id: number;
  title: string;
  category: string;
  focusKeyword: string;
  suggestedSlug: string;
  priority: "Low" | "Medium" | "High";
  status: "Suggested" | "Planned" | "Written" | "Published";
  createdAt: string;
}

export interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  serviceRequired: string;
  productRequired: string;
  address: string;
  message: string;
  status: EnquiryStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: number;
  leadNumber: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  requirementType: RequirementType;
  productRequired: string;
  serviceRequired: string;
  message: string;
  address: string;
  floorType: string;
  approxAreaSqFt: string;
  preferredDate: string;
  preferredTime: string;
  source: "website" | "WhatsApp" | "phone" | "manual" | "social media";
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string;
  followUpDate: string;
  adminNotes: string;
  attachments: string[];
  timeline: Array<{ date: string; note: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPrice: number;
  gstPercentage: number;
  gstAmount: number;
  deliveryCharge: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  couponCode: string;
  couponDiscount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  orderNotes: string;
  adminNotes: string;
  invoiceNumber: string;
  stockDeductionLog: Array<{ productId: number; sku: string; quantity: number; date: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: number;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: number;
  customerName: string;
  rating: number;
  review: string;
  image: string;
  serviceUsed: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: number;
  orderId: number;
  orderNumber: string;
  productId: number;
  productName: string;
  customerName: string;
  phone: string;
  email: string;
  rating: number;
  review: string;
  status: ReviewStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  badgeText: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  title: string;
  altText: string;
  caption: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoItem {
  id: number;
  videoType: "youtube" | "local";
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  relatedProduct: string;
  relatedService: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareerJob extends SeoFields {
  id: number;
  title: string;
  slug: string;
  department: string;
  location: string;
  jobType: string;
  shortDescription: string;
  fullDescription: string;
  checklist: string[];
  responsibilities: string[];
  requirements: string[];
  salaryRange: string;
  status: CareerJobStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  jobSlug: string;
  name: string;
  phone: string;
  email: string;
  resumeUrl: string;
  resumeFileName: string;
  message: string;
  status: CareerApplicationStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSettings {
  companyName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapLink: string;
  instagramLink: string;
  facebookLink: string;
  youtubeLink: string;
  linkedinLink: string;
  workingHours: string;
}

export interface PaymentSettings {
  codEnabled: boolean;
  razorpayEnabled: boolean;
  upiManualEnabled: boolean;
  bankTransferEnabled: boolean;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface TaxDeliverySettings {
  defaultGstPercentage: number;
  deliveryCharge: number;
  deliveryChargeBelow500: number;
  deliveryChargeAbove500: number;
  freeDeliveryAbove: number;
  minimumOrderAmount: number;
  codEnabled: boolean;
}

export interface SeoSettings extends SeoFields {
  siteTitle: string;
  defaultMetaDescription: string;
  robotsTxt: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  contact: ContactSettings;
  payment: PaymentSettings;
  taxDelivery: TaxDeliverySettings;
  seo: SeoSettings;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Editor";
  password: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSession {
  name: string;
  phone: string;
  email: string;
}

export interface CustomerAccount {
  id: number;
  customerKey: string;
  customerName: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
  isBlocked: boolean;
  blockReason: string;
  adminNotes: string;
  lastLoginAt: string;
  lastLogoutAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: number;
  customerName: string;
  phone: string;
  email: string;
  status: "Open" | "Resolved";
  lastMessage: string;
  lastSender: "user" | "admin" | "system";
  unreadForAdmin: number;
  unreadForUser: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  threadId: number;
  senderType: "user" | "admin" | "system";
  senderName: string;
  message: string;
  createdAt: string;
}

export interface GauranitaiData {
  services: Service[];
  products: Product[];
  blogs: Blog[];
  blogTopics: BlogTopic[];
  enquiries: Enquiry[];
  leads: Lead[];
  orders: Order[];
  reviews: ProductReview[];
  faqs: Faq[];
  testimonials: Testimonial[];
  banners: Banner[];
  categories: Category[];
  gallery: GalleryItem[];
  videos: VideoItem[];
  coupons: Coupon[];
  careerJobs: CareerJob[];
  careerApplications: CareerApplication[];
  adminUsers: AdminUser[];
  customers: CustomerAccount[];
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
  settings: SiteSettings;
}

export interface CustomerSummary {
  id: number;
  customerKey: string;
  customerName: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
  isBlocked: boolean;
  blockReason: string;
  adminNotes: string;
  lastLoginAt: string;
  lastLogoutAt: string;
  orderCount: number;
  totalSpend: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  lastOrderNumber: string;
  lastOrderStatus: OrderStatus | "";
  lastOrderTotal: number;
  city: string;
  state: string;
  orders: Order[];
}

export interface DashboardStats {
  totalServices: number;
  totalProducts: number;
  totalOrders: number;
  newOrders: number;
  pendingOrders: number;
  processingOrders: number;
  upcomingDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalLeads: number;
  totalProductEnquiries: number;
  totalServiceBookings: number;
  newLeads: number;
  pendingFollowUps: number;
  totalReviews: number;
  pendingReviews: number;
  revenueToday: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  publishedBlogs: number;
  latestEnquiries: Enquiry[];
  latestLeads: Lead[];
  latestOrders: Order[];
  latestReviews: ProductReview[];
  latestServiceBookings: Lead[];
  latestProductEnquiries: Lead[];
  recentCustomers: CustomerSummary[];
  productStockOverview: Array<{
    id: number;
    name: string;
    sku: string;
    stock: number;
    unit: string;
    lowStockAlert: number;
  }>;
}

export interface CartItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutInput {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: PaymentMethod;
  orderNotes: string;
  couponCode?: string;
  items: CartItemInput[];
}

export interface CheckoutSummary {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  couponDiscount: number;
  totalAmount: number;
  minimumOrderAmount: number;
  freeDeliveryAbove: number;
  canCheckout: boolean;
  message: string;
}
