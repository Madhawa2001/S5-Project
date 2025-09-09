import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken);

// Add patient
router.post("/", async (req, res) => {
  const { name, age, diagnosis } = req.body;
  const patient = await prisma.patient.create({
    data: { name, age, diagnosis, doctorId: req.user.userId },
  });
  res.json(patient);
});

// Get all patients for logged-in doctor
router.get("/", async (req, res) => {
  const patients = await prisma.patient.findMany({
    where: { doctorId: req.user.userId },
  });
  res.json(patients);
});

export default router;
