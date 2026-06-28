import { Router } from "express";
import { db } from "../db";
import { videoBlogs } from "@shared/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import { insertVideoBlogSchema } from "@shared/schema";

const router = Router();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const convertToEmbedUrl = (url: string, type: string) => {
  if (!url) return "";
  const typeLower = type.toLowerCase();
  
  if (typeLower === "youtube") {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
  } else if (typeLower === "vimeo") {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regExp);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  return url;
};

// Admin List Video Blogs
router.get("/admin/video-blogs", requireAdminAccess, async (req, res) => {
  try {
    const list = await db.select().from(videoBlogs).orderBy(desc(videoBlogs.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error listing video blogs:", error);
    res.status(500).json({ message: "Failed to list video blogs." });
  }
});

// Admin Get Video Blog by ID
router.get("/admin/video-blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [blog] = await db.select().from(videoBlogs).where(eq(videoBlogs.id, id));
    if (!blog) return res.status(404).json({ message: "Video blog not found." });
    res.json(blog);
  } catch (error) {
    console.error("Error getting video blog:", error);
    res.status(500).json({ message: "Failed to get video blog." });
  }
});

// Admin Create Video Blog
router.post("/admin/video-blogs", requireAdminAccess, async (req, res) => {
  try {
    const parsedData = insertVideoBlogSchema.parse(req.body);
    let slug = parsedData.slug ? slugify(parsedData.slug) : slugify(parsedData.title);
    if (!slug) {
      return res.status(400).json({ message: "A valid title or slug is required to generate the URL." });
    }

    const [existing] = await db.select().from(videoBlogs).where(eq(videoBlogs.slug, slug));
    if (existing) {
      return res.status(400).json({ message: "This slug already exists. Please choose another slug." });
    }

    // Convert video URL if YouTube or Vimeo
    let videoUrl = parsedData.videoUrl || "";
    if (parsedData.videoType) {
      videoUrl = convertToEmbedUrl(videoUrl, parsedData.videoType);
    }

    const [newBlog] = await db
      .insert(videoBlogs)
      .values({
        ...parsedData,
        slug,
        videoUrl,
        status: parsedData.status || "Draft",
      })
      .returning();

    res.status(201).json(newBlog);
  } catch (error: any) {
    console.error("Error creating video blog:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid video blog data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create video blog." });
  }
});

// Admin Update Video Blog
router.put("/admin/video-blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsedData = insertVideoBlogSchema.partial().parse(req.body);
    
    const [blog] = await db.select().from(videoBlogs).where(eq(videoBlogs.id, id));
    if (!blog) return res.status(404).json({ message: "Video blog not found." });

    let slug = blog.slug;
    if (parsedData.slug || parsedData.title) {
      slug = slugify(parsedData.slug || parsedData.title || "");
      
      const [existing] = await db
        .select()
        .from(videoBlogs)
        .where(and(eq(videoBlogs.slug, slug), ne(videoBlogs.id, id)));
      if (existing) {
        return res.status(400).json({ message: "This slug already exists. Please choose another slug." });
      }
    }

    // Convert video URL if videoType/videoUrl is updated
    let videoUrl = parsedData.videoUrl !== undefined ? parsedData.videoUrl : blog.videoUrl;
    const videoType = parsedData.videoType || blog.videoType;
    if (videoUrl && videoType) {
      videoUrl = convertToEmbedUrl(videoUrl, videoType);
    }

    const [updatedBlog] = await db
      .update(videoBlogs)
      .set({
        ...parsedData,
        slug,
        videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(videoBlogs.id, id))
      .returning();

    res.json(updatedBlog);
  } catch (error: any) {
    console.error("Error updating video blog:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid video blog data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update video blog." });
  }
});

// Admin Delete Video Blog
router.delete("/admin/video-blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db.delete(videoBlogs).where(eq(videoBlogs.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ message: "Video blog not found." });
    res.json({ success: true, message: "Video blog deleted successfully." });
  } catch (error) {
    console.error("Error deleting video blog:", error);
    res.status(500).json({ message: "Failed to delete video blog." });
  }
});

// Public List Video Blogs
router.get("/video-blogs", async (req, res) => {
  try {
    const search = req.query.search as string;
    let list = await db.select().from(videoBlogs).where(eq(videoBlogs.status, "Published")).orderBy(desc(videoBlogs.createdAt));
    
    if (search) {
      const searchLower = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.shortDescription.toLowerCase().includes(searchLower) ||
          (b.content && b.content.toLowerCase().includes(searchLower))
      );
    }
    
    res.json(list);
  } catch (error) {
    console.error("Error fetching public video blogs:", error);
    res.status(500).json({ message: "Failed to fetch video blogs." });
  }
});

// Public Get Video Blog by Slug
router.get("/video-blogs/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const [blog] = await db
      .select()
      .from(videoBlogs)
      .where(and(eq(videoBlogs.slug, slug), eq(videoBlogs.status, "Published")));
      
    if (!blog) return res.status(404).json({ message: "Video blog not found." });
    
    const allBlogs = await db
      .select()
      .from(videoBlogs)
      .where(and(eq(videoBlogs.status, "Published"), ne(videoBlogs.id, blog.id)))
      .limit(3);
      
    res.json({ blog, related: allBlogs });
  } catch (error) {
    console.error("Error fetching public video blog detail:", error);
    res.status(500).json({ message: "Failed to fetch video blog." });
  }
});

export default router;
