// routes/bloodMetals.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole("doctor"));

// Add a new blood metals report for a patient
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

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (patient.doctorId !== req.user.userId)
      return res.status(403).json({ error: "Forbidden" });

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

    // 🔹 Fetch full patient with features
    const fullPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: { orderBy: { createdAt: "desc" } } },
    });

    // 🔹 Call FastAPI prediction service
    try {
      // hormone (all 3 in one call)
      await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/hormone`,
        { features: fullPatient },
        { headers: { Authorization: req.headers.authorization } }
      );

      // infertility
      await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/infertility`,
        { features: fullPatient },
        { headers: { Authorization: req.headers.authorization } }
      );

      // menstrual
      await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/menstrual`,
        { features: fullPatient },
        { headers: { Authorization: req.headers.authorization } }
      );

      // menopause
      await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/menopause`,
        { features: fullPatient },
        { headers: { Authorization: req.headers.authorization } }
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

// Get all blood metals reports for a patient
router.get("/:patientId", audit("LIST_BLOODMETALS"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (patient.doctorId !== req.user.userId)
      return res.status(403).json({ error: "Forbidden" });

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

export default router;
