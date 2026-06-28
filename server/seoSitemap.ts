import type { Request } from "express";
import type { GauranitaiData } from "@shared/gauranitai";
import { allGeneratedSeoBlogSummaries } from "./generatedSeoBlogs";

type SitemapImage = {
  url: string;
  title: string;
  caption?: string;
};

type SitemapUrl = {
  path: string;
  title: string;
  lastmod?: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  images?: SitemapImage[];
};

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function cleanBaseUrl(value = "") {
  return (value || "http://localhost:5001").replace(/\/+$/, "");
}

function publicUrl(baseUrl: string, value = "") {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${cleanBaseUrl(baseUrl)}${path}`;
}

function publicPath(value = "") {
  if (!value || value === "/") return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function compactImages(baseUrl: string, images: Array<SitemapImage | undefined | null>) {
  const seen = new Set<string>();
  return images
    .filter((image): image is SitemapImage => Boolean(image?.url))
    .map((image) => ({ ...image, url: publicUrl(baseUrl, image.url) }))
    .filter((image) => {
      if (seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    });
}

export function publicBaseUrlFromRequest(req: Request) {
  if (process.env.PUBLIC_SITE_URL) return cleanBaseUrl(process.env.PUBLIC_SITE_URL);
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
  const host = req.get("host") || `localhost:${process.env.PORT || 5001}`;
  return cleanBaseUrl(`${protocol}://${host}`);
}

export function buildRobotsTxt(data: GauranitaiData, baseUrl: string) {
  const configured = data.settings?.seo?.robotsTxt || "";
  const defaultRules = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /login",
    "Disallow: /checkout",
    "Disallow: /cart",
    "Disallow: /account",
    "Disallow: /my-account",
  ].join("\n");
  let rules = configured.trim() ? configured.trim().replace(/^Sitemap:.*$/gim, "").trim() : defaultRules;
  if (!/^Disallow:\s*\/account\s*$/gim.test(rules)) rules = `${rules}\nDisallow: /account`;
  return `${rules}\n\nSitemap: ${publicUrl(baseUrl, "/sitemap.xml")}\n`;
}

export function buildSitemapEntries(data: GauranitaiData, baseUrl: string): SitemapUrl[] {
  const activeServices = data.services.filter((row) => row.isActive);
  const activeProducts = data.products.filter((row) => row.isActive);
  const publishedBlogs = data.blogs.filter((row) => row.status === "published");
  const generatedBlogs = allGeneratedSeoBlogSummaries();
  const gallery = data.gallery.filter((row) => row.isActive);
  const videos = data.videos.filter((row) => row.isActive);
  const careerJobs = (data.careerJobs || []).filter((row) => row.isActive && row.status === "Open");
  const banners = data.banners.filter((row) => row.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  const entries: SitemapUrl[] = [
    {
      path: "/",
      title: "Gauranitai Home",
      changefreq: "weekly",
      priority: "1.0",
      images: compactImages(baseUrl, banners.map((banner) => ({ url: banner.imageUrl, title: banner.title, caption: banner.subtitle }))),
    },
    { path: "/about-us", title: "About Gauranitai", changefreq: "monthly", priority: "0.8" },
    { path: "/services", title: "Services", changefreq: "weekly", priority: "0.9", images: compactImages(baseUrl, activeServices.map((service) => ({ url: service.coverImage, title: service.title, caption: service.shortDescription }))) },
    { path: "/products", title: "Products", changefreq: "weekly", priority: "0.9", images: compactImages(baseUrl, activeProducts.map((product) => ({ url: product.coverImage, title: product.name, caption: product.shortDescription }))) },
    { path: "/blogs", title: "Blogs", changefreq: "weekly", priority: "0.8", images: compactImages(baseUrl, publishedBlogs.map((blog) => ({ url: blog.featuredImage, title: blog.title, caption: blog.shortDescription }))) },
    { path: "/blog", title: "Blog", changefreq: "weekly", priority: "0.8" },
    { path: "/career", title: "Careers", changefreq: "weekly", priority: "0.7" },
    { path: "/gallery", title: "Gallery", changefreq: "monthly", priority: "0.7", images: compactImages(baseUrl, gallery.map((item) => ({ url: item.imageUrl, title: item.title, caption: item.caption }))) },
    { path: "/videos", title: "Videos", changefreq: "weekly", priority: "0.7", images: compactImages(baseUrl, videos.map((video) => ({ url: video.thumbnailUrl, title: video.title, caption: video.description }))) },
    { path: "/faq", title: "FAQ", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", title: "Contact", changefreq: "monthly", priority: "0.8" },
    { path: "/privacy-policy", title: "Privacy Policy", changefreq: "yearly", priority: "0.4" },
    { path: "/terms-and-conditions", title: "Terms and Conditions", changefreq: "yearly", priority: "0.4" },
    { path: "/refund-policy", title: "Refund Policy", changefreq: "yearly", priority: "0.3" },
    { path: "/shipping-policy", title: "Shipping Policy", changefreq: "yearly", priority: "0.3" },
    { path: "/sitemap", title: "HTML Sitemap", changefreq: "weekly", priority: "0.5" },
    ...activeServices.map((service) => ({
      path: `/services/${service.slug}`,
      title: service.title,
      lastmod: service.updatedAt,
      changefreq: "weekly" as const,
      priority: "0.9",
      images: compactImages(baseUrl, [
        { url: service.coverImage, title: service.title, caption: service.shortDescription },
        ...service.images.map((image) => ({ url: image.url, title: image.title || service.title, caption: image.caption })),
      ]),
    })),
    ...activeProducts.map((product) => ({
      path: `/products/${product.slug}`,
      title: product.name,
      lastmod: product.updatedAt,
      changefreq: "weekly" as const,
      priority: "0.8",
      images: compactImages(baseUrl, [
        { url: product.coverImage, title: product.name, caption: product.shortDescription },
        ...product.images.map((image) => ({ url: image.url, title: image.title || product.name, caption: image.caption })),
      ]),
    })),
    ...publishedBlogs.map((blog) => ({
      path: `/blogs/${blog.slug}`,
      title: blog.title,
      lastmod: blog.updatedAt,
      changefreq: "monthly" as const,
      priority: "0.7",
      images: compactImages(baseUrl, [{ url: blog.featuredImage, title: blog.title, caption: blog.shortDescription }]),
    })),
    ...generatedBlogs.map((blog) => ({
      path: `/blogs/${blog.slug}`,
      title: blog.title,
      lastmod: blog.updatedAt,
      changefreq: "monthly" as const,
      priority: "0.6",
      images: compactImages(baseUrl, [{ url: blog.featuredImage, title: blog.title, caption: blog.shortDescription }]),
    })),
    ...careerJobs.map((job) => ({
      path: `/career/${job.slug}`,
      title: job.title,
      lastmod: job.updatedAt,
      changefreq: "weekly" as const,
      priority: "0.7",
    })),
  ];

  return entries.map((entry) => ({ ...entry, path: publicPath(entry.path), lastmod: entry.lastmod || today() }));
}

export function buildSitemapXml(data: GauranitaiData, baseUrl: string) {
  const entries = buildSitemapEntries(data, baseUrl);
  const body = entries.map((entry) => {
    const images = (entry.images || []).map((image) => [
      "    <image:image>",
      `      <image:loc>${xmlEscape(image.url)}</image:loc>`,
      `      <image:title>${xmlEscape(image.title)}</image:title>`,
      image.caption ? `      <image:caption>${xmlEscape(image.caption)}</image:caption>` : "",
      "    </image:image>",
    ].filter(Boolean).join("\n")).join("\n");

    return [
      "  <url>",
      `    <loc>${xmlEscape(publicUrl(baseUrl, entry.path))}</loc>`,
      `    <lastmod>${xmlEscape(entry.lastmod || today())}</lastmod>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      images,
      "  </url>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    body,
    "</urlset>",
  ].join("\n");
}
