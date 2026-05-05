// src/ai/tools/file.tool.js

import pkg from "pdf-parse"; // ✅ FIXED (ESM safe)
const pdf = pkg.default || pkg;

import mammoth from "mammoth";

/**
 * ==========================================
 * 🔥 DevU AI FINAL FILE TOOL (RENDER SAFE)
 * ==========================================
 */

export async function handleFile(file) {
  try {
    if (!file || !file.buffer) {
      return "⚠️ No file uploaded.";
    }

    let text = "";

    const mime = file.mimeType || file.mimetype || "";
    const name = String(
      file.name || file.originalname || "document"
    ).toLowerCase();

    // ======================================
    // PDF ✅ FULL FIX
    // ======================================
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      const data = await pdf(file.buffer);
      text = data?.text || "";
    }

    // ======================================
    // DOCX
    // ======================================
    else if (
      mime.includes("word") ||
      mime.includes("officedocument") ||
      name.endsWith(".docx")
    ) {
      const data = await mammoth.extractRawText({
        buffer: file.buffer,
      });

      text = data?.value || "";
    }

    // ======================================
    // TEXT FILES
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
      text = file.buffer.toString("utf8");
    }

    // ======================================
    // FALLBACK
    // ======================================
    else {
      text = file.buffer.toString("utf8");
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

    if (!text) {
      return "⚠️ No readable text found in file.";
    }

    // ======================================
    // LIMIT SIZE
    // ======================================
    const preview =
      text.length > 12000
        ? text.substring(0, 12000) + "\n\n...[truncated]"
        : text;

    // ======================================
    // RESUME DETECTION
    // ======================================
    const isResume =
      name.includes("resume") ||
      name.includes("cv") ||
      (preview.toLowerCase().includes("experience") &&
        preview.toLowerCase().includes("education"));

    // ======================================
    // RESUME MODE
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
    // NORMAL MODE
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
    console.error("❌ File Tool Error:", err.message);
    return "⚠️ Failed to process file.";
  }
}