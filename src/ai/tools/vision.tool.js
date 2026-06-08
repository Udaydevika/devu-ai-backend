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

    const ai = await getAIStream(
  "vision",
  messages,
  {
    imageBuffer,
    mimeType:
      file.mimetype || "image/jpeg",
  }
);

if (!ai) {
  return {
    type: "text",
    text: "⚠️ Vision failed."
  };
}

let output = ai.text || "";

if (!output && ai.stream) {
  for await (const token of ai.stream) {
    output += String(token || "");
  }
}

output = output.trim();

return {
  type: "text",
  text: output ||
        "⚠️ No image understanding generated."
};

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