// src/ai/tools/ocr.tool.js

import { streamGemini } from "../../services/gemini.service.js";

/**
 * ==========================================
 * 🔥 DevU AI OCR TOOL
 * Supports:
 * ✅ Camera scanned docs
 * ✅ Handwritten notes
 * ✅ Receipts / Bills
 * ✅ Screenshot text
 * ✅ ID cards / forms
 * ==========================================
 */

export async function handleOCR(
  file,
  prompt = ""
) {
  try {
    if (
      !file ||
      !file.buffer
    ) {
      return "⚠️ No image uploaded.";
    }

    const ask =
      prompt?.trim() ||
      "Extract all text from this image clearly. Preserve headings, tables, numbers and formatting when possible.";

    const messages = [
      {
        role: "user",
        content: ask,
      },
    ];

    const stream =
      await streamGemini(
        messages,
        file.buffer,
        file.mimeType ||
          file.mimetype ||
          "image/jpeg"
      );

    let output = "";

    for await (const token of stream) {
      output += token;
    }

    output =
      output.trim();

    if (!output) {
      return "⚠️ No readable text detected.";
    }

    return `📄 OCR Complete

📝 Extracted Text:

${output}

💡 Ask Next:
• Summarize this
• Convert to notes
• Translate text
• Make PDF`;
  } catch (err) {
    console.error(
      "OCR Tool Error:",
      err.message
    );

    return "⚠️ Failed to read image text.";
  }
}