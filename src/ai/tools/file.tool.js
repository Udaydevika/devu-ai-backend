// src/ai/tools/file.tool.js

import fs from "fs";
import { createRequire } from "module";
import mammoth from "mammoth";

// ==========================================
// ✅ pdf-parse ESM SAFE FIX
// ==========================================
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * ==========================================
 * 🔥 DevU AI FINAL FILE TOOL
 * ==========================================
 */

export async function handleFile(file) {

  try {

    // ======================================
    // VALIDATE
    // ======================================
    if (!file || (!file.buffer && !file.path)) {

      return {
        type: "text",
        text: "⚠️ No file uploaded.",
      };
    }

    // ======================================
    // READ FILE
    // ======================================
    const buffer = file.buffer || fs.readFileSync(
      file.path
    );

    let text = "";

    const mime = String(
  file.mimetype ||
  file.mimeType ||
  ""
).toLowerCase();

   const name = String(
  file.originalname ||
  file.name ||
  "document"
).toLowerCase();

    // ======================================
    // PDF
    // ======================================
    if (
      mime.includes("pdf") ||
      name.endsWith(".pdf")
    ) {

      const data =
        await pdfParse(buffer);

      text =
        data?.text || "";
    }

    // ======================================
    // DOCX
    // ======================================
    else if (
      mime.includes("word") ||
      mime.includes("officedocument") ||
      name.endsWith(".docx")
    ) {

      const data =
        await mammoth.extractRawText({
          buffer,
        });

      text =
        data?.value || "";
    }

    // ======================================
    // TXT / CSV / JSON / MD
    // ======================================
    else if (
      mime.includes("text") ||
      mime.includes("csv") ||
      mime.includes("json") ||
      name.endsWith(".txt") ||
      name.endsWith(".csv") ||
      name.endsWith(".json") ||
      name.endsWith(".md")
    ) {

      text =
        buffer.toString("utf8");
    }

    // ======================================
    // FALLBACK
    // ======================================
    else {

  try {

    text =
      buffer.toString("utf8");

  } catch {

    text =
      "Unsupported binary file.";
  }
}
    // ======================================
    // CLEAN TEXT
    // ======================================
    text = String(text)
      .replace(/\0/g, "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ======================================
    // EMPTY CHECK
    // ======================================
    if (!text) {

      return {
        type: "text",
        text:
          "⚠️ No readable text found in file.",
      };
    }

    // ======================================
    // LIMIT SIZE
    // ======================================
    const preview =
      text.length > 12000
        ? text.substring(0, 12000) +
          "\n\n...[truncated]"
        : text;

    // ======================================
    // RESUME DETECTION
    // ======================================
    const lower =
      preview.toLowerCase();

    const isResume =
      name.includes("resume") ||
      name.includes("cv") ||
      (
        lower.includes("experience") &&
        lower.includes("education")
      );

    // ======================================
    // FINAL RESPONSE
    // ======================================
    return {

      type: "file",

      fileName: name,

      mimeType: mime,

      size: file.size,

      path: file.path,

      isResume,

      text: preview,
    };

  } catch (err) {

    console.error(
      "❌ File Tool Error:",
      err.message
    );

    return {

      type: "text",

      text:
        "⚠️ Failed to process file.",
    };
  }
}