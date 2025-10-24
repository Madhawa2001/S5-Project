// routes/bloodMetals.js
import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole("doctor", "nurse"));

/**
 * Add a new blood metals report for a patient
 * - Doctor can add for their own patients
 * - Nurse can add for any patient
 */
router.post("/:patientId", audit("CREATE_BLOODMETALS"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      lead_umolL,
      mercury_umolL,
      cadmium_umolL,
      selenium_umolL,
      manganese_umolL,
    } = req.body;

    const userRoles = req.dbUser.roles.map((r) => r.role.name);
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    //  Doctors can only modify their own patients
    if (userRoles.includes("doctor") && patient.doctorId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

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

    //  Fetch full patient with features
    const fullPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: { orderBy: { createdAt: "desc" } } },
    });

    //  Auto-trigger prediction service
    try {
      const endpoints = ["hormone", "infertility", "menstrual", "menopause"];
      await Promise.all(
        endpoints.map((ep) =>
          axios.post(
            `${process.env.ML_SERVICE_URL}/predict/${ep}`,
            { features: fullPatient },
            { headers: { Authorization: req.headers.authorization } }
          )
        )
      );
    } catch (err) {
      console.error("Auto prediction failed:", err.message);
    }

    res.json(bloodMetals);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add blood metals", details: String(error) });
  }
});

/**
 * Get all blood metals reports for a patient
 * - Doctor: only their patients
 * - Nurse: any patient
 */
router.get("/:patientId", audit("LIST_BLOODMETALS"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const userRoles = req.dbUser.roles.map((r) => r.role.name);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    if (userRoles.includes("doctor") && patient.doctorId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const reports = await prisma.bloodMetals.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    res.json(reports);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch blood metals", details: String(error) });
  }
});

/**
 *  Delete a blood metals record
 * - Doctor: can delete only their own patient's data
 * - Nurse: can delete any
 */
router.delete("/:id", audit("DELETE_BLOODMETALS"), async (req, res) => {
  try {
    const { id } = req.params;
    const userRoles = req.dbUser.roles.map((r) => r.role.name);

    const record = await prisma.bloodMetals.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!record) return res.status(404).json({ error: "Record not found" });

    if (
      userRoles.includes("doctor") &&
      record.patient.doctorId !== req.user.userId
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.bloodMetals.delete({ where: { id } });

    res.json({ message: "Blood metals record deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete blood metals", details: String(error) });
  }
});

export default router;
