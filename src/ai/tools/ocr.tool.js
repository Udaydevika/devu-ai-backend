import { streamGemini }
from "../../services/gemini.service.js";

/**
 * ==========================================
 * 📄 DEVU AI OCR TOOL
 * ==========================================
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

    // =====================================
    // VALIDATION
    // =====================================

    if (
      !file ||
      !file.buffer
    ) {

      return {
        type: "text",
        text: "⚠️ No image uploaded.",
      };
    }

    // =====================================
    // OCR PROMPT
    // =====================================

    const ask =
      prompt?.trim() ||
`
Extract all readable text from this image clearly.

Preserve:
- headings
- tables
- numbers
- formatting
`;

    const messages = [
      {
        role: "user",
        content: ask,
      },
    ];

    // =====================================
    // GEMINI OCR
    // =====================================

    const stream =
      await streamGemini(
        messages,
        file.buffer,
        file.mimeType ||
        file.mimetype ||
        "image/jpeg"
      );

    let output = "";

    for await (
      const token of stream
    ) {

      output += token;
    }

    output =
      output.trim();

    // =====================================
    // EMPTY RESPONSE
    // =====================================

    if (!output) {

      return {
        type: "text",
        text:
          "⚠️ No readable text detected.",
      };
    }

    // =====================================
    // SUCCESS
    // =====================================

    return {
      type: "text",
      text:
`📄 OCR Complete

📝 Extracted Text:

${output}

💡 Ask Next:
• Summarize this
• Convert to notes
• Translate text
• Make PDF`,
    };

  } catch (err) {

    console.error(
      "❌ OCR TOOL ERROR:",
      err.message
    );

    return {
      type: "text",
      text:
        "⚠️ Failed to read image text.",
    };
  }
}