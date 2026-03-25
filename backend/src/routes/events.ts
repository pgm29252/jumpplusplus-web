import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";

const router = Router();

const imageValueSchema = z.union([
  z.string().url("Image URL must be valid"),
  z
    .string()
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "Image data must be valid"),
]);

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: imageValueSchema.optional(),
  coverImageUrl: imageValueSchema.optional(),
  previewImageUrls: z.array(imageValueSchema).optional(),
  locationName: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  duration: z.number().int().positive().default(60),
  price: z.number().nonnegative().default(0),
  maxSlots: z.number().int().positive().default(1),
});

const updateEventSchema = createEventSchema.partial();

function getRouteId(id: string | string[]) {
  return Array.isArray(id) ? id[0] : id;
}

function getLocalUploadFilePath(url: string) {
  try {
    const parsed = new URL(url, "http://local");
    if (!parsed.pathname.startsWith("/uploads/events/")) return null;
    const fileName = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
    if (!fileName) return null;
    return path.join(process.cwd(), "uploads", "events", fileName);
  } catch {
    return null;
  }
}

function deleteLocalUploadByUrl(url: string) {
  const filePath = getLocalUploadFilePath(url);
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup failures to avoid blocking event updates.
  }
}

// GET /api/events/admin/all - List ALL events including inactive (Admin/Moderator only)
router.get(
  "/admin/all",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (_req: Request, res: Response) => {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        coverImageUrl: true,
        previewImageUrls: true,
        locationName: true,
        latitude: true,
        longitude: true,
        startDate: true,
        endDate: true,
        duration: true,
        price: true,
        maxSlots: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    });
    res.json({ success: true, events });
  },
);

// PATCH /api/events/:id/restore - Reactivate event (Admin/Moderator only)
router.patch(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const eventId = getRouteId(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdById: true,
        imageUrl: true,
        coverImageUrl: true,
        previewImageUrls: true,
      },
    });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.createdById !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { isActive: true },
    });

    res.json({ success: true, message: "Event restored" });
  },
);

// GET /api/events - List all active events
router.get("/", async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      coverImageUrl: true,
      previewImageUrls: true,
      locationName: true,
      latitude: true,
      longitude: true,
      startDate: true,
      endDate: true,
      duration: true,
      price: true,
      maxSlots: true,
      createdAt: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
  res.json({ success: true, events });
});

// GET /api/events/:id - Get event details
router.get("/:id", async (req: Request, res: Response) => {
  const eventId = getRouteId(req.params.id);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      coverImageUrl: true,
      previewImageUrls: true,
      locationName: true,
      latitude: true,
      longitude: true,
      startDate: true,
      endDate: true,
      duration: true,
      price: true,
      maxSlots: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
      bookings: {
        where: { status: "CONFIRMED" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!event) {
    res.status(404).json({ success: false, message: "Event not found" });
    return;
  }
  res.json({ success: true, event });
});

// POST /api/events - Create event (Admin/Moderator only)
router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const eventData = {
      ...parsed.data,
      startDate: parsed.data.startDate
        ? new Date(parsed.data.startDate)
        : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      createdById: req.user!.sub,
    };

    const event = await prisma.event.create({
      data: eventData,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        coverImageUrl: true,
        previewImageUrls: true,
        locationName: true,
        latitude: true,
        longitude: true,
        startDate: true,
        endDate: true,
        duration: true,
        price: true,
        maxSlots: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: "EVENT_CREATED",
        targetId: event.id,
        targetType: "EVENT",
        details: `Created event: ${event.title}`,
      },
    });

    res.status(201).json({ success: true, event });
  },
);

// PATCH /api/events/:id - Update event (Admin/Moderator only)
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const eventId = getRouteId(req.params.id);
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdById: true,
        imageUrl: true,
        coverImageUrl: true,
        previewImageUrls: true,
      },
    });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.createdById !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const updateData = {
      ...parsed.data,
      startDate: parsed.data.startDate
        ? new Date(parsed.data.startDate)
        : parsed.data.startDate,
      endDate: parsed.data.endDate
        ? new Date(parsed.data.endDate)
        : parsed.data.endDate,
    };

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        coverImageUrl: true,
        previewImageUrls: true,
        locationName: true,
        latitude: true,
        longitude: true,
        startDate: true,
        endDate: true,
        duration: true,
        price: true,
        maxSlots: true,
      },
    });

    const oldUrls = new Set<string>([
      ...(event.coverImageUrl ? [event.coverImageUrl] : []),
      ...(event.imageUrl ? [event.imageUrl] : []),
      ...(event.previewImageUrls ?? []),
    ]);
    const newUrls = new Set<string>([
      ...(updated.coverImageUrl ? [updated.coverImageUrl] : []),
      ...(updated.imageUrl ? [updated.imageUrl] : []),
      ...(updated.previewImageUrls ?? []),
    ]);

    for (const url of oldUrls) {
      if (!newUrls.has(url)) {
        deleteLocalUploadByUrl(url);
      }
    }

    res.json({ success: true, event: updated });
  },
);

// DELETE /api/events/:id - Deactivate event
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const eventId = getRouteId(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.createdById !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { isActive: false },
    });

    res.json({ success: true, message: "Event deactivated" });
  },
);

export default router;
