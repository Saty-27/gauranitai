# Gauranitai Website Conversion Spec

## Current Repo Status

- App stack: Vite + React + Express + Drizzle.
- Current repo path: `/Users/satyangupta/Desktop/All Folder/Divine natural Githu/divinenaturalproducts`.
- The conversion is already partially started: `shared/schema.ts` now contains Gauranitai-style `products`, `services`, `blogs`, `blog_topics_suggestions`, `enquiries`, `faqs`, banners, settings, footer, and about/contact tables.
- The app is not yet consistent: backend routes and frontend pages still reference dairy-era tables and flows such as orders, milk subscriptions, vendors, delivery partners, billing, support tickets, offers, video/image gallery, old product fields, and delivery jobs.
- `npm run check` currently fails because the schema no longer exports many legacy tables that the backend still imports.

## Brand Direction

Brand name: Gauranitai

Positioning:
Professional marble polishing, floor cleaning, and stone care solutions for homes, offices, societies, hotels, shops, and commercial spaces.

Logo direction:
Use the new Gauranitai logo as a simple, clean, spiritual-premium symbol. Keep the logo usage subtle and symbolic: lotus, water drop, shine, clean floor, gold/blue energy, and soft spiritual indication. Do not use direct gods, deity illustrations, or human figures in website UI.

Visual style:
- White base
- Deep blue: `#0D3E83`
- Premium gold: `#C9A24A`
- Light grey: `#F6F8FA`
- Soft marble texture backgrounds
- Subtle green accent only for cleanliness/safety notes
- Fonts: Inter or Manrope for body, Poppins/DM Sans for UI, Playfair Display/Cormorant/Cinzel for premium headings

## Updated Homepage Content

Hero headline:
Professional Marble Polishing & Floor Cleaning Services

Hero subheadline:
Restore shine, remove dullness, and keep your floors fresh with expert marble polishing, floor cleaning, and stone care solutions.

Hero CTAs:
- Book Service
- View Products
- WhatsApp Now
- Call Now

Trust line:
For homes, offices, societies, hotels, shops, and commercial spaces.

Homepage sections:
1. Hero with marble/floor-care service image, logo, CTAs, WhatsApp/call actions
2. About Gauranitai: clean brand introduction with service promise
3. Our Services: cards for polishing, restoration, crystallization, deep cleaning, tile/mosaic cleaning, commercial/residential cleaning
4. Our Cleaning Products: floor cleaner, marble cleaner, granite cleaner, tile/mosaic cleaner, heavy-duty cleaner
5. Why Choose Us: trained team, proper tools, marble-safe methods, reliable response, premium finish, clear pricing
6. Before & After Results: slider/gallery for dull-to-shiny floor transformations
7. Our Process: inspection, area protection, cleaning, polishing/treatment, final shine check, maintenance guidance
8. Service Areas: homes, offices, societies, hotels, shops, showrooms, commercial spaces
9. Testimonials: customer name, rating, service used, review
10. FAQ: service, product, safety, booking, maintenance questions
11. Latest Blogs: SEO blog cards
12. Contact Form: name, phone, service/product, address, message
13. WhatsApp floating button and sticky mobile call button

## About Page Content

Gauranitai provides professional marble polishing, floor cleaning, stone care, and cleaning product solutions for homes, offices, societies, hotels, shops, and commercial spaces. Our goal is to restore shine, improve cleanliness, and maintain the beauty of floors using proper methods, tools, and quality products.

We help customers bring dull, stained, scratched, and tired-looking floors back to a clean and premium finish. Our team focuses on practical inspection, correct surface treatment, marble-safe cleaning, and long-term maintenance guidance. Whether the requirement is diamond marble polishing, Italian marble polishing, granite polishing, tile cleaning, mosaic floor cleaning, or regular floor maintenance, Gauranitai keeps the process simple, reliable, and service-focused.

Core values:
- Clean finish
- Proper method
- Honest service
- Surface-safe products
- Timely support
- Long-term floor care

## Services List

1. Marble Polishing Service
   Professional marble polishing service to restore shine, remove dullness, and improve the appearance of marble floors.

2. Diamond Marble Polishing
   Advanced polishing method for marble floors to achieve a smooth, glossy, and premium finish.

3. Italian Marble Polishing
   Specialized polishing service for Italian marble surfaces to maintain natural shine and elegance.

4. Granite Polishing
   Professional granite polishing to restore surface shine and improve long-term appearance.

5. Stone Polishing
   Stone polishing service for marble, granite, and natural stone surfaces.

6. Marble Restoration
   Restoration service for dull, scratched, stained, or damaged marble floors.

7. Marble Crystallization
   Crystallization treatment to enhance marble shine and surface protection.

8. Floor Deep Cleaning
   Deep cleaning service for residential and commercial floors to remove dirt, stains, and dullness.

9. Tile Cleaning
   Tile floor cleaning service for homes, offices, bathrooms, and commercial areas.

10. Mosaic Floor Cleaning
    Professional mosaic floor cleaning to remove dirt and restore freshness.

11. Commercial Floor Cleaning
    Floor cleaning services for offices, hotels, shops, societies, and commercial properties.

12. Residential Floor Cleaning
    Home floor cleaning services for marble, tile, granite, mosaic, and regular flooring.

Additional homepage/service category cards:
- Bathroom Floor Cleaning
- Society Floor Cleaning
- Office Floor Cleaning
- Hotel Floor Cleaning
- Floor Maintenance Service

## Product Categories

- Floor Cleaner
- Marble Cleaner
- Granite Cleaner
- Tile Cleaner
- Mosaic Cleaner
- Bathroom Cleaner
- Multi-Surface Cleaner
- Stone Care Products
- Marble Polish Products
- Floor Shine Products

## Updated Product List

1. Gauranitai Floor Cleaner 1L
   Category: Floor Cleaner
   SKU: CLEAN-FLOOR-1L
   Price: Rs. 199
   Unit: 1L
   Stock: 100
   Description: Powerful floor cleaner suitable for daily cleaning of marble, granite, tiles, mosaic, and common floor surfaces. Helps remove dirt, stains, and bad odour while leaving a fresh clean feel.

2. Gauranitai Floor Cleaner 5L
   Category: Floor Cleaner
   SKU: CLEAN-FLOOR-5L
   Price: Rs. 799
   Unit: 5L
   Stock: 50
   Description: Value pack floor cleaner for homes, offices, societies, shops, and commercial spaces. Suitable for regular floor cleaning and freshness.

3. Marble Cleaner 1L
   Category: Marble Cleaner
   SKU: MARBLE-CLN-1L
   Price: Rs. 249
   Unit: 1L
   Stock: 100
   Description: Special cleaner for marble floors and surfaces. Helps clean dust, stains, and dullness without damaging the surface.

4. Granite Cleaner 1L
   Category: Granite Cleaner
   SKU: GRANITE-CLN-1L
   Price: Rs. 249
   Unit: 1L
   Stock: 100
   Description: Granite cleaner for daily cleaning and shine maintenance. Suitable for kitchen counters, granite floors, and commercial surfaces.

5. Tile & Mosaic Cleaner 1L
   Category: Tile Cleaner
   SKU: TILE-MOS-1L
   Price: Rs. 199
   Unit: 1L
   Stock: 100
   Description: Effective cleaner for tiles and mosaic floors. Helps remove dirt, stains, and dullness from daily-use floors.

6. Heavy Duty Floor Cleaner 5L
   Category: Industrial Cleaner
   SKU: HEAVY-FLOOR-5L
   Price: Rs. 899
   Unit: 5L
   Stock: 40
   Description: Heavy-duty cleaner for offices, shops, factories, societies, and high-traffic commercial areas.

Product detail page fields:
Product name, product image, category, SKU, price, unit, stock, description, benefits, how to use, suitable surfaces, safety instructions, enquiry button, WhatsApp button.

## Admin Panel Structure

Keep:
- Dashboard
- Services Management
- Product Management
- Product Categories
- Service Categories
- Enquiries / Bookings
- Blog Management
- Blog Topic Suggestions
- Banner Management
- Testimonials
- FAQ Management
- Pages / CMS
- Contact Settings
- Brand Identity
- User/Admin Management
- Media Uploads

Remove or hide from navigation and routes:
- Milk subscriptions
- Dairy delivery routing
- Vendors/sub-vendors
- Delivery partners/drivers
- Dairy billing
- Dairy order workflow
- Dairy stock/circulation reports
- Dairy customer app pages
- Old festivals/wellness/offers pages if still dairy-specific

Dashboard cards:
- Total services
- Total products
- Total enquiries
- Total bookings
- Total blogs
- Latest enquiries
- Latest service requests
- Product stock overview

Services management fields:
Title, slug, category, image, short description, full description, benefits, process steps, suitable for, FAQ, SEO title, SEO description, SEO keywords, active/inactive status.

Product management fields:
Name, slug, category, SKU, price, unit, stock, images, short description, full description, benefits, usage instructions, suitable surfaces, safety instructions, SEO title, SEO description, SEO keywords, active/inactive status.

Booking/enquiry fields:
Customer name, phone, email, service required, product required, address, message, status, admin notes.

Blog fields:
Title, slug, category, image, short description, content, author, tags, meta title, meta description, keywords, publish/draft status.

Contact settings:
Company name, phone, WhatsApp number, email, address, Google Map link, Instagram, Facebook, YouTube, LinkedIn.

## Database Schema

Use the new core tables already present in `shared/schema.ts` as the base:

`products`
- name
- slug
- category
- sku
- price
- unit
- stock
- shortDescription
- fullDescription
- benefits
- usageInstructions
- suitableSurfaces
- safetyInstructions
- images
- seoTitle
- seoDescription
- seoKeywords
- status
- createdAt
- updatedAt

`services`
- title
- slug
- category
- shortDescription
- fullDescription
- benefits
- processSteps
- suitableFor
- image
- faqs
- seoTitle
- seoDescription
- seoKeywords
- status
- createdAt
- updatedAt

`blogs`
- title
- slug
- category
- image
- shortDescription
- content
- author
- tags
- seoTitle
- seoDescription
- seoKeywords
- status
- createdAt
- updatedAt

`enquiries`
- name
- phone
- email
- serviceRequired
- productRequired
- address
- message
- status
- adminNotes
- createdAt
- updatedAt

Add or confirm:
- `testimonials`
- `service_categories`
- `product_categories` or reuse typed `categories`
- `contact_settings.whatsappNumber`
- `settings.googleMapLink`, `instagramLink`, `facebookLink`, `youtubeLink`, `linkedinLink`
- `before_after_results` for gallery/slider

## Frontend Page Structure

Public:
- `/` Home
- `/about`
- `/services`
- `/services/:slug`
- `/products`
- `/products/:slug`
- `/blogs`
- `/blogs/:slug`
- `/contact`
- `/privacy`
- `/terms`

Admin:
- `/admin`
- `/admin/services`
- `/admin/products`
- `/admin/categories`
- `/admin/enquiries`
- `/admin/blogs`
- `/admin/blog-topics`
- `/admin/banners`
- `/admin/testimonials`
- `/admin/faqs`
- `/admin/settings/contact`
- `/admin/brand`

Remove or stop linking:
- `/subscription`
- `/subscription/create`
- `/subscription/history`
- `/delivery/*`
- `/vendor/*`
- `/billing`
- `/orders` unless retained only for product purchase enquiries
- Customer dairy pages under `/customer/milk`, `/customer/subscription`, `/customer/festivals`, `/customer/wellness`, dairy offers

## API Structure

Public APIs:
- `GET /api/services`
- `GET /api/services/:slug`
- `GET /api/service-categories`
- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/product-categories`
- `GET /api/blogs`
- `GET /api/blogs/:slug`
- `GET /api/faqs`
- `GET /api/banners`
- `GET /api/testimonials`
- `GET /api/settings`
- `POST /api/enquiries`

Admin APIs:
- `GET/POST /api/admin/services`
- `GET/PUT/DELETE /api/admin/services/:id`
- `GET/POST /api/admin/products`
- `GET/PUT/DELETE /api/admin/products/:id`
- `GET/POST /api/admin/service-categories`
- `GET/POST /api/admin/product-categories`
- `GET/PUT /api/admin/enquiries`
- `PUT /api/admin/enquiries/:id/status`
- `GET/POST /api/admin/blogs`
- `GET/PUT/DELETE /api/admin/blogs/:id`
- `GET /api/admin/blog-topics`
- `GET/POST/PUT/DELETE /api/admin/banners`
- `GET/POST/PUT/DELETE /api/admin/testimonials`
- `GET/POST/PUT/DELETE /api/admin/faqs`
- `GET/PUT /api/admin/settings/contact`

Retire or remove:
- milk subscription routes
- auto-delivery jobs
- billing routes built around subscriptions
- vendor/delivery routes
- old dairy order/payment screenshot flows unless converted to product enquiry/order flow

## SEO Plan

Every page must include:
- SEO title
- Meta description
- Focus keywords
- Clean slug
- Image alt text
- Local SEO terms
- Schema markup where possible
- Mobile responsive layout
- Fast loading assets

Priority keywords:
- Marble polishing service
- Marble polishing near me
- Floor cleaning service
- Floor cleaning near me
- Marble floor polishing
- Diamond marble polishing
- Italian marble polishing
- Granite polishing service
- Tile cleaning service
- Mosaic floor cleaning
- Floor cleaner
- Marble cleaner
- Granite cleaner
- Tile cleaner
- Marble restoration
- Marble crystallization
- Floor deep cleaning
- Home floor cleaning
- Commercial floor cleaning
- Stone polishing service

Blog categories:
- Marble Polishing
- Floor Cleaning
- Marble Care
- Granite Care
- Tile Cleaning
- Mosaic Cleaning
- Cleaning Products
- Home Cleaning
- Commercial Cleaning
- Floor Maintenance
- Stain Removal
- Polishing Tips
- DIY Floor Care
- Professional Cleaning Services

Seed topic strategy:
Create 350 blog topic suggestions by combining 23 focus keyword groups, 15 title templates, and 13 location/customer-intent modifiers. This is already close to the approach in `server/seed.ts`.

Core keyword groups:
Marble polishing service, floor cleaning service, diamond marble polishing, Italian marble polishing, granite polishing, tile cleaning, mosaic floor cleaning, marble restoration, marble crystallization, marble stain removal, floor cleaner, marble cleaner, granite cleaner, tile cleaner, best floor cleaner for home, floor cleaning near me, marble polishing near me, commercial floor cleaning, society floor cleaning, hotel floor polishing, office floor cleaning, home floor cleaning, stone polishing service.

Title templates:
Best Tips for, How to Find the Best, Step-by-Step Guide for, Why You Need Professional, The Cost of, DIY vs Professional, Common Mistakes in, Secrets to Perfect, Important Benefits of, Ultimate Guide to, How to Restore, Quick Tips for, Essential Maintenance for, Eco-friendly Solutions for, Top Questions About.

Intent modifiers:
in Mumbai, in Navi Mumbai, in Thane, for Luxury Homes, for Large Corporate Offices, for Residential Societies, for Hotels and Showrooms, for Small Shops, for Modern Apartments, on a Budget, Before Festivals, After Home Renovation, to Keep Kids and Pets Safe.

Sample SEO topic list:
1. Best Marble Polishing Service for Homes
2. How to Restore Shine on Marble Floors
3. Diamond Marble Polishing Process Explained
4. Marble Polishing vs Marble Cleaning
5. How Often Should You Polish Marble Floors?
6. Best Floor Cleaner for Marble and Tiles
7. How to Remove Stains from Marble Floors
8. Why Marble Floors Become Dull
9. Italian Marble Polishing Guide
10. Granite Polishing and Maintenance Tips
11. Tile Floor Cleaning Tips for Homes
12. Mosaic Floor Cleaning Guide
13. Best Cleaner for Marble, Granite, Tiles and Mosaic
14. Benefits of Professional Marble Polishing
15. Commercial Floor Cleaning for Offices
16. Society Floor Cleaning Services
17. Hotel Marble Polishing Services
18. Floor Deep Cleaning Before Festivals
19. How to Maintain Marble Shine After Polishing
20. Difference Between Diamond Polishing and Crystallization
21. Marble Polishing Service Near Me: What to Check Before Booking
22. Floor Cleaning Service Near Me for Homes and Offices
23. Best Marble Cleaner for Daily Floor Care
24. Best Granite Cleaner for Kitchen and Floor Surfaces
25. Tile Cleaner for Bathroom and Kitchen Floors
26. Marble Restoration for Scratched Floors
27. Marble Crystallization Benefits for Long-Lasting Shine
28. Diamond Marble Polishing for Premium Homes
29. Italian Marble Polishing for Luxury Apartments
30. Granite Polishing Service for Commercial Spaces
31. Stone Polishing Service for Natural Stone Floors
32. Office Floor Cleaning Checklist
33. Hotel Floor Polishing Maintenance Guide
34. Society Floor Cleaning Service Planning Guide
35. Home Floor Cleaning Tips After Renovation
36. Heavy Duty Floor Cleaner for High-Traffic Areas
37. Safe Marble Cleaning Products for Homes
38. How to Clean Mosaic Floors Without Dullness
39. Floor Maintenance Service for Offices
40. Marble Stain Removal Guide for Coffee, Oil and Rust
41. How to Choose a Marble Polishing Company
42. Marble Floor Polishing Cost Factors
43. Floor Cleaning Before Festivals
44. Marble Care Mistakes to Avoid
45. Granite Care Mistakes to Avoid
46. Tile Cleaning Mistakes to Avoid
47. Deep Cleaning vs Regular Mopping
48. Professional Cleaning Services for Shops
49. Cleaning Products for Marble, Granite and Tiles
50. How to Keep Floors Fresh Every Day

Publishing rhythm:
Publish 8-12 high-quality blogs per month. Keep the 350 topics as admin suggestions, not as published low-quality pages.

## Sample Service Detail Page

Service: Marble Polishing Service

SEO title:
Marble Polishing Service | Restore Marble Floor Shine | Gauranitai

SEO description:
Book professional marble polishing service by Gauranitai. Restore shine, remove dullness, and maintain premium marble floors for homes, offices, societies, hotels, and shops.

Keywords:
marble polishing service, marble polishing near me, marble floor polishing, marble restoration, floor polishing service

Short description:
Professional marble polishing service to restore shine, remove dullness, and improve the appearance of marble floors.

Full content:
Marble floors can lose their shine because of daily foot traffic, dust, stains, wrong cleaning chemicals, scratches, and moisture. Gauranitai provides professional marble polishing service using proper inspection, surface preparation, polishing methods, and finishing care. The service helps restore natural shine and gives the floor a cleaner, fresher, and more premium appearance.

Benefits:
- Restores dull marble shine
- Improves floor appearance
- Helps reduce visible scratches and stains
- Suitable for homes and commercial spaces
- Uses proper tools and surface-safe methods
- Gives maintenance guidance after service

Process:
1. Floor inspection
2. Dust and dirt removal
3. Stain and dullness assessment
4. Polishing or diamond polishing treatment
5. Shine finishing
6. Final cleaning and care guidance

Suitable for:
Homes, offices, societies, hotels, shops, showrooms, lobbies, corridors, marble floors, marble staircases, and marble surfaces.

FAQs:
- How long does marble polishing take? It depends on floor area and condition.
- Can polishing remove all scratches? Light scratches usually improve; deep damage may need restoration.
- Is it safe for Italian marble? Yes, with the correct method and product selection.
- How often should marble be polished? Usually every 1-3 years depending on use.

CTA:
Book Marble Polishing Service / WhatsApp Now

## Sample Product Detail Page

Product: Gauranitai Floor Cleaner 1L

SEO title:
Gauranitai Floor Cleaner 1L | Marble, Granite, Tile & Mosaic Cleaner

SEO description:
Buy or enquire for Gauranitai Floor Cleaner 1L. Suitable for daily cleaning of marble, granite, tiles, mosaic, and common floor surfaces.

Keywords:
floor cleaner, marble cleaner, granite cleaner, tile cleaner, mosaic cleaner, best floor cleaner for home

Description:
Gauranitai Floor Cleaner 1L is a daily-use floor cleaner suitable for marble, granite, tiles, mosaic, and common floor surfaces. It helps remove dirt, stains, and bad odour while leaving a fresh clean feel.

Benefits:
- Suitable for daily floor cleaning
- Works on multiple common floor surfaces
- Helps remove dirt and odour
- Fresh clean feel after mopping
- Good for homes, offices, societies, and shops

How to use:
Mix the recommended quantity in water and mop the floor evenly. For heavy dirt, apply a stronger diluted solution on the affected area, leave briefly, scrub gently, and wipe clean.

Suitable surfaces:
Marble, granite, tile, mosaic, bathroom floor, common floor surfaces, office floor, society floor, shop floor.

Safety:
Keep away from children. Do not mix with other chemicals. Test on a small hidden area before full use. Avoid direct eye contact. Store in a cool and dry place.

CTA:
Enquire Now / WhatsApp Now

## Step-by-Step Implementation Plan

1. Stabilize the repo
   Run `npm run check`, list broken imports, and decide which legacy modules are truly removed versus converted.

2. Freeze legacy dairy flows
   Remove route registration for milk subscriptions, delivery jobs, vendor routes, billing routes, dairy orders, and old support/offers modules unless they are intentionally reused.

3. Clean schema/backend agreement
   Update `shared/schema.ts`, `server/storage.ts`, and route imports so all exported tables match real active features.

4. Create service/product/enquiry APIs
   Add dedicated route files for services, products, categories, enquiries, testimonials, FAQs, banners, blogs, and settings.

5. Replace frontend public routes
   Rebuild home, about, services, service detail, products, product detail, blog, blog detail, and contact pages around Gauranitai content.

6. Replace admin navigation
   Update `client/src/components/layout/admin-layout.tsx` to show only Gauranitai modules: dashboard, services, products, enquiries, blogs, banners, testimonials, FAQs, settings, brand.

7. Replace admin pages
   Build CRUD pages for services, products, enquiries, blogs, blog topics, testimonials, FAQs, banners, and contact settings.

8. Update seed data
   Seed service categories, product categories, 12 services, 6 products, 350 blog topic suggestions, FAQs, testimonials, banners, contact settings, and site settings.

9. Update visual system
   Replace dairy green visuals with white/deep-blue/gold/light-grey styling, marble textures, clean cards, subtle borders, and premium typography.

10. Add SEO foundations
    Add meta tags per page, clean slug URLs, image alt text, FAQ schema, Product schema, Service schema, LocalBusiness schema, sitemap, and robots rules.

11. Remove leftover dairy text
    Run `rg -i "milk|dairy|curd|paneer|buttermilk|subscription|vendor|delivery"` and clean every visible/frontend/backend/admin reference.

12. Verify
    Run `npm run check`, `npm run build`, smoke-test public pages, admin CRUD, enquiry submission, WhatsApp/call links, and mobile views.

