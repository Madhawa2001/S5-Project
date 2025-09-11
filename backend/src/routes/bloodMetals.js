import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken);

// ✅ Add a new blood metals report for a patient
router.post("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      lead_umolL,
      mercury_umolL,
      cadmium_umolL,
      selenium_umolL,
      manganese_umolL,
    } = req.body;

    const bloodMetals = await prisma.bloodMetals.create({
      data: {
        patientId,
        lead_umolL,
        mercury_umolL,
        cadmium_umolL,
        selenium_umolL,
        manganese_umolL,
      },
    });

    res.json(bloodMetals);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add blood metals", details: error });
  }
});

// ✅ Get all blood metals reports for a patient
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const reports = await prisma.bloodMetals.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch blood metals", details: error });
  }
});

export default router;
