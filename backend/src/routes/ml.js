// routes/predict.js
import express from "express";
import axios from "axios";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  "/:model/:method",
  verifyToken,
  requireRole("doctor"),
  audit("PREDICT"),
  async (req, res) => {
    try {
      const { model, method } = req.params;
      let payload = req.body;

      // If method === "db" we must fetch patient from the DB and build features here (per your request)
      if (method === "db") {
        const { patientId } = req.body;
        if (!patientId)
          return res.status(400).json({ error: "patientId required" });

        // fetch patient and latest bloodMetals (if any). Adjust include fields if your patient has more features.
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          include: { bloodMetals: { orderBy: { createdAt: "desc" }, take: 1 } },
        });

        if (!patient)
          return res.status(404).json({ error: "Patient not found" });

        const latestBloodMetals =
          patient.bloodMetals && patient.bloodMetals.length
            ? patient.bloodMetals[0]
            : null;

        // Build features dict to send to ML service.
        // IMPORTANT: we simply merge patient fields + latestBloodMetals fields.
        // Your DB must store feature column-names that match what the model expects (e.g. "RIDAGEMN", "RIAGENDR", etc.)
        // If your DB uses different names, add mapping logic here.
        const features = {
          ...patient,
          ...(latestBloodMetals || {}),
        };

        // remove Prisma metadata fields that ML service doesn't need
        // (id fields for relations, createdAt, updatedAt, etc.)
        delete features.id;
        delete features.createdAt;
        delete features.updatedAt;
        delete features.doctorId;
        delete features.bloodMetals; // it's nested array

        payload = { features };
      }

      // forward to fastapi
      const response = await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/${model}/${method}`,
        payload,
        { headers: { Authorization: req.headers.authorization } }
      );

      return res.json(response.data);
    } catch (err) {
      console.error(
        "Prediction service error:",
        err?.response?.data || err.message
      );
      res.status(500).json({
        error: "Prediction service error",
        details: err.response?.data || err.message,
      });
    }
  }
);

export default router;
