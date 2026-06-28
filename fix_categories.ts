
import { db } from "./server/db";
import { categories } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixCategories() {
  console.log("Fixing categories...");
  const cats = [
    { name: "Milk", description: "Fresh and pure milk from our farms.", icon: "🥛" },
    { name: "Dairy Products", description: "Fresh dairy products including curd, buttermilk, and paneer.", icon: "🧀" },
    { name: "Cold Pressed Oils", description: "Authentic Indian cold pressed oils extracted using traditional methods.", icon: "🫗" }
  ];

  for (const cat of cats) {
    const existing = await db.select().from(categories).where(eq(categories.name, cat.name));
    if (existing.length === 0) {
      console.log("Adding category: " + cat.name);
      await db.insert(categories).values(cat);
    } else {
      console.log("Category already exists: " + cat.name);
    }
  }
  console.log("Categories fixed!");
}

fixCategories().catch(console.error);
