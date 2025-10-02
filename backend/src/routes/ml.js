// backend/src/routes/ml.js

import express from "express";
import axios from "axios";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
// import db from "../prisma/db.js";
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

      if (method === "db") {
        // 1️⃣ Get patientId from request
        const { patientId } = req.body;
        if (!patientId) {
          return res.status(400).json({ error: "patientId required" });
        }

        // 2️⃣ Fetch from Prisma/Postgres
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          include: { bloodMetals: { orderBy: { createdAt: "desc" } } },
        });

        if (!patient) {
          return res.status(404).json({ error: "Patient not found" });
        }

        // 3️⃣ Build payload to send to FastAPI
        payload = { features: patient };
      }

      // 4️⃣ Forward to FastAPI
      const response = await axios.post(
        `${process.env.ML_SERVICE_URL}/predict/${model}`,
        payload,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json(response.data);
    } catch (err) {
      console.error("Prediction service error:", err.message);
      res.status(500).json({
        error: "Prediction service error",
        details: err.response?.data || err.message,
      });
    }
  }
);

export default router;
