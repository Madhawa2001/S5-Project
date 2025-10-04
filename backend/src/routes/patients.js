import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";

const router = express.Router();
const prisma = new PrismaClient();

// both doctors and nurses can access patient routes
router.use(verifyToken, requireRole("doctor", "nurse"));

/**
 * ✅ Add a patient
 * - Nurse can create patient without doctor assignment
 * - Doctor can create patient assigned to themselves
 */
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
      doctorId, // optional for nurse
    } = req.body;

    const userRoles = req.dbUser.roles.map((r) => r.role.name);

    // if doctor, auto-assign themselves
    let assignedDoctorId = doctorId;
    if (userRoles.includes("doctor")) {
      assignedDoctorId = req.user.userId;
    }

    // ✅ CORRECTED PART STARTS HERE
    const patientData = {
      name,
      ageYears,
      ageMonths,
      gender,
      pregnancyCount,
      pregnancyStatus,
      diagnosis,
    };

    // If there's a doctor to assign, add the 'connect' object
    if (assignedDoctorId) {
      patientData.doctor = {
        connect: {
          id: assignedDoctorId,
        },
      };
    }

    const patient = await prisma.patient.create({
      data: patientData,
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({
      error: "Failed to add patient",
      details: String(error),
    });
  }
});

/**
 * ✅ List all patients
 * - Doctors see their own patients
 * - Nurses see all patients (or optionally: unassigned + assigned)
 */
router.get("/", audit("LIST_PATIENTS"), async (req, res) => {
  try {
    const userRoles = req.dbUser.roles.map((r) => r.role.name);
    let whereClause = {};

    if (userRoles.includes("doctor")) {
      whereClause = { doctorId: req.user.userId };
    } else if (userRoles.includes("nurse")) {
      // nurse can view all
      whereClause = {};
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        bloodMetals: true,
        doctor: { select: { name: true, id: true } },
      },
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch patients",
      details: String(error),
    });
  }
});

/**
 * ✅ Get available doctors
 * (for nurse to assign one to a patient)
 */
router.get(
  "/available-doctors",
  audit("LIST_DOCTORS"),
  requireRole("nurse"),
  async (req, res) => {
    try {
      const doctors = await prisma.user.findMany({
        where: {
          roles: { some: { role: { name: "doctor" } } },
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });
      res.json(doctors);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch doctors",
        details: String(error),
      });
    }
  }
);

/**
 * ✅ Assign doctor to a patient
 * (nurse only)
 */
router.patch(
  "/:patientId/assign-doctor",
  audit("ASSIGN_DOCTOR"),
  requireRole("nurse"),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { doctorId } = req.body;

      const doctor = await prisma.user.findFirst({
        where: {
          id: doctorId,
          roles: { some: { role: { name: "doctor" } } },
        },
      });
      if (!doctor) return res.status(400).json({ error: "Invalid doctor ID" });

      const updated = await prisma.patient.update({
        where: { id: patientId },
        data: { doctorId },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({
        error: "Failed to assign doctor",
        details: String(error),
      });
    }
  }
);

/**
 * ✅ Get a single patient (doctor can only see their own)
 * Nurses can see any
 */
router.get("/:patientId", audit("READ_PATIENT"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: true, doctor: true },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const userRoles = req.dbUser.roles.map((r) => r.role.name);
    if (userRoles.includes("doctor") && patient.doctorId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch patient",
      details: String(error),
    });
  }
});

/**
 * ✅ Update patient record
 * Nurses can update any
 * Doctors can update only their patients
 */
router.put("/:patientId", audit("UPDATE_PATIENT"), async (req, res) => {
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

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "Failed to update patient",
      details: String(error),
    });
  }
});

export default router;
