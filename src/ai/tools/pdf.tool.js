// src/ai/tools/pdf.tool.js

import fs from "fs";
import path from "path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

/**
 * ==========================================
 * 🔥 DevU AI PDF TOOL
 *
 * Features:
 * ✅ Create PDF
 * ✅ Read PDF
 * ✅ Extract text
 * ✅ AI summary support
 * ✅ Resume PDF support
 * ✅ Render + Node 24 compatible
 * ✅ ESM compatible
 * ==========================================
 */

// ==========================================
// CREATE PDF
// ==========================================
export async function createPDF(
  title = "DevU AI File",
  content = ""
) {
  try {
    const pdfDoc =
      await PDFDocument.create();

    const page =
      pdfDoc.addPage([
        595,
        842,
      ]); // A4

    const font =
      await pdfDoc.embedFont(
        StandardFonts.Helvetica
      );

    const bold =
      await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

    const { height } =
      page.getSize();

    // =========================
    // TITLE
    // =========================
    page.drawText(title, {
      x: 40,
      y: height - 50,
      size: 20,
      font: bold,
      color: rgb(
        0,
        0,
        0
      ),
    });

    // =========================
    // CONTENT
    // =========================
    const lines =
      String(content)
        .replace(/\r/g, "")
        .split("\n");

    let y =
      height - 90;

    for (const rawLine of lines) {

      const chunks =
        rawLine.match(
          /.{1,90}/g
        ) || [""];

      for (const line of chunks) {

        if (y < 50) {
          break;
        }

        page.drawText(line, {
          x: 40,
          y,
          size: 11,
          font,
          color: rgb(
            0,
            0,
            0
          ),
        });

        y -= 16;
      }
    }

    // =========================
    // SAVE PDF
    // =========================
    const bytes =
      await pdfDoc.save();

    const fileName =
      `pdf_${Date.now()}.pdf`;

    const dir =
      path.join(
        process.cwd(),
        "public",
        "generated"
      );

    if (
      !fs.existsSync(dir)
    ) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }

    const fullPath =
      path.join(
        dir,
        fileName
      );

    fs.writeFileSync(
      fullPath,
      bytes
    );

    const base =
      process.env.PUBLIC_URL ||
      "http://localhost:3000";

    return `${base}/generated/${fileName}`;

  } catch (err) {

    console.error(
      "PDF CREATE ERROR:",
      err
    );

    return null;
  }
}

// ==========================================
// READ PDF
// ==========================================
export async function readPDF(
  file
) {
  try {

    // =========================
    // VALIDATE
    // =========================
    if (
      !file?.path
    ) {
      return {
        type: "text",
        text:
          "⚠️ No PDF uploaded.",
      };
    }

    // =========================
    // READ BUFFER
    // =========================
    const buffer =
      fs.readFileSync(
        file.path
      );

    // =========================
    // DYNAMIC IMPORT FIX
    // NODE 24 + ESM FIX
    // =========================
    const pdfParseModule =
      await import(
        "pdf-parse"
      );

    const pdfParse =
  pdfParseModule.default ||
  pdfParseModule;

    // =========================
    // PARSE PDF
    // =========================
    const data =
      await pdfParse(
        buffer
      );

    const text =
      data?.text?.trim();

    // =========================
    // EMPTY PDF
    // =========================
    if (!text) {
      return {
        type: "text",
        text:
          "⚠️ Empty PDF.",
      };
    }

    // =========================
    // SUCCESS
    // =========================
    return {
      type: "text",
      text,
    };

  } catch (err) {

    console.error(
      "PDF READ ERROR:",
      err
    );

    return {
      type: "text",
      text:
        "⚠️ Failed to read PDF.",
    };
  }
}