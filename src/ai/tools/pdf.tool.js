// src/ai/tools/pdf.tool.js

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * ==========================================
 * 🔥 DevU AI PDF TOOL
 * Supports:
 * ✅ Create notes PDF
 * ✅ Resume PDF
 * ✅ OCR text to PDF
 * ✅ AI summary to PDF
 * ==========================================
 */

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

    const lines =
      String(content)
        .match(
          /.{1,90}/g
        ) || [];

    let y =
      height - 90;

    for (const line of lines) {
      if (y < 50) {
        break;
      }

      page.drawText(line, {
        x: 40,
        y,
        size: 11,
        font,
      });

      y -= 16;
    }

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
      !fs.existsSync(
        dir
      )
    ) {
      fs.mkdirSync(
        dir,
        {
          recursive: true,
        }
      );
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

    return `${process.env.PUBLIC_URL}/generated/${fileName}`;
  } catch (err) {
    console.error(
      "PDF Tool Error:",
      err.message
    );

    return null;
  }
}

export async function readPDF(
  file
) {

  try {

    if (
      !file?.path
    ) {

      return {
        type: "text",
        text:
          "⚠️ No PDF uploaded.",
      };
    }

    const buffer =
      fs.readFileSync(
        file.path
      );

    const data =
      await pdfParse(
        buffer
      );

    const text =
      data?.text?.trim();

    if (!text) {

      return {
        type: "text",
        text:
          "⚠️ Empty PDF.",
      };
    }

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