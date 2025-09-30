// middleware/audit.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * audit(actionName)
 * Use as middleware after verifyToken/requireRole or on public endpoints.
 * Example: router.get("/:id", verifyToken, requireRole("doctor"), audit("READ_PATIENT"), handler)
 */
export function audit(action) {
  return async (req, res, next) => {
    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress;
      const ua = req.get("User-Agent") || "";
      const resource = req.params.patientId || req.originalUrl || null;
      const userId = req.user?.userId ?? null;

      await prisma.accessLog.create({
        data: {
          userId,
          action,
          resource: String(resource || ""),
          ipAddress: String(ip || ""),
          userAgent: ua,
        },
      });
    } catch (err) {
      // do not block request on audit failure; just console.warn
      console.warn("Audit log failed:", err);
    }
    next();
  };
}
