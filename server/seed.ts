import { db } from "./db";
import { 
  users, 
  products, 
  services,
  blogs,
  blogTopicsSuggestions,
  banners, 
  faqs, 
  newsletterSettings, 
  footerSettings,
  aboutUsSettings,
  contactSettings,
  siteSettings
} from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function seedDatabase() {
  try {
    console.log("Seeding database for Gauranitai Floor Care & Polishing...");

    // 1. Create Admin & Customer User
    const adminEmail = "md@gauranitai.in";
    const existingUsers = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingUsers.length > 0) {
      console.log("Admin user already exists. Updating Admin details...");
      await db.update(users).set({
        firstName: "Summit",
        lastName: "Shah",
        phone: "1800-GAURA"
      }).where(eq(users.email, adminEmail));
    } else {
      const hashedPassword = await bcrypt.hash("Gauranitai@2026", 10);
      
      // Admin Summit Shah
      await db.insert(users).values({
        id: nanoid(),
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
        firstName: "Summit",
        lastName: "Shah",
        phone: "1800-GAURA"
      });

      // Customer
      await db.insert(users).values({
        id: nanoid(),
        email: "customer@example.com",
        passwordHash: hashedPassword,
        role: "customer",
        firstName: "Ramesh",
        lastName: "Kumar",
        phone: "9876543210",
        address: "Flat 402, Royal Palace, Andheri West, Mumbai"
      });

      console.log("✓ Created Admin & Customer Users");
    }

    // 2. Insert/Update Services (12 Services)
    console.log("Seeding Services...");
    await db.delete(services);
    const baseServices = [
      {
        title: "Marble Polishing Service",
        slug: "marble-polishing-service",
        category: "Marble Polishing",
        shortDescription: "Professional marble polishing service to restore shine, remove dullness, and improve the appearance of marble floors.",
        fullDescription: "Over time, marble floors lose their natural luster due to foot traffic, scratches, and incorrect cleaning agents. Our professional marble polishing service uses state-of-the-art single-disc machines and diamond abrasive pads to gently grind away fine scratches, remove dull layers, and restore the original high-gloss, glass-like finish of your marble floors.",
        benefits: JSON.stringify([
          "Restores original glass-like mirror shine",
          "Removes surface scratches, stains, and dullness",
          "Protects marble from future liquid penetration",
          "Extends the lifespan of the marble flooring"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Deep Cleaning & Preparation", desc: "Vacuuming and washing floor to remove all surface dust and loose debris." },
          { step: 2, title: "Honing / Scratch Removal", desc: "Using lower-grit diamond pads to grind out minor scratches and stains." },
          { step: 3, title: "Polishing", desc: "Gradually increasing diamond pad grit sizes to smooth the stone surface." },
          { step: 4, title: "Buffing & Sealing", desc: "Applying premium polish powder and sealer for final shine and protection." }
        ]),
        suitableFor: "All types of Indian and Italian marble floors.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        faqs: JSON.stringify([
          { q: "How long does marble polishing take?", a: "Normally, a standard living room takes 1-2 days depending on scratches and flooring type." },
          { q: "How long will the shine last?", a: "With proper maintenance and regular cleaning using marble-safe cleaners, the shine can last for 2-3 years." }
        ]),
        seoTitle: "Best Marble Polishing Service in Mumbai | Gauranitai",
        seoDescription: "Professional marble polishing service to restore the natural shine of your marble floors. Call Gauranitai for a free floor inspection today.",
        seoKeywords: "marble polishing service, marble polishing near me, marble floor polishing, restore marble shine",
        status: "active"
      },
      {
        title: "Diamond Marble Polishing",
        slug: "diamond-marble-polishing",
        category: "Marble Polishing",
        shortDescription: "Advanced polishing method for marble floors to achieve a smooth, glossy, and premium finish.",
        fullDescription: "Diamond Marble Polishing is the gold standard in marble restoration. Using industrial diamond grit abrasive disks, we refine the marble surface step-by-step. This process changes the stone surface at a microscopic level, producing a natural, durable glossy shine without relying on temporary wax coats.",
        benefits: JSON.stringify([
          "Ultra-glossy, highly reflective mirror finish",
          "Extremely durable and long-lasting shine",
          "Smoothens uneven marble joints (lippage removal)",
          "Prevents dust accumulation on joints"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Grinding (Lippage Removal)", desc: "Using metal-bond diamonds to flatten uneven stone joints." },
          { step: 2, title: "Honing", desc: "Using resin-bond diamonds (grit 100 to 800) to erase scratches." },
          { step: 3, title: "Polishing", desc: "Using high-grit diamonds (grit 1500 to 3000) for natural reflection." },
          { step: 4, title: "Final Buffing", desc: "Buffing with specialized diamond powder for a spectacular wet look." }
        ]),
        suitableFor: "High-end residential marble, commercial lobbies, and premium offices.",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        faqs: JSON.stringify([
          { q: "Does diamond polishing create a lot of dust?", a: "No, we use wet-grinding systems which catch dust in water slurry, keeping your home clean." }
        ]),
        seoTitle: "Diamond Marble Polishing Service - Mirror Shine Floors",
        seoDescription: "Get premium diamond marble polishing for home and offices. We deliver durable, ultra-glossy finishes using state of the art equipment.",
        seoKeywords: "diamond marble polishing, diamond polishing service, premium marble polish",
        status: "active"
      },
      {
        title: "Italian Marble Polishing",
        slug: "italian-marble-polishing",
        category: "Marble Polishing",
        shortDescription: "Specialized polishing service for Italian marble surfaces to maintain natural shine and elegance.",
        fullDescription: "Italian marble (like Carrara, Botticino, and Statuario) is softer and more porous than regular marble, requiring specialized care. Our Italian Marble Polishing uses gentle, pH-balanced agents and micro-abrasive diamond pads to polish without causing structural micro-cracks or discoloration. We preserve the delicate veins and natural elegance of your imported marble.",
        benefits: JSON.stringify([
          "Customized care for delicate imported marble",
          "Highlights natural veins and artistic patterns",
          "Uses acid-free, non-corrosive polishing products",
          "Deep penetration sealer to prevent wine or coffee stains"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Surface Inspection", desc: "Inspecting veins and detecting cracks to determine safe pressure levels." },
          { step: 2, title: "Gentle Honing", desc: "Removing surface stains using fine diamond grit carefully." },
          { step: 3, title: "Premium Italian Polish", desc: "Applying special European crystallization powders." },
          { step: 4, title: "Hydrophobic Sealing", desc: "Impregnating the marble with stain protective sealers." }
        ]),
        suitableFor: "Italian Marble, imported Onyx, and Travertine flooring.",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        faqs: JSON.stringify([
          { q: "Why does Italian marble need specialized polishing?", a: "Italian marble is highly sensitive to acids and standard harsh abrasives which can permanently damage its texture." }
        ]),
        seoTitle: "Specialist Italian Marble Polishing | Gauranitai Floor Care",
        seoDescription: "Professional Italian marble polishing. Protect and beautify your premium Statuario, Carrara, and Botticino marble floors with expert care.",
        seoKeywords: "italian marble polishing, imported marble polish, statuario marble care",
        status: "active"
      },
      {
        title: "Granite Polishing",
        slug: "granite-polishing",
        category: "Stone Polishing",
        shortDescription: "Professional granite polishing to restore surface shine and improve long-term appearance.",
        fullDescription: "Granite is one of the hardest stones, meaning it is highly resistant to wear but requires immense skill and specialized high-speed machinery to polish. Our Granite Polishing service uses heavy-duty machines and diamond pads designed specifically for hard stones to polish kitchen counters, table tops, and floors to a glossy shine.",
        benefits: JSON.stringify([
          "Restores deep, rich color and reflection to granite",
          "Heat and scratch-resistant sealant application",
          "Easier daily cleaning and maintenance",
          "Prevents watermarks on counters"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Degreasing", desc: "Removing kitchen oil, soap residues, and dirt build-ups." },
          { step: 2, title: "High-pressure Honing", desc: "Grinding the hard granite surface using special copper-bond diamonds." },
          { step: 3, title: "Granite Crystallization", desc: "Using high-speed polishing machines with granite polish paste." },
          { step: 4, title: "Impregnation sealing", desc: "Sealing countertops to make them food-safe and stain-resistant." }
        ]),
        suitableFor: "Granite flooring, kitchen countertops, staircases, and wall cladding.",
        image: "https://images.unsplash.com/photo-1527359395034-a70ab8b41f51?w=800",
        faqs: JSON.stringify([
          { q: "Can scratches be removed from granite?", a: "Yes, deep scratches can be honed out using our professional heavy diamond grinding process." }
        ]),
        seoTitle: "Granite Polishing & Countertop Restoration | Gauranitai",
        seoDescription: "Professional granite polishing services for kitchen counters and floors. Make your granite look brand new with our deep polishing process.",
        seoKeywords: "granite polishing, granite kitchen counter polishing, granite shine restoration",
        status: "active"
      },
      {
        title: "Stone Polishing",
        slug: "stone-polishing",
        category: "Stone Polishing",
        shortDescription: "Stone polishing service for marble, granite, and natural stone surfaces.",
        fullDescription: "We provide comprehensive polishing services for various natural stones, including Kota stone, Jaisalmer stone, Sandstone, Slate, and Terrazzo. Every natural stone has unique mineral structures and hardness levels, and our team adapts techniques and polish products to ensure maximum shine without damage.",
        benefits: JSON.stringify([
          "Tailored polishing methods for Kota, Slate, Terrazzo, etc.",
          "Restores original rustic and earthy look of natural stones",
          "Applies slip-resistant protective coatings",
          "Fills voids and holes with stone-matching resins"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Floor Inspection", desc: "Determining stone type and chemical sensitivity." },
          { step: 2, title: "Scrubbing", desc: "Deep scrubbing to remove old wax layers and grime." },
          { step: 3, title: "Stone Honing", desc: "Fine honing to level joints and smooth surfaces." },
          { step: 4, title: "Stone Sealing & Buffing", desc: "Applying natural stone sealer and buffing for satin or gloss finish." }
        ]),
        suitableFor: "Kota stone, Jaisalmer stone, Terrazzo, Slate, and exterior natural stone paving.",
        image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800",
        faqs: JSON.stringify([
          { q: "Do you polish Kota stone?", a: "Yes, Kota stone is polished using specialized multi-grit stages followed by stone sealer to maintain its unique matte or glossy look." }
        ]),
        seoTitle: "Natural Stone Polishing Service - Kota, Jaisalmer & Terrazzo",
        seoDescription: "Expert natural stone polishing for Kota stone, Jaisalmer, Terrazzo, and Slate floors. Keep your rustic floors shining and stain-resistant.",
        seoKeywords: "stone polishing service, kota stone polishing, terrazzo floor polishing",
        status: "active"
      },
      {
        title: "Marble Restoration",
        slug: "marble-restoration",
        category: "Marble Polishing",
        shortDescription: "Restoration service for dull, scratched, stained, or damaged marble floors.",
        fullDescription: "If your marble is severely cracked, has deep holes, wide gaps in joints, or deep chemical stains (from acid or toilet cleaners), normal polishing is not enough. Our Marble Restoration service involves deep grinding, crack filling using color-matched Italian polyester resins, joint re-grouting, and complete resurfacing to make the floor look absolutely seamless, like a single slab.",
        benefits: JSON.stringify([
          "Repairs deep cracks, holes, and chips",
          "Seamless joints through color-matched epoxy grouting",
          "Removes severe chemical and acid burn stains",
          "Makes old, damaged floors look brand new"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Joint Raking & Cleaning", desc: "Removing old black dirt and loose cement from joints." },
          { step: 2, title: "Crack & Hole Filling", desc: "Filling cracks with imported Tenax polyester resin mixed with matching color pigments." },
          { step: 3, title: "Grinding & Resurfacing", desc: "Heavy grinding to level the floor and remove all deep stains." },
          { step: 4, title: "Polishing & Crystallization", desc: "Full polishing process to restore high gloss." }
        ]),
        suitableFor: "Old marble floors, damaged commercial floors, and stained residential entryways.",
        image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
        faqs: JSON.stringify([
          { q: "Can acid stains be completely removed from marble?", a: "Yes, acid eats into marble creating a dull white spot. We grind the damaged layer down to expose fresh marble and polish it back." }
        ]),
        seoTitle: "Professional Marble Floor Restoration Service | Gauranitai",
        seoDescription: "Restore cracked, chipped, or acid-damaged marble floors. We repair joints, fill cracks, and grind floors to make them look seamless.",
        seoKeywords: "marble restoration, repair marble cracks, remove marble acid stains",
        status: "active"
      },
      {
        title: "Marble Crystallization",
        slug: "marble-crystallization",
        category: "Marble Polishing",
        shortDescription: "Crystallization treatment to enhance marble shine and surface protection.",
        fullDescription: "Crystallization is a chemical reaction process that hardens the top layer of marble. We spray a specialized fluorosilicate liquid on the floor and buff it using steel wool pads under a heavy single-disc machine. The heat generated creates a glass-like calcium compound on the surface, making the floor highly reflective, water-resistant, and harder.",
        benefits: JSON.stringify([
          "Creates a glass-like, mirror-shiny protective layer",
          "Increases marble surface hardness and scratch resistance",
          "Prevents liquid penetration (water, oil, dirt)",
          "Provides slip-resistant high gloss"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Deep Cleaning", desc: "Removing all dust, wax, and oils from the floor." },
          { step: 2, title: "Drying", desc: "Ensuring the floor is 100% dry to allow the chemical reaction." },
          { step: 3, title: "Chemical Application", desc: "Spraying premium crystallization liquid onto a small section." },
          { step: 4, title: "Steel Wool Buffing", desc: "Buffing with heavy machines to trigger chemical crystallization." }
        ]),
        suitableFor: "Hotel lobbies, high-traffic corridors, showrooms, and luxury apartments.",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        faqs: JSON.stringify([
          { q: "What is the difference between polishing and crystallization?", a: "Polishing uses physical abrasives to smooth the stone, while crystallization uses chemical reactions to harden and gloss the top layer." }
        ]),
        seoTitle: "Marble Crystallization Treatment - High Gloss Protection",
        seoDescription: "Enhance your floor's shine and durability with our marble crystallization service. Hardens the marble surface and protects against scratches.",
        seoKeywords: "marble crystallization, crystallization service, glass finish floor treatment",
        status: "active"
      },
      {
        title: "Floor Deep Cleaning",
        slug: "floor-deep-cleaning",
        category: "Floor Cleaning",
        shortDescription: "Deep cleaning service for residential and commercial floors to remove dirt, stains, and dullness.",
        fullDescription: "Mopping only cleans loose dust, leaving grease, sticky residue, and grime in tile joints and stone pores. Our Floor Deep Cleaning service utilizes professional scrubbing machines, industrial vacuum cleaners, and eco-friendly floor cleaning agents to scrub away layers of accumulated dirt and stains, leaving your floors sanitized and fresh.",
        benefits: JSON.stringify([
          "Removes grease, sticky oils, and deep dirt",
          "Deep cleans tile grout lines and porous stone surfaces",
          "Sanitizes and eliminates bacteria and bad odors",
          "Safe for all floors including wood, laminate, and marble"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Dust Extraction", desc: "Dry vacuuming to extract loose dirt from corners." },
          { step: 2, title: "Solution Spraying", desc: "Applying eco-friendly floor cleaning agents to loosen grease." },
          { step: 3, title: "Machine Scrubbing", desc: "Scrubbing using rotary floor machines with soft brushes." },
          { step: 4, title: "Slurry Extraction", desc: "Using wet vacuum cleaners to instantly suck up dirty water." }
        ]),
        suitableFor: "All homes, retail outlets, offices, and commercial establishments.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
        faqs: JSON.stringify([
          { q: "Do you clean the furniture too?", a: "We move light furniture to clean underneath, and return it. Heavy furniture is cleaned around safely." }
        ]),
        seoTitle: "Professional Floor Deep Cleaning Service | Gauranitai",
        seoDescription: "Book professional floor deep cleaning. We use advanced scrubbers and wet vacuums to remove sticky dirt and sanitize your floors.",
        seoKeywords: "floor deep cleaning, floor scrubbing service, home floor cleaning",
        status: "active"
      },
      {
        title: "Tile Cleaning",
        slug: "tile-cleaning",
        category: "Floor Cleaning",
        shortDescription: "Tile floor cleaning service for homes, offices, bathrooms, and commercial areas.",
        fullDescription: "Ceramic and vitrified tiles are durable but their grout lines act as dirt magnets, turning black over time. Our Tile Cleaning service uses specialized tile scrubbers and high-pressure cleaning tools to clean tiles and restore black, dirty grout lines back to their original color, giving your floors a brand new look.",
        benefits: JSON.stringify([
          "Cleans tiles and brightens grout lines",
          "Removes hard water stains and soap scum",
          "Prevents mold and mildew growth in bathrooms",
          "Restores non-slip texture of floor tiles"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Pre-treatment", desc: "Applying grout cleaning solutions to dirty joints." },
          { step: 2, title: "Detail Grout Scrubbing", desc: "Scrubbing joints with detailed brushes." },
          { step: 3, title: "Surface Scrubbing", desc: "Mechanical floor scrubbing to wash tile faces." },
          { step: 4, title: "Rinsing & Drying", desc: "Thorough rinsing and mopping dry." }
        ]),
        suitableFor: "Kitchen tile floors, bathroom floors/walls, balconies, and public utility areas.",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
        faqs: JSON.stringify([
          { q: "Can you clean dirty black bathroom tile joints?", a: "Yes, our specialized cleaning agents dissolve soap scum and hard water deposits, turning black joints clean again." }
        ]),
        seoTitle: "Tile Cleaning Service & Grout Cleaning | Gauranitai",
        seoDescription: "Get sparkling clean tiles and bright grout lines. Specialized cleaning for bathroom tiles, kitchen floors, and balconies.",
        seoKeywords: "tile cleaning service, clean tile grout, bathroom floor cleaning",
        status: "active"
      },
      {
        title: "Mosaic Floor Cleaning",
        slug: "mosaic-floor-cleaning",
        category: "Floor Cleaning",
        shortDescription: "Professional mosaic floor cleaning to remove dirt and restore freshness.",
        fullDescription: "Mosaic and Terrazzo floors contain small chips of marble embedded in cement, which makes them highly durable but prone to absorbing dirt and yellowing over time. Our Mosaic Floor Cleaning uses fine buffing pads and alkaline cleaners to strip away yellowed waxes, extract deep dirt, and restore a clean, smooth, satin finish.",
        benefits: JSON.stringify([
          "Removes age-related yellowing and dullness",
          "Deep cleans marble chips and cement joints",
          "Applies a breathable protective sealer",
          "Safe and dust-free wet cleaning process"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Dry Sweeping", desc: "Removing loose dirt from joints." },
          { step: 2, title: "Alkaline Scrubbing", desc: "Using floor machines with non-acidic mosaic cleaners." },
          { step: 3, title: "Stain Spotting", desc: "Treating dark ink or rust spots with specific stain pullers." },
          { step: 4, title: "Light Buffing", desc: "Buffing with fine pads to smooth the mosaic surface." }
        ]),
        suitableFor: "Traditional residential houses, school corridors, and old commercial buildings.",
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
        faqs: JSON.stringify([
          { q: "Can you polish mosaic floors?", a: "Yes, we scrub them clean, and if needed, we can do light diamond grinding to bring back a smooth shine." }
        ]),
        seoTitle: "Mosaic Floor Cleaning & Polishing | Gauranitai Floor Care",
        seoDescription: "Professional mosaic floor cleaning services. Remove yellowing and restore fresh shine on traditional terrazzo and mosaic tile floors.",
        seoKeywords: "mosaic floor cleaning, terrazzo floor cleaning, clean old mosaic floors",
        status: "active"
      },
      {
        title: "Commercial Floor Cleaning",
        slug: "commercial-floor-cleaning",
        category: "Floor Cleaning",
        shortDescription: "Floor cleaning services for offices, hotels, shops, societies, and commercial properties.",
        fullDescription: "High-traffic commercial spaces require quick, efficient, and heavy-duty floor care that doesn't disrupt business hours. We offer customized commercial floor deep cleaning and maintenance packages for corporate offices, hotels, retail outlets, and building societies. We work overnight and on weekends to keep your business premises immaculate.",
        benefits: JSON.stringify([
          "Flexible schedules (weekend/overnight) to avoid business disruption",
          "Large-capacity machinery for fast turnaround times",
          "High-durability sealing for heavy foot-traffic areas",
          "Fully insured and safety-certified staff"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Site Assessment", desc: "Evaluating floor areas, high-traffic zones, and scheduling needs." },
          { step: 2, title: "Large-Scale Scrubbing", desc: "Using high-speed industrial ride-on or walk-behind scrubbing machines." },
          { step: 3, title: "Joint & Edge Cleaning", desc: "Manual detailing of edges, corners, and under workstations." },
          { step: 4, title: "Fast-dry Waxing/Sealing", desc: "Applying fast-drying floor sealers to prevent scuff marks." }
        ]),
        suitableFor: "Offices, Hotels, Societies, Malls, Showrooms, and Warehouses.",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        faqs: JSON.stringify([
          { q: "Can you work after office hours?", a: "Yes, our teams operate 24/7. We can schedule our deep cleaning during night shifts or Sunday holidays." }
        ]),
        seoTitle: "Commercial Floor Cleaning & Polishing | Gauranitai",
        seoDescription: "Heavy-duty commercial floor cleaning and maintenance services for offices, hotels, and societies. Flexible schedules to prevent downtime.",
        seoKeywords: "commercial floor cleaning, office floor cleaning, hotel marble polishing",
        status: "active"
      },
      {
        title: "Residential Floor Cleaning",
        slug: "residential-floor-cleaning",
        category: "Floor Cleaning",
        shortDescription: "Home floor cleaning services for marble, tile, granite, mosaic, and regular flooring.",
        fullDescription: "Our home floor cleaning service is tailored to deliver maximum cleanliness and hygiene for your family. We use safe, non-toxic, child-friendly and pet-safe cleaning agents to scrub and sanitize your home floors. We clean all floor types including vitrified tiles, marble, granite, mosaic, wooden laminate, and ceramic tiles.",
        benefits: JSON.stringify([
          "Child-safe and pet-safe organic cleaning products",
          "Sanitizes floors, killing 99.9% of bacteria and germs",
          "Detailed cleaning of skirting and corners",
          "Friendly, verified, and background-checked technicians"
        ]),
        processSteps: JSON.stringify([
          { step: 1, title: "Furniture Relocation", desc: "Moving sofas, tables, and chairs to clean the entire floor." },
          { step: 2, title: "Dust Vacuuming", desc: "Vacuuming edges and sliding doors grooves." },
          { step: 3, title: "Rotary Scrubbing", desc: "Scrubbing floors with soft brushes and organic sanitizing agents." },
          { step: 4, title: "Moisture Extraction & Restoration", desc: "Wet-vacuuming dirty liquid and dry mopping for a pristine look." }
        ]),
        suitableFor: "Apartments, bungalows, villas, and rented flats.",
        image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
        faqs: JSON.stringify([
          { q: "Are your cleaning agents safe for kids and pets?", a: "Yes, we use eco-friendly, biodegradable, non-toxic cleaners that leave zero chemical residue on the floor." }
        ]),
        seoTitle: "Home Floor Cleaning Service - Sparkling Clean Homes",
        seoDescription: "Book professional home floor cleaning services. We sanitize, remove grease stains, and scrub marble, granite, and tile floors to perfection.",
        seoKeywords: "residential floor cleaning, home floor cleaning, house floor deep cleaning",
        status: "active"
      }
    ];

    for (const service of baseServices) {
      await db.insert(services).values(service);
    }
    console.log("✓ Successfully seeded 12 services");

    // 3. Insert/Update Products (6 Products)
    console.log("Seeding Products...");
    await db.delete(products);
    const baseProducts = [
      {
        name: "Gauranitai Floor Cleaner 1L",
        slug: "gauranitai-floor-cleaner-1l",
        category: "Floor Cleaner",
        sku: "CLEAN-FLOOR-1L",
        price: "199.00",
        unit: "1L",
        stock: 100,
        shortDescription: "Powerful floor cleaner suitable for daily cleaning of marble, granite, tiles, mosaic, and common floor surfaces.",
        fullDescription: "Gauranitai Floor Cleaner 1L is a pH-balanced, highly concentrated daily cleaning solution. It is specially formulated to safely clean luxury floors like marble and granite without eating away at the sealers or causing dullness. It leaves behind a streak-free clean surface with a subtle, fresh, long-lasting natural fragrance.",
        benefits: "• Safe for all premium floors\n• Eco-friendly, biodegradable formula\n• Removes sticky oils and food grease\n• Non-corrosive, pH-neutral formula\n• Streak-free finish",
        usageInstructions: "Mix 15-20 ml of Gauranitai Floor Cleaner in half a bucket (approx. 4-5 liters) of water. Mop the floor as usual. No need to rinse.",
        suitableSurfaces: "Marble, Granite, Vitrified Tiles, Ceramic Tiles, Mosaic, Terrazzo, and Hardwood Laminates.",
        safetyInstructions: "Keep out of reach of children. In case of contact with eyes, rinse immediately with plenty of water and seek medical advice if irritation persists.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"]),
        seoTitle: "Streak-Free Floor Cleaner 1L - Gauranitai",
        seoDescription: "pH-neutral floor cleaner for daily mopping of marble, granite, and tiles. Leaves floors clean, shiny, and smelling fresh.",
        seoKeywords: "floor cleaner, best floor cleaner for home, marble safe floor wash",
        status: "active"
      },
      {
        name: "Gauranitai Floor Cleaner 5L",
        slug: "gauranitai-floor-cleaner-5l",
        category: "Floor Cleaner",
        sku: "CLEAN-FLOOR-5L",
        price: "799.00",
        unit: "5L",
        stock: 50,
        shortDescription: "Value pack floor cleaner for homes, offices, societies, shops, and commercial spaces.",
        fullDescription: "Gauranitai Floor Cleaner 5L offers the same premium pH-balanced formula in a cost-effective bulk pack. Ideal for large apartments, multi-story offices, societies, schools, and restaurants that require daily high-volume cleaning. Cleans dirt and grease efficiently while saving packaging waste.",
        benefits: "• Value for money bulk pack\n• Dilution ratio of 1:200 makes it highly economical\n• Removes tough soils and high foot-traffic dirt\n• Non-slippery formula",
        usageInstructions: "Dilute 15-25 ml per 5 liters of water. For commercial floor scrubbing machines, dilute at a ratio of 1:100.",
        suitableSurfaces: "Marble, Granite, Tiles, Mosaic, and polished concrete.",
        safetyInstructions: "Store in a cool dry place. Keep container tightly closed when not in use.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"]),
        seoTitle: "Bulk Floor Cleaner 5L Value Pack | Gauranitai",
        seoDescription: "Get the 5L value pack of Gauranitai floor cleaner. Economical cleaning liquid for offices, hotels, societies, and large homes.",
        seoKeywords: "floor cleaner 5L, commercial floor cleaner, bulk cleaning liquid",
        status: "active"
      },
      {
        name: "Marble Cleaner 1L",
        slug: "marble-cleaner-1l",
        category: "Marble Cleaner",
        sku: "MARBLE-CLN-1L",
        price: "249.00",
        unit: "1L",
        stock: 100,
        shortDescription: "Special cleaner for marble floors and surfaces. Helps clean dust, stains, and dullness without damaging the surface.",
        fullDescription: "Marble is chemical-sensitive and acidic cleaners (like phenyl, lemon, or vinegar) can dissolve the calcium structure of marble, creating white burn marks. Gauranitai Marble Cleaner is a highly specialized pH 7.0 formula. It gently extracts dirt from stone pores and protects the polished seal, enhancing the floor's natural shine with every wash.",
        benefits: "• Strictly pH-neutral (pH 7.0)\n• Preserves the mirror shine of polished marble\n• Prevents yellowing of white marble\n• Leaves no residue or haze",
        usageInstructions: "Mix 20 ml in 4 liters of warm water. Mop gently. For dirty spots, apply neat, scrub with a soft sponge, and wipe dry with a microfibre cloth.",
        suitableSurfaces: "Indian Marble, Italian Marble, Travertine, Onyx, and Limestone.",
        safetyInstructions: "Do not mix with acidic chemicals or bleach. Wear rubber gloves for sensitive skin.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"]),
        seoTitle: "pH Neutral Marble Floor Cleaner 1L | Gauranitai",
        seoDescription: "Best pH neutral cleaner for Italian and Indian marble floors. Protects shine, prevents yellowing, and cleans gently.",
        seoKeywords: "marble cleaner, pH neutral marble cleaner, best cleaner for marble floor",
        status: "active"
      },
      {
        name: "Granite Cleaner 1L",
        slug: "granite-cleaner-1l",
        category: "Granite Cleaner",
        sku: "GRANITE-CLN-1L",
        price: "249.00",
        unit: "1L",
        stock: 100,
        shortDescription: "Granite cleaner for daily cleaning and shine maintenance. Suitable for kitchen counters, granite floors, and commercial surfaces.",
        fullDescription: "Granite countertops are prone to kitchen grease, oil drops, and hard water rings. Gauranitai Granite Cleaner is an fast-drying, streak-free sprayable cleaner. It cuts through oil, food residues, and finger marks instantly, drying within seconds to leave a streak-free shine on granite counters and flooring.",
        benefits: "• Fast-evaporating streak-free shine\n• Food-contact surface safe\n• Cuts through kitchen grease and sticky oils\n• Safe for daily counter wipe-downs",
        usageInstructions: "For countertops: Spray directly onto the granite surface and wipe off using a clean microfiber cloth. For floors: Dilute 20 ml in 5 liters of water.",
        suitableSurfaces: "Polished Granite, Quartz counters, Slate, and Quartzite.",
        safetyInstructions: "Avoid contact with eyes. Do not swallow.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1527359395034-a70ab8b41f51?w=800"]),
        seoTitle: "Streak-Free Granite & Quartz Cleaner 1L - Gauranitai",
        seoDescription: "Clean granite kitchen counters and floors easily. Streak-free, fast-drying granite cleaner that removes grease and oils.",
        seoKeywords: "granite cleaner, granite countertop wash, kitchen counter cleaner",
        status: "active"
      },
      {
        name: "Tile & Mosaic Cleaner 1L",
        slug: "tile-mosaic-cleaner-1l",
        category: "Tile Cleaner",
        sku: "TILE-MOS-1L",
        price: "199.00",
        unit: "1L",
        stock: 100,
        shortDescription: "Effective cleaner for tiles and mosaic floors. Helps remove dirt, stains, and dullness from daily-use floors.",
        fullDescription: "Daily foot traffic leaves vitrified tiles dull and turns grout lines black. Gauranitai Tile & Mosaic Cleaner is a deep-action formula. It penetrates deep into microscopic tile pores and grout textures, releasing trapped dirt, grime, and hard water minerals. Excellent for bathrooms, kitchens, and balconies.",
        benefits: "• Brightens grout lines\n• Removes hard-water film and soap scum\n• Non-corrosive to tile glazes\n• Restores freshness to old mosaic floors",
        usageInstructions: "For regular mopping: Mix 20 ml in 4 liters of water. For dirty tile joints: Apply diluted 1:1, leave for 2-3 minutes, scrub with brush, and rinse with water.",
        suitableSurfaces: "Vitrified Tiles, Ceramic Tiles, Glazed Tiles, Mosaic, and China clay tiles.",
        safetyInstructions: "Use hand protection while using concentrated formula. Do not use on acid-sensitive stones like marble.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"]),
        seoTitle: "Tile and Mosaic Floor Cleaner Liquid | Gauranitai",
        seoDescription: "Remove black dirt from tile joints and soap scum from bathroom floors. Effective tile and mosaic cleaner.",
        seoKeywords: "tile cleaner, mosaic floor cleaner, grout cleaning liquid",
        status: "active"
      },
      {
        name: "Heavy Duty Floor Cleaner 5L",
        slug: "heavy-duty-floor-cleaner-5l",
        category: "Industrial Cleaner",
        sku: "HEAVY-FLOOR-5L",
        price: "899.00",
        unit: "5L",
        stock: 40,
        shortDescription: "Heavy-duty cleaner for offices, shops, factories, societies, and high-traffic commercial areas.",
        fullDescription: "Gauranitai Heavy Duty Floor Cleaner is a powerful alkaline degreaser designed to tackle extreme dirt, grease trails, tyre marks, carbon deposits, and industrial oils. Perfect for commercial parking areas, hotel kitchens, factory workshops, building lobbies, and public spaces.",
        benefits: "• Industrial-strength alkaline degreaser\n• Dissolves tyre marks and machine grease\n• Low-foaming formula suitable for ride-on scrubbers\n• Highly concentrated and economical",
        usageInstructions: "For heavy oil/grease: Dilute 1:10 with water. For general commercial scrubbing: Dilute 1:50 to 1:100 with water.",
        suitableSurfaces: "Concrete, Epoxy floors, Vitrified tiles, Cobblestones, and hard stone paving.",
        safetyInstructions: "Wear gloves and safety goggles during handling. Ensure adequate ventilation. Keep out of reach of children.",
        images: JSON.stringify(["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"]),
        seoTitle: "Industrial Heavy Duty Floor Cleaner 5L | Gauranitai",
        seoDescription: "Powerful alkaline floor cleaner and degreaser. Removes tyre marks, grease, and heavy dirt from parking lots and commercial floors.",
        seoKeywords: "heavy duty floor cleaner, industrial degreaser, commercial floor wash",
        status: "active"
      }
    ];

    for (const prod of baseProducts) {
      await db.insert(products).values(prod);
    }
    console.log("✓ Successfully seeded 6 products");

    // 4. Seed 10 High-Quality Blogs
    console.log("Seeding Blogs...");
    await db.delete(blogs);
    const baseBlogs = [
      {
        title: "Best Marble Polishing Service for Homes",
        slug: "best-marble-polishing-service-for-homes",
        category: "Marble Polishing",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        shortDescription: "A complete guide to choosing the right professional marble polishing service for your home.",
        content: "Your home's marble floor is an investment that adds luxury and warmth. However, maintaining that showroom-like mirror shine requires professional marble polishing services. In this guide, we discuss what to look for when choosing a contractor: ensure they use wet-grinding systems to avoid dust, check that they use diamond abrasive pads (not just cheap chemical acids), and verify their technicians understand the difference between Italian and Indian marble. With Gauranitai, you get verified professionals, modern single-disc machines, and premium eco-safe polishing powders to restore the glass finish of your home.",
        author: "Summit Shah",
        tags: JSON.stringify(["Marble Polishing", "Home Improvement", "Floor Care"]),
        seoTitle: "How to Choose the Best Marble Polishing Service for Homes",
        seoDescription: "Learn how to choose the best marble polishing service for your residence. Discover key tips on dust-free polishing, diamond pads, and stone sealing.",
        seoKeywords: "marble polishing service, home marble polish, professional stone care",
        status: "Published"
      },
      {
        title: "How to Restore Shine on Marble Floors",
        slug: "how-to-restore-shine-on-marble-floors",
        category: "Marble Care",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        shortDescription: "Step-by-step methods to restore the lost shine of dull, scratched marble floors.",
        content: "Has your once-glossy marble floor turned dull, white, and full of micro-scratches? Mop water minerals, acid spills, and foot friction scrape away the polished surface. To restore shine, you must follow the correct process: first, deep clean to remove dirt; second, hone the floor using diamond grit pads from grit 400 to 1500 to level micro-scratches; third, apply a calcium-fluorosilicate crystallization chemical to create a protective, glassy micro-layer; and finally, buff with high-grit buffing pads. Avoid vinegar or harsh toilet cleaners, which cause immediate acid burns. Use pH-neutral marble cleaners daily to maintain the shine.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Marble Restoration", "DIY Floor Care", "Floor Shine"]),
        seoTitle: "How to Restore Shine on Marble Floors: Expert Step-by-Step",
        seoDescription: "Dull marble floors? Read our expert guide to restoring glass shine on marble floors using diamond honing and crystallization.",
        seoKeywords: "restore marble shine, how to polish marble, dull marble floors",
        status: "Published"
      },
      {
        title: "Diamond Marble Polishing Process Explained",
        slug: "diamond-marble-polishing-process-explained",
        category: "Marble Polishing",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        shortDescription: "Understand what diamond marble polishing is and how it delivers a long-lasting wet mirror finish.",
        content: "Unlike traditional acid-wash wax polishing which yellows and wears off within months, Diamond Marble Polishing is a structural restoration. Using diamond-infused resin disks, the process physically grinds down the stone surface, removing a microscopic damaged layer. The grit size is gradually increased from a rough 100 grit up to an ultra-fine 3000 grit, polishing the stone particles until they naturally reflect light. This creates a durable, slip-resistant, and dust-free mirror gloss that lasts for years.",
        author: "Summit Shah",
        tags: JSON.stringify(["Diamond Polishing", "Stone Care", "Marble Restoration"]),
        seoTitle: "What is Diamond Marble Polishing? Process & Benefits",
        seoDescription: "Get the complete details of the diamond marble polishing process. Learn how it achieves a natural mirror gloss without relying on wax.",
        seoKeywords: "diamond marble polishing, diamond polishing process, marble mirror finish",
        status: "Published"
      },
      {
        title: "Marble Polishing vs Marble Cleaning",
        slug: "marble-polishing-vs-marble-cleaning",
        category: "Marble Care",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
        shortDescription: "Learn the difference between daily marble cleaning and professional marble polishing.",
        content: "Many homeowners confuse cleaning with polishing. Marble cleaning involves removing surface dirt, dust, and sticky oils using pH-neutral soap and a mop. It keeps the floor hygienic but cannot remove scratches, acid etch marks, or restore gloss. Marble polishing, on the other hand, is a mechanical restoration process. It uses grinding machinery to level the stone and hone away scratches, followed by crystallization chemicals to harden the surface and build a mirror shine. If your floor is dirty, clean it; if it is dull and scratched, it is time to polish it.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Marble Cleaning", "Marble Polishing", "Home Cleaning"]),
        seoTitle: "Difference Between Marble Polishing and Marble Cleaning",
        seoDescription: "Understand the key differences between marble cleaning and polishing. Find out which treatment your floor needs to look its best.",
        seoKeywords: "marble polishing vs cleaning, clean marble, polish dull marble",
        status: "Published"
      },
      {
        title: "How Often Should You Polish Marble Floors?",
        slug: "how-often-should-you-polish-marble-floors",
        category: "Floor Maintenance",
        image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
        shortDescription: "A guide on the ideal frequency for polishing marble floors in residential and commercial spaces.",
        content: "How often you should polish your marble floors depends on foot traffic and maintenance. For typical residential homes, a professional marble polishing or crystallization treatment is recommended every 2 to 3 years. For high-traffic commercial spaces like hotels, retail malls, and office lobbies, crystallization should be done every 6 to 12 months to prevent wear lanes. Daily mopping with pH-neutral marble cleaners and prompt cleaning of spills will double the lifespan of your floor's shine.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Floor Maintenance", "Marble Care", "Commercial Cleaning"]),
        seoTitle: "How Often to Polish Marble Floors? Residential & Commercial Guide",
        seoDescription: "Determine the best frequency to polish your marble flooring. Tips for residential homes and high-traffic commercial halls.",
        seoKeywords: "how often to polish marble, marble floor maintenance, commercial stone care",
        status: "Published"
      },
      {
        title: "Best Floor Cleaner for Marble and Tiles",
        slug: "best-floor-cleaner-for-marble-and-tiles",
        category: "Cleaning Products",
        image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
        shortDescription: "Why standard acidic cleaners ruin floors and how to choose the best pH-neutral floor cleaner.",
        content: "Most floor cleaners available in local stores contain acidic agents or bleach. While they clean tiles, they slowly eat away at marble and corrode tile grout lines. The best floor cleaner for a household with mixed flooring is a pH-neutral, non-toxic cleaner like Gauranitai Floor Cleaner. It removes everyday grease, tea stains, and dust while protecting the delicate shine of marble and the sealers on tiles, keeping your home clean and safe.",
        author: "Summit Shah",
        tags: JSON.stringify(["Cleaning Products", "Floor Cleaner", "Marble safe"]),
        seoTitle: "Best Safe Floor Cleaner for Marble and Tiles | Gauranitai",
        seoDescription: "Discover why pH-neutral floor cleaners are essential for marble and tiles. Safeguard your floor's shine with Gauranitai Floor Cleaner.",
        seoKeywords: "best floor cleaner, marble safe cleaner, tile cleaner liquid",
        status: "Published"
      },
      {
        title: "How to Remove Stains from Marble Floors",
        slug: "how-to-remove-stains-from-marble-floors",
        category: "Stain Removal",
        image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800",
        shortDescription: "Effective remedies and professional tips to remove oil, coffee, rust, and acid stains from marble.",
        content: "Marble is highly porous, meaning spilled liquids can quickly sink into the stone pores, leaving deep stains. If you have an oil stain, apply a poultice (mix baking soda and water into a paste, apply on stain, cover with plastic wrap, leave for 24 hours). For organic stains like coffee or wine, clean immediately with pH-neutral marble cleaner. For rust stains, use specialized rust removers. If the stain has etched the stone (leaving a rough white spot), professional honing is required to level the surface.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Stain Removal", "Marble Care", "DIY Floor Care"]),
        seoTitle: "Remove Oil, Coffee & Rust Stains from Marble | Gauranitai",
        seoDescription: "Stains on your marble floor? Learn how to remove tough oil, rust, and coffee stains using simple poultice methods and marble-safe products.",
        seoKeywords: "remove marble stains, marble stain removal, oil stain on marble",
        status: "Published"
      },
      {
        title: "Why Marble Floors Become Dull",
        slug: "why-marble-floors-become-dull",
        category: "Marble Care",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        shortDescription: "Understand the scientific reasons behind marble dullness and how to prevent it.",
        content: "Marble is mainly made of calcium carbonate, which reacts chemically with acids. When acidic cleaners, fruit juices, or soft drinks spill, they immediately 'etch' (corrode) the stone surface, turning it dull. Another reason is abrasion: sand particles on footwear act like sandpaper, scratching the shiny polish. To prevent dullness, place door mats at entryways, dust-mop daily, and never use acidic household cleaners. Instead, use specialized marble cleaners.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Marble Care", "Floor Protection", "Dull Marble"]),
        seoTitle: "Why Do Marble Floors Lose Their Shine? | Gauranitai",
        seoDescription: "Explore the causes of marble floor dullness, from acid etching to sand abrasion, and learn preventative measures to keep floors shiny.",
        seoKeywords: "dull marble floors, why marble loses shine, marble etching",
        status: "Published"
      },
      {
        title: "Italian Marble Polishing Guide",
        slug: "italian-marble-polishing-guide",
        category: "Marble Care",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        shortDescription: "A comprehensive guide on Italian marble care, polishing methods, and sealants.",
        content: "Italian marble is prized for its exquisite beauty and shine. However, its delicate crystalline structure makes it softer than Indian marble. Honing Italian marble requires using fine diamond abrasives (grit 1000 to 3000) under low-pressure grinding machines to prevent cracking along natural veins. After polishing, applying an impregnating hydrophobic sealer is essential to prevent staining. Italian marble should only be washed with specialized pH-neutral cleaners.",
        author: "Summit Shah",
        tags: JSON.stringify(["Italian Marble", "Premium Polishing", "Stone Care"]),
        seoTitle: "Italian Marble Polishing Guide - Tips & Sealer Info",
        seoDescription: "Read our comprehensive guide to Italian marble polishing. Protect Statuario, Carrara, and Botticino marble with expert care and sealers.",
        seoKeywords: "italian marble polishing guide, statuario marble polish, imported stone sealer",
        status: "Published"
      },
      {
        title: "Granite Polishing and Maintenance Tips",
        slug: "granite-polishing-and-maintenance-tips",
        category: "Granite Care",
        image: "https://images.unsplash.com/photo-1527359395034-a70ab8b41f51?w=800",
        shortDescription: "Best practices for polishing and maintaining granite countertops and floors.",
        content: "Granite is highly durable and heat-resistant, making it perfect for kitchen counters. To maintain its shine: wipe spills immediately to prevent water spots, spray daily with specialized fast-drying Granite Cleaner, and avoid abrasive scrubbing pads. Polishing granite requires heavy high-speed machines and specialized diamond pads. Re-sealing your granite counters once a year keeps them water and food stain-resistant.",
        author: "Gauranitai Experts",
        tags: JSON.stringify(["Granite Care", "Kitchen Countertops", "Polishing Tips"]),
        seoTitle: "Granite Polishing & Daily Maintenance Tips | Gauranitai",
        seoDescription: "Keep granite countertops and floors shiny and clean. Read our maintenance tips on granite cleaning, sealers, and professional polishing.",
        seoKeywords: "granite maintenance, polish granite counters, granite sealer tips",
        status: "Published"
      }
    ];

    for (const blog of baseBlogs) {
      await db.insert(blogs).values(blog);
    }
    console.log("✓ Successfully seeded 10 blogs");

    // 5. Seed 350 SEO Blog Topic Suggestions (programmatic combinations)
    console.log("Generating 350 SEO Blog Topic Suggestions...");
    await db.delete(blogTopicsSuggestions);
    
    const coreKeywords = [
      "Marble polishing service", "Floor cleaning service", "Diamond marble polishing",
      "Italian marble polishing", "Granite polishing", "Tile cleaning", "Mosaic floor cleaning",
      "Marble restoration", "Marble crystallization", "Marble stain removal", "Floor cleaner",
      "Marble cleaner", "Granite cleaner", "Tile cleaner", "Best floor cleaner for home",
      "Floor cleaning near me", "Marble polishing near me", "Commercial floor cleaning",
      "Society floor cleaning", "Hotel floor polishing", "Office floor cleaning", "Home floor cleaning"
    ];

    const titlePrefixes = [
      "Best Tips for", "How to Find the Best", "Step-by-Step Guide for", "Why You Need Professional",
      "The Cost of", "DIY vs Professional", "Common Mistakes in", "Secrets to Perfect",
      "Important Benefits of", "Ultimate Guide to", "How to Restore", "Quick Tips for",
      "Essential Maintenance for", "Eco-friendly Solutions for", "Top 10 Questions About"
    ];

    const locationsAndTargets = [
      "in Mumbai", "in Navi Mumbai", "in Thane", "for Luxury Homes", "for Large Corporate Offices",
      "for Residential Societies", "for Hotels and Showrooms", "for Small Shops", "for Modern Apartments",
      "on a Budget", "Before Festivals", "After Home Renovation", "to Keep Kids and Pets Safe"
    ];

    const categoriesList = [
      "Marble Polishing", "Floor Cleaning", "Marble Care", "Granite Care", "Tile Cleaning",
      "Mosaic Cleaning", "Cleaning Products", "Home Cleaning", "Commercial Cleaning", "Floor Maintenance",
      "Stain Removal", "Polishing Tips", "DIY Floor Care", "Professional Cleaning Services"
    ];

    let count = 0;
    const suggestionsToInsert = [];
    
    // Generate programmatically combining keywords, prefixes, and locations
    for (let i = 0; i < coreKeywords.length; i++) {
      for (let j = 0; j < titlePrefixes.length; j++) {
        const keyword = coreKeywords[i];
        const prefix = titlePrefixes[j];
        const loc = locationsAndTargets[(i + j) % locationsAndTargets.length];
        const cat = categoriesList[(i * j) % categoriesList.length];
        
        const topicTitle = `${prefix} ${keyword} ${loc}`;
        suggestionsToInsert.push({
          topic: topicTitle,
          category: cat,
          focusKeywords: keyword
        });
        count++;
        if (count >= 350) break;
      }
      if (count >= 350) break;
    }

    // Chunk insert to avoid parameters overload
    const chunkSize = 50;
    for (let i = 0; i < suggestionsToInsert.length; i += chunkSize) {
      const chunk = suggestionsToInsert.slice(i, i + chunkSize);
      await db.insert(blogTopicsSuggestions).values(chunk);
    }
    console.log(`✓ Seeded ${count} Blog Topic Suggestions`);

    // 6. Reset & Seeding Banners
    console.log("Seeding Banners...");
    await db.delete(banners);
    await db.insert(banners).values([
      {
        title: "Professional Marble Polishing & Floor Cleaning Services",
        subtitle: "Restore shine, remove dullness, and keep your floors fresh with expert marble polishing, floor cleaning, and stone care solutions.",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920",
        imageUrlTablet: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        imageUrlMobile: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        ctaText: "Book Service",
        ctaLink: "/contact",
        badgeText: "Premium Stone Care",
        displayOrder: 1,
        isActive: true
      },
      {
        title: "Italian Marble Honing & Crystallization",
        subtitle: "Specialized gentle polishing for Carrara, Statuario, and Botticino marble. Preserves natural veins and builds high glass protection.",
        imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920",
        imageUrlTablet: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
        imageUrlMobile: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        ctaText: "View Services",
        ctaLink: "/services",
        badgeText: "Italian Marble Specialist",
        displayOrder: 2,
        isActive: true
      },
      {
        title: "Eco-Friendly pH Neutral Cleaners",
        subtitle: "Safeguard your floor's shine. Explore our range of child-safe, pet-safe floor cleaning liquids for marble, granite, and vitrified tiles.",
        imageUrl: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1920",
        imageUrlTablet: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200",
        imageUrlMobile: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
        ctaText: "Shop Products",
        ctaLink: "/shop",
        badgeText: "Cleaning Products",
        displayOrder: 3,
        isActive: true
      }
    ]);
    console.log("✓ Updated Hero Banners");

    // 7. Seeding FAQs
    console.log("Seeding FAQs...");
    await db.delete(faqs);
    await db.insert(faqs).values([
      {
        question: "What is the difference between normal scrubbing and marble polishing?",
        answer: "Scrubbing cleans the top layer of dirt and grease, but cannot remove scratches or acid burns. Marble polishing is a restoration process using diamond pads to grind out scratches, followed by crystallization to restore glass shine.",
        category: "Services",
        order: 1,
        displayOrder: 1
      },
      {
        question: "Are your cleaning products safe for marble floors?",
        answer: "Yes, our floor cleaner and marble cleaner are strictly pH-neutral (pH 7.0) and acid-free, meaning they will not cause acid etching or strip away the polish of your marble floors.",
        category: "Products",
        order: 2,
        displayOrder: 2
      },
      {
        question: "How long does a marble crystallization treatment last?",
        answer: "In a standard residential home, the crystallization shine lasts for 2 to 3 years. We recommend mopping with pH-neutral cleaners and utilizing door mats to protect the shine from sand particles.",
        category: "Maintenance",
        order: 3,
        displayOrder: 3
      },
      {
        question: "Do you offer services on Sundays or after office hours?",
        answer: "Yes, for commercial spaces, societies, and offices, we offer flexible timing options (overnight or Sundays) to ensure zero business disruption.",
        category: "Booking",
        order: 4,
        displayOrder: 4
      }
    ]);
    console.log("✓ Updated FAQs");

    // 8. Seeding Singletons & Settings
    const [existingSite] = await db.select().from(siteSettings).limit(1);
    const siteData = {
      brandName: "Gauranitai",
      logoUrl: "/attached_assets/gauranitai_logo.png",
      faviconUrl: "/attached_assets/gauranitai_logo.png",
      primaryColor: "#0D3E83", // Royal Blue
      secondaryColor: "#FFF9F2", // Marble Soft Cream
    };
    if (existingSite) {
      await db.update(siteSettings).set(siteData).where(eq(siteSettings.id, existingSite.id));
    } else {
      await db.insert(siteSettings).values(siteData);
    }

    const [existingAbout] = await db.select().from(aboutUsSettings).limit(1);
    const aboutData = {
      heroTitle: "About Gauranitai",
      heroSubtitle: "Professional floor care and stone restoration solutions.",
      heroImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      storyHeading: "Our Journey & Philosophy",
      storyDescription: "Gauranitai provides professional marble polishing, floor cleaning, stone care, and cleaning product solutions for homes, offices, societies, hotels, shops, and commercial spaces. Our goal is to restore shine, improve cleanliness, and maintain the beauty of floors using proper methods, tools, and quality products. We believe that clean, shiny floors reflect the health and purity of a space. By combining traditional diligence with modern diamond honing technology and safe pH-neutral chemicals, we bring old, dull floors back to life, creating a shiny, clean floor that feels premium and trustworthy.",
      storyImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
      valuesTitle: "Our Core Values",
      values: [
        { title: "Diligence", description: "Taking absolute care of your delicate stone surfaces using pH-safe methods." },
        { title: "Quality Products", description: "Providing strictly pH-neutral cleaners and premium Italian crystallizers." },
        { title: "Transparency", description: "No hidden charges, clear estimates, and verified technicians." }
      ],
      processTitle: "Our Restoration Process",
      processSteps: [
        { title: "Inspection & Diagnosis", description: "We analyze stone type, scratch depth, and stain levels." },
        { title: "Diamond Grinding & Honing", description: "Grinding away scratches and leveling joints using diamond pads." },
        { title: "Crystallization & Sealing", description: "Buffing with chemical crystallizers to harden stone and seal pores." },
        { title: "Shine Inspection", description: "Checking gloss levels with glossmeters to verify perfection." }
      ],
      isActive: true
    };
    if (existingAbout) {
      await db.update(aboutUsSettings).set(aboutData).where(eq(aboutUsSettings.id, existingAbout.id));
    } else {
      await db.insert(aboutUsSettings).values(aboutData);
    }

    const [existingContact] = await db.select().from(contactSettings).limit(1);
    const contactData = {
      heroTitle: "Book Floor Inspection",
      heroSubtitle: "Get a free quote and inspection for your marble, granite, or tile floors.",
      phone: "+91 98765 43210",
      email: "info@gauranitai.co.in",
      address: "Gauranitai Floor Care, Shop No. 4, Ground Floor, Sai Plaza, Andheri West, Mumbai, Maharashtra 400053",
      businessHours: "Monday - Sunday: 8:00 AM - 8:00 PM | Services: 24/7 (Prior Booking)",
      socialLinks: [
        { platform: "instagram", url: "https://www.instagram.com/shahenterprise90/" },
        { platform: "facebook", url: "https://facebook.com/gauranitaifloorcare" },
        { platform: "whatsapp", url: "https://wa.me/919876543210" }
      ],
      isActive: true
    };
    if (existingContact) {
      await db.update(contactSettings).set(contactData).where(eq(contactSettings.id, existingContact.id));
    } else {
      await db.insert(contactSettings).values(contactData);
    }

    const [existingNewsletter] = await db.select().from(newsletterSettings).limit(1);
    const newsletterData = {
      title: "Get Free Floor Care Tips",
      subtitle: "Join our list to receive professional guide on removing stains, maintaining marble shine, and discount coupons.",
      ctaText: "Subscribe",
      placeholderText: "Enter your email address",
      isActive: true
    };
    if (existingNewsletter) {
      await db.update(newsletterSettings).set(newsletterData).where(eq(newsletterSettings.id, existingNewsletter.id));
    } else {
      await db.insert(newsletterSettings).values(newsletterData);
    }

    const [existingFooter] = await db.select().from(footerSettings).limit(1);
    const footerData = {
      companyName: "Gauranitai Floor Care",
      tagline: "Shine. Purity. Cleanliness.",
      description: "Professional marble polishing, floor deep cleaning, and stone restoration services. We restore shine and maintain the natural beauty of your residential and commercial floors.",
      phone: "+91 98765 43210",
      email: "info@gauranitai.co.in",
      address: "Sai Plaza, Andheri West, Mumbai, Maharashtra 400053",
      socialLinks: [
        { platform: "instagram", url: "https://www.instagram.com/shahenterprise90/" },
        { platform: "facebook", url: "https://facebook.com/gauranitaifloorcare" },
        { platform: "whatsapp", url: "https://wa.me/919876543210" }
      ],
      footerLinks: [
        { title: "Services", links: [{ label: "Marble Polishing", url: "/services" }, { label: "Floor Deep Cleaning", url: "/services" }, { label: "Italian Marble Care", url: "/services" }] },
        { title: "Quick Links", links: [{ label: "About Us", url: "/about" }, { label: "Shop Products", url: "/shop" }, { label: "Latest Blogs", url: "/blog" }, { label: "Contact Us", url: "/contact" }] }
      ],
      copyrightText: "© 2026 Gauranitai. All rights reserved.",
      isActive: true
    };
    if (existingFooter) {
      await db.update(footerSettings).set(footerData).where(eq(footerSettings.id, existingFooter.id));
    } else {
      await db.insert(footerSettings).values(footerData);
    }

    console.log("✓ Enriched CMS content & singletons");
    console.log("✅ Gauranitai Database Seeding Completed Successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
