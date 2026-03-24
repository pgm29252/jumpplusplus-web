import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  locationName: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  duration: z.number().int().positive().default(60),
  price: z.number().nonnegative().default(0),
  maxSlots: z.number().int().positive().default(1),
});

const updateEventSchema = createEventSchema.partial();

function getRouteId(id: string | string[]) {
  return Array.isArray(id) ? id[0] : id;
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
        locationName: true,
        latitude: true,
        longitude: true,
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
      locationName: true,
      latitude: true,
      longitude: true,
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
      locationName: true,
      latitude: true,
      longitude: true,
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

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        createdById: req.user!.sub,
      },
      select: {
        id: true,
        title: true,
        description: true,
        locationName: true,
        latitude: true,
        longitude: true,
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
    });
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (event.createdById !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: parsed.data,
      select: {
        id: true,
        title: true,
        description: true,
        locationName: true,
        latitude: true,
        longitude: true,
        duration: true,
        price: true,
        maxSlots: true,
      },
    });

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
