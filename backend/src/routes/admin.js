// routes/admin.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// all admin routes require admin role
router.use(verifyToken, requireRole("admin"));

// ✅ List users pending approval
router.get("/pending", async (req, res) => {
  const pending = await prisma.user.findMany({
    where: { isActive: false },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(pending);
});

// ✅ Approve a user
router.post("/approve/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    res.json({
      message: "User approved",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Unable to approve user", details: String(err) });
  }
});

// ✅ Assign role to a user
router.post("/assign-role", async (req, res) => {
  const { userId, roleName } = req.body;
  if (!userId || !roleName)
    return res.status(400).json({ error: "userId and roleName required" });

  try {
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleName } });
    }

    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId: role.id },
    });
    if (existing) return res.json({ message: "Role already assigned" });

    const userRole = await prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    res.json({ message: "Role assigned", userRole });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Unable to assign role", details: String(err) });
  }
});

// ✅ View access logs
router.get("/logs", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1"));
  const pageSize = Math.min(100, parseInt(req.query.pageSize || "50"));

  const logs = await prisma.accessLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  res.json({ page, pageSize, logs });
});

export default router;
