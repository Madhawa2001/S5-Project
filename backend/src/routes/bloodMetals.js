import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken);

// Add blood metals for a patient
router.post("/:patientId", async (req, res) => {
  const { patientId } = req.params;
  const { lead, mercury, cadmium, arsenic, chromium } = req.body;

  const bloodMetals = await prisma.bloodMetals.create({
    data: { patientId, lead, mercury, cadmium, arsenic, chromium },
  });

  res.json(bloodMetals);
});

// Get blood metals for a patient
router.get("/:patientId", async (req, res) => {
  const { patientId } = req.params;
  const bloodMetals = await prisma.bloodMetals.findUnique({
    where: { patientId },
  });
  res.json(bloodMetals);
});

export default router;
