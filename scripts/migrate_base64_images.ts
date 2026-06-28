import "dotenv/config";
import { db } from "../server/db";
import { products, categories, siteSettings } from "../shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

// Ensure output directories exist
const productsDir = path.join(process.cwd(), "public", "products");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Parses a base64 Data URL, saves the binary data as a file, and returns the public URL.
 * Returns null if the string is not a valid base64 image data URL.
 */
function saveBase64Image(base64Str: string, isProduct = false): string | null {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return null;
  }

  try {
    const matches = base64Str.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error("Invalid base64 format match.");
      return null;
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const dataBuffer = Buffer.from(matches[2], "base64");
    const uniqueName = `migrated_${Date.now()}_${nanoid(6)}.${ext}`;

    const targetDir = isProduct ? productsDir : uploadsDir;
    const filePath = path.join(targetDir, uniqueName);

    fs.writeFileSync(filePath, dataBuffer);
    console.log(`Saved image to disk: ${filePath} (${dataBuffer.length} bytes)`);

    return isProduct ? `/products/${uniqueName}` : `/uploads/${uniqueName}`;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    return null;
  }
}

async function runMigration() {
  console.log("🚀 Starting Base64 image migration...");
  console.log(`Database URL: ${process.env.DATABASE_URL ? "URL is set" : "NOT SET!"}`);

  let productsMigrated = 0;
  let categoriesMigrated = 0;
  let settingsMigrated = 0;

  // 1. Migrate Products
  console.log("Checking products table for base64 images...");
  const dbProducts = await db.select().from(products);
  for (const product of dbProducts) {
    if (product.imageUrl && product.imageUrl.startsWith("data:image/")) {
      console.log(`Migrating product image for: "${product.name}" (ID: ${product.id})`);
      const fileUrl = saveBase64Image(product.imageUrl, true);
      if (fileUrl) {
        await db.update(products)
          .set({ imageUrl: fileUrl })
          .where(eq(products.id, product.id));
        productsMigrated++;
      }
    }
  }

  // 2. Migrate Categories
  console.log("Checking categories table for base64 images...");
  const dbCategories = await db.select().from(categories);
  for (const category of dbCategories) {
    if (category.icon && category.icon.startsWith("data:image/")) {
      console.log(`Migrating category image for: "${category.name}" (ID: ${category.id})`);
      const fileUrl = saveBase64Image(category.icon, false);
      if (fileUrl) {
        await db.update(categories)
          .set({ icon: fileUrl })
          .where(eq(categories.id, category.id));
        categoriesMigrated++;
      }
    }
  }

  // 3. Migrate Site Settings
  console.log("Checking site settings table for base64 images...");
  const dbSettings = await db.select().from(siteSettings);
  for (const settings of dbSettings) {
    const updates: Partial<typeof siteSettings.$inferInsert> = {};
    let needsUpdate = false;

    if (settings.logoUrl && settings.logoUrl.startsWith("data:image/")) {
      console.log(`Migrating site settings brand logo (ID: ${settings.id})`);
      const fileUrl = saveBase64Image(settings.logoUrl, false);
      if (fileUrl) {
        updates.logoUrl = fileUrl;
        needsUpdate = true;
      }
    }

    if (settings.faviconUrl && settings.faviconUrl.startsWith("data:image/")) {
      console.log(`Migrating site settings favicon (ID: ${settings.id})`);
      const fileUrl = saveBase64Image(settings.faviconUrl, false);
      if (fileUrl) {
        updates.faviconUrl = fileUrl;
        needsUpdate = true;
      }
    }

    if (settings.qrCodeUrl && settings.qrCodeUrl.startsWith("data:image/")) {
      console.log(`Migrating site settings payment QR code (ID: ${settings.id})`);
      const fileUrl = saveBase64Image(settings.qrCodeUrl, false);
      if (fileUrl) {
        updates.qrCodeUrl = fileUrl;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db.update(siteSettings)
        .set(updates)
        .where(eq(siteSettings.id, settings.id));
      settingsMigrated++;
    }
  }

  console.log("\n=================================");
  console.log("🎉 Migration completed successfully!");
  console.log(`- Products updated:   ${productsMigrated}`);
  console.log(`- Categories updated: ${categoriesMigrated}`);
  console.log(`- Settings updated:   ${settingsMigrated}`);
  console.log("=================================\n");
}

runMigration().catch(console.error).finally(() => process.exit(0));
