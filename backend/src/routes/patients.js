// routes/patients.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";

const router = express.Router();
const prisma = new PrismaClient();

// only approved doctors can use patient routes
router.use(verifyToken, requireRole("doctor"));

// ✅ Add a patient
router.post("/", audit("CREATE_PATIENT"), async (req, res) => {
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
    res
      .status(500)
      .json({ error: "Failed to add patient", details: String(error) });
  }
});

// ✅ Get all patients for logged-in doctor
router.get("/", audit("LIST_PATIENTS"), async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { doctorId: req.user.userId },
      include: { bloodMetals: true },
    });
    res.json(patients);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch patients", details: String(error) });
  }
});

// ✅ Get a single patient (verify ownership)
router.get("/:patientId", audit("READ_PATIENT"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: true },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (patient.doctorId !== req.user.userId)
      return res.status(403).json({ error: "Forbidden" });

    res.json(patient);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch patient", details: String(error) });
  }
});

export default router;
