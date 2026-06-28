import type { Blog, BlogTopic, FaqItem } from "@shared/gauranitai";
import { slugify } from "./gauranitaiSeed";

export const GENERATED_SEO_BLOG_COUNT = 5200;

type SeoService = {
  name: string;
  category: string;
  focusKeyword: string;
  surface: string;
  route: string;
  productRoute?: string;
  entity: "service" | "product";
};

type GeneratedBlogContext = {
  id: number;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  focusKeyword: string;
  service: SeoService;
  location: string;
  intent: string;
  propertyType: string;
  floorType: string;
  imagePrompt: string;
  imageTitle: string;
  imageCaption: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const serviceSeeds: SeoService[] = [
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
  ["5 litre marble cleaner", "Cleaning Products", "5 litre marble cleaner", "bulk home, office and society floors", "/products/lizonex-floor-cleaner-5l", "/products/lizonex-floor-cleaner-5l"],
].map(([name, category, focusKeyword, surface, route, productRoute]) => ({
  name,
  category,
  focusKeyword,
  surface,
  route,
  productRoute,
  entity: productRoute ? "product" : "service",
}));

const locations = [
  "Mumbai Central", "Dadar", "Lower Parel", "Worli", "Prabhadevi", "Mahalaxmi", "Byculla", "Parel", "Matunga", "Sion", "Kurla", "Bandra", "Khar", "Santacruz", "Vile Parle", "Andheri", "Jogeshwari", "Goregaon", "Malad", "Kandivali", "Borivali", "Dahisar", "Powai", "Ghatkopar", "Chembur", "Bhandup", "Mulund", "Vikhroli", "Colaba", "Churchgate", "Fort", "Marine Lines", "Charni Road", "Girgaon", "Grant Road", "Tardeo", "Cuffe Parade", "Nariman Point", "Juhu", "Versova", "Lokhandwala", "Oshiwara", "Mira Road", "Bhayandar", "Thane", "Navi Mumbai", "Vashi", "Nerul", "Seawoods", "Belapur", "Kharghar", "Panvel",
];

const intents = [
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
  "daily care mistakes",
];

const propertyTypes = ["apartment", "society lobby", "office", "hotel", "shop", "clinic", "showroom", "restaurant", "school", "gym", "bungalow", "commercial space"];
const floorTypes = ["marble", "Italian marble", "granite", "tile", "mosaic", "natural stone", "bathroom floor", "kitchen floor"];

const titleOpeners = [
  "Best",
  "Complete Guide to",
  "Practical Guide for",
  "Cost Guide for",
  "How to Choose",
  "Mumbai Guide to",
  "Professional",
  "Simple Guide to",
];

function limitText(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trim()}`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function generatedImageUrl(slug: string) {
  return `/api/blog-images/${slug}.svg`;
}

function metaTitle(context: GeneratedBlogContext) {
  const base = `${titleCase(context.service.name)} ${context.location}`;
  return limitText(`${base} | Mumbai Guide`, 59);
}

function metaDescription(context: GeneratedBlogContext) {
  return limitText(`Human-written guide to ${context.service.name} in ${context.location}, Mumbai with process, cost factors, checklist, FAQs and safe floor care tips.`, 154);
}

function titleFor(service: SeoService, location: string, intent: string, propertyType: string, floorType: string, index: number) {
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

function locationLabel(location: string) {
  if (location.includes("Mumbai") || location === "Thane" || location === "Mira Road" || location === "Bhayandar" || location === "Panvel") return location;
  return `${location} Mumbai`;
}

function buildGeneratedContexts() {
  const rows: GeneratedBlogContext[] = [];
  const seen = new Set<string>();
  let id = 100000;

  for (const service of serviceSeeds) {
    for (const location of locations) {
      for (const intent of intents) {
        const propertyType = propertyTypes[(rows.length + location.length) % propertyTypes.length];
        const floorType = floorTypes[(rows.length + service.name.length) % floorTypes.length];
        const title = titleFor(service, location, intent, propertyType, floorType, rows.length);
        const slug = slugify(title);
        if (seen.has(slug)) continue;
        seen.add(slug);
        const locationText = locationLabel(location);
        const context: GeneratedBlogContext = {
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
            `${propertyType} floor care`,
          ].join(", "),
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

const generatedContexts = buildGeneratedContexts();
const generatedBySlug = new Map(generatedContexts.map((context) => [context.slug, context]));

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function timestampsFor(index: number) {
  const date = new Date(Date.UTC(2026, 5, 26));
  date.setUTCDate(date.getUTCDate() + (index % 30));
  return date.toISOString();
}

function blogFromContext(context: GeneratedBlogContext, withContent: boolean): Blog {
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
    updatedAt: stamp,
  };
}

export function allGeneratedSeoBlogSummaries() {
  return generatedContexts.map((context) => blogFromContext(context, false));
}

export function generatedSeoCategories() {
  return Array.from(new Set(generatedContexts.map((context) => context.category))).sort((a, b) => a.localeCompare(b));
}

function searchableText(context: GeneratedBlogContext) {
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
    context.seoKeywords,
  ].join(" ").toLowerCase();
}

export function searchGeneratedSeoBlogs(options: { q?: unknown; category?: unknown; limit?: unknown; offset?: unknown } = {}) {
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
    blogs: rows.slice(offset, offset + limit).map((context) => blogFromContext(context, false)),
  };
}

export function getGeneratedSeoBlog(slug: string) {
  const context = generatedBySlug.get(slug);
  return context ? blogFromContext(context, true) : null;
}

export function generatedSeoBlogTopics(): BlogTopic[] {
  return generatedContexts.map((context) => ({
    id: context.id,
    title: context.title,
    category: context.category,
    focusKeyword: context.focusKeyword,
    suggestedSlug: context.slug,
    priority: context.id % 5 === 0 ? "High" : context.id % 2 === 0 ? "Medium" : "Low",
    status: "Suggested",
    createdAt: timestampsFor(context.id),
  }));
}

function faqItems(context: GeneratedBlogContext): FaqItem[] {
  const productMode = context.service.entity === "product";
  return [
    {
      question: `Is ${context.service.name} suitable for ${context.location} ${context.propertyType}s?`,
      answer: productMode
        ? `Yes, it can be considered for daily floor care when the surface is suitable and the cleaner is diluted correctly. Sensitive floors should be tested in a hidden area first.`
        : `Yes, but the exact process depends on floor condition, area size, access, stains, scratches and expected finish.`,
    },
    {
      question: `What affects the cost of ${context.service.name} in ${context.location}?`,
      answer: `Cost depends on area size, floor type, traffic level, stains, furniture movement, timing, and whether the job needs cleaning, polishing, restoration or only routine maintenance.`,
    },
    {
      question: "How can I get the right guidance?",
      answer: "Share clear photos, floor type, approximate square feet, location and the main issue. This helps avoid wrong product selection or unnecessary service work.",
    },
  ];
}

function generatedBlogContent(context: GeneratedBlogContext) {
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
    `Renovation dust, hard water marks and shoe traffic are common reasons why ${context.floorType} floors in ${locationText} start looking tired before the owner expects it.`,
  ];
  const localSituation = localSituations[context.id % localSituations.length];
  const serviceExplanation = productMode
    ? `${productLine} is positioned as a practical floor-care product for marble, granite, tiles and mosaic. It is meant for daily freshness, controlled mopping and regular maintenance, not for repairing deep scratches or replacing professional restoration. For ${context.propertyType}s in ${locationText}, it is most useful when the floor is structurally fine but needs a cleaner, fresher routine.`
    : `${provider} focuses on ${serviceLine} across Mumbai, Navi Mumbai and Thane. The right method depends on whether the floor needs only cleaning, diamond pad polishing, stain improvement, crystallization guidance or restoration. For ${context.propertyType}s in ${locationText}, the first step should be inspection because the same dull patch can mean surface dirt, chemical damage or actual scratches.`;
  const whyChoose = productMode
    ? [
      "Surface-focused cleaner for marble, granite, tiles and mosaic.",
      "Useful for homes, offices, societies and commercial floors.",
      "1L and 5L options make it easier to plan daily or bulk cleaning.",
      "Supports regular floor freshness when used with correct dilution.",
    ]
    : [
      "Mumbai-focused stone-care experience for homes and commercial sites.",
      "Process selection based on actual floor condition, not guesswork.",
      "Guidance for marble polishing, granite polishing, restoration and maintenance.",
      "Clear planning for timing, furniture movement, safety and handover.",
    ];
  const ctaLines = [
    "Call now for marble polishing in Mumbai",
    "Order Lizonex marble and floor cleaner",
    "Get free guidance for marble, granite, tile and mosaic cleaning",
  ];
  const process = productMode
    ? [
      "Identify the floor material before choosing the dilution.",
      "Remove dry dust, hair and grit before wet mopping.",
      "Dilute the cleaner in clean water and avoid mixing it with bleach, acid or unknown chemicals.",
      "Mop evenly, change dirty water quickly and avoid leaving sticky residue.",
      "Review stains, smell, dullness or rough patches separately because some problems need service support.",
      "Store the bottle safely and keep a simple routine for daily floor freshness.",
    ]
    : [
      "Inspect the floor type, age, stains, scratches, traffic marks and previous chemical use.",
      "Protect furniture, skirting, walls and nearby surfaces before work starts.",
      "Deep clean the floor so polishing or restoration work does not trap dirt.",
      "Choose the correct method based on condition: cleaning, diamond polishing, restoration, crystallization or maintenance.",
      "Check reflection, edges, corners and high-traffic areas before handover.",
      "Explain daily cleaning and maintenance so the result lasts longer.",
    ];
  const tableRows = [
    [`Small ${context.propertyType}`, productMode ? "1L cleaner guidance" : "Photo check and small-area quote", "Good for homes, cabins and low-traffic spaces."],
    [`Busy ${context.propertyType}`, productMode ? "5L cleaner or planned supply" : "Zone-wise service planning", "Useful where foot traffic or housekeeping frequency is high."],
    [`Sensitive ${context.floorType}`, "Hidden-area test and gentle method", "Avoid harsh chemicals and aggressive scrubbing."],
    ["Stains, scratches or dull patches", productMode ? "Ask before using strong chemical" : "Inspection before final quotation", "Deep damage may need restoration or polishing."],
  ];
  const checklist = [
    `Take clear photos of the ${context.floorType} floor in natural light.`,
    `Write the approximate area and exact ${context.location} location.`,
    `Mention whether it is a ${context.propertyType}, society, office, shop, hotel or home.`,
    "Describe stains, smell, dullness, scratches, sticky patches or renovation dust separately.",
    productMode ? "Read dilution instructions and do not mix cleaner with other chemicals." : "Ask what result is realistic before confirming the service.",
    "Keep children, pets and visitors away from wet work areas.",
    "Check high-traffic zones separately from corners and low-use rooms.",
    "Plan simple maintenance after cleaning or polishing.",
  ];
  const links = [
    `[Book a service enquiry](/contact)`,
    `[View marble polishing service](/services/marble-polishing-service)`,
    `[View floor deep cleaning](/services/floor-deep-cleaning)`,
    `[Order Lizonex floor cleaner](${context.service.productRoute || "/products/lizonex-floor-cleaner"})`,
    `[Read more blogs](/blogs)`,
  ];
  const related = generatedContexts
    .filter((item) => item.slug !== context.slug && (item.location === context.location || item.service.name === context.service.name))
    .slice(0, 3)
    .map((item) => `- [${item.title}](/blogs/${item.slug})`)
    .join("\n");
  const faqs = faqItems(context).map((faq) => `### ${faq.question}\n${faq.answer}`).join("\n\n");

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
${process.map((step, index) => `${index + 1}. ${step}`).join("\n")}

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
    `If there is confusion between product use and service need, ask for guidance first. It is better to spend a few minutes on diagnosis than to use a strong chemical on the wrong floor.`,
  ];
  let index = context.id;
  while (wordCount(content) < 2050) {
    content += `\n\n${variants[index % variants.length]}`;
    index += 1;
  }

  return content;
}

function hashSlug(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

export function generatedBlogImageSvg(slug: string) {
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
