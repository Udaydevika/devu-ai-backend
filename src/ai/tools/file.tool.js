// src/ai/tools/file.tool.js

import * as pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * ==========================================
 * 🔥 DevU AI FINAL FILE TOOL (Render Safe)
 *
 * Supports:
 * ✅ PDF
 * ✅ DOCX
 * ✅ TXT
 * ✅ CSV
 * ✅ JSON
 * ✅ MD
 * ✅ Resume files
 * ✅ Notes / Reports
 * ✅ Large text cleanup
 * ✅ Render Node v24 safe
 * ==========================================
 */

export async function handleFile(file) {
  try {
    if (!file || !file.buffer) {
      return "⚠️ No file uploaded.";
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
        await pdf.default(
          file.buffer
        );

      text =
        data?.text || "";
    }

    // ======================================
    // DOCX
    // ======================================
    else if (
      mime.includes("word") ||
      mime.includes(
        "officedocument"
      ) ||
      name.endsWith(".docx")
    ) {
      const data =
        await mammoth.extractRawText(
          {
            buffer:
              file.buffer,
          }
        );

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
        file.buffer.toString(
          "utf8"
        );
    }

    // ======================================
    // Unknown file fallback
    // ======================================
    else {
      text =
        file.buffer.toString(
          "utf8"
        );
    }

    // ======================================
    // Clean Text
    // ======================================
    text = String(text)
      .replace(/\0/g, "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return "⚠️ No readable text found in file.";
    }

    // ======================================
    // Limit Size
    // ======================================
    const preview =
      text.length > 12000
        ? text.substring(
            0,
            12000
          ) +
          "\n\n...[truncated]"
        : text;

    // ======================================
    // Detect Resume
    // ======================================
    const isResume =
      name.includes(
        "resume"
      ) ||
      name.includes(
        "cv"
      ) ||
      preview
        .toLowerCase()
        .includes(
          "experience"
        ) &&
      preview
        .toLowerCase()
        .includes(
          "education"
        );

    // ======================================
    // Resume Mode
    // ======================================
    if (isResume) {
      return `
📄 Resume Read Successfully

📌 File Name:
${name}

🧠 Resume Content Preview:

${preview}

💡 Ask Next:
• Improve my resume
• ATS optimize resume
• Make professional resume
• Find mistakes
• Convert to PDF
• Rewrite summary
`;
    }

    // ======================================
    // Normal File Mode
    // ======================================
    return `
📄 File Read Successfully

📌 File Name:
${name}

📝 Content Preview:

${preview}

💡 Ask Next:
• Summarize this
• Explain key points
• Convert to notes
• Translate document
• Make PDF
• Find mistakes
• Extract action items
`;
  } catch (err) {
    console.error(
      "❌ File Tool Error:",
      err.message
    );

    return "⚠️ Failed to process file.";
  }
}