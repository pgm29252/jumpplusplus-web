import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();
router.use(authenticate);

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// GET /api/users — Admin only: list all users
router.get(
  "/",
  requireRole("ADMIN"),
  async (_req: AuthenticatedRequest, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, users });
  },
);

// GET /api/users/stats — Admin only
router.get(
  "/stats",
  requireRole("ADMIN"),
  async (_req: AuthenticatedRequest, res: Response) => {
    const [total, admins, mods, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MODERATOR" } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    res.json({
      success: true,
      stats: { total, admins, moderators: mods, active },
    });
  },
);

// GET /api/users/:id — Admin or self
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdminOrMod = ["ADMIN", "MODERATOR"].includes(req.user!.role);
  if (!isAdminOrMod && req.user!.sub !== id) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json({ success: true, user });
});

// PATCH /api/users/:id — Admin or self (role update: Admin only)
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user!.role === "ADMIN";
  const isSelf = req.user!.sub === id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { role, isActive, password, ...rest } = parsed.data;

  // Only admin can change role or activation status
  if ((role !== undefined || isActive !== undefined) && !isAdmin) {
    res
      .status(403)
      .json({
        success: false,
        message: "Only admins can change role or status",
      });
    return;
  }

  const updateData: Record<string, unknown> = { ...rest };
  if (isAdmin && role !== undefined) updateData.role = role;
  if (isAdmin && isActive !== undefined) updateData.isActive = isActive;
  if (password) updateData.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.sub,
      action: "UPDATE_USER",
      target: id,
      metadata: { fields: Object.keys(updateData) },
    },
  });

  res.json({ success: true, user });
});

// DELETE /api/users/:id — Admin only
router.delete(
  "/:id",
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (req.user!.sub === id) {
      res
        .status(400)
        .json({ success: false, message: "Cannot delete your own account" });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { userId: req.user!.sub, action: "DELETE_USER", target: id },
    });

    res.json({ success: true, message: "User deleted successfully" });
  },
);

export default router;
