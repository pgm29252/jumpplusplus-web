import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";

const router = Router();

const createBookingSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
  startTime: z.string().datetime("Invalid datetime"),
  notes: z.string().optional(),
});

function getRouteId(id: string | string[]) {
  return Array.isArray(id) ? id[0] : id;
}

// GET /api/bookings - List user's bookings
router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.sub },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            locationName: true,
            latitude: true,
            longitude: true,
            startDate: true,
            endDate: true,
            duration: true,
            price: true,
            createdBy: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
    res.json({ success: true, bookings });
  },
);

// GET /api/bookings/admin/all - List all bookings (Admin only)
router.get(
  "/admin/all",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== "ADMIN" && req.user!.role !== "MODERATOR") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        event: {
          select: {
            id: true,
            title: true,
            locationName: true,
            latitude: true,
            longitude: true,
            startDate: true,
            endDate: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });
    res.json({ success: true, bookings });
  },
);

// GET /api/bookings/:id - Get booking details
router.get(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getRouteId(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        userId: true,
        event: {
          select: {
            id: true,
            title: true,
            locationName: true,
            latitude: true,
            longitude: true,
            startDate: true,
            endDate: true,
            duration: true,
            price: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Check authorization
    if (
      booking.userId !== req.user!.sub &&
      req.user!.role !== "ADMIN" &&
      req.user!.role !== "MODERATOR"
    ) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    res.json({ success: true, booking });
  },
);

// POST /api/bookings - Create booking
router.post(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      select: {
        id: true,
        duration: true,
        maxSlots: true,
        isActive: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!event || !event.isActive) {
      res
        .status(404)
        .json({ success: false, message: "Event not found or inactive" });
      return;
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(startTime.getTime() + event.duration * 60000);

    // Validate startTime is within the event's date range (if set)
    if (event.startDate && startTime < event.startDate) {
      res.status(400).json({
        success: false,
        message: `Booking must be on or after the event start date (${event.startDate.toISOString().split("T")[0]})`,
      });
      return;
    }
    if (event.endDate && startTime > event.endDate) {
      res.status(400).json({
        success: false,
        message: `Booking must be on or before the event end date (${event.endDate.toISOString().split("T")[0]})`,
      });
      return;
    }

    // Check for conflicting bookings
    const conflicting = await prisma.booking.count({
      where: {
        eventId: parsed.data.eventId,
        status: "CONFIRMED",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflicting >= event.maxSlots) {
      res
        .status(409)
        .json({ success: false, message: "This time slot is fully booked" });
      return;
    }

    // Check if user already has booking for this time
    const existing = await prisma.booking.findFirst({
      where: {
        userId: req.user!.sub,
        eventId: parsed.data.eventId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "You already have a booking for this time",
      });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        eventId: parsed.data.eventId,
        userId: req.user!.sub,
        startTime,
        endTime,
        notes: parsed.data.notes,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        event: { select: { id: true, title: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: "BOOKING_CREATED",
        targetId: booking.id,
        targetType: "BOOKING",
        details: `Booked: ${booking.event.title}`,
      },
    });

    res.status(201).json({ success: true, booking });
  },
);

// PATCH /api/bookings/:id/cancel - Cancel booking
router.patch(
  "/:id/cancel",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getRouteId(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        status: true,
        event: { select: { title: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    if (booking.userId !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    if (booking.status === "CANCELLED") {
      res
        .status(400)
        .json({ success: false, message: "Booking is already cancelled" });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      select: {
        id: true,
        status: true,
        startTime: true,
        event: { select: { title: true } },
      },
    });

    res.json({ success: true, booking: updated });
  },
);

// PATCH /api/bookings/:id/admin-cancel - Admin/Moderator cancel any booking
router.patch(
  "/:id/admin-cancel",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getRouteId(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        userId: true,
        event: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    if (booking.status === "CANCELLED") {
      res
        .status(400)
        .json({ success: false, message: "Booking is already cancelled" });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      select: {
        id: true,
        status: true,
        startTime: true,
        user: { select: { id: true, name: true, email: true } },
        event: { select: { title: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: "BOOKING_ADMIN_CANCELLED",
        targetId: bookingId,
        targetType: "BOOKING",
        details: `Admin cancelled booking for ${booking.user?.name ?? "user"} on ${booking.event.title}`,
      },
    });

    res.json({ success: true, booking: updated });
  },
);

export default router;
