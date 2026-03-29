import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";

const router = Router();

const createBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  excerpt: z.string().max(280).optional(),
  content: z.string().min(30, "Content must be at least 30 characters"),
  coverImageUrl: z.string().url("Cover image URL must be valid").optional(),
  isPublished: z.boolean().optional(),
});

const updateBlogSchema = createBlogSchema.partial();

function getRouteId(id: string | string[]) {
  return Array.isArray(id) ? id[0] : id;
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createUniqueSlug(title: string) {
  const base = toSlug(title) || "blog-post";
  let slug = base;
  let counter = 1;

  while (true) {
    const exists = await prisma.blog.findUnique({ where: { slug } });
    if (!exists) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

function isBlogTableNotReady(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

// GET /api/blogs - Public blog feed
router.get("/", async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, blogs });
  } catch (error) {
    if (isBlogTableNotReady(error)) {
      res.status(503).json({
        success: false,
        message:
          "Blogs are not initialized yet. Run database migration and seed.",
      });
      return;
    }
    throw error;
  }
});

// GET /api/blogs/admin/all - List all blogs (Admin/Moderator)
router.get(
  "/admin/all",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      });

      res.json({ success: true, blogs });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

// GET /api/blogs/admin/:id - Get any blog by ID (Admin/Moderator, incl. private drafts)
router.get(
  "/admin/:id",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getRouteId(req.params.id);
    try {
      const blog = await prisma.blog.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      });

      if (!blog) {
        res.status(404).json({ success: false, message: "Blog not found" });
        return;
      }

      res.json({ success: true, blog });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

// GET /api/blogs/:idOrSlug - Public blog detail
router.get("/:idOrSlug", async (req: Request, res: Response) => {
  const raw = getRouteId(req.params.idOrSlug);

  try {
    const byIdOrSlug = await prisma.blog.findFirst({
      where: {
        isPublished: true,
        OR: [{ id: raw }, { slug: raw }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    if (!byIdOrSlug) {
      res.status(404).json({ success: false, message: "Blog not found" });
      return;
    }

    res.json({ success: true, blog: byIdOrSlug });
  } catch (error) {
    if (isBlogTableNotReady(error)) {
      res.status(503).json({
        success: false,
        message:
          "Blogs are not initialized yet. Run database migration and seed.",
      });
      return;
    }
    throw error;
  }
});

// POST /api/blogs - Create blog (Admin/Moderator)
router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createBlogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const slug = await createUniqueSlug(parsed.data.title);

      const blog = await prisma.blog.create({
        data: {
          title: parsed.data.title,
          slug,
          excerpt: parsed.data.excerpt,
          content: parsed.data.content,
          coverImageUrl: parsed.data.coverImageUrl,
          isPublished: parsed.data.isPublished ?? true,
          authorId: req.user!.sub,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: "BLOG_CREATED",
          targetId: blog.id,
          targetType: "BLOG",
          details: `Created blog: ${blog.title}`,
        },
      });

      res.status(201).json({ success: true, blog });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

// PATCH /api/blogs/:id - Update blog (Admin/Moderator)
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getRouteId(req.params.id);
    const parsed = updateBlogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: "Blog not found" });
        return;
      }

      let slug = existing.slug;
      if (parsed.data.title && parsed.data.title !== existing.title) {
        slug = await createUniqueSlug(parsed.data.title);
      }

      const blog = await prisma.blog.update({
        where: { id },
        data: {
          title: parsed.data.title,
          slug,
          excerpt: parsed.data.excerpt,
          content: parsed.data.content,
          coverImageUrl: parsed.data.coverImageUrl,
          isPublished: parsed.data.isPublished,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: "BLOG_UPDATED",
          targetId: blog.id,
          targetType: "BLOG",
          details: `Updated blog: ${blog.title}`,
        },
      });

      res.json({ success: true, blog });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

// POST /api/blogs/:id/duplicate - Duplicate blog (Admin/Moderator)
router.post(
  "/:id/duplicate",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getRouteId(req.params.id);
    try {
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: "Blog not found" });
        return;
      }

      const newTitle = `Copy of ${existing.title}`;
      const slug = await createUniqueSlug(newTitle);

      const blog = await prisma.blog.create({
        data: {
          title: newTitle,
          slug,
          excerpt: existing.excerpt,
          content: existing.content,
          coverImageUrl: existing.coverImageUrl,
          isPublished: false,
          authorId: req.user!.sub,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: "BLOG_DUPLICATED",
          targetId: blog.id,
          targetType: "BLOG",
          details: `Duplicated blog from "${existing.title}" → "${blog.title}"`,
        },
      });

      res.status(201).json({ success: true, blog });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

// DELETE /api/blogs/:id - Remove blog (Admin/Moderator)
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = getRouteId(req.params.id);
    try {
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: "Blog not found" });
        return;
      }

      await prisma.blog.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.sub,
          action: "BLOG_DELETED",
          targetId: id,
          targetType: "BLOG",
          details: `Deleted blog: ${existing.title}`,
        },
      });

      res.json({ success: true, message: "Blog removed successfully" });
    } catch (error) {
      if (isBlogTableNotReady(error)) {
        res.status(503).json({
          success: false,
          message:
            "Blogs are not initialized yet. Run database migration and seed.",
        });
        return;
      }
      throw error;
    }
  },
);

export default router;
