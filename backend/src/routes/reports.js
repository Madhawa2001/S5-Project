// routes/reports.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Define colors and styles for a professional look
const PRIMARY_COLOR = "#1E88E5"; // Blue accent
const HEADER_COLOR = "#222222"; // Dark Gray text
const BORDER_COLOR = "#CCCCCC"; // Light Gray border
const BG_COLOR_LIGHT = "#F0F8FF"; // Very light blue background for cards
const NORMAL_COLOR = "#2E7D32"; // Darker Green for normal
const ABNORMAL_COLOR = "#C62828"; // Darker Red for abnormal
const NEUTRAL_COLOR = "#666666"; // Medium Gray

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 612; // 8.5 inches * 72 points/inch
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN; // 512

/**
 * Helper to draw a horizontal line
 */
const drawDivider = (doc, color = BORDER_COLOR, y = doc.y) => {
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
    .strokeColor(color)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.2);
};

/**
 * Helper to draw a rounded box with light background for sections
 */
const drawSectionBox = (doc, x, y, w, h) => {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(BG_COLOR_LIGHT, BORDER_COLOR);
};

// --- Report Route ---
router.use(verifyToken, requireRole("doctor"));

router.get("/:patientId", async (req, res) => {
  let doc;
  try {
    const { patientId } = req.params;
    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // 1. Data Fetching
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        bloodMetals: { orderBy: { createdAt: "desc" }, take: 1 },
        predictions: { orderBy: { createdAt: "desc" } },
        doctor: { select: { name: true } },
      },
    });

    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Process predictions: keep latest per model
    const latestPreds = {};
    for (const p of patient.predictions) {
      if (!latestPreds[p.model]) latestPreds[p.model] = p;
    }

    // Initialize PDF (Single Page Setup)
    doc = new PDFDocument({ margin: PAGE_MARGIN });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Health_Report_${patient.name || patientId}.pdf`
    );
    doc.pipe(res);

    // --- HEADER (Report Title) ---
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(PRIMARY_COLOR)
      .text("PATIENT HEALTH DIAGNOSTIC REPORT", {
        align: "center",
        y: 50,
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(NEUTRAL_COLOR)
      .text(
        `Report ID: ${patientId.substring(0, 8).toUpperCase()}`,
        PAGE_MARGIN,
        75,
        { continued: true }
      )
      .text(` | Generated: ${formattedDate}`, PAGE_MARGIN + 120);

    drawDivider(doc, PRIMARY_COLOR, 95);
    doc.moveDown(0.5);

    // --- PATIENT & ANTHROPOMETRICS CARD (2 Columns) ---
    const cardY = doc.y;
    const cardH = 120;
    drawSectionBox(doc, PAGE_MARGIN, cardY, CONTENT_WIDTH, cardH);
    doc.y = cardY + 10;

    // Header
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("PATIENT SUMMARY", PAGE_MARGIN + 10, doc.y);
    doc.moveDown(0.2);

    doc.fillColor(HEADER_COLOR).fontSize(10).font("Helvetica");

    const infoData = [
      ["Name", patient.name || "N/A"],
      ["ID/NIC", patient.nic || "N/A"],
      ["Date of Birth", new Date(patient.dob).toLocaleDateString() || "N/A"],
      ["Age", `${patient.ageYears}y ${patient.ageMonths || 0}m`],
      ["Gender", patient.gender],
      [
        "Marital Status",
        patient.maritalStatus
          ? patient.maritalStatus.replace(/_/g, " ")
          : "N/A",
      ],
      ["Height", patient.heightCm ? `${patient.heightCm} cm` : "N/A"],
      ["Weight", patient.weightKg ? `${patient.weightKg} kg` : "N/A"],
      ["BMI", patient.bmi?.toFixed(2) || "N/A"],
    ];

    const dataX = PAGE_MARGIN + 10;
    const col1Width = 250;
    let lineY = cardY + 35;
    const lineHeight = 12;

    // --- ALIGNMENT FIX START ---

    // 1. Split data for two columns
    const col1Data = infoData.slice(0, 5); // First 5 items
    const col2Data = infoData.slice(5); // Remaining items (4 items)

    // 2. Find the max label width in COL 1
    let maxLabelWidthCol1 = 0;
    doc.font("Helvetica-Bold").fontSize(10);
    col1Data.forEach(([label]) => {
      maxLabelWidthCol1 = Math.max(
        maxLabelWidthCol1,
        doc.widthOfString(`${label}:`)
      );
    });
    const valueStartXCol1 = dataX + maxLabelWidthCol1 + 5; // Start position for all values in Col 1

    // 3. Find the max label width in COL 2
    let maxLabelWidthCol2 = 0;
    col2Data.forEach(([label]) => {
      maxLabelWidthCol2 = Math.max(
        maxLabelWidthCol2,
        doc.widthOfString(`${label}:`)
      );
    });
    const col2Offset = dataX + col1Width; // X position where the second column starts
    const valueStartXCol2 = col2Offset + maxLabelWidthCol2 + 5; // Start position for all values in Col 2

    // 4. Draw Column 1
    doc.font("Helvetica-Bold").fontSize(10);
    col1Data.forEach(([label, value], index) => {
      const y = lineY + index * lineHeight;
      doc.text(`${label}:`, dataX, y); // Print the label at dataX
      doc.font("Helvetica").text(value, valueStartXCol1, y); // Print the value at its fixed alignment point
      doc.font("Helvetica-Bold"); // Restore bold for next label
    });

    // 5. Draw Column 2
    doc.font("Helvetica-Bold").fontSize(10);
    col2Data.forEach(([label, value], index) => {
      const y = lineY + index * lineHeight;
      doc.text(`${label}:`, col2Offset, y); // Print the label at col2Offset
      doc.font("Helvetica").text(value, valueStartXCol2, y); // Print the value at its fixed alignment point
      doc.font("Helvetica-Bold"); // Restore bold for next label
    });

    // --- ALIGNMENT FIX END ---

    // Set doc.y after the card
    doc.y = cardY + cardH + 10;
    doc.moveDown(1);

    // --- LABORATORY DATA (Blood Metals Table) ---
    const bm = patient.bloodMetals[0];
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("LABORATORY RESULTS: BLOOD METALS", PAGE_MARGIN, doc.y, {
        underline: true,
      });
    drawDivider(doc);

    if (bm) {
      const tableTop = doc.y + 5;
      const rowHeight = 20;
      const colWidths = [100, 100, 100, 100, 112]; // Total 512
      const startX = PAGE_MARGIN;

      const refRanges = {
        Lead: { range: [0, 0.2], display: `< 0.2` },
        Mercury: { range: [0, 0.05], display: `< 0.05` },
        Cadmium: { range: [0, 0.01], display: `< 0.01` },
        Selenium: { range: [1.0, 1.8], display: `1.0 - 1.8` },
        Manganese: { range: [0.05, 0.2], display: `0.05 - 0.2` },
      };

      const getInterpretation = (metal, value) => {
        if (value === undefined || value === null)
          return { text: "N/A", color: NEUTRAL_COLOR };
        const val = parseFloat(value);
        const { range } = refRanges[metal] || { range: [-Infinity, Infinity] };

        if (val < range[0] || val > range[1])
          return { text: "ABNORMAL", color: ABNORMAL_COLOR };

        return { text: "NORMAL", color: NORMAL_COLOR };
      };

      const tableData = [
        [
          "Metal",
          "Value (µmol/L)",
          "Reference Range",
          "Interpretation",
          "Test Date",
        ],
        [
          "Lead",
          bm.lead_umolL,
          refRanges.Lead.display,
          bm.lead_umolL,
          bm.createdAt,
        ],
        [
          "Mercury",
          bm.mercury_umolL,
          refRanges.Mercury.display,
          bm.mercury_umolL,
          bm.createdAt,
        ],
        [
          "Cadmium",
          bm.cadmium_umolL,
          refRanges.Cadmium.display,
          bm.cadmium_umolL,
          bm.createdAt,
        ],
        [
          "Selenium",
          bm.selenium_umolL,
          refRanges.Selenium.display,
          bm.selenium_umolL,
          bm.createdAt,
        ],
        [
          "Manganese",
          bm.manganese_umolL,
          refRanges.Manganese.display,
          bm.manganese_umolL,
          bm.createdAt,
        ],
      ];

      // Draw Headers
      let currentX = startX;
      doc.fillColor(PRIMARY_COLOR).font("Helvetica-Bold").fontSize(9);
      tableData[0].forEach((header, i) => {
        doc.text(header, currentX, tableTop, {
          width: colWidths[i],
          align: "left",
        });
        currentX += colWidths[i];
      });

      drawDivider(doc, PRIMARY_COLOR, tableTop + rowHeight - 8);

      // Draw Rows
      doc.font("Helvetica").fontSize(9);
      tableData.slice(1).forEach((row, rowIndex) => {
        currentX = startX;
        const y = tableTop + rowHeight * (rowIndex + 1);

        row.forEach((cell, cellIndex) => {
          let text;
          let color = HEADER_COLOR;

          if (cellIndex === 3) {
            // Interpretation column
            const { text: interpText, color: interpColor } = getInterpretation(
              row[0],
              row[1]
            );
            text = interpText;
            color = interpColor;
          } else if (cellIndex === 1) {
            // Value column
            const { color: interpColor } = getInterpretation(row[0], row[1]);
            color = interpColor;
            text =
              cell === undefined || cell === null
                ? "N/A"
                : parseFloat(cell).toFixed(4);
          } else if (cellIndex === 4) {
            // Date column
            text = cell ? new Date(cell).toLocaleDateString() : "N/A";
          } else {
            text = cell === undefined || cell === null ? "N/A" : String(cell);
          }

          doc.fillColor(color).text(text, currentX, y, {
            width: colWidths[cellIndex],
            align: "left",
          });
          currentX += colWidths[cellIndex];
        });

        drawDivider(doc, BORDER_COLOR, y + rowHeight - 8);
      });

      doc.y = tableTop + rowHeight * tableData.length + 5;
    } else {
      doc
        .fillColor(NEUTRAL_COLOR)
        .text("No recent Blood Metal data available.", PAGE_MARGIN, doc.y);
      doc.moveDown(1);
    }

    doc.moveDown(1);

    // --- AI MODEL PREDICTIONS (Simplified Table) ---
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("AI MODEL PREDICTIONS", PAGE_MARGIN, doc.y, { underline: true });
    drawDivider(doc);
    doc.moveDown(0.2);

    if (Object.keys(latestPreds).length) {
      const predTableTop = doc.y;
      const predRowHeight = 16;
      const predCol1Width = 200;
      const predCol2Width = 150;

      // Headers
      doc.fillColor(NEUTRAL_COLOR).font("Helvetica-Bold").fontSize(9);
      doc.text("AI Model", PAGE_MARGIN, predTableTop, { width: predCol1Width });
      // ** MODIFIED HEADER **
      doc.text(
        "Predicted Value (0.0 - 1.0)",
        PAGE_MARGIN + predCol1Width,
        predTableTop,
        { width: predCol2Width }
      );
      doc.text(
        "Prediction Date",
        PAGE_MARGIN + predCol1Width + predCol2Width,
        predTableTop,
        { width: predCol2Width }
      );

      drawDivider(doc, BORDER_COLOR, predTableTop + predRowHeight - 5);
      doc.font("Helvetica").fontSize(9);
      let currentPredY = predTableTop + predRowHeight;

      Object.entries(latestPreds).forEach(([model, pred]) => {
        // ** MODIFIED VALUE DISPLAY **
        const predictionValue = pred.value.toFixed(4);
        let valueColor = NEUTRAL_COLOR;

        // Use color to indicate general risk level, but show raw value
        if (pred.value > 0.7) valueColor = ABNORMAL_COLOR;
        else if (pred.value > 0.3) valueColor = "#FF9800"; // Orange

        doc
          .fillColor(HEADER_COLOR)
          .text(
            model.replace(/_/g, " ").toUpperCase(),
            PAGE_MARGIN,
            currentPredY,
            { width: predCol1Width }
          );
        doc
          .fillColor(valueColor)
          .text(predictionValue, PAGE_MARGIN + predCol1Width, currentPredY, {
            width: predCol2Width,
          });
        doc
          .fillColor(NEUTRAL_COLOR)
          .text(
            new Date(pred.createdAt).toLocaleDateString(),
            PAGE_MARGIN + predCol1Width + predCol2Width,
            currentPredY,
            { width: predCol2Width }
          );

        currentPredY += predRowHeight;
        drawDivider(doc, BORDER_COLOR, currentPredY - 5);
      });
      doc.y = currentPredY + 5;
    } else {
      doc
        .fillColor(NEUTRAL_COLOR)
        .text("No AI prediction data available.", PAGE_MARGIN, doc.y);
      doc.moveDown(1);
    }

    doc.moveDown(1);

    // --- CLINICIAN NOTES & SIGNATURE ---
    doc
      .fillColor(PRIMARY_COLOR)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("CLINICIAN REVIEW & AUTHORIZATION", PAGE_MARGIN, doc.y, {
        underline: true,
      });
    drawDivider(doc);

    // Notes Box
    doc
      .fillColor(HEADER_COLOR)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Clinical Notes / Recommendations:", PAGE_MARGIN, doc.y + 5);
    doc
      .rect(PAGE_MARGIN, doc.y + 20, CONTENT_WIDTH, 50)
      .fillOpacity(0)
      .strokeColor(BORDER_COLOR)
      .stroke();
    doc.y += 80;

    // Signature Block
    const sigX = PAGE_MARGIN + 300;
    const sigLine = doc.y;

    doc
      .fillColor(NEUTRAL_COLOR)
      .text("_______________________________", sigX, sigLine); // Line for signature
    doc
      .font("Helvetica-Bold")
      .fillColor(HEADER_COLOR)
      .text(
        `Dr. ${
          req.user?.name || patient.doctor?.name || "Authorized Clinician"
        }`,
        sigX,
        sigLine + 15,
        { align: "right" }
      );
    doc
      .font("Helvetica")
      .fillColor(NEUTRAL_COLOR)
      .text("Reviewing Clinician", sigX, sigLine + 28, { align: "right" });

    doc.y = sigLine + 50;

    // --- FOOTER ---
    const bottomY = doc.page.height - 30;

    doc
      .moveTo(PAGE_MARGIN, bottomY - 5)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, bottomY - 5)
      .strokeColor(BORDER_COLOR)
      .stroke();

    doc.fillColor(NEUTRAL_COLOR).fontSize(7).font("Helvetica");

    doc.text(
      "Disclaimer: This report is automatically generated from laboratory and model data. It is intended for clinical assistance only. A qualified medical professional must confirm the diagnosis and treatment plan.",
      PAGE_MARGIN,
      bottomY + 5,
      { width: 400 }
    );

    doc.text(
      "© 2025 Smart Health Diagnostics System (v1.2)",
      PAGE_MARGIN,
      bottomY + 15
    );
    doc.text(`Page 1 of 1`, 0, bottomY + 15, {
      align: "right",
      indent: PAGE_MARGIN,
    });

    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error("Report generation error:", err);

    // CRITICAL FIX: End the PDF stream gracefully on error
    if (doc) {
      doc.end();
    }

    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Failed to generate report", details: String(err) });
    }
  }
});

export default router;
