import { Router } from "express";
import { db } from "../db";
import { blogs } from "@shared/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/auth";
import { insertBlogSchema } from "@shared/schema";

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

// Admin List Blogs
router.get("/admin/blogs", requireAdminAccess, async (req, res) => {
  try {
    const list = await db.select().from(blogs).orderBy(desc(blogs.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error listing blogs:", error);
    res.status(500).json({ message: "Failed to list blogs." });
  }
});

// Admin Get Blog by ID
router.get("/admin/blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    if (!blog) return res.status(404).json({ message: "Blog not found." });
    res.json(blog);
  } catch (error) {
    console.error("Error getting blog:", error);
    res.status(500).json({ message: "Failed to get blog." });
  }
});

// Admin Create Blog
router.post("/admin/blogs", requireAdminAccess, async (req, res) => {
  try {
    const parsedData = insertBlogSchema.parse(req.body);
    let slug = parsedData.slug ? slugify(parsedData.slug) : slugify(parsedData.title);
    if (!slug) {
      return res.status(400).json({ message: "A valid title or slug is required to generate the URL." });
    }

    const [existing] = await db.select().from(blogs).where(eq(blogs.slug, slug));
    if (existing) {
      return res.status(400).json({ message: "This slug already exists. Please choose another slug." });
    }

    const [newBlog] = await db
      .insert(blogs)
      .values({
        ...parsedData,
        slug,
        status: parsedData.status || "Draft",
      })
      .returning();

    res.status(201).json(newBlog);
  } catch (error: any) {
    console.error("Error creating blog:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid blog data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create blog." });
  }
});

// Admin Update Blog
router.put("/admin/blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsedData = insertBlogSchema.partial().parse(req.body);
    
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    if (!blog) return res.status(404).json({ message: "Blog not found." });

    let slug = blog.slug;
    if (parsedData.slug || parsedData.title) {
      slug = slugify(parsedData.slug || parsedData.title || "");
      
      const [existing] = await db
        .select()
        .from(blogs)
        .where(and(eq(blogs.slug, slug), ne(blogs.id, id)));
      if (existing) {
        return res.status(400).json({ message: "This slug already exists. Please choose another slug." });
      }
    }

    const [updatedBlog] = await db
      .update(blogs)
      .set({
        ...parsedData,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    res.json(updatedBlog);
  } catch (error: any) {
    console.error("Error updating blog:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid blog data.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update blog." });
  }
});

// Admin Delete Blog
router.delete("/admin/blogs/:id", requireAdminAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await db.delete(blogs).where(eq(blogs.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ message: "Blog not found." });
    res.json({ success: true, message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Failed to delete blog." });
  }
});

// Public List Blogs
router.get("/blogs", async (req, res) => {
  try {
    const search = req.query.search as string;
    let list = await db.select().from(blogs).where(eq(blogs.status, "Published")).orderBy(desc(blogs.createdAt));
    
    if (search) {
      const searchLower = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.shortDescription.toLowerCase().includes(searchLower) ||
          b.content.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(list);
  } catch (error) {
    console.error("Error fetching public blogs:", error);
    res.status(500).json({ message: "Failed to fetch blogs." });
  }
});

// Public Get Blog by Slug
router.get("/blogs/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const [blog] = await db
      .select()
      .from(blogs)
      .where(and(eq(blogs.slug, slug), eq(blogs.status, "Published")));
      
    if (!blog) return res.status(404).json({ message: "Blog article not found." });
    
    const allBlogs = await db
      .select()
      .from(blogs)
      .where(and(eq(blogs.status, "Published"), ne(blogs.id, blog.id)))
      .limit(3);
      
    res.json({ blog, related: allBlogs });
  } catch (error) {
    console.error("Error fetching public blog detail:", error);
    res.status(500).json({ message: "Failed to fetch blog article." });
  }
});

export default router;
