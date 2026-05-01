import * as pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * ==========================================
 * 🔥 DevU AI File Tool
 * Supports:
 * ✅ PDF
 * ✅ DOCX
 * ✅ TXT
 * ==========================================
 */

export async function handleFile(file) {
  try {
    let text = "";

    // ==========================
    // 📄 PDF
    // ==========================
    if (
      file.mimetype ===
      "application/pdf"
    ) {
      const data =
        await pdf(file.buffer);

      text = data.text;
    }

    // ==========================
    // 📝 DOCX
    // ==========================
    else if (
      file.mimetype.includes(
        "wordprocessingml"
      ) ||
      file.originalname
        ?.toLowerCase()
        .endsWith(".docx")
    ) {
      const data =
        await mammoth.extractRawText(
          {
            buffer:
              file.buffer,
          }
        );

      text = data.value;
    }

    // ==========================
    // 📄 TXT
    // ==========================
    else if (
      file.mimetype.includes(
        "text"
      ) ||
      file.originalname
        ?.toLowerCase()
        .endsWith(".txt")
    ) {
      text =
        file.buffer.toString(
          "utf8"
        );
    }

    // ==========================
    // ❌ Unsupported
    // ==========================
    else {
      return "⚠️ Unsupported file type.";
    }

    text = text
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return "⚠️ No readable text found.";
    }

    // Limit size for AI
    const shortText =
      text.slice(0, 6000);

    return `
📄 Document processed successfully.

Summary Preview:

${shortText}
`;
  } catch (err) {
    console.error(
      "❌ File tool error:",
      err.message
    );

    return "⚠️ Failed to process document.";
  }
}