import fs from "fs";
import { streamGemini }
from "../../services/gemini.service.js";

/**
 * ==========================================
 * 👁️ DEVU AI VISION TOOL
 * ==========================================
 * Supports:
 * ✅ Camera AI
 * ✅ Photo understanding
 * ✅ Screenshot analysis
 * ✅ Meme explanation
 * ✅ Scene description
 * ✅ Object detection
 * ✅ General image chat
 * ==========================================
 */

export async function handleVision(
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
    // PROMPT
    // =====================================

    const ask =
      prompt?.trim() ||
      "Explain this image clearly.";

    const messages = [
      {
        role: "user",
        content: ask,
      },
    ];

    // =====================================
    // GEMINI VISION
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
          "⚠️ No image understanding generated.",
      };
    }

    // =====================================
    // SUCCESS
    // =====================================

    return {
      type: "text",
      text: output,
    };

  } catch (err) {

    console.error(
      "❌ VISION ERROR:",
      err.message
    );

    return {
      type: "text",
      text:
        "⚠️ Failed to analyze image.",
    };
  }
}