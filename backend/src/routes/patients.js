import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken);

// ✅ Add a patient
router.post("/", async (req, res) => {
  try {
    const {
      name,
      ageYears,
      ageMonths,
      gender,
      pregnancyCount,
      pregnancyStatus,
      diagnosis,
    } = req.body;

    const patient = await prisma.patient.create({
      data: {
        name,
        ageYears,
        ageMonths,
        gender,
        pregnancyCount,
        pregnancyStatus,
        diagnosis,
        doctorId: req.user.userId,
      },
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to add patient", details: error });
  }
});

// ✅ Get all patients for logged-in doctor
router.get("/", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { doctorId: req.user.userId },
      include: { bloodMetals: true }, // ✅ include reports if needed
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patients", details: error });
  }
});

// ✅ Get a single patient (with reports)
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: true },
    });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient", details: error });
  }
});

export default router;
