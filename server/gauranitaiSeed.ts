import type {
  AdminUser,
  Banner,
  Blog,
  BlogTopic,
  Category,
  Coupon,
  CareerApplication,
  CareerJob,
  CustomerAccount,
  Enquiry,
  Faq,
  FaqItem,
  GalleryItem,
  GauranitaiData,
  Lead,
  MediaImage,
  Order,
  ProductReview,
  Product,
  Service,
  Testimonial,
  VideoItem,
} from "@shared/gauranitai";

const now = () => new Date().toISOString();

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function timestamps() {
  const value = now();
  return { createdAt: value, updatedAt: value };
}

function finalPrice(discountPrice: number, gstPercentage: number, deliveryCharge: number) {
  const gstAmount = Math.round(discountPrice * (gstPercentage / 100));
  return { gstAmount, finalPayablePrice: discountPrice + gstAmount + deliveryCharge };
}

function image(id: number, url: string, title: string, type: MediaImage["type"] = "cover"): MediaImage {
  return {
    id,
    url,
    title,
    altText: `${title} by Gauranitai`,
    caption: title,
    type,
    sortOrder: id,
  };
}

function makeCategories(): Category[] {
  const groups = [
    ["Floor Cleaner", "product"],
    ["Marble Cleaner", "product"],
    ["Granite Cleaner", "product"],
    ["Tile Cleaner", "product"],
    ["Mosaic Cleaner", "product"],
    ["Bathroom Cleaner", "product"],
    ["Multi-Surface Cleaner", "product"],
    ["Stone Care Products", "product"],
    ["Marble Polish Products", "product"],
    ["Floor Shine Products", "product"],
    ["Heavy Duty Cleaner", "product"],
    ["Commercial Cleaning Products", "product"],
    ["Marble Polishing", "service"],
    ["Floor Cleaning", "service"],
    ["Stone Polishing", "service"],
    ["Commercial Cleaning", "service"],
    ["Residential Cleaning", "service"],
    ["Floor Maintenance", "service"],
    ["Marble Care", "blog"],
    ["Granite Care", "blog"],
    ["Tile Cleaning", "blog"],
    ["Mosaic Cleaning", "blog"],
    ["Cleaning Products", "blog"],
    ["Professional Cleaning Services", "blog"],
    ["Before After", "gallery"],
    ["Product Demo", "video"],
  ] as const;

  return groups.map(([name, type], index) => ({
    id: index + 1,
    name,
    slug: slugify(name),
    type,
    description: `${name} management category for Gauranitai.`,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
    icon: type === "product" ? "Droplets" : type === "service" ? "Sparkles" : "BadgeCheck",
    seoTitle: `${name} | Gauranitai`,
    seoDescription: `${name} from Gauranitai floor cleaning and marble polishing solutions.`,
    seoKeywords: `${name.toLowerCase()}, Gauranitai, floor cleaning, marble polishing`,
    sortOrder: index + 1,
    isActive: true,
    ...timestamps(),
  }));
}

const productSeeds = [
  ["Lizonex Floor Cleaner 1L", "Floor Cleaner", "CLEAN-FLOOR-1L", 249, 199, "1L", 300, 50, "Premium floor cleaner suitable for marble, granite, tiles, mosaic, and common floor surfaces."],
  ["Lizonex Floor Cleaner 5L", "Floor Cleaner", "CLEAN-FLOOR-5L", 999, 799, "5L", 150, 80, "Value pack floor cleaner for homes, offices, societies, shops, hotels, and commercial spaces."],
] as const;

const lizonexFloorCleanerOneLiterImages = [
  "https://www.lizonex.com/images/image1.jpg",
];

const lizonexFloorCleanerFiveLiterImages = [
  "https://www.lizonex.com/images/image7.jpg",
];

function makeProducts(categories: Category[]): Product[] {
  return productSeeds.map(([name, category, sku, mainPrice, discountPrice, unit, stock, deliveryCharge, description], index) => {
    const { gstAmount, finalPayablePrice } = finalPrice(discountPrice, 18, deliveryCharge);
    const categoryId = categories.find((row) => row.name === category)?.id || 1;
    const lizonexImages =
      sku === "CLEAN-FLOOR-1L"
        ? lizonexFloorCleanerOneLiterImages
        : sku === "CLEAN-FLOOR-5L"
          ? lizonexFloorCleanerFiveLiterImages
          : null;
    const cover = lizonexImages?.[0] || "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=85";
    const slug = sku === "CLEAN-FLOOR-1L" ? "lizonex-floor-cleaner" : slugify(name);

    return {
      id: index + 1,
      name,
      slug,
      categoryId,
      category,
      sku,
      hsnCode: "3402",
      mainPrice,
      discountPrice,
      gstPercentage: 18,
      gstAmount,
      deliveryCharge,
      finalPayablePrice,
      unit,
      packSize: unit,
      minimumOrderAmount: 500,
      minimumOrderQuantity: 1,
      stock,
      lowStockAlert: 20,
      shortDescription: description,
      fullDescription: `${description} It helps remove dirt, stains, and bad odour while maintaining floor freshness. Suitable for regular cleaning routines and commercial floor care needs.`,
      benefits: ["Daily floor cleaning", "Fresh clean feel", "Suitable for home and commercial use", "Supports marble, granite, tile and mosaic care"],
      usageInstructions: "Mix the recommended quantity in water and mop evenly. For heavy dirt, use a stronger diluted solution and wipe clean.",
      suitableSurfaces: ["Marble", "Granite", "Tiles", "Mosaic", "Bathroom floor", "Commercial floor"],
      safetyInstructions: ["Keep away from children", "Do not mix with other chemicals", "Test on a hidden area before full use", "Avoid direct eye contact"],
      ingredients: "Cleaning surfactants, fragrance, water base, floor-safe formulation.",
      storageInstructions: "Store in a cool, dry place away from direct sunlight.",
      warrantyGuarantee: "Quality support available for genuine product issues.",
      images: lizonexImages
        ? lizonexImages.map((url, imageIndex) => image(imageIndex + 1, url, `${name} image ${imageIndex + 1}`, imageIndex === 0 ? "cover" : "gallery"))
        : [
            image(1, cover, `${name} cover`, "cover"),
            image(2, "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=900&q=85", `${name} usage`, "usage"),
          ],
      coverImage: cover,
      videoType: "none",
      youtubeUrl: "",
      localVideoUrl: "",
      htmlContent: `<h2>${name}</h2><p>${description}</p><ul><li>Easy to use</li><li>Suitable for daily cleaning</li><li>Made for clean floor freshness</li></ul>`,
      infoTable: [
        { label: "SKU", value: sku },
        { label: "Pack size", value: unit },
        { label: "GST", value: "18%" },
        { label: "Delivery charge", value: `Rs. ${deliveryCharge}` },
      ],
      faqs: [
        { question: "Can this cleaner be used daily?", answer: "Yes, follow dilution instructions and test on a hidden area first." },
        { question: "Is it suitable for marble?", answer: "Yes, it is intended for common floor surfaces including marble." },
      ],
      imageTitle: `${name} product image`,
      imageAltText: `${name} for floor cleaning`,
      seoTitle: `${name} | Gauranitai Cleaning Products`,
      seoDescription: `${description} Buy or enquire for Gauranitai cleaning products.`,
      seoKeywords: `${category.toLowerCase()}, floor cleaner, marble cleaner, tile cleaner`,
      canonicalUrl: `/products/${slug}`,
      focusKeyword: category,
      openGraphTitle: `${name} by Gauranitai`,
      openGraphDescription: description,
      openGraphImage: cover,
      isFeatured: index < 4,
      isBestSeller: index < 2,
      isNewLaunch: index === 0,
      isActive: true,
      ...timestamps(),
    };
  });
}

const serviceSeeds = [
  ["Marble Polishing Service", "Marble Polishing", "Professional marble polishing service to restore shine, remove dullness, and improve the appearance of marble floors."],
  ["Diamond Marble Polishing", "Marble Polishing", "Advanced polishing method for marble floors to achieve a smooth, glossy, and premium finish."],
  ["Italian Marble Polishing", "Marble Polishing", "Specialized polishing service for Italian marble surfaces to maintain natural shine and elegance."],
  ["Granite Polishing", "Stone Polishing", "Professional granite polishing to restore surface shine and improve long-term appearance."],
  ["Stone Polishing", "Stone Polishing", "Stone polishing service for marble, granite, and natural stone surfaces."],
  ["Marble Restoration", "Marble Polishing", "Restoration service for dull, scratched, stained, or damaged marble floors."],
  ["Marble Crystallization", "Marble Polishing", "Crystallization treatment to enhance marble shine and surface protection."],
  ["Floor Deep Cleaning", "Floor Cleaning", "Deep cleaning service for residential and commercial floors to remove dirt, stains, and dullness."],
  ["Tile Cleaning", "Floor Cleaning", "Tile floor cleaning service for homes, offices, bathrooms, and commercial areas."],
  ["Mosaic Floor Cleaning", "Floor Cleaning", "Professional mosaic floor cleaning to remove dirt and restore freshness."],
  ["Bathroom Floor Cleaning", "Floor Cleaning", "Bathroom floor cleaning to remove dullness, stains, soap residue, and daily dirt build-up."],
  ["Commercial Floor Cleaning", "Commercial Cleaning", "Floor cleaning services for offices, hotels, shops, societies, and commercial properties."],
  ["Residential Floor Cleaning", "Residential Cleaning", "Home floor cleaning services for marble, tile, granite, mosaic, and regular flooring."],
  ["Society Floor Cleaning", "Commercial Cleaning", "Floor cleaning service for residential societies, lobbies, corridors, and shared spaces."],
  ["Office Floor Cleaning", "Commercial Cleaning", "Office floor cleaning service for a cleaner and more presentable workspace."],
  ["Hotel Floor Cleaning", "Commercial Cleaning", "Hotel floor polishing and cleaning for lobbies, rooms, corridors, and reception areas."],
  ["Floor Maintenance Service", "Floor Maintenance", "Scheduled floor maintenance service to keep polished floors clean, fresh, and presentable."],
] as const;

function youtubeShortUrl(videoId: string) {
  return `https://www.youtube.com/shorts/${videoId}`;
}

function youtubeThumb(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

const serviceVideoIds: Record<string, string> = {
  "Marble Polishing Service": "NLBAhneRORM",
  "Diamond Marble Polishing": "qCFYvlHkDcE",
  "Italian Marble Polishing": "XHJPVfoMVEw",
  "Granite Polishing": "HVHnf8vHAgE",
  "Stone Polishing": "DfZUDAdaNxw",
  "Marble Restoration": "_Upa89wMiuk",
  "Marble Crystallization": "UiLMZX7wC4Y",
  "Floor Deep Cleaning": "f0ThmOh9obU",
  "Tile Cleaning": "oh9kkBFRuKM",
  "Mosaic Floor Cleaning": "dF6ZUdCMz1I",
  "Bathroom Floor Cleaning": "IWNE6fxUpSw",
  "Commercial Floor Cleaning": "Eni3VO6BktI",
};

export const serviceMediaByTitle: Record<string, { coverImage: string; gallery: string[] }> = {
  "Marble Polishing Service": {
    coverImage: "/assets/uploads/ai-services/marble-polishing-ai.png",
    gallery: [youtubeThumb("NLBAhneRORM"), "/assets/uploads/blog-ai/restore-shine-marble-floors-ai.png"],
  },
  "Diamond Marble Polishing": {
    coverImage: "/assets/uploads/ai-services/diamond-marble-polishing-ai.png",
    gallery: [youtubeThumb("qCFYvlHkDcE"), "/assets/uploads/blog-ai/diamond-marble-polishing-process-ai.png"],
  },
  "Italian Marble Polishing": {
    coverImage: "/assets/uploads/blog-ai/italian-marble-polishing-guide-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1100&q=85", youtubeThumb("XHJPVfoMVEw")],
  },
  "Granite Polishing": {
    coverImage: "/assets/uploads/ai-services/granite-stone-polishing-ai.png",
    gallery: ["https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1100&q=85", youtubeThumb("HVHnf8vHAgE")],
  },
  "Stone Polishing": {
    coverImage: "/assets/uploads/blog-ai/diamond-polishing-vs-crystallization-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1100&q=85", youtubeThumb("DfZUDAdaNxw")],
  },
  "Marble Restoration": {
    coverImage: "/assets/uploads/blog-ai/restore-shine-marble-floors-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=85", youtubeThumb("_Upa89wMiuk")],
  },
  "Marble Crystallization": {
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("UiLMZX7wC4Y"), "/assets/uploads/ai-services/diamond-marble-polishing-ai.png"],
  },
  "Floor Deep Cleaning": {
    coverImage: "/assets/uploads/ai-services/tile-floor-cleaning-ai.png",
    gallery: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1100&q=85", youtubeThumb("f0ThmOh9obU")],
  },
  "Tile Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("oh9kkBFRuKM"), "/assets/uploads/ai-services/tile-floor-cleaning-ai.png"],
  },
  "Mosaic Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("dF6ZUdCMz1I"), "/assets/uploads/blog-ai/best-floor-cleaner-marble-tiles-ai.png"],
  },
  "Bathroom Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("IWNE6fxUpSw"), "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1100&q=85"],
  },
  "Commercial Floor Cleaning": {
    coverImage: "/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png",
    gallery: [youtubeThumb("Eni3VO6BktI"), "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=85"],
  },
  "Residential Floor Cleaning": {
    coverImage: "/assets/uploads/blog-ai/best-floor-cleaner-marble-tiles-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85", "/assets/uploads/ai-services/tile-floor-cleaning-ai.png"],
  },
  "Society Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1100&q=85"],
  },
  "Office Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1100&q=85"],
  },
  "Hotel Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1100&q=85",
    gallery: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1100&q=85", "/assets/uploads/blog-ai/italian-marble-polishing-guide-ai.png"],
  },
  "Floor Maintenance Service": {
    coverImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/diamond-polishing-vs-crystallization-ai.png", "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1100&q=85"],
  },
};

function serviceImageFor(title: string) {
  return serviceMediaByTitle[title]?.coverImage || "/assets/uploads/ai-services/marble-polishing-ai.png";
}

function serviceYoutubeFor(title: string) {
  const videoId = serviceVideoIds[title];
  return videoId ? youtubeShortUrl(videoId) : "";
}

function serviceImagesFor(title: string, cover: string) {
  const fallbackPool = Object.values(serviceMediaByTitle).flatMap((media) => [media.coverImage, ...media.gallery]).filter((url) => url !== cover);
  const serviceIndex = Math.max(0, serviceSeeds.findIndex(([seedTitle]) => seedTitle === title));
  const gallery = serviceMediaByTitle[title]?.gallery || [];
  const galleryOne = gallery[0] || fallbackPool[serviceIndex % fallbackPool.length] || "/assets/uploads/ai-services/granite-stone-polishing-ai.png";
  const galleryTwo = gallery[1] || fallbackPool[(serviceIndex + 5) % fallbackPool.length] || "/assets/uploads/ai-services/tile-floor-cleaning-ai.png";
  return [
    image(1, cover, `${title} cover`, "cover"),
    image(2, galleryOne, `${title} work image`, "gallery"),
    image(3, galleryTwo, `${title} result image`, "beforeAfter"),
  ];
}

function makeServices(categories: Category[]): Service[] {
  return serviceSeeds.map(([title, category, shortDescription], index) => {
    const categoryId = categories.find((row) => row.name === category)?.id || 13;
    const cover = serviceImageFor(title);
    const youtubeUrl = serviceYoutubeFor(title);
    return {
      id: index + 1,
      title,
      slug: slugify(title),
      categoryId,
      category,
      shortDescription,
      fullDescription: `${title} by Gauranitai helps restore floor beauty through inspection, cleaning, treatment, polishing, finishing, and maintenance guidance.`,
      startingPrice: index < 4 ? 12 : 8,
      priceUnit: index < 4 ? "per sq ft" : "custom quote",
      discountPrice: index < 4 ? 10 : 0,
      images: serviceImagesFor(title, cover),
      coverImage: cover,
      videoType: youtubeUrl ? "youtube" : "none",
      youtubeUrl,
      localVideoUrl: "",
      benefits: ["Restores shine", "Improves floor appearance", "Surface-safe methods", "Suitable for residential and commercial spaces"],
      processSteps: ["Floor inspection", "Area protection", "Surface cleaning", "Treatment and polishing", "Final shine check", "Care guidance"],
      suitableFor: ["Homes", "Offices", "Societies", "Hotels", "Shops", "Commercial spaces"],
      toolsUsed: ["Polishing machine", "Diamond pads", "Floor-safe cleaners", "Microfiber tools"],
      estimatedTime: "Depends on area and floor condition",
      serviceAreas: ["Mumbai", "Navi Mumbai", "Thane", "Nearby commercial areas"],
      faqs: [
        { question: `How long does ${title.toLowerCase()} take?`, answer: "Timing depends on floor area and condition." },
        { question: "Can I book on WhatsApp?", answer: "Yes, share photos, location, and approximate area." },
      ],
      seoTitle: `${title} | Gauranitai`,
      seoDescription: `${shortDescription} Book Gauranitai floor cleaning and stone care services.`,
      seoKeywords: `${title.toLowerCase()}, marble polishing service, floor cleaning service`,
      canonicalUrl: `/services/${slugify(title)}`,
      focusKeyword: title,
      openGraphTitle: `${title} by Gauranitai`,
      openGraphDescription: shortDescription,
      openGraphImage: cover,
      isFeatured: index < 9,
      isActive: true,
      ...timestamps(),
    };
  });
}

type LongBlogSeed = {
  title: string;
  category: string;
  shortDescription: string;
  featuredImage: string;
  imageAlt: string;
  focusKeyword: string;
  tags: string[];
  audience: string;
  location: string;
  surface: string;
  problem: string;
  solution: string;
  ctaText: string;
  ctaLink: string;
  supportingProduct: string;
  tableRows: Array<[string, string, string]>;
  checklist: string[];
  processSteps: string[];
  faqs: FaqItem[];
  localExamples: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function makeLongBlogContent(blog: LongBlogSeed) {
  const table = [
    "| Need or Situation | Recommended Action | Practical Notes |",
    "| --- | --- | --- |",
    ...blog.tableRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`),
  ].join("\n");

  const checklist = blog.checklist.map((item) => `- [ ] ${item}`).join("\n");
  const process = blog.processSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const examples = blog.localExamples.map((item) => `- ${item}`).join("\n");
  const faqs = blog.faqs.map((faq) => `### ${faq.question}\n${faq.answer}`).join("\n\n");

  let content = `## Quick answer for Mumbai readers
${blog.shortDescription} If you are in ${blog.location}, the right decision starts with understanding the floor condition, the usage pattern, and whether the surface needs only cleaning, deeper treatment, or professional polishing. This guide is written for ${blog.audience}, so the advice stays practical and easy to apply instead of sounding like a product brochure.

Most floor problems do not appear in one day. The issue of ${blog.problem} usually builds up because of dust, incorrect mopping liquid, traffic marks, hard water, small scratches, acidic spills, or old polish layers. A good floor-care plan looks at the reason behind the dullness or staining before recommending a service or cleaner. That is why Gauranitai always asks for floor photos, approximate area, location, and the main issue before giving guidance.

For a Mumbai home, office, society, hotel, showroom, clinic, restaurant, school, or gym, the expectation is simple: the floor should look clean, feel fresh, and remain easy to maintain. The best solution is not always the most aggressive treatment. Sometimes a correct deep clean is enough. Sometimes diamond polishing is needed. Sometimes the floor needs restoration before final shine work. The purpose of this blog is to help you choose calmly.

## The main problem this article solves
The core issue here is ${blog.problem}. On ${blog.surface}, this can show as a cloudy reflection, patchy shine, dull walking lanes, rough touch, stains near furniture, black dirt near edges, or marks that return soon after mopping. Customers often assume that every dull floor needs the same polish, but stone and tile surfaces respond differently.

Marble is softer than granite and can react badly to acidic cleaners. Italian marble can look luxurious but also shows etching quickly. Granite is harder but can lose its rich appearance when grease or mineral deposits sit on it. Tiles and mosaic floors may hold dirt in grout lines, corners, and texture. Because of these differences, one method cannot be used blindly on every floor.

In busy Mumbai properties, daily dust and foot traffic add another layer to the problem. A flat in Dadar, a clinic in Andheri, an office in Lower Parel, a society lobby in Thane, and a hotel corridor in South Mumbai may all need different handling even if the surface looks similar from a distance. The correct approach is to match the method with the floor type and the lifestyle of the space.

The goal is not to force keywords into the page. The goal is to answer real customer questions: what is happening to my floor, what should I avoid, what process is sensible, what will it cost, how long will it take, and how do I maintain the result after the work is completed?

## What Gauranitai recommends
${blog.solution} The recommendation depends on the present condition of the floor, the age of the surface, previous maintenance, and the expected finish. A premium marble floor may need a polished reflection, while a commercial tile floor may need hygiene, grip, and daily freshness more than mirror-like shine.

For service enquiries, Gauranitai normally starts with inspection questions. What is the floor material? Is it marble, Italian marble, granite, tile, mosaic, or another stone? Is the problem dullness, stain, smell, scratches, black corners, renovation dust, or traffic wear? Is the space residential or commercial? These answers help avoid wrong treatment and unnecessary cost.

For product guidance, ${blog.supportingProduct} can support daily floor cleaning when used correctly. A daily cleaner should be practical, easy to dilute, and suitable for regular mopping. It should not leave a sticky film or harsh smell. It should also be used with a clean mop and the right dilution instead of being poured randomly on the floor.

Professional service and daily product care work best together. Polishing or deep cleaning gives the floor a better base condition. Daily maintenance protects that result. If the floor is already damaged, a cleaner alone cannot repair scratches or deep etching. If the floor is newly polished, wrong daily care can reduce shine faster than expected.

## Step-by-step process
${process}

This process keeps the customer informed and reduces confusion. A proper technician should not promise the same finish for every floor without seeing the condition. Old marble, new Italian marble, granite counters, bathroom tiles, and commercial floor passages all need different handling. Even within one property, the lobby may need a stronger process than bedrooms or cabins.

The final step is maintenance guidance. This is where many projects fail. Customers get a good shine after service but continue using harsh cleaners, dirty mop water, or abrasive pads. Within weeks, the floor starts looking tired again. Gauranitai explains simple care: remove dust first, mop with the right dilution, dry heavy wet areas, avoid acidic liquids, and call for periodic maintenance before damage becomes expensive.

## Price and planning guide
Cost depends on surface type, area size, access, furniture movement, stains, scratches, traffic level, and the exact service or product required. A small residential room is planned differently from a society lobby or hotel reception. Commercial spaces may need off-hour work so that cleaning or polishing does not disturb daily operations.

The following table gives a simple planning view. It is not a fixed quotation because floor condition can change the process. Use it as a starting point before sending photos or booking an inspection.

${table}

For service work, ask for a clear scope: what is included, what is not included, how furniture will be handled, what finish can realistically be expected, and what care is needed after the work. For product orders, check the pack size, surface suitability, usage instructions, and delivery option. This prevents misunderstanding and gives a better customer experience.

## Checklist before booking or buying
${checklist}

This checklist helps avoid rushed decisions. If a provider gives a price without asking about floor type or condition, be careful. If a cleaner promises to solve every stain, scratch, smell, and dullness problem alone, be careful again. Good floor care is practical, not magical.

## Mumbai location examples
${examples}

Mumbai properties often have mixed floor needs. A home may have Italian marble in the living room, tiles in the bathroom, granite in the kitchen, and mosaic in an old balcony. A commercial property may have granite reception counters, vitrified tiles in cabins, marble in the lobby, and rough flooring in service areas. That is why the best recommendation is based on the surface and use, not only the area name.

In coastal or humid areas, floors may also feel sticky or show marks faster. In high-rise apartments, dust from nearby construction can settle quickly. In offices and hotels, shoes bring grit that slowly abrades polished stone. In societies, lobby cleaning needs consistency because many people walk through the area every day. These local realities matter when planning a floor-care routine.

## Common mistakes to avoid
- Using acidic bathroom cleaner on marble or polished stone.
- Scrubbing shiny marble with rough pads that create fine scratches.
- Mixing different chemicals without knowing the reaction.
- Using too much cleaner and leaving residue on the floor.
- Mopping with dirty water and expecting a fresh result.
- Ignoring small stains until they become harder to treat.
- Booking polishing when the floor only needs deep cleaning.
- Buying a daily cleaner and expecting it to repair stone damage.

These mistakes are common because customers want quick results. The safer approach is to diagnose first. For example, dullness from dust film can improve with deep cleaning. Dullness from scratches may need polishing. A cloudy patch from acid etching may need restoration. Black grout may need tile or bathroom cleaning. The correct method saves time, money, and stress.

## Daily maintenance plan
Start with dry dust removal. Dust and sand are small but abrasive, especially on polished marble. If you mop without removing dust, the mop can drag particles across the surface and slowly reduce shine. In homes, a soft broom or microfiber dust mop is usually enough. In offices and commercial areas, routine dry mopping before wet cleaning makes a visible difference.

Use the correct dilution for daily cleaning. More liquid does not always mean better cleaning. Too much cleaner can leave a film, attract dirt, or make the floor feel sticky. A measured amount in clean water is usually better than a strong mix. Change mop water when it becomes dirty, especially in large spaces.

Protect heavy traffic zones. Entrance mats, shoe-dust control, furniture pads, and quick spill cleaning help polished floors last longer. In hotels, clinics, showrooms, and offices, the entry zone often decides how the rest of the floor looks through the day. If that area stays dirty, the dirt travels everywhere.

Do not ignore stains. Tea, coffee, oil, rust, turmeric, paint, cement marks, and acidic spills behave differently. Some can be cleaned; others need professional treatment. Rubbing aggressively may spread the mark or damage the finish. Take a photo and ask for guidance before using strong chemicals.

Schedule maintenance before the floor looks completely damaged. Light periodic maintenance is usually easier than major restoration. For commercial properties, a planned maintenance calendar keeps the floor presentable and reduces emergency work before events, inspections, festivals, or guest visits.

## Why choose Gauranitai
Gauranitai focuses on professional marble polishing, floor cleaning, stone care, and practical cleaning product solutions. The brand position is simple: restore shine, improve cleanliness, and help customers maintain floors with proper methods and quality products.

Customers can contact Gauranitai for homes, offices, societies, hotels, shops, showrooms, clinics, restaurants, schools, gyms, and commercial spaces. The team can guide whether the floor needs polishing, deep cleaning, restoration, crystallization, or daily product care. This saves customers from buying the wrong product or booking the wrong service.

The communication is kept simple. Share photos, location, surface type, approximate area, and your main issue. You will get clearer guidance about what can be improved, what result is realistic, and what maintenance is needed after the work.

## Useful internal links
- [Book a service enquiry](/contact)
- [View marble polishing services](/services/marble-polishing-service)
- [View diamond marble polishing](/services/diamond-marble-polishing)
- [View floor cleaning services](/services/floor-deep-cleaning)
- [Order Lizonex floor cleaner](/products/lizonex-floor-cleaner)
- [Read more floor care blogs](/blogs)

## Frequently asked questions
${faqs}

## Final recommendation
If your floor has ${blog.problem}, do not decide only by looking at one photo or one price. Start with the surface type, floor age, current condition, usage, and expected result. Then choose the right service or product. This approach is safer for marble, granite, tile, mosaic, and natural stone surfaces.

For personal guidance, use the contact form or WhatsApp button and share your floor photos. Gauranitai can help you decide whether you need professional service, daily cleaning product support, or a maintenance plan. ${blog.ctaText}: [contact Gauranitai now](${blog.ctaLink}).`;

  const expansionNotes = [
    `A good floor-care decision also considers timing. Residential customers may prefer work during daytime, while offices, hotels, and shops may need early morning or night schedules. Planning the timing properly keeps the process calmer and avoids rushing the finish.`,
    `Another important point is expectation setting. Some stains and scratches can improve strongly, while very deep damage may not disappear completely without restoration. Honest guidance is better than overpromising because it helps the customer choose the right budget and result.`,
    `For large spaces, divide the floor into zones. High-traffic zones, corners, wet areas, and visible entrance areas should be checked separately. This helps the team plan machines, pads, cleaner strength, drying time, and final inspection more professionally.`,
    `For daily cleaning, staff training matters as much as the product. The same cleaner can give different results when the mop is dirty, dilution is wrong, or water is not changed. Simple instructions placed in a pantry or housekeeping area can protect the floor for months.`,
    `For homes with children, elderly family members, pets, or frequent guests, freshness and slip control are also important. The aim is not only shine; the floor should feel clean, safe, and comfortable for daily life.`,
    `For commercial locations, appearance has business value. A clean lobby, showroom, clinic, hotel reception, or office floor creates confidence. Regular floor care is part of the customer experience, not only a housekeeping expense.`,
  ];

  let noteIndex = 0;
  while (wordCount(content) < 2050) {
    content += `\n\n${expansionNotes[noteIndex % expansionNotes.length]}`;
    noteIndex += 1;
  }

  return content;
}

function makeBlogs(): Blog[] {
  const blogs: LongBlogSeed[] = [
    {
      title: "How to Restore Shine on Marble Floors",
      category: "Marble Polishing",
      shortDescription: "Learn how dull marble can regain a clean, glossy finish with the right cleaning, polishing, and maintenance steps.",
      featuredImage: "/assets/uploads/blog-ai/restore-shine-marble-floors-ai.png",
      imageAlt: "Professional marble floor shine restoration in a Mumbai apartment",
      focusKeyword: "marble polishing service",
      tags: ["Marble Shine", "Floor Care", "Polishing Service"],
      audience: "Mumbai homeowners, society managers, and office admins who want dull marble to look fresh again",
      location: "Mumbai, Navi Mumbai, and Thane",
      surface: "Indian marble, Italian marble, and common polished stone flooring",
      problem: "dull marble floors losing shine after daily use, wrong cleaner use, and foot traffic",
      solution: "Start with inspection, deep cleaning, stain checking, diamond polishing where needed, and a simple maintenance plan after service.",
      ctaText: "Call now for marble polishing in Mumbai",
      ctaLink: "/contact?service=Marble%20Polishing%20Service",
      supportingProduct: "Lizonex floor cleaner",
      tableRows: [
        ["Light dullness after regular mopping", "Deep cleaning and correct daily cleaner", "Best when scratches are minor and the surface is not etched."],
        ["Patchy shine or walking lanes", "Marble polishing inspection", "Diamond polishing may be needed for visible traffic wear."],
        ["Acid marks or deep stains", "Restoration before final shine", "A cleaner alone cannot repair etched or damaged stone."],
        ["Recently polished marble", "Maintenance cleaning plan", "Use gentle cleaning and avoid acidic products."],
      ],
      checklist: [
        "Take clear daylight photos of dull and shiny areas.",
        "Confirm whether the floor is Indian marble, Italian marble, granite, tile, or mosaic.",
        "Note the areas with stains, scratches, or cloudy patches.",
        "Share approximate square feet before asking for price.",
        "Ask what result is realistic before booking service.",
        "Keep furniture movement and drying time in mind.",
        "Use a suitable daily cleaner after polishing.",
        "Avoid acid, bleach, and rough scrubbing pads on polished stone.",
      ],
      processSteps: [
        "Inspect the marble surface, dullness level, stains, scratches, and traffic lanes.",
        "Remove loose dust and protect nearby furniture, skirting, and walls.",
        "Deep clean the surface so polishing does not trap dirt below the finish.",
        "Use the right polishing method based on floor condition and expected shine.",
        "Check reflection, edges, corners, and high-traffic areas before handover.",
        "Explain daily cleaning, spill care, and periodic maintenance to the customer.",
      ],
      faqs: [
        { question: "Can all dull marble floors become shiny again?", answer: "Most dull marble floors can improve, but the result depends on scratches, stains, etching, previous chemical use, and stone age. Inspection gives a more realistic answer." },
        { question: "Is polishing better than normal mopping?", answer: "Mopping removes daily dirt. Polishing improves surface reflection when the stone itself has become dull or scratched. Both have different purposes." },
        { question: "How do I maintain marble shine after service?", answer: "Remove dust before mopping, use a suitable cleaner with correct dilution, clean spills quickly, and avoid acidic or abrasive products." },
      ],
      localExamples: [
        "A Dadar apartment with dull living-room marble may need deep cleaning followed by polishing.",
        "A Thane society lobby with walking lanes may need zone-wise polishing and a maintenance schedule.",
        "A Bandra home with cloudy patches may need stain checking before final shine work.",
        "A South Mumbai office reception may need off-hour service so visitors are not disturbed.",
      ],
      seoTitle: "Restore Marble Shine in Mumbai | Gauranitai",
      seoDescription: "Learn how to restore dull marble shine with cleaning, polishing, maintenance tips, price guidance, checklist and FAQs for Mumbai floors.",
      seoKeywords: "restore marble shine, marble polishing Mumbai, dull marble floor, marble floor cleaning, marble maintenance",
    },
    {
      title: "Diamond Marble Polishing Process Explained",
      category: "Marble Polishing",
      shortDescription: "Understand how diamond pad polishing improves marble smoothness, clarity, and long-term shine.",
      featuredImage: "/assets/uploads/blog-ai/diamond-marble-polishing-process-ai.png",
      imageAlt: "Diamond pad marble polishing machine process on marble floor",
      focusKeyword: "diamond marble polishing",
      tags: ["Diamond Polishing", "Marble Care", "Stone Care"],
      audience: "customers comparing normal polishing, diamond polishing, and restoration for premium marble floors",
      location: "Mumbai homes, offices, hotels, societies, and showrooms",
      surface: "marble floors with dullness, fine scratches, traffic wear, and uneven reflection",
      problem: "marble floors needing smoother reflection because normal cleaning is no longer improving the finish",
      solution: "Use a controlled diamond pad sequence after inspection so the surface is refined gradually instead of covered with temporary shine.",
      ctaText: "Book diamond marble polishing guidance",
      ctaLink: "/contact?service=Diamond%20Marble%20Polishing",
      supportingProduct: "Lizonex floor cleaner",
      tableRows: [
        ["Fine scratches and dull walking lanes", "Diamond polishing", "Useful when the surface needs mechanical refinement."],
        ["Uneven reflection after old treatment", "Inspection and pad sequence planning", "Wrong pad selection can create patchy results."],
        ["Deep stains or damaged joints", "Restoration first", "Polishing should not hide unresolved damage."],
        ["Freshly polished floors", "Gentle daily cleaning", "Protect the finish with correct mopping and dust control."],
      ],
      checklist: [
        "Ask whether the provider uses a step-by-step pad sequence.",
        "Check whether furniture and wall edges will be protected.",
        "Discuss expected reflection before the work starts.",
        "Confirm if restoration is needed before polishing.",
        "Ask about drying time and access after service.",
        "Check high-traffic zones separately from low-use rooms.",
        "Request maintenance guidance after the polish.",
        "Avoid wax-only solutions when the marble needs surface refinement.",
      ],
      processSteps: [
        "Inspect marble condition, scratches, stains, cracks, and previous polish layers.",
        "Prepare the site by clearing movement space and protecting nearby surfaces.",
        "Clean the floor thoroughly before starting diamond pad work.",
        "Use progressive diamond pads based on floor condition and desired finish.",
        "Clean residue between stages so the finish remains even.",
        "Complete final shine check and explain after-care instructions.",
      ],
      faqs: [
        { question: "Is diamond polishing the same as wax polishing?", answer: "No. Diamond polishing refines the marble surface mechanically. Wax-based shine can be temporary and may not solve scratches or uneven reflection." },
        { question: "How long does diamond marble polishing take?", answer: "Timing depends on area, floor condition, furniture movement, and the number of polishing stages required." },
        { question: "Can diamond polishing remove every stain?", answer: "It can improve surface wear, but deep stains, acid marks, or cracks may need separate restoration before final polishing." },
      ],
      localExamples: [
        "An Andheri office with dull traffic lanes may need diamond polishing after working hours.",
        "A Juhu apartment with premium marble may need careful pad selection to protect natural veining.",
        "A hotel lobby in South Mumbai may need zone-wise polishing to manage guest movement.",
        "A society entrance in Navi Mumbai may need maintenance guidance after the shine is restored.",
      ],
      seoTitle: "Diamond Marble Polishing Process | Mumbai",
      seoDescription: "Understand diamond marble polishing, process, cost factors, checklist, maintenance and FAQs for Mumbai homes and commercial floors.",
      seoKeywords: "diamond marble polishing, diamond polishing Mumbai, marble polishing process, marble floor shine",
    },
    {
      title: "Best Floor Cleaner for Marble and Tiles",
      category: "Cleaning Products",
      shortDescription: "Choose a practical daily cleaner for marble, granite, tiles, mosaic, and regular home or office floors.",
      featuredImage: "/assets/uploads/blog-ai/best-floor-cleaner-marble-tiles-ai.png",
      imageAlt: "Floor cleaner bottle with mop for marble and tile cleaning",
      focusKeyword: "floor cleaner",
      tags: ["Floor Cleaner", "Marble Cleaner", "Tile Cleaning"],
      audience: "families, offices, shops, societies, and housekeeping teams looking for a simple daily floor cleaner",
      location: "Mumbai and nearby delivery areas",
      surface: "marble, granite, tile, mosaic, and common floor surfaces",
      problem: "floors looking sticky, dull, dusty, or smelly even after routine mopping",
      solution: "Choose a cleaner that supports daily mopping, use correct dilution, and avoid harsh chemical mixing on marble or polished stone.",
      ctaText: "Order Lizonex marble and floor cleaner",
      ctaLink: "/products/lizonex-floor-cleaner",
      supportingProduct: "Lizonex marble, granite, tiles and mosaic cleaner",
      tableRows: [
        ["Daily home mopping", "Diluted Lizonex floor cleaner", "Use clean water and a fresh mop for better freshness."],
        ["Office or shop floor", "Regular cleaning schedule", "High-traffic floors may need more frequent water changes."],
        ["Marble or granite surface", "Surface-safe daily cleaner", "Avoid acid and abrasive powders."],
        ["Heavy stains or cement marks", "Professional guidance", "Daily cleaner may not solve construction residue or deep stains."],
      ],
      checklist: [
        "Check whether the cleaner is suitable for marble, granite, tiles, and mosaic.",
        "Read the dilution instruction before use.",
        "Do not mix with bleach, acid, or unknown chemicals.",
        "Use a clean mop and change dirty water quickly.",
        "Test on a small hidden area if the floor is sensitive.",
        "Keep bottle closed and stored safely after use.",
        "Use professional service for deep stains or old damage.",
        "Maintain a separate routine for bathrooms and high-traffic areas.",
      ],
      processSteps: [
        "Remove loose dust, hair, and grit before wet mopping.",
        "Dilute the cleaner in clean water as guided on the product.",
        "Mop evenly without flooding the floor.",
        "Change mop water when it becomes visibly dirty.",
        "Let the floor dry naturally with safe ventilation.",
        "Review sticky or dull areas and ask for service guidance if needed.",
      ],
      faqs: [
        { question: "Can one cleaner be used for marble and tiles?", answer: "A suitable multi-surface cleaner can be used on common marble, granite, tile, and mosaic floors when diluted correctly. Very sensitive or damaged floors should be tested first." },
        { question: "Will a floor cleaner restore old marble shine?", answer: "A cleaner can improve freshness and remove daily dirt, but scratches, etching, or deep dullness may need professional polishing or restoration." },
        { question: "Can I use extra cleaner for better fragrance?", answer: "Using more than needed can leave residue. Correct dilution gives better daily results than a very strong mix." },
      ],
      localExamples: [
        "A Mumbai apartment can use a daily cleaner for marble living rooms and tile kitchens.",
        "An office in Lower Parel may need a measured dilution plan for housekeeping staff.",
        "A society in Thane may use 5L packs for common areas and lobbies.",
        "A shop or clinic can maintain freshness with regular mopping and periodic deep cleaning.",
      ],
      seoTitle: "Best Floor Cleaner for Marble and Tiles",
      seoDescription: "Choose a daily floor cleaner for marble, granite, tiles and mosaic with usage tips, checklist, table and FAQs for Mumbai homes.",
      seoKeywords: "floor cleaner, marble cleaner, tile cleaner, Lizonex floor cleaner, granite cleaner, mosaic cleaner",
    },
    {
      title: "Italian Marble Polishing Guide",
      category: "Marble Polishing",
      shortDescription: "A simple guide to caring for Italian marble floors without losing their natural elegance and premium finish.",
      featuredImage: "/assets/uploads/blog-ai/italian-marble-polishing-guide-ai.png",
      imageAlt: "Italian marble floor polishing and shine inspection in luxury home",
      focusKeyword: "Italian marble polishing",
      tags: ["Italian Marble", "Premium Floors", "Marble Care"],
      audience: "homeowners, designers, and property managers caring for premium Italian marble floors",
      location: "Mumbai luxury apartments, bungalows, offices, hotels, and showrooms",
      surface: "Italian marble including premium light-coloured and veined stone floors",
      problem: "Italian marble showing dull patches, chemical marks, fine scratches, or uneven premium shine",
      solution: "Use controlled inspection, gentle cleaning, suitable polishing stages, and careful maintenance instead of harsh trial-and-error cleaning.",
      ctaText: "Book Italian marble polishing in Mumbai",
      ctaLink: "/contact?service=Italian%20Marble%20Polishing",
      supportingProduct: "Lizonex floor cleaner",
      tableRows: [
        ["Light dullness", "Inspection and gentle polishing", "Avoid aggressive treatment unless required."],
        ["Acidic cleaner marks", "Restoration assessment", "Etching may need professional correction."],
        ["Premium living-room marble", "Controlled shine finishing", "Natural veining should remain elegant."],
        ["After polishing", "Soft daily cleaning", "Wrong daily care can reduce finish quickly."],
      ],
      checklist: [
        "Confirm the marble type and previous treatments.",
        "Avoid acid, bleach, vinegar, and rough pads.",
        "Share photos of dull patches and light reflection.",
        "Ask if crystallization is suitable for the surface.",
        "Protect wooden furniture, wall panels, and skirting.",
        "Check whether corners and edges are included.",
        "Use a soft mop after service.",
        "Plan maintenance before major events or festivals.",
      ],
      processSteps: [
        "Inspect the Italian marble for etching, stains, scratches, and previous polish layers.",
        "Protect nearby furniture, wall panels, skirting, and delicate interiors.",
        "Clean the marble gently before deciding polishing intensity.",
        "Use controlled polishing stages suitable for premium marble.",
        "Check reflection in natural and artificial light.",
        "Provide care instructions for daily use and spill handling.",
      ],
      faqs: [
        { question: "Is Italian marble more sensitive than regular marble?", answer: "Many Italian marble surfaces show etching and chemical marks quickly, so cleaner choice and polishing method should be selected carefully." },
        { question: "Can Italian marble be polished at home?", answer: "Daily cleaning can be done at home, but polishing should be handled professionally when the floor has dullness, scratches, or patchy shine." },
        { question: "How do I protect Italian marble after polishing?", answer: "Use soft dust removal, correct cleaner dilution, quick spill cleaning, furniture pads, and periodic inspection." },
      ],
      localExamples: [
        "A Juhu apartment with light Italian marble may need careful polishing before a family event.",
        "A Worli luxury home may need protection for wall panels and furniture before service.",
        "A Bandra showroom may need a finish that looks premium under display lighting.",
        "A South Mumbai hotel suite may need quiet scheduling and clean handover.",
      ],
      seoTitle: "Italian Marble Polishing Guide Mumbai",
      seoDescription: "Care for Italian marble floors with polishing process, checklist, cost planning, mistakes to avoid and FAQs for Mumbai properties.",
      seoKeywords: "Italian marble polishing, Italian marble care, marble polishing Mumbai, premium marble floor cleaning",
    },
    {
      title: "Commercial Floor Cleaning for Offices",
      category: "Floor Cleaning",
      shortDescription: "Keep office floors clean, presentable, and easier to maintain with planned commercial floor cleaning.",
      featuredImage: "/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png",
      imageAlt: "Commercial office floor cleaning with machine in modern office corridor",
      focusKeyword: "commercial floor cleaning",
      tags: ["Office Cleaning", "Commercial Cleaning", "Floor Deep Cleaning"],
      audience: "office admins, facility managers, hotel teams, shop owners, and society committees",
      location: "Mumbai commercial areas including Lower Parel, BKC, Andheri, Thane, and Navi Mumbai",
      surface: "office marble, granite, tile, mosaic, vitrified tile, and common commercial flooring",
      problem: "commercial floors collecting dust, shoe marks, spills, dullness, and traffic lanes during working hours",
      solution: "Plan zone-wise floor cleaning with correct methods, safe movement paths, and daily maintenance instructions for staff.",
      ctaText: "Book commercial floor cleaning in Mumbai",
      ctaLink: "/contact?service=Commercial%20Floor%20Cleaning",
      supportingProduct: "Lizonex floor cleaner",
      tableRows: [
        ["Office reception", "Frequent dust control and deep cleaning", "First impression area should stay presentable."],
        ["Pantry and corridor", "Scheduled scrubbing or mopping", "Spills and shoe marks collect quickly."],
        ["Hotel or showroom", "Off-hour cleaning and polish planning", "Avoid disturbing customers or guests."],
        ["Society lobby", "Common area maintenance routine", "High traffic needs consistent care."],
      ],
      checklist: [
        "Identify floor type in each zone.",
        "Plan timing around staff and visitor movement.",
        "Separate pantry, reception, cabin, and corridor needs.",
        "Use caution signs during wet work.",
        "Check drying time before reopening an area.",
        "Keep daily cleaning product dilution consistent.",
        "Track high-traffic zones for periodic maintenance.",
        "Ask for photos before and after deep cleaning.",
      ],
      processSteps: [
        "Survey the commercial site and divide floors into zones.",
        "Remove loose dirt, bins, small furniture, and movable obstacles.",
        "Choose machine or manual method based on floor material and traffic.",
        "Clean or polish zone by zone while keeping movement safe.",
        "Inspect corners, entrances, pantry areas, and visible walkways.",
        "Set a maintenance routine for housekeeping or facility staff.",
      ],
      faqs: [
        { question: "Can office cleaning be done after working hours?", answer: "Yes. Commercial cleaning can usually be planned early morning, late evening, or on low-traffic days depending on site rules." },
        { question: "Do commercial floors need polishing or cleaning?", answer: "It depends on the surface. Dirt, residue, and stains may need cleaning, while scratched or dull marble may need polishing." },
        { question: "Can daily cleaner be used in office housekeeping?", answer: "Yes, if diluted correctly and used with clean mops. High-traffic offices may need stronger routines and periodic deep cleaning." },
      ],
      localExamples: [
        "A Lower Parel office may need weekend cleaning for reception and corridors.",
        "A BKC clinic may need hygiene-focused mopping and safe drying time.",
        "A Thane society lobby may need daily maintenance plus periodic machine cleaning.",
        "A Navi Mumbai showroom may need shine care before new product launches.",
      ],
      seoTitle: "Commercial Floor Cleaning Mumbai Guide",
      seoDescription: "Office and commercial floor cleaning guide with process, checklist, table, maintenance plan and FAQs for Mumbai workspaces.",
      seoKeywords: "commercial floor cleaning, office floor cleaning Mumbai, floor deep cleaning, society floor cleaning",
    },
    {
      title: "Difference Between Diamond Polishing and Crystallization",
      category: "Marble Polishing",
      shortDescription: "Know the difference between diamond polishing and crystallization before choosing a marble shine treatment.",
      featuredImage: "/assets/uploads/blog-ai/diamond-polishing-vs-crystallization-ai.png",
      imageAlt: "Diamond polishing pads and crystallization tools for marble care",
      focusKeyword: "marble crystallization",
      tags: ["Diamond Polishing", "Crystallization", "Marble Restoration"],
      audience: "customers confused between polishing, crystallization, restoration, and regular marble cleaning",
      location: "Mumbai, Navi Mumbai, and Thane service areas",
      surface: "marble and polished stone floors that need shine correction or finishing",
      problem: "customers choosing crystallization when the floor actually needs polishing, or polishing when only finishing is required",
      solution: "Understand the role of each treatment before booking so the floor gets the right process in the right sequence.",
      ctaText: "Get free guidance for marble polishing or crystallization",
      ctaLink: "/contact?service=Marble%20Crystallization",
      supportingProduct: "Lizonex floor cleaner",
      tableRows: [
        ["Fine scratches and dull surface", "Diamond polishing", "Refines the marble before final finishing."],
        ["Good floor needing shine boost", "Crystallization assessment", "Works best after the surface is already suitable."],
        ["Stains, cracks, or acid marks", "Restoration first", "Damage should be corrected before shine treatment."],
        ["After any treatment", "Daily maintenance", "Wrong cleaner can reduce the result."],
      ],
      checklist: [
        "Ask whether scratches are surface-level or deep.",
        "Check if stains or acid marks need restoration first.",
        "Understand whether crystallization is suitable for your marble.",
        "Do not choose only by lowest price.",
        "Ask what process sequence will be used.",
        "Confirm expected shine and limitations.",
        "Use suitable daily cleaner after treatment.",
        "Schedule maintenance based on traffic level.",
      ],
      processSteps: [
        "Inspect the floor and identify whether dullness is from dirt, scratches, or chemical marks.",
        "Clean the surface to reveal the real condition.",
        "Choose diamond polishing if the surface needs mechanical refinement.",
        "Use crystallization only when the floor condition is suitable for finishing.",
        "Check reflection, texture, and edges after treatment.",
        "Explain how to maintain the finish without harsh products.",
      ],
      faqs: [
        { question: "Which is better, diamond polishing or crystallization?", answer: "Neither is automatically better. Diamond polishing refines the surface, while crystallization is a finishing treatment. The floor condition decides the right choice." },
        { question: "Can crystallization remove scratches?", answer: "Crystallization can improve shine but it is not the main treatment for scratches. Scratched marble usually needs polishing or restoration first." },
        { question: "Should I do both treatments?", answer: "Some floors may need polishing followed by a suitable finish, while others may not. Inspection helps avoid unnecessary work." },
      ],
      localExamples: [
        "A Powai home with fine scratches may need diamond polishing before shine finishing.",
        "A Colaba office lobby with acceptable surface condition may need only a finishing treatment.",
        "A Borivali society entrance with stains may need restoration before crystallization.",
        "A hotel corridor in Mumbai may need a planned sequence because traffic is heavy.",
      ],
      seoTitle: "Diamond Polishing vs Crystallization",
      seoDescription: "Compare diamond polishing and crystallization for marble floors with process, checklist, table, FAQs and Mumbai maintenance tips.",
      seoKeywords: "diamond polishing vs crystallization, marble crystallization, diamond marble polishing, marble restoration",
    },
  ];

  return blogs.map((blog, index) => ({
    id: index + 1,
    title: blog.title,
    slug: slugify(blog.title),
    category: blog.category,
    shortDescription: blog.shortDescription,
    content: makeLongBlogContent(blog),
    featuredImage: blog.featuredImage,
    imageAlt: blog.imageAlt,
    focusKeyword: blog.focusKeyword,
    tags: blog.tags,
    author: "Gauranitai Experts",
    status: "published",
    publishedAt: now(),
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    seoKeywords: blog.seoKeywords,
    canonicalUrl: `/blogs/${slugify(blog.title)}`,
    openGraphTitle: `${blog.title} | Gauranitai`,
    openGraphDescription: blog.shortDescription,
    openGraphImage: blog.featuredImage,
    ...timestamps(),
  }));
}

function makeBlogTopics(): BlogTopic[] {
  const keywords = ["Marble polishing service", "Floor cleaning service", "Diamond marble polishing", "Italian marble polishing", "Granite polishing", "Tile cleaning", "Mosaic floor cleaning", "Marble restoration", "Marble crystallization", "Marble stain removal", "Floor cleaner", "Marble cleaner", "Granite cleaner", "Tile cleaner", "Best floor cleaner for home", "Floor cleaning near me", "Marble polishing near me", "Commercial floor cleaning", "Society floor cleaning", "Hotel floor polishing", "Office floor cleaning", "Home floor cleaning", "Lizonex floor cleaner", "Lizonex marble cleaner", "Lizonex 1 litre floor cleaner", "Lizonex 5 litre floor cleaner", "Marble granite tiles mosaic cleaner"];
  const prefixes = ["Best Tips for", "How to Find the Best", "Step-by-Step Guide for", "Why You Need Professional", "The Cost of", "DIY vs Professional", "Common Mistakes in", "Important Benefits of", "Ultimate Guide to", "How to Restore", "Quick Tips for", "Essential Maintenance for", "Top Questions About", "Complete Guide to", "When to Choose"];
  const modifiers = ["in Mumbai", "in Navi Mumbai", "in Thane", "for Luxury Homes", "for Offices", "for Residential Societies", "for Hotels and Showrooms", "for Shops", "Before Festivals", "After Renovation"];
  const categories = ["Marble Polishing", "Floor Cleaning", "Marble Care", "Granite Care", "Tile Cleaning", "Mosaic Cleaning", "Cleaning Products", "Home Cleaning", "Commercial Cleaning", "Floor Maintenance", "Stain Removal", "Polishing Tips", "DIY Floor Care", "Professional Cleaning Services"];
  const rows: BlogTopic[] = [];
  for (const keyword of keywords) {
    for (const prefix of prefixes) {
      const id = rows.length + 1;
      const title = `${prefix} ${keyword} ${modifiers[id % modifiers.length]}`;
      rows.push({
        id,
        title,
        category: categories[id % categories.length],
        focusKeyword: keyword,
        suggestedSlug: slugify(title),
        priority: id % 5 === 0 ? "High" : id % 2 === 0 ? "Medium" : "Low",
        status: "Suggested",
        createdAt: now(),
      });
      if (rows.length >= 350) return rows;
    }
  }
  return rows;
}

function makeFaqs(): Faq[] {
  return [
    ["Services", "Do you polish residential and commercial marble floors?", "Yes. Gauranitai handles homes, societies, offices, hotels, shops, showrooms, and commercial spaces."],
    ["Services", "Is diamond marble polishing suitable for Italian marble?", "Yes, after inspection. Italian marble needs the right method, pad grade, and product selection."],
    ["Products", "Can your products be used on marble, granite, tiles, and mosaic?", "Our listed cleaners are designed for common floor care needs. Follow usage instructions and test on a hidden area first."],
    ["Booking", "How do I book a service?", "Use the contact form, call button, or WhatsApp button and share floor type, area size, location, and photos if possible."],
    ["Payment", "Do you support COD?", "Yes, COD can be enabled from payment settings."],
  ].map(([category, question, answer], index) => ({
    id: index + 1,
    category,
    question,
    answer,
    displayOrder: index + 1,
    isActive: true,
    ...timestamps(),
  }));
}

function makeGallery(): GalleryItem[] {
  return ["Marble polishing result", "Floor cleaning work", "Product usage", "Machine work"].map((title, index) => ({
    id: index + 1,
    imageUrl: index % 2 === 0
      ? "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85"
      : "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=85",
    title,
    altText: `${title} by Gauranitai`,
    caption: `${title} handled by Gauranitai.`,
    category: index === 0 ? "Before After" : "Floor Cleaning",
    sortOrder: index + 1,
    isActive: true,
    ...timestamps(),
  }));
}

function makeVideos(): VideoItem[] {
  const channelVideos = [
    ["Professional Marble Polishing & Floor Cleaning Services", "Main Gauranitai service reel for marble polishing and floor cleaning.", "Marble Polishing Service", "", "NLBAhneRORM"],
    ["Diamond Marble Polishing for Premium Shine", "Diamond marble polishing reel for premium shine and better reflection.", "Diamond Marble Polishing", "", "qCFYvlHkDcE"],
    ["Marble Floor Polishing Site Work", "Short polishing work reel from the Sumit Shah marble polishing channel.", "Marble Polishing Service", "", "XHJPVfoMVEw"],
    ["Italian Marble Shine Result", "Italian marble care and shine result reel for premium floor surfaces.", "Italian Marble Polishing", "", "HVHnf8vHAgE"],
    ["Granite and Stone Polishing Work", "Stone polishing process reel for granite, marble, and natural stone floors.", "Stone Polishing", "", "DfZUDAdaNxw"],
    ["Marble Restoration Before After", "Restoration reel for dull, scratched, or stained marble surfaces.", "Marble Restoration", "", "_Upa89wMiuk"],
    ["Marble Crystallization Finish", "Crystallization and finishing reel for marble shine enhancement.", "Marble Crystallization", "", "UiLMZX7wC4Y"],
    ["Floor Deep Cleaning Reel", "Floor deep cleaning reel for residential and commercial floor freshness.", "Floor Deep Cleaning", "", "f0ThmOh9obU"],
    ["Tile Cleaning Service Reel", "Tile cleaning and surface care reel for homes, offices, and bathrooms.", "Tile Cleaning", "", "oh9kkBFRuKM"],
    ["Mosaic Floor Cleaning Reel", "Mosaic floor cleaning reel for dirt removal and fresh floor appearance.", "Mosaic Floor Cleaning", "", "dF6ZUdCMz1I"],
    ["Bathroom Floor Cleaning Reel", "Bathroom floor cleaning reel for stain, soap residue, and dullness removal.", "Bathroom Floor Cleaning", "", "IWNE6fxUpSw"],
    ["Commercial Floor Cleaning Reel", "Commercial floor cleaning reel for offices, shops, hotels, and societies.", "Commercial Floor Cleaning", "", "Eni3VO6BktI"],
  ] as const;

  return channelVideos.map(([title, description, relatedService, relatedProduct, videoId], index) => ({
    id: index + 1,
    videoType: "youtube",
    videoUrl: youtubeShortUrl(videoId),
    thumbnailUrl: youtubeThumb(videoId),
    title,
    description,
    relatedProduct,
    relatedService,
    isActive: true,
    ...timestamps(),
  }));
}

function makeTestimonials(): Testimonial[] {
  return [
    ["Residential Customer", "The marble floor looked dull before service. After polishing, the shine came back and the team explained how to maintain it properly.", "Marble Polishing Service", "Mumbai"],
    ["Office Manager", "Clean work, good response, and a professional finish for our office floor cleaning.", "Commercial Floor Cleaning", "Thane"],
  ].map(([customerName, review, serviceUsed, location], index) => ({
    id: index + 1,
    customerName,
    rating: 5,
    review,
    image: "",
    serviceUsed,
    location,
    isActive: true,
    ...timestamps(),
  }));
}

function makeBanners(): Banner[] {
  return [
    {
      id: 1,
      title: "Professional Marble Polishing & Floor Cleaning Services",
      subtitle: "Restore shine, remove dullness, and keep your floors fresh with expert marble polishing, floor cleaning, and stone care solutions.",
      imageUrl: youtubeThumb("NLBAhneRORM"),
      ctaText: "Book Service",
      ctaLink: "/contact",
      badgeText: "Premium Stone Care",
      displayOrder: 1,
      isActive: true,
      ...timestamps(),
    },
    {
      id: 2,
      title: "Diamond Marble Polishing for Premium Shine",
      subtitle: "Restore dull marble with inspection, deep cleaning, diamond pad polishing, crystallization guidance, and finishing care.",
      imageUrl: youtubeThumb("qCFYvlHkDcE"),
      ctaText: "Book Marble Polishing",
      ctaLink: "/contact?service=Diamond%20Marble%20Polishing",
      badgeText: "Marble Polishing",
      displayOrder: 2,
      isActive: true,
      ...timestamps(),
    },
    {
      id: 3,
      title: "Floor Cleaner Products for Daily Care",
      subtitle: "Choose practical floor cleaner products for marble, granite, tile, mosaic, homes, offices, shops, societies, and commercial spaces.",
      imageUrl: "/assets/uploads/lizonex-floor-cleaner-daily-care-banner.png",
      ctaText: "View Floor Cleaners",
      ctaLink: "/products",
      badgeText: "Daily Floor Cleaning",
      displayOrder: 3,
      isActive: true,
      ...timestamps(),
    },
  ];
}

function makeCoupons(): Coupon[] {
  return [{
    id: 1,
    code: "GAURANITAI10",
    discountType: "percentage",
    discountValue: 10,
    minimumOrder: 999,
    maximumDiscount: 200,
    expiryDate: "2026-12-31",
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    ...timestamps(),
  }];
}

function makeCareerJobs(): CareerJob[] {
  const jobs = [
    {
      title: "Marble Polishing Technician",
      department: "Service Team",
      location: "Mumbai",
      jobType: "Full Time",
      shortDescription: "Join Gauranitai as a marble polishing technician for residential and commercial floor-care projects.",
      fullDescription: "We are looking for a careful, disciplined marble polishing technician who can support marble polishing, diamond polishing, deep cleaning, and stone-care work across homes, offices, societies, hotels, shops, and commercial spaces.",
      checklist: ["Experience with floor polishing machines preferred", "Understands site cleanliness and customer handling", "Can travel for Mumbai service work", "Comfortable with residential and commercial projects"],
      responsibilities: ["Inspect floors before work starts", "Support polishing, cleaning, masking, and finishing work", "Keep tools and work areas clean", "Explain basic after-care to customers"],
      requirements: ["Basic floor-care experience", "Reliable phone communication", "Teamwork and punctuality", "Willingness to learn Gauranitai methods"],
    },
    {
      title: "Site Supervisor",
      department: "Operations",
      location: "Mumbai",
      jobType: "Full Time",
      shortDescription: "Manage daily service sites, customer coordination, staff planning, and quality checks for floor-care projects.",
      fullDescription: "The site supervisor will coordinate service teams, customer timings, work quality, safety, and handover for marble polishing and floor cleaning jobs.",
      checklist: ["Can manage technicians and site timelines", "Good customer communication", "Understands floor cleaning or facility work", "Can handle photos, updates, and job notes"],
      responsibilities: ["Plan daily job execution", "Coordinate with customers and workers", "Check before-after quality", "Report job status to admin"],
      requirements: ["Site supervision experience preferred", "Strong discipline and follow-up", "Basic smartphone and WhatsApp usage", "Problem-solving attitude"],
    },
    {
      title: "Cleaner Helper",
      department: "Service Team",
      location: "Mumbai",
      jobType: "Full Time",
      shortDescription: "Assist the service team with floor cleaning, material movement, site preparation, and final cleanup.",
      fullDescription: "This role is suitable for someone who wants to learn professional floor cleaning and polishing work from the ground level.",
      checklist: ["Hardworking and punctual", "Ready for field work", "Can follow supervisor instructions", "Interested in learning cleaning and polishing service"],
      responsibilities: ["Help prepare the site", "Move tools and materials carefully", "Assist cleaning and mopping work", "Support final site cleanup"],
      requirements: ["No advanced experience required", "Basic discipline and honesty", "Physical fitness for site work", "Team-friendly behaviour"],
    },
  ];

  return jobs.map((job, index) => ({
    id: index + 1,
    slug: slugify(job.title),
    salaryRange: "As per experience",
    status: "Open",
    isActive: true,
    seoTitle: `${job.title} Job in Mumbai | Gauranitai Careers`,
    seoDescription: job.shortDescription,
    seoKeywords: `${job.title}, Gauranitai careers, floor cleaning jobs Mumbai, marble polishing jobs`,
    focusKeyword: `${job.title} job in Mumbai`,
    canonicalUrl: `/career/${slugify(job.title)}`,
    ...job,
    ...timestamps(),
  }));
}

export function createSeedData(): GauranitaiData {
  const categories = makeCategories();
  return {
    services: makeServices(categories),
    products: makeProducts(categories),
    blogs: makeBlogs(),
    blogTopics: makeBlogTopics(),
    enquiries: [] satisfies Enquiry[],
    leads: [] satisfies Lead[],
    orders: [] satisfies Order[],
    reviews: [] satisfies ProductReview[],
    faqs: makeFaqs(),
    testimonials: makeTestimonials(),
    banners: makeBanners(),
    categories,
    gallery: makeGallery(),
    videos: makeVideos(),
    coupons: makeCoupons(),
    careerJobs: makeCareerJobs(),
    careerApplications: [] satisfies CareerApplication[],
    adminUsers: [{
      id: 1,
      name: "Gauranitai Admin",
      email: "admin@gauranitai.com",
      role: "Super Admin",
      password: "admin123",
      isActive: true,
      ...timestamps(),
    }] satisfies AdminUser[],
    customers: [] satisfies CustomerAccount[],
    chatThreads: [],
    chatMessages: [],
    settings: {
      brandName: "Gauranitai",
      tagline: "Professional Polishing & Floor Deep Cleaning",
      logoUrl: "/assets/gauranitai_logo.png",
      primaryColor: "#0D3E83",
      secondaryColor: "#FFFFFF",
      accentColor: "#F49D1A",
      contact: {
        companyName: "Gauranitai",
        phone: "+91 9142069507",
        whatsappNumber: "919142069507",
        email: "hello@gauranitai.com",
        address: "Mumbai, Maharashtra",
        googleMapLink: "",
        instagramLink: "https://www.instagram.com/shahenterprise90/",
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
        upiId: "gauranitai@upi",
        bankName: "Bank Name",
        accountNumber: "0000000000",
        ifscCode: "BANK0000000",
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
        siteTitle: "Gauranitai | Marble Polishing & Floor Cleaning Services",
        defaultMetaDescription: "Professional marble polishing, floor cleaning, stone care, and cleaning products.",
        seoTitle: "Gauranitai | Marble Polishing & Floor Cleaning",
        seoDescription: "Professional marble polishing, floor cleaning, and stone care solutions.",
        seoKeywords: "marble polishing service, floor cleaning service, floor cleaner, marble cleaner",
        focusKeyword: "marble polishing service",
        openGraphTitle: "Gauranitai",
        openGraphDescription: "Professional floor cleaning and marble polishing services.",
        openGraphImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
        robotsTxt: "User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /login\nDisallow: /checkout\nDisallow: /cart\nDisallow: /my-account",
      },
    },
  };
}
