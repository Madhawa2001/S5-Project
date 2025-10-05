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
      dob,
      gender,
      heightCm,
      weightKg,
      pregnancyCount,
      pregnancyStatus,
      diagnosis,
      doctorId, // optional for nurse
    } = req.body;

    const userRoles = req.dbUser.roles.map((r) => r.role.name);

    // If logged-in user is a doctor, auto-assign them
    let assignedDoctorId = doctorId;
    if (userRoles.includes("doctor")) {
      assignedDoctorId = req.user.userId;
    }

    // Parse and calculate
    const parsedDob = new Date(dob);
    const now = new Date();

    let ageYears = null;
    let ageMonths = null;
    if (!isNaN(parsedDob)) {
      const diffMs = now - parsedDob;
      const diffDate = new Date(diffMs);
      ageYears = diffDate.getUTCFullYear() - 1970;
      ageMonths = now.getMonth() - parsedDob.getMonth();
      if (ageMonths < 0) {
        ageMonths += 12;
      }
    }

    const parsedHeight = heightCm ? parseFloat(heightCm) : null;
    const parsedWeight = weightKg ? parseFloat(weightKg) : null;
    const bmi =
      parsedHeight && parsedWeight
        ? parsedWeight / (parsedHeight / 100) ** 2
        : null;

    // Prepare Prisma data
    const patientData = {
      name,
      dob: parsedDob,
      gender,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      bmi,
      ageYears,
      ageMonths,
      pregnancyCount: pregnancyCount ? parseInt(pregnancyCount) : null,
      pregnancyStatus: pregnancyStatus ?? null,
      diagnosis,
      doctor: assignedDoctorId
        ? { connect: { id: assignedDoctorId } }
        : undefined,
    };

    const patient = await prisma.patient.create({ data: patientData });

    res.json(patient);
  } catch (error) {
    console.error("❌ Error creating patient:", error);
    res.status(500).json({
      error: "Failed to add patient",
      details: String(error),
    });
  }
});

/**
 * ✅ List all patients
 */
router.get("/", audit("LIST_PATIENTS"), async (req, res) => {
  try {
    const userRoles = req.dbUser.roles.map((r) => r.role.name);
    let whereClause = {};

    if (userRoles.includes("doctor")) {
      whereClause = { doctorId: req.user.userId };
    } else if (userRoles.includes("nurse")) {
      whereClause = {};
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        bloodMetals: true,
        doctor: { select: { name: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
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
 * ✅ Get a single patient
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

    const data = { ...req.body };
    if (data.dob) data.dob = new Date(data.dob); // ensure date object

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "Failed to update patient",
      details: String(error),
    });
  }
});

/**
 * ✅ Delete patient
 * - Doctor can delete only their own
 * - Nurse can delete any
 */
router.delete("/:patientId", audit("DELETE_PATIENT"), async (req, res) => {
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

    await prisma.bloodMetals.deleteMany({ where: { patientId } });
    await prisma.prediction.deleteMany({ where: { patientId } });
    await prisma.patient.delete({ where: { id: patientId } });

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete patient",
      details: String(error),
    });
  }
});

export default router;
