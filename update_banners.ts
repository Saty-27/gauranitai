
import { db } from "./server/db";
import { banners } from "./shared/schema";
import { eq } from "drizzle-orm";

async function updateBanners() {
  console.log("Updating banners with working Unsplash URLs...");
  const bannerUpdates = [
    {
      id: 10,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1600",
      imageUrlTablet: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1024",
      imageUrlMobile: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=640",
    },
    {
      id: 11,
      imageUrl: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=1600",
      imageUrlTablet: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=1024",
      imageUrlMobile: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=640",
    },
    {
      id: 12,
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=1600",
      imageUrlTablet: "https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=1024",
      imageUrlMobile: "https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=640",
    }
  ];

  for (const update of bannerUpdates) {
    await db.update(banners)
      .set({
        imageUrl: update.imageUrl,
        imageUrlTablet: update.imageUrlTablet,
        imageUrlMobile: update.imageUrlMobile,
        updatedAt: new Date()
      })
      .where(eq(banners.id, update.id));
    console.log(`Updated banner ${update.id}`);
  }
  console.log("Banners updated!");
}

updateBanners().catch(console.error);
