// server/index.ts
import "dotenv/config";
import express2 from "express";
import session from "express-session";
import { createServer } from "http";
import path5 from "path";
import { Server as SocketIOServer } from "socket.io";

// server/gauranitaiRoutes.ts
import { Router } from "express";
import fs2 from "fs/promises";
import path2 from "path";

// server/gauranitaiStore.ts
import fs from "fs/promises";
import path from "path";

// server/gauranitaiSeed.ts
var now = () => (/* @__PURE__ */ new Date()).toISOString();
function slugify(value) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function timestamps() {
  const value = now();
  return { createdAt: value, updatedAt: value };
}
function finalPrice(discountPrice, gstPercentage, deliveryCharge) {
  const gstAmount = Math.round(discountPrice * (gstPercentage / 100));
  return { gstAmount, finalPayablePrice: discountPrice + gstAmount + deliveryCharge };
}
function image(id, url, title, type = "cover") {
  return {
    id,
    url,
    title,
    altText: `${title} by Gauranitai`,
    caption: title,
    type,
    sortOrder: id
  };
}
function makeCategories() {
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
    ["Product Demo", "video"]
  ];
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
    ...timestamps()
  }));
}
var productSeeds = [
  ["Lizonex Floor Cleaner 1L", "Floor Cleaner", "CLEAN-FLOOR-1L", 249, 199, "1L", 300, 50, "Premium floor cleaner suitable for marble, granite, tiles, mosaic, and common floor surfaces."],
  ["Lizonex Floor Cleaner 5L", "Floor Cleaner", "CLEAN-FLOOR-5L", 999, 799, "5L", 150, 80, "Value pack floor cleaner for homes, offices, societies, shops, hotels, and commercial spaces."]
];
var lizonexFloorCleanerOneLiterImages = [
  "https://www.lizonex.com/images/image1.jpg"
];
var lizonexFloorCleanerFiveLiterImages = [
  "https://www.lizonex.com/images/image7.jpg"
];
function makeProducts(categories) {
  return productSeeds.map(([name, category, sku, mainPrice, discountPrice, unit, stock, deliveryCharge, description], index) => {
    const { gstAmount, finalPayablePrice } = finalPrice(discountPrice, 18, deliveryCharge);
    const categoryId = categories.find((row) => row.name === category)?.id || 1;
    const lizonexImages = sku === "CLEAN-FLOOR-1L" ? lizonexFloorCleanerOneLiterImages : sku === "CLEAN-FLOOR-5L" ? lizonexFloorCleanerFiveLiterImages : null;
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
      images: lizonexImages ? lizonexImages.map((url, imageIndex) => image(imageIndex + 1, url, `${name} image ${imageIndex + 1}`, imageIndex === 0 ? "cover" : "gallery")) : [
        image(1, cover, `${name} cover`, "cover"),
        image(2, "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=900&q=85", `${name} usage`, "usage")
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
        { label: "Delivery charge", value: `Rs. ${deliveryCharge}` }
      ],
      faqs: [
        { question: "Can this cleaner be used daily?", answer: "Yes, follow dilution instructions and test on a hidden area first." },
        { question: "Is it suitable for marble?", answer: "Yes, it is intended for common floor surfaces including marble." }
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
      ...timestamps()
    };
  });
}
var serviceSeeds = [
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
  ["Floor Maintenance Service", "Floor Maintenance", "Scheduled floor maintenance service to keep polished floors clean, fresh, and presentable."]
];
function youtubeShortUrl(videoId) {
  return `https://www.youtube.com/shorts/${videoId}`;
}
function youtubeThumb(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
var serviceVideoIds = {
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
  "Commercial Floor Cleaning": "Eni3VO6BktI"
};
var serviceMediaByTitle = {
  "Marble Polishing Service": {
    coverImage: "/assets/uploads/ai-services/marble-polishing-ai.png",
    gallery: [youtubeThumb("NLBAhneRORM"), "/assets/uploads/blog-ai/restore-shine-marble-floors-ai.png"]
  },
  "Diamond Marble Polishing": {
    coverImage: "/assets/uploads/ai-services/diamond-marble-polishing-ai.png",
    gallery: [youtubeThumb("qCFYvlHkDcE"), "/assets/uploads/blog-ai/diamond-marble-polishing-process-ai.png"]
  },
  "Italian Marble Polishing": {
    coverImage: "/assets/uploads/blog-ai/italian-marble-polishing-guide-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1100&q=85", youtubeThumb("XHJPVfoMVEw")]
  },
  "Granite Polishing": {
    coverImage: "/assets/uploads/ai-services/granite-stone-polishing-ai.png",
    gallery: ["https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1100&q=85", youtubeThumb("HVHnf8vHAgE")]
  },
  "Stone Polishing": {
    coverImage: "/assets/uploads/blog-ai/diamond-polishing-vs-crystallization-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1100&q=85", youtubeThumb("DfZUDAdaNxw")]
  },
  "Marble Restoration": {
    coverImage: "/assets/uploads/blog-ai/restore-shine-marble-floors-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=85", youtubeThumb("_Upa89wMiuk")]
  },
  "Marble Crystallization": {
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("UiLMZX7wC4Y"), "/assets/uploads/ai-services/diamond-marble-polishing-ai.png"]
  },
  "Floor Deep Cleaning": {
    coverImage: "/assets/uploads/ai-services/tile-floor-cleaning-ai.png",
    gallery: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1100&q=85", youtubeThumb("f0ThmOh9obU")]
  },
  "Tile Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("oh9kkBFRuKM"), "/assets/uploads/ai-services/tile-floor-cleaning-ai.png"]
  },
  "Mosaic Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("dF6ZUdCMz1I"), "/assets/uploads/blog-ai/best-floor-cleaner-marble-tiles-ai.png"]
  },
  "Bathroom Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=85",
    gallery: [youtubeThumb("IWNE6fxUpSw"), "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1100&q=85"]
  },
  "Commercial Floor Cleaning": {
    coverImage: "/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png",
    gallery: [youtubeThumb("Eni3VO6BktI"), "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=85"]
  },
  "Residential Floor Cleaning": {
    coverImage: "/assets/uploads/blog-ai/best-floor-cleaner-marble-tiles-ai.png",
    gallery: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85", "/assets/uploads/ai-services/tile-floor-cleaning-ai.png"]
  },
  "Society Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1100&q=85"]
  },
  "Office Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/commercial-floor-cleaning-offices-ai.png", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1100&q=85"]
  },
  "Hotel Floor Cleaning": {
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1100&q=85",
    gallery: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1100&q=85", "/assets/uploads/blog-ai/italian-marble-polishing-guide-ai.png"]
  },
  "Floor Maintenance Service": {
    coverImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=85",
    gallery: ["/assets/uploads/blog-ai/diamond-polishing-vs-crystallization-ai.png", "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1100&q=85"]
  }
};
function serviceImageFor(title) {
  return serviceMediaByTitle[title]?.coverImage || "/assets/uploads/ai-services/marble-polishing-ai.png";
}
function serviceYoutubeFor(title) {
  const videoId = serviceVideoIds[title];
  return videoId ? youtubeShortUrl(videoId) : "";
}
function serviceImagesFor(title, cover) {
  const fallbackPool = Object.values(serviceMediaByTitle).flatMap((media) => [media.coverImage, ...media.gallery]).filter((url) => url !== cover);
  const serviceIndex = Math.max(0, serviceSeeds.findIndex(([seedTitle]) => seedTitle === title));
  const gallery = serviceMediaByTitle[title]?.gallery || [];
  const galleryOne = gallery[0] || fallbackPool[serviceIndex % fallbackPool.length] || "/assets/uploads/ai-services/granite-stone-polishing-ai.png";
  const galleryTwo = gallery[1] || fallbackPool[(serviceIndex + 5) % fallbackPool.length] || "/assets/uploads/ai-services/tile-floor-cleaning-ai.png";
  return [
    image(1, cover, `${title} cover`, "cover"),
    image(2, galleryOne, `${title} work image`, "gallery"),
    image(3, galleryTwo, `${title} result image`, "beforeAfter")
  ];
}
function makeServices(categories) {
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
        { question: "Can I book on WhatsApp?", answer: "Yes, share photos, location, and approximate area." }
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
      ...timestamps()
    };
  });
}
function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
function makeLongBlogContent(blog) {
  const table = [
    "| Need or Situation | Recommended Action | Practical Notes |",
    "| --- | --- | --- |",
    ...blog.tableRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`)
  ].join("\n");
  const checklist = blog.checklist.map((item) => `- [ ] ${item}`).join("\n");
  const process2 = blog.processSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const examples = blog.localExamples.map((item) => `- ${item}`).join("\n");
  const faqs = blog.faqs.map((faq) => `### ${faq.question}
${faq.answer}`).join("\n\n");
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
${process2}

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
    `For commercial locations, appearance has business value. A clean lobby, showroom, clinic, hotel reception, or office floor creates confidence. Regular floor care is part of the customer experience, not only a housekeeping expense.`
  ];
  let noteIndex = 0;
  while (wordCount(content) < 2050) {
    content += `

${expansionNotes[noteIndex % expansionNotes.length]}`;
    noteIndex += 1;
  }
  return content;
}
function makeBlogs() {
  const blogs = [
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
        ["Recently polished marble", "Maintenance cleaning plan", "Use gentle cleaning and avoid acidic products."]
      ],
      checklist: [
        "Take clear daylight photos of dull and shiny areas.",
        "Confirm whether the floor is Indian marble, Italian marble, granite, tile, or mosaic.",
        "Note the areas with stains, scratches, or cloudy patches.",
        "Share approximate square feet before asking for price.",
        "Ask what result is realistic before booking service.",
        "Keep furniture movement and drying time in mind.",
        "Use a suitable daily cleaner after polishing.",
        "Avoid acid, bleach, and rough scrubbing pads on polished stone."
      ],
      processSteps: [
        "Inspect the marble surface, dullness level, stains, scratches, and traffic lanes.",
        "Remove loose dust and protect nearby furniture, skirting, and walls.",
        "Deep clean the surface so polishing does not trap dirt below the finish.",
        "Use the right polishing method based on floor condition and expected shine.",
        "Check reflection, edges, corners, and high-traffic areas before handover.",
        "Explain daily cleaning, spill care, and periodic maintenance to the customer."
      ],
      faqs: [
        { question: "Can all dull marble floors become shiny again?", answer: "Most dull marble floors can improve, but the result depends on scratches, stains, etching, previous chemical use, and stone age. Inspection gives a more realistic answer." },
        { question: "Is polishing better than normal mopping?", answer: "Mopping removes daily dirt. Polishing improves surface reflection when the stone itself has become dull or scratched. Both have different purposes." },
        { question: "How do I maintain marble shine after service?", answer: "Remove dust before mopping, use a suitable cleaner with correct dilution, clean spills quickly, and avoid acidic or abrasive products." }
      ],
      localExamples: [
        "A Dadar apartment with dull living-room marble may need deep cleaning followed by polishing.",
        "A Thane society lobby with walking lanes may need zone-wise polishing and a maintenance schedule.",
        "A Bandra home with cloudy patches may need stain checking before final shine work.",
        "A South Mumbai office reception may need off-hour service so visitors are not disturbed."
      ],
      seoTitle: "Restore Marble Shine in Mumbai | Gauranitai",
      seoDescription: "Learn how to restore dull marble shine with cleaning, polishing, maintenance tips, price guidance, checklist and FAQs for Mumbai floors.",
      seoKeywords: "restore marble shine, marble polishing Mumbai, dull marble floor, marble floor cleaning, marble maintenance"
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
        ["Freshly polished floors", "Gentle daily cleaning", "Protect the finish with correct mopping and dust control."]
      ],
      checklist: [
        "Ask whether the provider uses a step-by-step pad sequence.",
        "Check whether furniture and wall edges will be protected.",
        "Discuss expected reflection before the work starts.",
        "Confirm if restoration is needed before polishing.",
        "Ask about drying time and access after service.",
        "Check high-traffic zones separately from low-use rooms.",
        "Request maintenance guidance after the polish.",
        "Avoid wax-only solutions when the marble needs surface refinement."
      ],
      processSteps: [
        "Inspect marble condition, scratches, stains, cracks, and previous polish layers.",
        "Prepare the site by clearing movement space and protecting nearby surfaces.",
        "Clean the floor thoroughly before starting diamond pad work.",
        "Use progressive diamond pads based on floor condition and desired finish.",
        "Clean residue between stages so the finish remains even.",
        "Complete final shine check and explain after-care instructions."
      ],
      faqs: [
        { question: "Is diamond polishing the same as wax polishing?", answer: "No. Diamond polishing refines the marble surface mechanically. Wax-based shine can be temporary and may not solve scratches or uneven reflection." },
        { question: "How long does diamond marble polishing take?", answer: "Timing depends on area, floor condition, furniture movement, and the number of polishing stages required." },
        { question: "Can diamond polishing remove every stain?", answer: "It can improve surface wear, but deep stains, acid marks, or cracks may need separate restoration before final polishing." }
      ],
      localExamples: [
        "An Andheri office with dull traffic lanes may need diamond polishing after working hours.",
        "A Juhu apartment with premium marble may need careful pad selection to protect natural veining.",
        "A hotel lobby in South Mumbai may need zone-wise polishing to manage guest movement.",
        "A society entrance in Navi Mumbai may need maintenance guidance after the shine is restored."
      ],
      seoTitle: "Diamond Marble Polishing Process | Mumbai",
      seoDescription: "Understand diamond marble polishing, process, cost factors, checklist, maintenance and FAQs for Mumbai homes and commercial floors.",
      seoKeywords: "diamond marble polishing, diamond polishing Mumbai, marble polishing process, marble floor shine"
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
        ["Heavy stains or cement marks", "Professional guidance", "Daily cleaner may not solve construction residue or deep stains."]
      ],
      checklist: [
        "Check whether the cleaner is suitable for marble, granite, tiles, and mosaic.",
        "Read the dilution instruction before use.",
        "Do not mix with bleach, acid, or unknown chemicals.",
        "Use a clean mop and change dirty water quickly.",
        "Test on a small hidden area if the floor is sensitive.",
        "Keep bottle closed and stored safely after use.",
        "Use professional service for deep stains or old damage.",
        "Maintain a separate routine for bathrooms and high-traffic areas."
      ],
      processSteps: [
        "Remove loose dust, hair, and grit before wet mopping.",
        "Dilute the cleaner in clean water as guided on the product.",
        "Mop evenly without flooding the floor.",
        "Change mop water when it becomes visibly dirty.",
        "Let the floor dry naturally with safe ventilation.",
        "Review sticky or dull areas and ask for service guidance if needed."
      ],
      faqs: [
        { question: "Can one cleaner be used for marble and tiles?", answer: "A suitable multi-surface cleaner can be used on common marble, granite, tile, and mosaic floors when diluted correctly. Very sensitive or damaged floors should be tested first." },
        { question: "Will a floor cleaner restore old marble shine?", answer: "A cleaner can improve freshness and remove daily dirt, but scratches, etching, or deep dullness may need professional polishing or restoration." },
        { question: "Can I use extra cleaner for better fragrance?", answer: "Using more than needed can leave residue. Correct dilution gives better daily results than a very strong mix." }
      ],
      localExamples: [
        "A Mumbai apartment can use a daily cleaner for marble living rooms and tile kitchens.",
        "An office in Lower Parel may need a measured dilution plan for housekeeping staff.",
        "A society in Thane may use 5L packs for common areas and lobbies.",
        "A shop or clinic can maintain freshness with regular mopping and periodic deep cleaning."
      ],
      seoTitle: "Best Floor Cleaner for Marble and Tiles",
      seoDescription: "Choose a daily floor cleaner for marble, granite, tiles and mosaic with usage tips, checklist, table and FAQs for Mumbai homes.",
      seoKeywords: "floor cleaner, marble cleaner, tile cleaner, Lizonex floor cleaner, granite cleaner, mosaic cleaner"
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
        ["After polishing", "Soft daily cleaning", "Wrong daily care can reduce finish quickly."]
      ],
      checklist: [
        "Confirm the marble type and previous treatments.",
        "Avoid acid, bleach, vinegar, and rough pads.",
        "Share photos of dull patches and light reflection.",
        "Ask if crystallization is suitable for the surface.",
        "Protect wooden furniture, wall panels, and skirting.",
        "Check whether corners and edges are included.",
        "Use a soft mop after service.",
        "Plan maintenance before major events or festivals."
      ],
      processSteps: [
        "Inspect the Italian marble for etching, stains, scratches, and previous polish layers.",
        "Protect nearby furniture, wall panels, skirting, and delicate interiors.",
        "Clean the marble gently before deciding polishing intensity.",
        "Use controlled polishing stages suitable for premium marble.",
        "Check reflection in natural and artificial light.",
        "Provide care instructions for daily use and spill handling."
      ],
      faqs: [
        { question: "Is Italian marble more sensitive than regular marble?", answer: "Many Italian marble surfaces show etching and chemical marks quickly, so cleaner choice and polishing method should be selected carefully." },
        { question: "Can Italian marble be polished at home?", answer: "Daily cleaning can be done at home, but polishing should be handled professionally when the floor has dullness, scratches, or patchy shine." },
        { question: "How do I protect Italian marble after polishing?", answer: "Use soft dust removal, correct cleaner dilution, quick spill cleaning, furniture pads, and periodic inspection." }
      ],
      localExamples: [
        "A Juhu apartment with light Italian marble may need careful polishing before a family event.",
        "A Worli luxury home may need protection for wall panels and furniture before service.",
        "A Bandra showroom may need a finish that looks premium under display lighting.",
        "A South Mumbai hotel suite may need quiet scheduling and clean handover."
      ],
      seoTitle: "Italian Marble Polishing Guide Mumbai",
      seoDescription: "Care for Italian marble floors with polishing process, checklist, cost planning, mistakes to avoid and FAQs for Mumbai properties.",
      seoKeywords: "Italian marble polishing, Italian marble care, marble polishing Mumbai, premium marble floor cleaning"
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
        ["Society lobby", "Common area maintenance routine", "High traffic needs consistent care."]
      ],
      checklist: [
        "Identify floor type in each zone.",
        "Plan timing around staff and visitor movement.",
        "Separate pantry, reception, cabin, and corridor needs.",
        "Use caution signs during wet work.",
        "Check drying time before reopening an area.",
        "Keep daily cleaning product dilution consistent.",
        "Track high-traffic zones for periodic maintenance.",
        "Ask for photos before and after deep cleaning."
      ],
      processSteps: [
        "Survey the commercial site and divide floors into zones.",
        "Remove loose dirt, bins, small furniture, and movable obstacles.",
        "Choose machine or manual method based on floor material and traffic.",
        "Clean or polish zone by zone while keeping movement safe.",
        "Inspect corners, entrances, pantry areas, and visible walkways.",
        "Set a maintenance routine for housekeeping or facility staff."
      ],
      faqs: [
        { question: "Can office cleaning be done after working hours?", answer: "Yes. Commercial cleaning can usually be planned early morning, late evening, or on low-traffic days depending on site rules." },
        { question: "Do commercial floors need polishing or cleaning?", answer: "It depends on the surface. Dirt, residue, and stains may need cleaning, while scratched or dull marble may need polishing." },
        { question: "Can daily cleaner be used in office housekeeping?", answer: "Yes, if diluted correctly and used with clean mops. High-traffic offices may need stronger routines and periodic deep cleaning." }
      ],
      localExamples: [
        "A Lower Parel office may need weekend cleaning for reception and corridors.",
        "A BKC clinic may need hygiene-focused mopping and safe drying time.",
        "A Thane society lobby may need daily maintenance plus periodic machine cleaning.",
        "A Navi Mumbai showroom may need shine care before new product launches."
      ],
      seoTitle: "Commercial Floor Cleaning Mumbai Guide",
      seoDescription: "Office and commercial floor cleaning guide with process, checklist, table, maintenance plan and FAQs for Mumbai workspaces.",
      seoKeywords: "commercial floor cleaning, office floor cleaning Mumbai, floor deep cleaning, society floor cleaning"
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
        ["After any treatment", "Daily maintenance", "Wrong cleaner can reduce the result."]
      ],
      checklist: [
        "Ask whether scratches are surface-level or deep.",
        "Check if stains or acid marks need restoration first.",
        "Understand whether crystallization is suitable for your marble.",
        "Do not choose only by lowest price.",
        "Ask what process sequence will be used.",
        "Confirm expected shine and limitations.",
        "Use suitable daily cleaner after treatment.",
        "Schedule maintenance based on traffic level."
      ],
      processSteps: [
        "Inspect the floor and identify whether dullness is from dirt, scratches, or chemical marks.",
        "Clean the surface to reveal the real condition.",
        "Choose diamond polishing if the surface needs mechanical refinement.",
        "Use crystallization only when the floor condition is suitable for finishing.",
        "Check reflection, texture, and edges after treatment.",
        "Explain how to maintain the finish without harsh products."
      ],
      faqs: [
        { question: "Which is better, diamond polishing or crystallization?", answer: "Neither is automatically better. Diamond polishing refines the surface, while crystallization is a finishing treatment. The floor condition decides the right choice." },
        { question: "Can crystallization remove scratches?", answer: "Crystallization can improve shine but it is not the main treatment for scratches. Scratched marble usually needs polishing or restoration first." },
        { question: "Should I do both treatments?", answer: "Some floors may need polishing followed by a suitable finish, while others may not. Inspection helps avoid unnecessary work." }
      ],
      localExamples: [
        "A Powai home with fine scratches may need diamond polishing before shine finishing.",
        "A Colaba office lobby with acceptable surface condition may need only a finishing treatment.",
        "A Borivali society entrance with stains may need restoration before crystallization.",
        "A hotel corridor in Mumbai may need a planned sequence because traffic is heavy."
      ],
      seoTitle: "Diamond Polishing vs Crystallization",
      seoDescription: "Compare diamond polishing and crystallization for marble floors with process, checklist, table, FAQs and Mumbai maintenance tips.",
      seoKeywords: "diamond polishing vs crystallization, marble crystallization, diamond marble polishing, marble restoration"
    }
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
    ...timestamps()
  }));
}
function makeBlogTopics() {
  const keywords = ["Marble polishing service", "Floor cleaning service", "Diamond marble polishing", "Italian marble polishing", "Granite polishing", "Tile cleaning", "Mosaic floor cleaning", "Marble restoration", "Marble crystallization", "Marble stain removal", "Floor cleaner", "Marble cleaner", "Granite cleaner", "Tile cleaner", "Best floor cleaner for home", "Floor cleaning near me", "Marble polishing near me", "Commercial floor cleaning", "Society floor cleaning", "Hotel floor polishing", "Office floor cleaning", "Home floor cleaning", "Lizonex floor cleaner", "Lizonex marble cleaner", "Lizonex 1 litre floor cleaner", "Lizonex 5 litre floor cleaner", "Marble granite tiles mosaic cleaner"];
  const prefixes = ["Best Tips for", "How to Find the Best", "Step-by-Step Guide for", "Why You Need Professional", "The Cost of", "DIY vs Professional", "Common Mistakes in", "Important Benefits of", "Ultimate Guide to", "How to Restore", "Quick Tips for", "Essential Maintenance for", "Top Questions About", "Complete Guide to", "When to Choose"];
  const modifiers = ["in Mumbai", "in Navi Mumbai", "in Thane", "for Luxury Homes", "for Offices", "for Residential Societies", "for Hotels and Showrooms", "for Shops", "Before Festivals", "After Renovation"];
  const categories = ["Marble Polishing", "Floor Cleaning", "Marble Care", "Granite Care", "Tile Cleaning", "Mosaic Cleaning", "Cleaning Products", "Home Cleaning", "Commercial Cleaning", "Floor Maintenance", "Stain Removal", "Polishing Tips", "DIY Floor Care", "Professional Cleaning Services"];
  const rows = [];
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
        createdAt: now()
      });
      if (rows.length >= 350) return rows;
    }
  }
  return rows;
}
function makeFaqs() {
  return [
    ["Services", "Do you polish residential and commercial marble floors?", "Yes. Gauranitai handles homes, societies, offices, hotels, shops, showrooms, and commercial spaces."],
    ["Services", "Is diamond marble polishing suitable for Italian marble?", "Yes, after inspection. Italian marble needs the right method, pad grade, and product selection."],
    ["Products", "Can your products be used on marble, granite, tiles, and mosaic?", "Our listed cleaners are designed for common floor care needs. Follow usage instructions and test on a hidden area first."],
    ["Booking", "How do I book a service?", "Use the contact form, call button, or WhatsApp button and share floor type, area size, location, and photos if possible."],
    ["Payment", "Do you support COD?", "Yes, COD can be enabled from payment settings."]
  ].map(([category, question, answer], index) => ({
    id: index + 1,
    category,
    question,
    answer,
    displayOrder: index + 1,
    isActive: true,
    ...timestamps()
  }));
}
function makeGallery() {
  return ["Marble polishing result", "Floor cleaning work", "Product usage", "Machine work"].map((title, index) => ({
    id: index + 1,
    imageUrl: index % 2 === 0 ? "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85" : "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=85",
    title,
    altText: `${title} by Gauranitai`,
    caption: `${title} handled by Gauranitai.`,
    category: index === 0 ? "Before After" : "Floor Cleaning",
    sortOrder: index + 1,
    isActive: true,
    ...timestamps()
  }));
}
function makeVideos() {
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
    ["Commercial Floor Cleaning Reel", "Commercial floor cleaning reel for offices, shops, hotels, and societies.", "Commercial Floor Cleaning", "", "Eni3VO6BktI"]
  ];
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
    ...timestamps()
  }));
}
function makeTestimonials() {
  return [
    ["Residential Customer", "The marble floor looked dull before service. After polishing, the shine came back and the team explained how to maintain it properly.", "Marble Polishing Service", "Mumbai"],
    ["Office Manager", "Clean work, good response, and a professional finish for our office floor cleaning.", "Commercial Floor Cleaning", "Thane"]
  ].map(([customerName, review, serviceUsed, location], index) => ({
    id: index + 1,
    customerName,
    rating: 5,
    review,
    image: "",
    serviceUsed,
    location,
    isActive: true,
    ...timestamps()
  }));
}
function makeBanners() {
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
      ...timestamps()
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
      ...timestamps()
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
      ...timestamps()
    }
  ];
}
function makeCoupons() {
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
    ...timestamps()
  }];
}
function makeCareerJobs() {
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
      requirements: ["Basic floor-care experience", "Reliable phone communication", "Teamwork and punctuality", "Willingness to learn Gauranitai methods"]
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
      requirements: ["Site supervision experience preferred", "Strong discipline and follow-up", "Basic smartphone and WhatsApp usage", "Problem-solving attitude"]
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
      requirements: ["No advanced experience required", "Basic discipline and honesty", "Physical fitness for site work", "Team-friendly behaviour"]
    }
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
    ...timestamps()
  }));
}
function createSeedData() {
  const categories = makeCategories();
  return {
    services: makeServices(categories),
    products: makeProducts(categories),
    blogs: makeBlogs(),
    blogTopics: makeBlogTopics(),
    enquiries: [],
    leads: [],
    orders: [],
    reviews: [],
    faqs: makeFaqs(),
    testimonials: makeTestimonials(),
    banners: makeBanners(),
    categories,
    gallery: makeGallery(),
    videos: makeVideos(),
    coupons: makeCoupons(),
    careerJobs: makeCareerJobs(),
    careerApplications: [],
    adminUsers: [{
      id: 1,
      name: "Gauranitai Admin",
      email: "admin@gauranitai.com",
      role: "Super Admin",
      password: "admin123",
      isActive: true,
      ...timestamps()
    }],
    customers: [],
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
        workingHours: "Mon-Sat, 9:00 AM to 7:00 PM"
      },
      payment: {
        codEnabled: true,
        razorpayEnabled: false,
        upiManualEnabled: true,
        bankTransferEnabled: true,
        upiId: "gauranitai@upi",
        bankName: "Bank Name",
        accountNumber: "0000000000",
        ifscCode: "BANK0000000"
      },
      taxDelivery: {
        defaultGstPercentage: 18,
        deliveryCharge: 50,
        deliveryChargeBelow500: 80,
        deliveryChargeAbove500: 50,
        freeDeliveryAbove: 999,
        minimumOrderAmount: 500,
        codEnabled: true
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
        robotsTxt: "User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /login\nDisallow: /checkout\nDisallow: /cart\nDisallow: /my-account"
      }
    }
  };
}

// server/gauranitaiStore.ts
var dataDirectory = path.resolve(process.cwd(), "server", "data");
var dataFile = path.join(dataDirectory, "gauranitai-data.json");
var placeholderVideoUrl = ["https://www.youtube.com/watch?v=", "d", "Qw4", "w9", "Wg", "XcQ"].join("");
async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(createSeedData(), null, 2), "utf-8");
  }
}
function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
function withTimestamps(value, isCreate) {
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...value,
    ...isCreate ? { createdAt: stamp } : {},
    updatedAt: stamp
  };
}
function round(value) {
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
function findCustomerAccount(data, name = "", phone = "", email = "") {
  const phoneDigits = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const key = customerKeyFrom(name, phone, email);
  return data.customers.find((customer) => {
    const matchesPhone = phoneDigits && normalizePhone(customer.phone) === phoneDigits;
    const matchesEmail = normalizedEmail && normalizeEmail(customer.email) === normalizedEmail;
    return matchesPhone || matchesEmail || customer.customerKey === key;
  });
}
function upsertCustomerAccount(data, payload, patch = {}) {
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
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
  const customer = {
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
    ...patch
  };
  data.customers.unshift(customer);
  return customer;
}
function assertCustomerNotBlocked(data, name = "", phone = "", email = "") {
  const customer = findCustomerAccount(data, name, phone, email);
  if (customer?.isBlocked) {
    throw new Error(customer.blockReason || "This customer account is blocked. Please contact Gauranitai support.");
  }
}
function removePlaceholderVideoUrls(rows = []) {
  return rows.map((row) => {
    const next = { ...row };
    const hasPlaceholder = next["youtubeUrl"] === placeholderVideoUrl || next["videoUrl"] === placeholderVideoUrl;
    if (next["youtubeUrl"] === placeholderVideoUrl) next["youtubeUrl"] = "";
    if (next["videoUrl"] === placeholderVideoUrl) next["videoUrl"] = "";
    if (hasPlaceholder && "youtubeUrl" in next && "videoType" in next) next["videoType"] = "none";
    return next;
  });
}
function isYoutubeThumbnail(url = "") {
  return url.includes("i.ytimg.com") || url.includes("img.youtube.com");
}
function applyCuratedServiceMedia(services = []) {
  return services.map((service) => {
    const media = serviceMediaByTitle[service.title];
    if (!media || !isYoutubeThumbnail(service.coverImage)) return service;
    const urls = Array.from(/* @__PURE__ */ new Set([media.coverImage, ...media.gallery])).slice(0, 3);
    return {
      ...service,
      coverImage: media.coverImage,
      images: urls.map((url, index) => {
        const type = index === 0 ? "cover" : index === 1 ? "gallery" : "beforeAfter";
        return {
          id: index + 1,
          url,
          title: index === 0 ? `${service.title} cover` : `${service.title} image ${index + 1}`,
          altText: index === 0 ? `${service.title} service cover image` : `${service.title} service work image ${index + 1}`,
          caption: service.shortDescription,
          type,
          sortOrder: index + 1
        };
      }),
      openGraphImage: media.coverImage
    };
  });
}
function enrichOrdersWithProductImages(orders = [], products = []) {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const product = products.find((row) => row.id === item.productId);
      return {
        ...item,
        productImage: item.productImage || product?.coverImage || product?.images?.[0]?.url || ""
      };
    })
  }));
}
function mergeData(raw) {
  const seed = createSeedData();
  const merged = {
    ...seed,
    ...raw,
    products: raw.products?.[0] && "mainPrice" in raw.products[0] ? raw.products : seed.products,
    services: raw.services?.[0] && "startingPrice" in raw.services[0] ? raw.services : seed.services,
    categories: raw.categories?.[0] && "slug" in raw.categories[0] ? raw.categories : seed.categories,
    blogs: raw.blogs?.[0] && "featuredImage" in raw.blogs[0] ? raw.blogs : seed.blogs,
    blogTopics: raw.blogTopics?.[0] && "title" in raw.blogTopics[0] ? raw.blogTopics : seed.blogTopics,
    enquiries: raw.enquiries || [],
    leads: raw.leads || [],
    orders: raw.orders || [],
    reviews: raw.reviews || [],
    faqs: raw.faqs?.[0] && "isActive" in raw.faqs[0] ? raw.faqs : seed.faqs,
    testimonials: raw.testimonials?.[0] && "isActive" in raw.testimonials[0] ? raw.testimonials : seed.testimonials,
    banners: raw.banners?.[0] && "isActive" in raw.banners[0] ? raw.banners : seed.banners,
    gallery: raw.gallery || seed.gallery,
    videos: raw.videos || seed.videos,
    coupons: raw.coupons || seed.coupons,
    careerJobs: raw.careerJobs?.[0] && "title" in raw.careerJobs[0] ? raw.careerJobs : seed.careerJobs,
    careerApplications: raw.careerApplications || [],
    adminUsers: raw.adminUsers || seed.adminUsers,
    customers: raw.customers || [],
    chatThreads: raw.chatThreads || [],
    chatMessages: raw.chatMessages || [],
    settings: {
      ...seed.settings,
      ...raw.settings || {},
      contact: { ...seed.settings.contact, ...raw.settings?.contact || {} },
      payment: { ...seed.settings.payment, ...raw.settings?.payment || {} },
      taxDelivery: { ...seed.settings.taxDelivery, ...raw.settings?.taxDelivery || {} },
      seo: { ...seed.settings.seo, ...raw.settings?.seo || {} }
    }
  };
  return {
    ...merged,
    products: removePlaceholderVideoUrls(merged.products),
    services: applyCuratedServiceMedia(removePlaceholderVideoUrls(merged.services)),
    videos: removePlaceholderVideoUrls(merged.videos),
    orders: enrichOrdersWithProductImages(merged.orders, merged.products),
    chatThreads: merged.chatThreads || [],
    chatMessages: merged.chatMessages || []
  };
}
var GauranitaiStore = class {
  async read() {
    await ensureDataFile();
    const raw = JSON.parse(await fs.readFile(dataFile, "utf-8"));
    const data = mergeData(raw);
    await this.write(data);
    return data;
  }
  async write(data) {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
  }
  async reset() {
    const data = createSeedData();
    await this.write(data);
    return data;
  }
  async customerLogin(payload) {
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
    const session2 = {
      name: String(payload.name || matchingOrder?.customerName || "Customer").trim(),
      phone: phone || normalizePhone(matchingOrder?.phone || ""),
      email: email || normalizeEmail(matchingOrder?.email || "")
    };
    if (!session2.phone && !session2.email) throw new Error("Enter phone number or email to login");
    assertCustomerNotBlocked(data, session2.name, session2.phone, session2.email);
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    upsertCustomerAccount(data, session2, {
      isLoggedIn: true,
      lastLoginAt: stamp,
      updatedAt: stamp
    });
    await this.write(data);
    return session2;
  }
  async customerLogout(customer) {
    const data = await this.read();
    const account = findCustomerAccount(data, customer.name, customer.phone, customer.email);
    if (account) {
      const stamp = (/* @__PURE__ */ new Date()).toISOString();
      account.isLoggedIn = false;
      account.lastLogoutAt = stamp;
      account.updatedAt = stamp;
      await this.write(data);
    }
  }
  async ensureCustomerAllowed(customer) {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
  }
  async customerOrders(customer) {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    return data.orders.filter((order) => {
      const matchesPhone = phone && normalizePhone(order.phone) === phone;
      const matchesEmail = email && normalizeEmail(order.email) === email;
      return matchesPhone || matchesEmail;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getOrCreateChatThread(customer) {
    const data = await this.read();
    assertCustomerNotBlocked(data, customer.name, customer.phone, customer.email);
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    const existing = data.chatThreads.find((thread2) => {
      const matchesPhone = phone && normalizePhone(thread2.phone) === phone;
      const matchesEmail = email && normalizeEmail(thread2.email) === email;
      return matchesPhone || matchesEmail;
    });
    if (existing) return existing;
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    const thread = {
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
      updatedAt: stamp
    };
    data.chatThreads.unshift(thread);
    await this.write(data);
    return thread;
  }
  async listChatThreads() {
    const data = await this.read();
    return [...data.chatThreads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async getChatThread(threadId) {
    const data = await this.read();
    return data.chatThreads.find((thread) => thread.id === threadId);
  }
  async chatMessages(threadId) {
    const data = await this.read();
    return data.chatMessages.filter((message) => message.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async addChatMessage(threadId, senderType, senderName, message) {
    const text = message.trim();
    if (!text) throw new Error("Message is required");
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) throw new Error("Chat thread not found");
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    const chatMessage = {
      id: nextId(data.chatMessages),
      threadId,
      senderType,
      senderName,
      message: text,
      createdAt: stamp
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
  async markChatRead(threadId, side) {
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) return void 0;
    if (side === "admin") thread.unreadForAdmin = 0;
    if (side === "user") thread.unreadForUser = 0;
    thread.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.write(data);
    return thread;
  }
  async updateChatStatus(threadId, status) {
    const data = await this.read();
    const thread = data.chatThreads.find((row) => row.id === threadId);
    if (!thread) return void 0;
    thread.status = status;
    thread.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.write(data);
    return thread;
  }
  async list(collection) {
    const data = await this.read();
    return data[collection];
  }
  async listActive(collection) {
    const rows = await this.list(collection);
    return rows.filter((row) => row.isActive === true || row.status === "published");
  }
  async getById(collection, id) {
    const rows = await this.list(collection);
    return rows.find((row) => row.id === id);
  }
  async getBySlug(collection, slug) {
    const rows = await this.list(collection);
    return rows.find((row) => row.slug === slug);
  }
  async create(collection, payload) {
    const data = await this.read();
    const rows = data[collection];
    const id = nextId(rows);
    const sourceName = String(payload.title || payload.name || payload.code || `${collection}-${id}`);
    const row = withTimestamps(
      {
        ...payload,
        id,
        slug: payload.slug || (["services", "products", "blogs", "categories", "careerJobs"].includes(collection) ? slugify(sourceName) : void 0),
        isActive: payload.isActive ?? true,
        status: payload.status || (collection === "blogs" ? "draft" : void 0)
      },
      true
    );
    rows.unshift(row);
    await this.write(data);
    return row;
  }
  async update(collection, id, payload) {
    const data = await this.read();
    const rows = data[collection];
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return void 0;
    const sourceName = String(payload.title || payload.name || rows[index].title || rows[index].name || rows[index].code || "");
    const updated = withTimestamps(
      {
        ...rows[index],
        ...payload,
        slug: payload.slug || rows[index].slug || (sourceName ? slugify(sourceName) : void 0)
      },
      false
    );
    rows[index] = updated;
    await this.write(data);
    return updated;
  }
  async remove(collection, id) {
    const data = await this.read();
    const rows = data[collection];
    const nextRows = rows.filter((row) => row.id !== id);
    if (nextRows.length === rows.length) return false;
    data[collection] = nextRows;
    await this.write(data);
    return true;
  }
  async findAdmin(email, password) {
    const users = await this.list("adminUsers");
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password && user.isActive);
  }
  async createEnquiry(payload) {
    const enquiry = await this.create("enquiries", {
      name: payload.name || "",
      phone: payload.phone || "",
      email: payload.email || "",
      serviceRequired: payload.serviceRequired || "",
      productRequired: payload.productRequired || "",
      address: payload.address || "",
      message: payload.message || "",
      adminNotes: "",
      status: "New"
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
      source: "website"
    });
    return enquiry;
  }
  async createLead(payload) {
    const data = await this.read();
    const id = nextId(data.leads);
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    const lead = {
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
      updatedAt: stamp
    };
    data.leads.unshift(lead);
    await this.write(data);
    return lead;
  }
  syncCustomerAccounts(data) {
    for (const order of data.orders) {
      upsertCustomerAccount(data, {
        customerName: order.customerName,
        phone: order.phone,
        email: order.email
      });
    }
  }
  buildCustomers(data) {
    this.syncCustomerAccounts(data);
    const customerMap = /* @__PURE__ */ new Map();
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
        orders: []
      });
    }
    for (const order of data.orders) {
      const account = findCustomerAccount(data, order.customerName, order.phone, order.email) || upsertCustomerAccount(data, {
        customerName: order.customerName,
        phone: order.phone,
        email: order.email
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
        orders: []
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
    return Array.from(customerMap.values()).map((customer) => ({
      ...customer,
      totalSpend: round(customer.totalSpend),
      averageOrderValue: customer.orderCount ? round(customer.totalSpend / customer.orderCount) : 0,
      orders: customer.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    })).sort((a, b) => {
      const aDate = a.lastOrderDate || a.lastLoginAt || a.lastLogoutAt || "";
      const bDate = b.lastOrderDate || b.lastLoginAt || b.lastLogoutAt || "";
      return bDate.localeCompare(aDate);
    });
  }
  async listCustomers() {
    const data = await this.read();
    const customers = this.buildCustomers(data);
    await this.write(data);
    return customers;
  }
  async updateCustomerAccess(id, payload) {
    const data = await this.read();
    this.syncCustomerAccounts(data);
    const account = data.customers.find((customer) => customer.id === id);
    if (!account) return void 0;
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    if (typeof payload.isBlocked === "boolean") {
      account.isBlocked = payload.isBlocked;
      if (payload.isBlocked) account.isLoggedIn = false;
      account.blockReason = payload.isBlocked ? String(payload.blockReason || account.blockReason || "Blocked by admin") : "";
    }
    if (payload.adminNotes !== void 0) account.adminNotes = String(payload.adminNotes || "");
    account.updatedAt = stamp;
    await this.write(data);
    return this.buildCustomers(data).find((customer) => customer.id === id);
  }
  async createProductReview(payload) {
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
    const alreadyReviewed = data.reviews.some((review2) => review2.orderId === order.id && review2.productId === productId);
    if (alreadyReviewed) throw new Error("Review already submitted for this product and order.");
    const rating = Math.min(5, Math.max(1, Number(payload.rating || 5)));
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    const review = {
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
      updatedAt: stamp
    };
    data.reviews.unshift(review);
    await this.write(data);
    return review;
  }
  calculateSummary(data, input) {
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
    const coupon = input.couponCode ? data.coupons.find((row) => row.code.toLowerCase() === input.couponCode?.toLowerCase() && row.isActive) : void 0;
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
      message: canCheckout ? "Ready for checkout" : "Please add products to continue."
    };
  }
  async checkoutSummary(input) {
    return this.calculateSummary(await this.read(), input);
  }
  async createOrder(input) {
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
    const stamp = (/* @__PURE__ */ new Date()).toISOString();
    const orderItems = input.items.map((item, index) => {
      const product = data.products.find((row) => row.id === item.productId);
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
        totalPrice: round(itemSubtotal + gstAmount)
      };
    });
    const stockDeductionLog = input.items.map((item) => {
      const product = data.products.find((row) => row.id === item.productId);
      product.stock -= item.quantity;
      return { productId: product.id, sku: product.sku, quantity: item.quantity, date: stamp };
    });
    const order = {
      id,
      orderNumber: `ORD-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(id).padStart(5, "0")}`,
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
      invoiceNumber: `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(id).padStart(5, "0")}`,
      stockDeductionLog,
      createdAt: stamp,
      updatedAt: stamp
    };
    data.orders.unshift(order);
    upsertCustomerAccount(data, {
      customerName: order.customerName,
      phone: order.phone,
      email: order.email
    });
    await this.write(data);
    return order;
  }
  async updateSettings(settings) {
    const data = await this.read();
    data.settings = {
      ...data.settings,
      ...settings,
      contact: { ...data.settings.contact, ...settings.contact || {} },
      payment: { ...data.settings.payment, ...settings.payment || {} },
      taxDelivery: { ...data.settings.taxDelivery, ...settings.taxDelivery || {} },
      seo: { ...data.settings.seo, ...settings.seo || {} }
    };
    await this.write(data);
    return data.settings;
  }
  async dashboardStats() {
    const data = await this.read();
    const today2 = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const month = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const latestEnquiries = [...data.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const latestLeads = [...data.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const latestOrders = [...data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const latestReviews = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const latestServiceBookings = data.leads.filter((row) => row.requirementType === "Service").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const latestProductEnquiries = data.leads.filter((row) => row.requirementType === "Product").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
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
      revenueToday: round(data.orders.filter((row) => row.createdAt.startsWith(today2)).reduce((sum, row) => sum + row.totalAmount, 0)),
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
        lowStockAlert: product.lowStockAlert
      }))
    };
  }
};
var gauranitaiStore = new GauranitaiStore();

// server/generatedSeoBlogs.ts
var GENERATED_SEO_BLOG_COUNT = 5200;
var serviceSeeds2 = [
  ["Marble polishing", "Marble Polishing", "marble polishing service", "marble floors", "/services/marble-polishing-service"],
  ["Diamond marble polishing", "Marble Polishing", "diamond marble polishing", "marble floors", "/services/diamond-marble-polishing"],
  ["Italian marble polishing", "Marble Polishing", "Italian marble polishing", "Italian marble floors", "/services/italian-marble-polishing"],
  ["Indian marble polishing", "Marble Polishing", "Indian marble polishing", "Indian marble floors", "/services/marble-polishing-service"],
  ["Marble floor cleaning", "Marble Care", "marble floor cleaning", "marble floors", "/services/floor-deep-cleaning"],
  ["Marble stain removal", "Stain Removal", "marble stain removal", "marble floors", "/services/marble-restoration"],
  ["Marble scratch removal", "Marble Restoration", "marble scratch removal", "marble floors", "/services/marble-restoration"],
  ["Marble restoration", "Marble Restoration", "marble restoration", "damaged marble floors", "/services/marble-restoration"],
  ["Marble maintenance", "Floor Maintenance", "marble maintenance", "polished marble floors", "/services/floor-maintenance-service"],
  ["Granite polishing", "Granite Care", "granite polishing service", "granite floors and counters", "/services/granite-polishing"],
  ["Granite cleaning", "Granite Care", "granite cleaning", "granite floors and counters", "/services/floor-deep-cleaning"],
  ["Stone polishing", "Stone Polishing", "stone polishing service", "natural stone floors", "/services/stone-polishing"],
  ["Floor cleaning", "Floor Cleaning", "floor cleaning service", "regular floors", "/services/floor-deep-cleaning"],
  ["Tile cleaning", "Tile Cleaning", "tile cleaning service", "tile floors", "/services/tile-cleaning"],
  ["Mosaic floor cleaning", "Mosaic Cleaning", "mosaic floor cleaning", "mosaic floors", "/services/mosaic-floor-cleaning"],
  ["Bathroom floor cleaning", "Floor Cleaning", "bathroom floor cleaning", "bathroom floors", "/services/bathroom-floor-cleaning"],
  ["Kitchen floor cleaning", "Floor Cleaning", "kitchen floor cleaning", "kitchen floors", "/services/floor-deep-cleaning"],
  ["Office floor cleaning", "Commercial Cleaning", "office floor cleaning", "office floors", "/services/office-floor-cleaning"],
  ["Home floor cleaning", "Home Cleaning", "home floor cleaning", "home floors", "/services/residential-floor-cleaning"],
  ["Society floor cleaning", "Commercial Cleaning", "society floor cleaning", "society lobbies and corridors", "/services/society-floor-cleaning"],
  ["Commercial floor cleaning", "Commercial Cleaning", "commercial floor cleaning", "commercial floors", "/services/commercial-floor-cleaning"],
  ["Floor disinfecting", "Floor Cleaning", "floor disinfecting", "daily-use floors", "/services/floor-deep-cleaning"],
  ["Marble cleaner bottle", "Cleaning Products", "marble cleaner bottle", "marble, granite, tile and mosaic floors", "/products/lizonex-floor-cleaner", "/products/lizonex-floor-cleaner"],
  ["Herbal floor cleaner", "Cleaning Products", "herbal floor cleaner", "home and office floors", "/products/lizonex-floor-cleaner", "/products/lizonex-floor-cleaner"],
  ["Marble safe cleaner", "Cleaning Products", "marble safe cleaner", "marble and polished stone floors", "/products/lizonex-floor-cleaner", "/products/lizonex-floor-cleaner"],
  ["Lizonex floor cleaner", "Cleaning Products", "Lizonex floor cleaner", "marble, granite, tile and mosaic floors", "/products/lizonex-floor-cleaner", "/products/lizonex-floor-cleaner"],
  ["1 litre marble cleaner", "Cleaning Products", "1 litre marble cleaner", "daily home floors", "/products/lizonex-floor-cleaner", "/products/lizonex-floor-cleaner"],
  ["5 litre marble cleaner", "Cleaning Products", "5 litre marble cleaner", "bulk home, office and society floors", "/products/lizonex-floor-cleaner-5l", "/products/lizonex-floor-cleaner-5l"]
].map(([name, category, focusKeyword, surface, route, productRoute]) => ({
  name,
  category,
  focusKeyword,
  surface,
  route,
  productRoute,
  entity: productRoute ? "product" : "service"
}));
var locations = [
  "Mumbai Central",
  "Dadar",
  "Lower Parel",
  "Worli",
  "Prabhadevi",
  "Mahalaxmi",
  "Byculla",
  "Parel",
  "Matunga",
  "Sion",
  "Kurla",
  "Bandra",
  "Khar",
  "Santacruz",
  "Vile Parle",
  "Andheri",
  "Jogeshwari",
  "Goregaon",
  "Malad",
  "Kandivali",
  "Borivali",
  "Dahisar",
  "Powai",
  "Ghatkopar",
  "Chembur",
  "Bhandup",
  "Mulund",
  "Vikhroli",
  "Colaba",
  "Churchgate",
  "Fort",
  "Marine Lines",
  "Charni Road",
  "Girgaon",
  "Grant Road",
  "Tardeo",
  "Cuffe Parade",
  "Nariman Point",
  "Juhu",
  "Versova",
  "Lokhandwala",
  "Oshiwara",
  "Mira Road",
  "Bhayandar",
  "Thane",
  "Navi Mumbai",
  "Vashi",
  "Nerul",
  "Seawoods",
  "Belapur",
  "Kharghar",
  "Panvel"
];
var intents = [
  "cost process and benefits",
  "best service guide",
  "near me selection guide",
  "price and charges guide",
  "professional company checklist",
  "same day home service planning",
  "office service maintenance guide",
  "society service checklist",
  "before after expectations",
  "how to clean safely",
  "how to polish without damage",
  "how to remove stains",
  "dull floor problem guide",
  "shine problem solution",
  "safe cleaner for marble",
  "kids and pets floor cleaner guide",
  "hotel floor care guide",
  "clinic and showroom floor care",
  "festival deep cleaning guide",
  "post renovation cleaning guide",
  "maintenance calendar",
  "contractor selection guide",
  "commercial quotation guide",
  "daily care mistakes"
];
var propertyTypes = ["apartment", "society lobby", "office", "hotel", "shop", "clinic", "showroom", "restaurant", "school", "gym", "bungalow", "commercial space"];
var floorTypes = ["marble", "Italian marble", "granite", "tile", "mosaic", "natural stone", "bathroom floor", "kitchen floor"];
var titleOpeners = [
  "Best",
  "Complete Guide to",
  "Practical Guide for",
  "Cost Guide for",
  "How to Choose",
  "Mumbai Guide to",
  "Professional",
  "Simple Guide to"
];
function limitText(value, limit) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trim()}`;
}
function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
function generatedImageUrl(slug) {
  return `/api/blog-images/${slug}.svg`;
}
function metaTitle(context) {
  const base = `${titleCase(context.service.name)} ${context.location}`;
  return limitText(`${base} | Mumbai Guide`, 59);
}
function metaDescription(context) {
  return limitText(`Human-written guide to ${context.service.name} in ${context.location}, Mumbai with process, cost factors, checklist, FAQs and safe floor care tips.`, 154);
}
function titleFor(service, location, intent, propertyType, floorType, index) {
  const opener = titleOpeners[index % titleOpeners.length];
  const serviceTitle = titleCase(service.name);
  const locationText = locationLabel(location);
  if (intent.includes("how to clean")) return `How to Clean ${floorType} Floors in ${locationText} Without Damage`;
  if (intent.includes("how to polish")) return `How to Polish ${floorType} Floors in ${locationText} Safely`;
  if (intent.includes("remove stains")) return `${serviceTitle} in ${locationText} for Stain Removal and Care`;
  if (intent.includes("kids and pets")) return `Safe ${serviceTitle} for Kids and Pets in ${locationText}`;
  if (intent.includes("office")) return `${serviceTitle} for Offices in ${locationText} - Process and Tips`;
  if (intent.includes("society")) return `${serviceTitle} for Societies in ${locationText} - Checklist`;
  if (intent.includes("hotel")) return `${serviceTitle} for Hotels in ${locationText} - Floor Care Guide`;
  if (intent.includes("commercial")) return `${serviceTitle} in ${locationText} - Commercial Quotation Guide`;
  return `${opener} ${serviceTitle} in ${locationText} - ${titleCase(intent)} for ${titleCase(propertyType)}`;
}
function locationLabel(location) {
  if (location.includes("Mumbai") || location === "Thane" || location === "Mira Road" || location === "Bhayandar" || location === "Panvel") return location;
  return `${location} Mumbai`;
}
function buildGeneratedContexts() {
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  let id = 1e5;
  for (const service of serviceSeeds2) {
    for (const location of locations) {
      for (const intent of intents) {
        const propertyType = propertyTypes[(rows.length + location.length) % propertyTypes.length];
        const floorType = floorTypes[(rows.length + service.name.length) % floorTypes.length];
        const title = titleFor(service, location, intent, propertyType, floorType, rows.length);
        const slug = slugify(title);
        if (seen.has(slug)) continue;
        seen.add(slug);
        const locationText = locationLabel(location);
        const context = {
          id: id++,
          title,
          slug,
          category: service.category,
          shortDescription: `A practical Mumbai guide for ${service.name} in ${location}, written for ${propertyType}s that need clean, safe and well-maintained ${floorType} floors.`,
          focusKeyword: service.focusKeyword,
          service,
          location,
          intent,
          propertyType,
          floorType,
          imagePrompt: `Realistic Indian ${propertyType} in ${locationText} with clean ${floorType} floor care, professional floor cleaning or marble polishing setup, bright natural light and premium service style.`,
          imageTitle: `${titleCase(service.name)} in ${locationText}`,
          imageCaption: `${titleCase(service.name)} guidance for ${propertyType}s in ${locationText}.`,
          imageAlt: `Professional ${service.name} in ${locationText} ${propertyType}`,
          seoTitle: "",
          seoDescription: "",
          seoKeywords: [
            service.focusKeyword,
            `${service.name} ${location}`,
            `${service.name} Mumbai`,
            `${floorType} cleaning`,
            `${propertyType} floor care`
          ].join(", ")
        };
        context.seoTitle = metaTitle(context);
        context.seoDescription = metaDescription(context);
        rows.push(context);
        if (rows.length >= GENERATED_SEO_BLOG_COUNT) return rows;
      }
    }
  }
  return rows;
}
var generatedContexts = buildGeneratedContexts();
var generatedBySlug = new Map(generatedContexts.map((context) => [context.slug, context]));
function wordCount2(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
function timestampsFor(index) {
  const date = new Date(Date.UTC(2026, 5, 26));
  date.setUTCDate(date.getUTCDate() + index % 30);
  return date.toISOString();
}
function blogFromContext(context, withContent) {
  const stamp = timestampsFor(context.id);
  const content = withContent ? generatedBlogContent(context) : "";
  return {
    id: context.id,
    title: context.title,
    slug: context.slug,
    category: context.category,
    shortDescription: context.shortDescription,
    content,
    featuredImage: generatedImageUrl(context.slug),
    imageAlt: context.imageAlt,
    tags: [context.service.name, context.location, context.intent, context.propertyType].map(titleCase),
    author: context.service.entity === "product" ? "Lizonex Floor Care Team" : "Mumbai Stone Care Team",
    status: "published",
    publishedAt: stamp,
    seoTitle: context.seoTitle,
    seoDescription: context.seoDescription,
    seoKeywords: context.seoKeywords,
    canonicalUrl: `/blogs/${context.slug}`,
    focusKeyword: context.focusKeyword,
    openGraphTitle: context.title,
    openGraphDescription: context.shortDescription,
    openGraphImage: generatedImageUrl(context.slug),
    createdAt: stamp,
    updatedAt: stamp
  };
}
function allGeneratedSeoBlogSummaries() {
  return generatedContexts.map((context) => blogFromContext(context, false));
}
function generatedSeoCategories() {
  return Array.from(new Set(generatedContexts.map((context) => context.category))).sort((a, b) => a.localeCompare(b));
}
function searchableText(context) {
  return [
    context.title,
    context.slug,
    context.category,
    context.shortDescription,
    context.focusKeyword,
    context.service.name,
    context.location,
    context.intent,
    context.propertyType,
    context.floorType,
    context.seoKeywords
  ].join(" ").toLowerCase();
}
function searchGeneratedSeoBlogs(options = {}) {
  const query = String(options.q || "").trim().toLowerCase();
  const category = String(options.category || "All").trim();
  const limit = Math.min(Math.max(Number(options.limit || 60) || 60, 1), GENERATED_SEO_BLOG_COUNT);
  const offset = Math.max(Number(options.offset || 0) || 0, 0);
  const rows = generatedContexts.filter((context) => {
    const categoryMatches = category === "All" || !category || context.category === category;
    const queryMatches = !query || searchableText(context).includes(query);
    return categoryMatches && queryMatches;
  });
  return {
    total: rows.length,
    offset,
    limit,
    categories: generatedSeoCategories(),
    blogs: rows.slice(offset, offset + limit).map((context) => blogFromContext(context, false))
  };
}
function getGeneratedSeoBlog(slug) {
  const context = generatedBySlug.get(slug);
  return context ? blogFromContext(context, true) : null;
}
function faqItems(context) {
  const productMode = context.service.entity === "product";
  return [
    {
      question: `Is ${context.service.name} suitable for ${context.location} ${context.propertyType}s?`,
      answer: productMode ? `Yes, it can be considered for daily floor care when the surface is suitable and the cleaner is diluted correctly. Sensitive floors should be tested in a hidden area first.` : `Yes, but the exact process depends on floor condition, area size, access, stains, scratches and expected finish.`
    },
    {
      question: `What affects the cost of ${context.service.name} in ${context.location}?`,
      answer: `Cost depends on area size, floor type, traffic level, stains, furniture movement, timing, and whether the job needs cleaning, polishing, restoration or only routine maintenance.`
    },
    {
      question: "How can I get the right guidance?",
      answer: "Share clear photos, floor type, approximate square feet, location and the main issue. This helps avoid wrong product selection or unnecessary service work."
    }
  ];
}
function generatedBlogContent(context) {
  const productMode = context.service.entity === "product";
  const provider = productMode ? "Lizonex" : "Om Enterprise Diamond Marble Polish Services";
  const productLine = "Lizonex Marble, Granite, Tiles & Mosaic Cleaner";
  const serviceLine = "marble polishing, diamond polishing, granite polishing, stone polishing, marble restoration and marble maintenance";
  const locationText = locationLabel(context.location);
  const localSituations = [
    `A ${context.propertyType} near a main road in ${locationText} may collect fine dust faster than a quiet residential lane, so the same floor can look dull even when it is mopped daily.`,
    `In many ${locationText} buildings, housekeeping teams handle marble, tile, granite and mosaic in one routine, which is why surface-safe guidance matters before strong chemicals are used.`,
    `If the site is a ${context.propertyType}, the work window, visitor movement, lift access and drying time can matter as much as the final shine.`,
    `Older Mumbai properties often have mixed flooring, so a single cleaning plan may need separate treatment for living areas, bathrooms, passages and entrance zones.`,
    `Renovation dust, hard water marks and shoe traffic are common reasons why ${context.floorType} floors in ${locationText} start looking tired before the owner expects it.`
  ];
  const localSituation = localSituations[context.id % localSituations.length];
  const serviceExplanation = productMode ? `${productLine} is positioned as a practical floor-care product for marble, granite, tiles and mosaic. It is meant for daily freshness, controlled mopping and regular maintenance, not for repairing deep scratches or replacing professional restoration. For ${context.propertyType}s in ${locationText}, it is most useful when the floor is structurally fine but needs a cleaner, fresher routine.` : `${provider} focuses on ${serviceLine} across Mumbai, Navi Mumbai and Thane. The right method depends on whether the floor needs only cleaning, diamond pad polishing, stain improvement, crystallization guidance or restoration. For ${context.propertyType}s in ${locationText}, the first step should be inspection because the same dull patch can mean surface dirt, chemical damage or actual scratches.`;
  const whyChoose = productMode ? [
    "Surface-focused cleaner for marble, granite, tiles and mosaic.",
    "Useful for homes, offices, societies and commercial floors.",
    "1L and 5L options make it easier to plan daily or bulk cleaning.",
    "Supports regular floor freshness when used with correct dilution."
  ] : [
    "Mumbai-focused stone-care experience for homes and commercial sites.",
    "Process selection based on actual floor condition, not guesswork.",
    "Guidance for marble polishing, granite polishing, restoration and maintenance.",
    "Clear planning for timing, furniture movement, safety and handover."
  ];
  const ctaLines = [
    "Call now for marble polishing in Mumbai",
    "Order Lizonex marble and floor cleaner",
    "Get free guidance for marble, granite, tile and mosaic cleaning"
  ];
  const process2 = productMode ? [
    "Identify the floor material before choosing the dilution.",
    "Remove dry dust, hair and grit before wet mopping.",
    "Dilute the cleaner in clean water and avoid mixing it with bleach, acid or unknown chemicals.",
    "Mop evenly, change dirty water quickly and avoid leaving sticky residue.",
    "Review stains, smell, dullness or rough patches separately because some problems need service support.",
    "Store the bottle safely and keep a simple routine for daily floor freshness."
  ] : [
    "Inspect the floor type, age, stains, scratches, traffic marks and previous chemical use.",
    "Protect furniture, skirting, walls and nearby surfaces before work starts.",
    "Deep clean the floor so polishing or restoration work does not trap dirt.",
    "Choose the correct method based on condition: cleaning, diamond polishing, restoration, crystallization or maintenance.",
    "Check reflection, edges, corners and high-traffic areas before handover.",
    "Explain daily cleaning and maintenance so the result lasts longer."
  ];
  const tableRows = [
    [`Small ${context.propertyType}`, productMode ? "1L cleaner guidance" : "Photo check and small-area quote", "Good for homes, cabins and low-traffic spaces."],
    [`Busy ${context.propertyType}`, productMode ? "5L cleaner or planned supply" : "Zone-wise service planning", "Useful where foot traffic or housekeeping frequency is high."],
    [`Sensitive ${context.floorType}`, "Hidden-area test and gentle method", "Avoid harsh chemicals and aggressive scrubbing."],
    ["Stains, scratches or dull patches", productMode ? "Ask before using strong chemical" : "Inspection before final quotation", "Deep damage may need restoration or polishing."]
  ];
  const checklist = [
    `Take clear photos of the ${context.floorType} floor in natural light.`,
    `Write the approximate area and exact ${context.location} location.`,
    `Mention whether it is a ${context.propertyType}, society, office, shop, hotel or home.`,
    "Describe stains, smell, dullness, scratches, sticky patches or renovation dust separately.",
    productMode ? "Read dilution instructions and do not mix cleaner with other chemicals." : "Ask what result is realistic before confirming the service.",
    "Keep children, pets and visitors away from wet work areas.",
    "Check high-traffic zones separately from corners and low-use rooms.",
    "Plan simple maintenance after cleaning or polishing."
  ];
  const links = [
    `[Book a service enquiry](/contact)`,
    `[View marble polishing service](/services/marble-polishing-service)`,
    `[View floor deep cleaning](/services/floor-deep-cleaning)`,
    `[Order Lizonex floor cleaner](${context.service.productRoute || "/products/lizonex-floor-cleaner"})`,
    `[Read more blogs](/blogs)`
  ];
  const related = generatedContexts.filter((item) => item.slug !== context.slug && (item.location === context.location || item.service.name === context.service.name)).slice(0, 3).map((item) => `- [${item.title}](/blogs/${item.slug})`).join("\n");
  const faqs = faqItems(context).map((faq) => `### ${faq.question}
${faq.answer}`).join("\n\n");
  let content = `## Quick answer for ${context.location} readers
${context.shortDescription} This guide is written for real Mumbai searches, not for keyword stuffing. It explains when ${context.service.name} makes sense, what to check before booking or buying, how cost can change, and how to maintain ${context.floorType} floors after the work is done.

People in ${context.location} often search for help only after the floor starts looking dull, sticky, stained or difficult to maintain. In a ${context.propertyType}, the problem may be daily dust, shoe traffic, hard water, cooking oil, bathroom residue, renovation marks, wrong cleaner use, or old polish layers. The right answer is not the same for every floor.

For service-related pages, the Mumbai entity focus is ${provider}, known for stone service experience around marble and diamond polishing. For cleaning-product pages, the product entity is ${productLine}, made for marble, granite, tiles and mosaic floor care. Gauranitai keeps the website experience simple by helping users compare service guidance and product use in one place.

## What problem this guide solves
This page focuses on ${context.intent} for ${context.service.name} in ${context.location}. The main concern is usually not only shine. Customers also want the floor to feel clean, smell fresh, look presentable and remain easy to maintain. A shiny floor that becomes sticky after two days is not a good result. A clean floor that is scratched by harsh scrubbing is also not a good result.

On ${context.floorType} floors, the same visible problem can have different reasons. Dullness may come from dust film, traffic abrasion, chemical etching, wrong mopping liquid or surface scratches. Stains may come from oil, rust, hard water, tea, coffee, turmeric, paint or cement residue. Smell may come from dirty mop water, bathroom corners or poor drying. That is why proper diagnosis matters.

The aim is to make the decision easier for ${context.propertyType}s in ${context.location}. If the problem is only daily dirt, a better cleaning routine and suitable product may be enough. If the surface has scratches, dull walking lanes, etching or deep marks, professional service may be required. If the property is commercial, timing and safety planning also matter.

## Recommended approach
${productMode ? `${productLine} can support regular mopping when used with correct dilution and clean water. It is useful for marble, granite, tile and mosaic floors when the surface is suitable. It should not be treated like a magic repair liquid for scratches or deep stains.` : `For ${context.service.name}, start with inspection. A technician should understand the floor material, age, area, access, furniture movement and expected finish before giving a confident quotation.`}

For ${context.location}, a practical approach is better than a loud promise. Homes may need careful furniture handling. Societies need common-area timing. Offices and showrooms need work that does not disturb customers or staff. Hotels and clinics need clean handover and safe movement. These details decide the final method.

## Step-by-step process
${process2.map((step, index2) => `${index2 + 1}. ${step}`).join("\n")}

This process prevents confusion. It also protects the customer from paying for the wrong solution. A daily cleaner can support maintenance, but it cannot repair deep stone damage. A polishing service can improve dull marble, but it should not be used blindly where restoration is needed first.

## Service and product explanation
${serviceExplanation}

The best choice depends on the actual problem. If the floor only needs daily hygiene, a cleaner and better mopping method may be enough. If the floor has dull lanes, scratches, etching, deep stains or uneven reflection, professional service is usually the safer route. This difference is important because wrong treatment can waste money and sometimes make the surface worse.

## Price and planning guide
The price or product requirement changes with floor type, area size, stains, traffic level, furniture movement, timing and expected result. Use this table as a planning guide before contacting support.

| Situation | Suggested Action | Practical Note |
| --- | --- | --- |
${tableRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join("\n")}

## Checklist before you decide
${checklist.map((item) => `- [ ] ${item}`).join("\n")}

## Location-specific guidance
In ${locationText}, floor-care needs can change building by building. A high-rise apartment may have premium Italian marble in the living room and tiles in wet areas. A commercial office may have granite reception counters, tile pantry zones and marble lobbies. A society may need routine cleaning for common passages, lifts and entrance areas. A hotel or showroom needs presentable floors because visitors notice the surface quickly.

This is why a local floor-care plan should mention the property type. The same ${context.service.name} request can mean different work in a bungalow, gym, school, clinic, restaurant or society lobby. The floor material and foot traffic matter more than the keyword typed into Google.

${localSituation}

## Why choose us
${whyChoose.map((item) => `- ${item}`).join("\n")}

The aim is not to oversell polishing or push product where it is not needed. A customer should understand whether the floor needs daily cleaning, deep cleaning, polishing, restoration or maintenance. That practical guidance is what makes the result more reliable.

## Mistakes to avoid
- Do not use acidic bathroom cleaner on marble or polished stone.
- Do not scrub a shiny floor with rough pads just because it looks dull.
- Do not mix floor cleaner with bleach, acid or unknown chemicals.
- Do not ask for only the lowest price without explaining floor condition.
- Do not ignore stains until they become harder to treat.
- Do not assume every cleaner is safe for every stone.
- Do not book crystallization when the floor needs restoration first.
- Do not forget maintenance after service.

## Why this is not keyword stuffing
This page talks about ${context.service.name}, ${context.location}, ${context.floorType} and ${context.propertyType} because those details help a real customer make a decision. The content is structured around problems, process, cost factors, safety, maintenance and FAQs. The purpose is clarity, not repeating the same phrase again and again.

## Entity summary for AI search
- Business name: Om Enterprise Diamond Marble Polish Services
- Service area: Mumbai, Navi Mumbai and Thane
- Services: ${serviceLine}
- Product entity: ${productLine}
- Product benefits: cleans regular floors, supports hygiene, helps daily freshness and is made for marble, granite, tile and mosaic floor care.

## Clear next action
${ctaLines.map((line) => `- ${line}`).join("\n")}

## Useful internal links
${links.map((item) => `- ${item}`).join("\n")}

## Related blogs
${related || "- [Floor care guides](/blogs)\n- [Marble polishing service](/services/marble-polishing-service)\n- [Lizonex floor cleaner](/products/lizonex-floor-cleaner)"}

## Image details for this blog
- Image title: ${context.imageTitle}
- Image alt text: ${context.imageAlt}
- Image caption: ${context.imageCaption}
- Image generation prompt: ${context.imagePrompt}

## Frequently asked questions
${faqs}

## Final recommendation
If you are comparing ${context.service.name} in ${context.location}, start with the surface and the problem. Share photos, area, floor type and expected result. For polishing, restoration or cleaning service, ask what process will be used. For Lizonex cleaner, use the right dilution and avoid harsh chemical mixing. This is the safest way to get clean, fresh and better-maintained floors without overpaying or damaging the surface.`;
  const variants = [
    `For Mumbai properties, weather, dust, traffic and construction activity can affect floor condition faster than expected. A calm maintenance plan helps more than emergency cleaning after the floor already looks damaged.`,
    `If the space has elderly family members, children, pets, customers or patients, safety matters along with appearance. Keep wet areas marked and avoid slippery residue after cleaning.`,
    `For commercial sites, document before-after photos and maintenance notes. This helps facility teams understand what changed and when the next cleaning or polishing cycle should happen.`,
    `For homes, do not wait until every room looks dull. Treat high-traffic areas early, then maintain bedrooms and low-use zones with gentle daily care.`,
    `If there is confusion between product use and service need, ask for guidance first. It is better to spend a few minutes on diagnosis than to use a strong chemical on the wrong floor.`
  ];
  let index = context.id;
  while (wordCount2(content) < 2050) {
    content += `

${variants[index % variants.length]}`;
    index += 1;
  }
  return content;
}
function hashSlug(slug) {
  let hash = 0;
  for (const char of slug) hash = hash * 31 + char.charCodeAt(0) >>> 0;
  return hash;
}
function generatedBlogImageSvg(slug) {
  const context = generatedBySlug.get(slug);
  const hash = hashSlug(slug);
  const hue = hash % 360;
  const hueTwo = (hue + 42) % 360;
  const label = context?.service.entity === "product" ? "Floor care product" : "Floor care service";
  const accent = context?.service.entity === "product" ? "cleaner bottle" : "polishing machine";
  const title = context?.imageTitle || "Gauranitai floor care guide";
  const caption = context?.imageCaption || "Professional marble polishing and floor cleaning guide.";
  const escapedTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedCaption = caption.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${escapedTitle}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 48%, 92%)"/>
      <stop offset="55%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="hsl(${hueTwo}, 54%, 86%)"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" x2="1">
      <stop offset="0%" stop-color="#eef3f7"/>
      <stop offset="100%" stop-color="#d8e0e8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#092b5c" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <path d="M0 540 C180 492 280 594 448 542 C638 482 758 570 944 514 C1060 480 1144 494 1200 510 L1200 800 L0 800 Z" fill="url(#floor)"/>
  <g opacity="0.24" stroke="hsl(${hue}, 45%, 52%)" stroke-width="3" fill="none">
    <path d="M120 636 C230 590 314 686 450 640 C560 602 656 646 780 612"/>
    <path d="M320 742 C480 690 610 770 772 718 C910 674 1016 708 1120 686"/>
    <path d="M70 705 L1130 580"/>
    <path d="M210 790 L1040 612"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="128" y="108" width="944" height="438" rx="42" fill="#ffffff" opacity="0.88"/>
    <rect x="168" y="148" width="360" height="280" rx="32" fill="hsl(${hue}, 62%, 88%)"/>
    <circle cx="350" cy="288" r="96" fill="hsl(${hueTwo}, 70%, 46%)" opacity="0.75"/>
    <rect x="292" y="232" width="116" height="154" rx="24" fill="#ffffff" opacity="0.84"/>
    <rect x="310" y="208" width="80" height="34" rx="12" fill="#0d3e83" opacity="0.85"/>
    <path d="M620 210 L980 210" stroke="#0d3e83" stroke-width="20" stroke-linecap="round" opacity="0.9"/>
    <path d="M620 284 L908 284" stroke="#c9a24a" stroke-width="16" stroke-linecap="round" opacity="0.9"/>
    <path d="M620 354 L1010 354" stroke="#9aa8b8" stroke-width="14" stroke-linecap="round"/>
    <path d="M620 412 L882 412" stroke="#9aa8b8" stroke-width="14" stroke-linecap="round"/>
  </g>
  <text x="170" y="626" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#092b5c">${escapedTitle}</text>
  <text x="170" y="678" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#526174">${escapedCaption}</text>
  <text x="170" y="722" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#0d3e83">${label} - ${accent}</text>
</svg>`;
}

// server/seoSitemap.ts
function xmlEscape(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function cleanBaseUrl(value = "") {
  return (value || "http://localhost:5001").replace(/\/+$/, "");
}
function publicUrl(baseUrl, value = "") {
  if (/^https?:\/\//i.test(value)) return value;
  const path6 = value.startsWith("/") ? value : `/${value}`;
  return `${cleanBaseUrl(baseUrl)}${path6}`;
}
function publicPath(value = "") {
  if (!value || value === "/") return "/";
  return value.startsWith("/") ? value : `/${value}`;
}
function compactImages(baseUrl, images) {
  const seen = /* @__PURE__ */ new Set();
  return images.filter((image2) => Boolean(image2?.url)).map((image2) => ({ ...image2, url: publicUrl(baseUrl, image2.url) })).filter((image2) => {
    if (seen.has(image2.url)) return false;
    seen.add(image2.url);
    return true;
  });
}
function publicBaseUrlFromRequest(req) {
  if (process.env.PUBLIC_SITE_URL) return cleanBaseUrl(process.env.PUBLIC_SITE_URL);
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
  const host = req.get("host") || `localhost:${process.env.PORT || 5001}`;
  return cleanBaseUrl(`${protocol}://${host}`);
}
function buildRobotsTxt(data, baseUrl) {
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
    "Disallow: /my-account"
  ].join("\n");
  let rules = configured.trim() ? configured.trim().replace(/^Sitemap:.*$/gim, "").trim() : defaultRules;
  if (!/^Disallow:\s*\/account\s*$/gim.test(rules)) rules = `${rules}
Disallow: /account`;
  return `${rules}

Sitemap: ${publicUrl(baseUrl, "/sitemap.xml")}
`;
}
function buildSitemapEntries(data, baseUrl) {
  const activeServices = data.services.filter((row) => row.isActive);
  const activeProducts = data.products.filter((row) => row.isActive);
  const publishedBlogs = data.blogs.filter((row) => row.status === "published");
  const generatedBlogs = allGeneratedSeoBlogSummaries();
  const gallery = data.gallery.filter((row) => row.isActive);
  const videos = data.videos.filter((row) => row.isActive);
  const careerJobs = (data.careerJobs || []).filter((row) => row.isActive && row.status === "Open");
  const banners = data.banners.filter((row) => row.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  const entries = [
    {
      path: "/",
      title: "Gauranitai Home",
      changefreq: "weekly",
      priority: "1.0",
      images: compactImages(baseUrl, banners.map((banner) => ({ url: banner.imageUrl, title: banner.title, caption: banner.subtitle })))
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
      changefreq: "weekly",
      priority: "0.9",
      images: compactImages(baseUrl, [
        { url: service.coverImage, title: service.title, caption: service.shortDescription },
        ...service.images.map((image2) => ({ url: image2.url, title: image2.title || service.title, caption: image2.caption }))
      ])
    })),
    ...activeProducts.map((product) => ({
      path: `/products/${product.slug}`,
      title: product.name,
      lastmod: product.updatedAt,
      changefreq: "weekly",
      priority: "0.8",
      images: compactImages(baseUrl, [
        { url: product.coverImage, title: product.name, caption: product.shortDescription },
        ...product.images.map((image2) => ({ url: image2.url, title: image2.title || product.name, caption: image2.caption }))
      ])
    })),
    ...publishedBlogs.map((blog) => ({
      path: `/blogs/${blog.slug}`,
      title: blog.title,
      lastmod: blog.updatedAt,
      changefreq: "monthly",
      priority: "0.7",
      images: compactImages(baseUrl, [{ url: blog.featuredImage, title: blog.title, caption: blog.shortDescription }])
    })),
    ...generatedBlogs.map((blog) => ({
      path: `/blogs/${blog.slug}`,
      title: blog.title,
      lastmod: blog.updatedAt,
      changefreq: "monthly",
      priority: "0.6",
      images: compactImages(baseUrl, [{ url: blog.featuredImage, title: blog.title, caption: blog.shortDescription }])
    })),
    ...careerJobs.map((job) => ({
      path: `/career/${job.slug}`,
      title: job.title,
      lastmod: job.updatedAt,
      changefreq: "weekly",
      priority: "0.7"
    }))
  ];
  return entries.map((entry) => ({ ...entry, path: publicPath(entry.path), lastmod: entry.lastmod || today() }));
}
function buildSitemapXml(data, baseUrl) {
  const entries = buildSitemapEntries(data, baseUrl);
  const body = entries.map((entry) => {
    const images = (entry.images || []).map((image2) => [
      "    <image:image>",
      `      <image:loc>${xmlEscape(image2.url)}</image:loc>`,
      `      <image:title>${xmlEscape(image2.title)}</image:title>`,
      image2.caption ? `      <image:caption>${xmlEscape(image2.caption)}</image:caption>` : "",
      "    </image:image>"
    ].filter(Boolean).join("\n")).join("\n");
    return [
      "  <url>",
      `    <loc>${xmlEscape(publicUrl(baseUrl, entry.path))}</loc>`,
      `    <lastmod>${xmlEscape(entry.lastmod || today())}</lastmod>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      images,
      "  </url>"
    ].filter(Boolean).join("\n");
  }).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    body,
    "</urlset>"
  ].join("\n");
}

// server/gauranitaiRoutes.ts
var router = Router();
var rateLimitBuckets = /* @__PURE__ */ new Map();
var adminCollections = [
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
  "adminUsers"
];
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
function rateLimit(label, maxRequests, windowMs) {
  return (req, res, next) => {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ip = forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${label}:${ip}`;
    const now2 = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || bucket.resetAt <= now2) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now2 + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now2) / 1e3));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Too many attempts. Please try again shortly." });
    }
    return next();
  };
}
function requireAdmin(req, res, next) {
  if (req.session?.adminUser) return next();
  return res.status(401).json({ message: "Admin login required" });
}
function requireCustomer(req, res, next) {
  if (req.session?.customer) return next();
  return res.status(401).json({ message: "Customer login required" });
}
function validateEnquiry(body) {
  const errors = [];
  if (!body?.name || String(body.name).trim().length < 2) errors.push("Name is required");
  if (!body?.phone || String(body.phone).trim().length < 7) errors.push("Phone number is required");
  if (!body?.serviceRequired && !body?.productRequired && String(body?.requirementType || "") !== "General") errors.push("Select a service or product requirement");
  return errors;
}
function sanitizeAdminUser(row) {
  const { password: _password, ...safe } = row;
  return safe;
}
function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}
function blogSearchText(row) {
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
    ...Array.isArray(row.tags) ? row.tags : []
  ].join(" ").toLowerCase();
}
function topicSearchText(row) {
  return [row.title, row.category, row.focusKeyword, row.suggestedSlug, row.priority, row.status].join(" ").toLowerCase();
}
function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
function sendCsv(res, filename, headers, rows) {
  const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
}
function parseCsvRows(csv) {
  return csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const values = [];
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
function rowsToObjects(csv) {
  const rows = parseCsvRows(csv);
  const headers = rows[0]?.map((header) => header.trim()) || [];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}
function sanitizeUploadName(fileName) {
  return path2.basename(fileName || "gauranitai-product-image").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}
async function saveDataUrlImage(dataUrl, fileName) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
  if (!match) throw new Error("Upload must be a PNG, JPG, WEBP, or GIF image.");
  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw new Error("Image file is empty.");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Image must be 5MB or smaller.");
  const uploadDirectory = path2.resolve(process.cwd(), "attached_assets", "uploads");
  await fs2.mkdir(uploadDirectory, { recursive: true });
  const safeName = sanitizeUploadName(fileName).replace(/\.[^.]+$/, "");
  const finalName = `${Date.now()}-${safeName || "gauranitai-product-image"}.${extension}`;
  await fs2.writeFile(path2.join(uploadDirectory, finalName), buffer);
  return `/assets/uploads/${finalName}`;
}
async function saveDataUrlResume(dataUrl, fileName) {
  const match = dataUrl.match(/^data:(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,(.+)$/i);
  if (!match) throw new Error("Resume must be PDF, DOC, or DOCX.");
  const extensionMap = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
  };
  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) throw new Error("Resume file is empty.");
  if (buffer.length > 2 * 1024 * 1024) throw new Error("Resume must be 2MB or smaller.");
  const uploadDirectory = path2.resolve(process.cwd(), "attached_assets", "uploads", "resumes");
  await fs2.mkdir(uploadDirectory, { recursive: true });
  const safeName = sanitizeUploadName(fileName).replace(/\.[^.]+$/, "");
  const finalName = `${Date.now()}-${safeName || "resume"}.${extensionMap[mimeType] || "pdf"}`;
  await fs2.writeFile(path2.join(uploadDirectory, finalName), buffer);
  return `/assets/uploads/resumes/${finalName}`;
}
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Gauranitai API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
router.post("/admin/login", rateLimit("admin-login", 10, 15 * 60 * 1e3), async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await gauranitaiStore.findAdmin(String(email || ""), String(password || ""));
    if (!user) return res.status(401).json({ message: "Invalid admin credentials" });
    req.session.adminUser = sanitizeAdminUser(user);
    res.json({ user: sanitizeAdminUser(user) });
  } catch (error) {
    next(error);
  }
});
router.post("/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});
router.get("/admin/me", (req, res) => {
  res.json({ user: req.session?.adminUser || null });
});
router.post("/customer/login", rateLimit("customer-login", 20, 15 * 60 * 1e3), async (req, res, next) => {
  try {
    const customer = await gauranitaiStore.customerLogin(req.body || {});
    req.session.customer = customer;
    res.json({ customer });
  } catch (error) {
    res.status(400).json({ message: error.message || "Customer login failed" });
  }
});
router.post("/customer/logout", requireCustomer, async (req, res, next) => {
  try {
    await gauranitaiStore.customerLogout(req.session.customer);
    delete req.session.customer;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
router.get("/customer/me", async (req, res) => {
  const customer = req.session?.customer || null;
  if (!customer) return res.json({ customer: null });
  try {
    await gauranitaiStore.ensureCustomerAllowed(customer);
    return res.json({ customer });
  } catch (error) {
    delete req.session.customer;
    return res.status(403).json({ customer: null, message: error.message || "Customer account is blocked" });
  }
});
router.get("/customer/orders", requireCustomer, async (req, res, next) => {
  try {
    res.json(await gauranitaiStore.customerOrders(req.session.customer));
  } catch (error) {
    next(error);
  }
});
router.get("/customer/chat/thread", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread(req.session.customer);
    await gauranitaiStore.markChatRead(thread.id, "user");
    res.json(thread);
  } catch (error) {
    next(error);
  }
});
router.get("/customer/chat/messages", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread(req.session.customer);
    await gauranitaiStore.markChatRead(thread.id, "user");
    res.json(await gauranitaiStore.chatMessages(thread.id));
  } catch (error) {
    next(error);
  }
});
router.post("/customer/chat/messages", requireCustomer, async (req, res, next) => {
  try {
    const thread = await gauranitaiStore.getOrCreateChatThread(req.session.customer);
    const result = await gauranitaiStore.addChatMessage(thread.id, "user", req.session.customer.name || "Customer", String(req.body?.message || ""));
    res.status(201).json(result);
  } catch (error) {
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
    const result = await gauranitaiStore.addChatMessage(id, "admin", req.session.adminUser?.name || "Admin", String(req.body?.message || ""));
    res.status(201).json(result);
  } catch (error) {
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
      videos: data.videos.filter((row) => row.isActive)
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
    const categoryMatches = (row) => category === "All" || !category || row.category === category;
    const queryMatches = (text) => !query || text.includes(query);
    const blogs = data.blogs.filter((row) => row.status === "published").filter((row) => categoryMatches(row) && queryMatches(blogSearchText(row)));
    const topics = data.blogTopics.filter((row) => categoryMatches(row) && queryMatches(topicSearchText(row)));
    const generated = searchGeneratedSeoBlogs({ q: req.query.q, category, limit: req.query.limit || 60, offset: req.query.offset || 0 });
    res.json({
      query,
      category,
      counts: {
        blogs: blogs.length,
        topics: topics.length,
        generatedBlogs: generated.total,
        total: blogs.length + topics.length + generated.total
      },
      blogs,
      topics,
      generatedBlogs: generated.blogs,
      generatedCategories: generated.categories
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
    const rows = (await gauranitaiStore.list("careerJobs")).filter((job) => job.isActive && job.status === "Open").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
router.post("/career-applications", rateLimit("career-application", 8, 10 * 60 * 1e3), async (req, res) => {
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
    const job = jobSlug ? await gauranitaiStore.getBySlug("careerJobs", jobSlug) : void 0;
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
      adminNotes: ""
    });
    res.status(201).json(application);
  } catch (error) {
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
router.post("/reviews", rateLimit("reviews", 10, 10 * 60 * 1e3), async (req, res) => {
  try {
    const reviewText = String(req.body?.review || "").trim();
    if (reviewText.length < 5) return res.status(400).json({ message: "Review text is required" });
    const review = await gauranitaiStore.createProductReview(req.body);
    res.status(201).json(review);
  } catch (error) {
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
router.post("/enquiries", rateLimit("enquiries", 12, 10 * 60 * 1e3), async (req, res, next) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const enquiry = await gauranitaiStore.createEnquiry(req.body);
    res.status(201).json(enquiry);
  } catch (error) {
    next(error);
  }
});
router.post("/leads", rateLimit("leads", 12, 10 * 60 * 1e3), async (req, res, next) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });
    const lead = await gauranitaiStore.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});
router.post("/checkout/summary", rateLimit("checkout-summary", 60, 10 * 60 * 1e3), async (req, res, next) => {
  try {
    res.json(await gauranitaiStore.checkoutSummary(req.body));
  } catch (error) {
    next(error);
  }
});
router.post("/orders", requireCustomer, rateLimit("orders", 10, 10 * 60 * 1e3), async (req, res, next) => {
  try {
    const order = await gauranitaiStore.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
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
      createdAt: order.createdAt
    });
  } catch (error) {
    next(error);
  }
});
router.post("/orders/lookup", rateLimit("order-lookup", 30, 10 * 60 * 1e3), async (req, res, next) => {
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
  const titles = {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refund: "Return / Refund Policy",
    shipping: "Shipping Policy"
  };
  const title = titles[req.params.type] || "Policy";
  res.json({
    title,
    content: `${title} for Gauranitai. This page explains customer information, orders, service bookings, payments, shipping, and support policies for cleaning products and marble polishing services.`
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
  } catch (error) {
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
        product.createdAt
      ])
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
    [["Example Floor Cleaner 1L", "Floor Cleaner", "EXAMPLE-FLOOR-1L", 249, 199, 18, 50, "1L", "1L", 100, "Short product description", "SEO title", "SEO description"]]
  );
});
router.post("/admin/products/import.csv", requireAdmin, async (req, res, next) => {
  try {
    const csv = String(req.body?.csv || "");
    const rows = rowsToObjects(csv);
    const errors = [];
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
        isActive: true
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
        order.createdAt
      ])
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
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.requirementType, row.productRequired, row.serviceRequired, row.status, row.priority, row.followUpDate, row.assignedTo, row.source])
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
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.serviceRequired, row.floorType, row.approxAreaSqFt, row.preferredDate, row.preferredTime, row.status, row.priority, row.address])
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
      rows.map((row) => [row.leadNumber, row.name, row.phone, row.email, row.productRequired, row.status, row.priority, row.followUpDate, row.address, row.message])
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
      rows.map((row) => [row.orderNumber, row.productName, row.customerName, row.phone, row.email, row.rating, row.review, row.status, row.adminNotes, row.createdAt])
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
      customers.map((row) => [row.customerName, row.phone, row.email, row.isLoggedIn ? "Logged in" : "Logged out", row.isBlocked ? "Blocked" : "Active", row.orderCount, row.totalSpend, row.averageOrderValue, row.lastOrderDate, row.lastOrderNumber, row.lastOrderStatus, row.city, row.state, row.adminNotes])
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
      `Date: ${order.createdAt}`
    ].join("\n"));
  } catch (error) {
    next(error);
  }
});
var gauranitaiRoutes_default = router;

// server/gauranitaiSocket.ts
function registerGauranitaiSocket(io) {
  io.on("connection", (socket) => {
    const session2 = socket.request.session;
    socket.on("customer:join", async (_payload, ack) => {
      try {
        if (!session2?.customer) throw new Error("Customer login required");
        const thread = await gauranitaiStore.getOrCreateChatThread(session2.customer);
        const updatedThread = await gauranitaiStore.markChatRead(thread.id, "user") || thread;
        socket.join(`chat-${thread.id}`);
        io.to("admin-chat").emit("chat:thread", updatedThread);
        ack?.({ thread: updatedThread, messages: await gauranitaiStore.chatMessages(thread.id) });
      } catch (error) {
        ack?.({ error: error.message || "Could not join customer chat" });
      }
    });
    socket.on("admin:join", async (_payload, ack) => {
      try {
        if (!session2?.adminUser) throw new Error("Admin login required");
        socket.join("admin-chat");
        ack?.({ threads: await gauranitaiStore.listChatThreads() });
      } catch (error) {
        ack?.({ error: error.message || "Could not join admin chat" });
      }
    });
    socket.on("chat:join-thread", async (payload, ack) => {
      try {
        if (!session2?.adminUser) throw new Error("Admin login required");
        const threadId = Number(payload?.threadId);
        const thread = await gauranitaiStore.getChatThread(threadId);
        if (!thread) throw new Error("Chat thread not found");
        const updatedThread = await gauranitaiStore.markChatRead(threadId, "admin") || thread;
        socket.join(`chat-${threadId}`);
        io.to("admin-chat").emit("chat:thread", updatedThread);
        ack?.({ thread: updatedThread, messages: await gauranitaiStore.chatMessages(threadId) });
      } catch (error) {
        ack?.({ error: error.message || "Could not open chat thread" });
      }
    });
    socket.on("chat:send", async (payload, ack) => {
      try {
        const text = String(payload?.message || "");
        let threadId = Number(payload?.threadId);
        let result;
        if (session2?.adminUser) {
          if (!threadId) throw new Error("Chat thread is required");
          result = await gauranitaiStore.addChatMessage(threadId, "admin", session2.adminUser.name || "Admin", text);
        } else if (session2?.customer) {
          const thread = await gauranitaiStore.getOrCreateChatThread(session2.customer);
          threadId = thread.id;
          socket.join(`chat-${threadId}`);
          result = await gauranitaiStore.addChatMessage(threadId, "user", session2.customer.name || "Customer", text);
        } else {
          throw new Error("Login required");
        }
        io.to(`chat-${threadId}`).emit("chat:message", result.message);
        io.to(`chat-${threadId}`).emit("chat:thread", result.thread);
        io.to("admin-chat").emit("chat:thread", result.thread);
        ack?.(result);
      } catch (error) {
        ack?.({ error: error.message || "Could not send message" });
      }
    });
  });
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path4.sep}assets${path4.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
var isProduction = process.env.NODE_ENV === "production";
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' ws: wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});
var sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "gauranitai-local-session-secret",
  resave: false,
  saveUninitialized: false,
  name: "gauranitai.sid",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1e3 * 60 * 60 * 8
  }
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use(sessionMiddleware);
app.use("/assets", express2.static(path5.join(process.cwd(), "attached_assets"), {
  maxAge: isProduction ? "30d" : "1h",
  immutable: isProduction
}));
app.get("/robots.txt", async (req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("text/plain").send(buildRobotsTxt(data, publicBaseUrlFromRequest(req)));
  } catch (error) {
    next(error);
  }
});
app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const data = await gauranitaiStore.read();
    res.type("application/xml").send(buildSitemapXml(data, publicBaseUrlFromRequest(req)));
  } catch (error) {
    next(error);
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  let captured;
  res.json = function json(body) {
    captured = body;
    return originalJson.call(this, body);
  };
  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const duration = Date.now() - start;
    const suffix = captured ? ` :: ${JSON.stringify(captured).slice(0, 120)}` : "";
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms${suffix}`);
  });
  next();
});
app.use("/api", gauranitaiRoutes_default);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});
(async () => {
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true }
  });
  io.engine.use(sessionMiddleware);
  registerGauranitaiSocket(io);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT || 5e3);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`Gauranitai full-stack app serving on port ${port}`);
  });
})();
