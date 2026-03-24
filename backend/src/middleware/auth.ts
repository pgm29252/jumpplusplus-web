import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../lib/jwt";

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required" });
    return;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
