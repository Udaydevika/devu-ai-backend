import { createRequire } from "module";
import mammoth from "mammoth";
import axios from "axios";

// ✅ FIX pdf-parse (ESM safe)
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// =========================
// 📄 TEXT EXTRACTION (FIXED)
// =========================
export async function extractTextFromFile(buffer, mimeType) {
  try {
    if (!buffer) return "";

    // =========================
    // 📄 PDF
    // =========================
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    // =========================
    // 📄 DOCX
    // =========================
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    }

    // =========================
    // 📄 TXT / fallback
    // =========================
    return buffer
  .toString("utf-8")
  .replace(/\0/g, "")
  .trim();

  } catch (err) {
    console.error("❌ File extraction error:", err.message);
    return "";
  }
}

// =========================
// 🧠 SMART SUMMARIZATION
// =========================
export async function summarizeDocument(text) {
  try {
    if (!text || text.trim().length === 0) {
      return "⚠️ No readable content found in document.";
    }

    const limitedText = text.slice(0, 15000);

    const prompt = `
You are DevU AI.

Summarize the following document with:

1. Title
2. Key points (bullet list)
3. Important facts
4. Short explanation
5. Conclusion

Document:
${limitedText}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    return (
      response?.data?.choices?.[0]?.message?.content ||
      "⚠️ Failed to generate summary."
    );

  } catch (err) {
    console.error("❌ Summarization error:", err.message);
    return "⚠️ AI summarization failed. Try again.";
  }
}