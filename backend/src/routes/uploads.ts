import { Router, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads", "events");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/events",
  authenticate,
  requireRole("ADMIN", "MODERATOR"),
  upload.array("images", 10),
  (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = files.map(
      (file) =>
        `${baseUrl}/uploads/events/${encodeURIComponent(file.filename)}`,
    );

    res.status(201).json({ success: true, urls });
  },
);

export default router;
