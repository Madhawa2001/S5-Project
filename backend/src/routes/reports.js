// routes/reports.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole("doctor"));

// Generate patient health report
router.get("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { bloodMetals: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const predictions = await prisma.prediction.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });

    // Keep only latest per model
    const latestPreds = {};
    for (const p of predictions) {
      if (!latestPreds[p.model]) latestPreds[p.model] = p;
    }

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${patientId}.pdf`
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .text("Patient Health Prediction Report", { align: "center" });
    doc.moveDown();

    // Patient Info
    doc.fontSize(12).text(`Patient ID: ${patient.id}`);
    doc.text(`Name: ${patient.name}`);
    doc.text(`Age: ${patient.ageYears}y ${patient.ageMonths || 0}m`);
    doc.text(`Gender: ${patient.gender}`);
    doc.text(`Pregnancy Status: ${patient.pregnancyStatus ? "Yes" : "No"}`);
    doc.text(`Diagnosis: ${patient.diagnosis || "N/A"}`);
    doc.moveDown();

    // Blood Metals
    if (patient.bloodMetals.length) {
      const bm = patient.bloodMetals[0];
      doc.fontSize(14).text("Latest Blood Metals Report:", { underline: true });
      doc
        .fontSize(12)
        .text(`Lead: ${bm.lead_umolL ?? "N/A"} µmol/L`)
        .text(`Mercury: ${bm.mercury_umolL ?? "N/A"} µmol/L`)
        .text(`Cadmium: ${bm.cadmium_umolL ?? "N/A"} µmol/L`)
        .text(`Selenium: ${bm.selenium_umolL ?? "N/A"} µmol/L`)
        .text(`Manganese: ${bm.manganese_umolL ?? "N/A"} µmol/L`);
      doc.moveDown();
    }

    // Predictions
    doc.fontSize(14).text("Latest Predictions:", { underline: true });
    for (const [model, pred] of Object.entries(latestPreds)) {
      doc.fontSize(12).text(`${model}: ${pred.value}`);
    }
    doc.moveDown();

    // Footer
    doc
      .moveDown()
      .fontSize(10)
      .text("Generated automatically. For clinical use only.", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("Report generation error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate report", details: String(err) });
  }
});

export default router;
