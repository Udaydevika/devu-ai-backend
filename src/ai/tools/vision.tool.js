import fs from "fs";
import { getAIStream }
from "../../services/aiRouter.service.js";
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
  (!file.buffer && !file.path)
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

    console.log(
      "🖼️ Vision file:",
      file?.originalname,
      file?.mimetype
    );

    const imageBuffer =
      file.buffer ||
      fs.readFileSync(file.path);

    console.log(
      "🖼 VISION START:",
      file.originalname,
      file.mimetype
    );

    console.log(
      "🖼 BUFFER SIZE:",
      imageBuffer?.length
    );

    const ai =
  await getAIStream(
    "vision",
    messages,
    {
      imageBuffer,
      mimeType:
        file.mimetype ||
        "image/jpeg",
    }
  );

if (ai?.text) {
  return {
    type: "text",
    text: ai.text,
  };
}

    console.log(
      "✅ GEMINI VISION RESULT:",
      ai
    );

    // =====================================
    // VALIDATE STREAM
    // =====================================

   if (!ai) {
  return {
    type: "text",
    text: "⚠️ Gemini returned empty response."
  };
}

if (ai.text) {
  return {
    type: "text",
    text: ai.text
  };
}

if (
  !ai.stream ||
  typeof ai.stream[
    Symbol.asyncIterator
  ] !== "function"
) {
  return {
    type: "text",
    text: "⚠️ Invalid Gemini response."
  };
}

    let output = "";

for await (const token of ai.stream) {
  output +=
    typeof token === "string"
      ? token
      : token?.text || "";
}

output = output.trim();

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

    console.log(
      "✅ VISION OUTPUT:",
      output.substring(0, 200)
    );

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