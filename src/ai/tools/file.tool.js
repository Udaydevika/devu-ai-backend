// src/ai/tools/file.tool.js

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
 *
 * Features:
 * ✅ PDF support
 * ✅ DOCX support
 * ✅ TXT / CSV / JSON / MD
 * ✅ Resume detection
 * ✅ Structured response format
 * ✅ Render safe
 * ==========================================
 */

export async function handleFile(file) {
  try {
    // ======================================
    // VALIDATE
    // ======================================
    if (!file || !file.buffer) {
      return {
        type: "text",
        text: "⚠️ No file uploaded.",
      };
    }

    let text = "";

    const mime =
      file.mimeType ||
      file.mimetype ||
      "";

    const name = String(
      file.name ||
      file.originalname ||
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
        await pdfParse(file.buffer);

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
          buffer: file.buffer,
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
        file.buffer.toString("utf8");
    }

    // ======================================
    // FALLBACK
    // ======================================
    else {
      text =
        file.buffer.toString("utf8");
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
        text: "⚠️ No readable text found in file.",
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
    // FINAL STRUCTURED RESPONSE
    // ======================================
    return {
      type: "file",
      fileName: name,
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
      text: "⚠️ Failed to process file.",
    };
  }
}