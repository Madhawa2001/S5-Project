// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import passport from "passport";
import dotenv from "dotenv";
import { generateTokens } from "../utils/generateTokens.js";
import { authLimiter } from "../middleware/rateLimit.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// apply rate limit to auth endpoints
router.use(authLimiter);

// ✅ Register (manual doctor signup -> unauthorized role)
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  try {
    const hashed = await bcrypt.hash(password, 10);

    // find unauthorized role
    const role = await prisma.role.findUnique({
      where: { name: "unauthorized" },
    });
    if (!role)
      return res.status(500).json({ error: "Unauthorized role not seeded" });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        isActive: false, // must be approved
        roles: {
          create: [{ roleId: role.id }],
        },
      },
    });

    res.json({
      message: "Registered. Wait for admin approval.",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(400).json({
      error: "User already exists or invalid data",
      details: String(err),
    });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });

  if (!user || !user.password)
    return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  if (!user.isActive)
    return res.status(403).json({ error: "Account not yet approved" });

  const tokens = generateTokens(user);
  res.json(tokens);
});

// ✅ Google OAuth (start)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { roles: { include: { role: true } } },
    });

    if (!user.isActive) {
      return res.status(403).json({ error: "Account pending approval" });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  }
);

export default router;
