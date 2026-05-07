// src/ai/tools/vision.tool.js

import { streamGemini } from "../../services/gemini.service.js";

/**
 * ==========================================
 * 👁️ DevU AI VISION TOOL
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

    if (
      !file ||
      !file.buffer
    ) {
      return "⚠️ No image uploaded.";
    }

    const ask =
      prompt?.trim() ||
      "Explain this image clearly.";

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

    for await (
      const token of stream
    ) {

      output += token;
    }

    output =
      output.trim();

    if (!output) {

      return "⚠️ No image understanding generated.";
    }

    return output;

  } catch (err) {

    console.error(
      "VISION ERROR:",
      err
    );

    return "⚠️ Failed to analyze image.";
  }
}