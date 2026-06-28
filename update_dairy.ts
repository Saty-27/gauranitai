
import { db } from "./server/db";
import { products, categories } from "./shared/schema";
import { eq } from "drizzle-orm";

async function updateProducts() {
  console.log("Starting to update dairy products...");

  const dairyProducts = [
    {
      name: "Buttermilk",
      sku: "DAIRY-BMLK-500ML",
      description: "Refreshing and digestive traditional Indian Buttermilk (Chaas). Made from fresh curd with a touch of sea salt.",
      category: "Dairy Products",
      type: "DAIRY",
      price: "25.00",
      unit: "500ml",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1571210051434-a0c332c6e19c?w=800", // Temporary Unsplash Indian style
      isActive: true,
    },
    {
      name: "Fresh Curd",
      sku: "DAIRY-CURD-500G",
      description: "Thick, creamy, and fresh homemade-style curd. Rich in probiotics and perfectly set.",
      category: "Dairy Products",
      type: "DAIRY",
      price: "40.00",
      unit: "500g",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1484244233201-29892afe6a2c?w=800", // Temporary
      isActive: true,
    },
    {
      name: "Full Cream Milk",
      sku: "MILK-FULL-1L",
      description: "Pure and fresh Full Cream Milk with high fat content. Ideal for tea, coffee, and traditional Indian sweets.",
      category: "Milk",
      type: "MILK",
      price: "60.00",
      unit: "1L",
      stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800", // Temporary
      isActive: true,
    },
    {
      name: "Paneer",
      sku: "DAIRY-PNR-250G",
      description: "Fresh and soft Malai Paneer. Made from pure milk, perfect for your favorite Indian curries.",
      category: "Dairy Products",
      type: "DAIRY",
      price: "120.00",
      unit: "250g",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800", // Temporary
      isActive: true,
    },
    {
      name: "Toned Milk",
      sku: "MILK-TONED-1L",
      description: "Fresh Toned Milk, balanced and nutritious. Perfect for daily consumption.",
      category: "Milk",
      type: "MILK",
      price: "54.00",
      unit: "1L",
      stock: 200,
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=800", // Temporary
      isActive: true,
    },
  ];

  for (const item of dairyProducts) {
    const existing = await db.select().from(products).where(eq(products.sku, item.sku));
    if (existing.length === 0) {
      console.log("Adding product: " + item.name);
      await db.insert(products).values(item as any);
    } else {
      console.log("Updating product: " + item.name);
      await db.update(products).set(item as any).where(eq(products.sku, item.sku));
    }
  }

  console.log("Done updating dairy products!");
}

updateProducts().catch(console.error);
