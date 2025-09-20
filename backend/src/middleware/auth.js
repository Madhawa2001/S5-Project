// middleware/auth.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    // payload contains userId, email, roles
    req.user = payload;
    next();
  });
}

/**
 * requireRole(...roles)
 * Usage: router.get("/", verifyToken, requireRole("doctor"))
 */
export function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ error: "Unauthorized" });

    // fetch user to check isActive and DB roles (single source of truth)
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!dbUser) return res.status(401).json({ error: "User not found" });
    if (!dbUser.isActive)
      return res.status(403).json({ error: "Account not active" });

    const userRoles = (dbUser.roles || []).map((ur) => ur.role?.name);

    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed)
      return res.status(403).json({ error: "Forbidden: insufficient role" });

    // attach full DB user for handlers
    req.dbUser = dbUser;
    next();
  };
}
