// routes/reports.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole("doctor"));

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

    // Keep latest per model
    const latestPreds = {};
    for (const p of predictions) {
      if (!latestPreds[p.model]) latestPreds[p.model] = p;
    }

    // Initialize PDF
    const doc = new PDFDocument({ margin: 50 });
    const date = new Date().toLocaleString("en-US", { hour12: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Health_Report_${patient.name || patientId}.pdf`
    );
    doc.pipe(res);

    // --- HEADER ---
    doc
      .fontSize(22)
      .fillColor("#004080")
      .text("Smart Health Diagnostic Report", {
        align: "center",
        underline: true,
      });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated on: ${date}`, { align: "center" });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#004080").stroke();
    doc.moveDown(1.5);

    // --- PATIENT DETAILS ---
    doc.fontSize(14).fillColor("#004080").text("Patient Information", {
      underline: true,
    });
    doc.moveDown(0.8);
    doc.fontSize(12).fillColor("black");
    const info = [
      ["Patient ID", patient.id],
      ["Full Name", patient.name || "N/A"],
      ["Age", `${patient.ageYears} years ${patient.ageMonths || 0} months`],
      ["Gender", patient.gender],
      [
        "Pregnancy Status",
        patient.pregnancyStatus ? "Pregnant" : "Not Pregnant",
      ],
      ["Diagnosis", patient.diagnosis || "N/A"],
    ];

    info.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value);
    });

    doc.moveDown(1);

    // --- BLOOD METALS ---
    if (patient.bloodMetals.length) {
      const bm = patient.bloodMetals[0];
      doc
        .fontSize(14)
        .fillColor("#004080")
        .text("Recent Blood Metal Analysis", {
          underline: true,
        });
      doc.moveDown(0.8);

      const tableData = [
        ["Metal", "Concentration (µmol/L)"],
        ["Lead", bm.lead_umolL ?? "N/A"],
        ["Mercury", bm.mercury_umolL ?? "N/A"],
        ["Cadmium", bm.cadmium_umolL ?? "N/A"],
        ["Selenium", bm.selenium_umolL ?? "N/A"],
        ["Manganese", bm.manganese_umolL ?? "N/A"],
      ];

      // Table header
      doc.font("Helvetica-Bold").fillColor("#004080");
      doc.text(`${tableData[0][0]}`, 70, doc.y, { continued: true });
      doc.text(`${tableData[0][1]}`, 350);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#c0c0c0").stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font("Helvetica").fillColor("black");
      for (let i = 1; i < tableData.length; i++) {
        doc.text(tableData[i][0], 70, doc.y, { continued: true });
        doc.text(tableData[i][1], 350);
      }
      doc.moveDown(1);
    }

    // --- PREDICTIONS ---
    doc.fontSize(14).fillColor("#004080").text("Latest Model Predictions", {
      underline: true,
    });
    doc.moveDown(0.8);

    if (Object.keys(latestPreds).length) {
      doc.fontSize(12).fillColor("black");
      Object.entries(latestPreds).forEach(([model, pred]) => {
        doc
          .font("Helvetica-Bold")
          .text(`${model}: `, { continued: true })
          .font("Helvetica")
          .text(
            `${pred.value}  (at ${new Date(
              pred.createdAt
            ).toLocaleDateString()})`
          );
      });
    } else {
      doc.text("No prediction data available.");
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#004080").stroke();
    doc.moveDown(1);

    // --- DOCTOR / FOOTER ---
    doc
      .fontSize(12)
      .fillColor("gray")
      .text(`Reviewed by: Dr. ${req.user?.name || "Authorized Clinician"}`, {
        align: "right",
      });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(
        "Disclaimer: This report is automatically generated from laboratory and model data. Please consult a qualified medical professional before making clinical decisions.",
        { align: "center", width: 480 }
      );
    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .fillColor("#999999")
      .text("© 2025 Smart Health Diagnostics System", {
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
