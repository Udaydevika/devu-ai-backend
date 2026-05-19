import { streamGroq } from "./groq.service.js";
import { streamGemini } from "./gemini.service.js";
import { streamOpenRouter } from "./openrouter.service.js";
import { streamHuggingFace } from "./huggingface.service.js";

export async function getAIStream(
tool,
messages,
extra = {}
) {

try {

switch (tool) {

  // =====================================
  // ⚡ NORMAL CHAT
  // =====================================
  case "groq_chat":

    return {
      stream:
        await streamGroq(messages),

      usedModel:
        "groq",
    };

  // =====================================
  // 💻 CODING
  // =====================================
  case "coding":

    return {
      stream:
        await streamOpenRouter(
          messages,
          [],
          "openai/gpt-4o-mini"
        ),

      usedModel:
        "gpt-4o-mini",
    };

  // =====================================
  // 👁️ VISION / OCR
  // =====================================
  case "vision":
  case "ocr":

    return {
      stream:
        await streamGemini(
          messages,
          extra.imageBuffer,
          extra.mimeType
        ),

      usedModel:
        "gemini",
    };

  // =====================================
  // 🎨 IMAGE AI
  // =====================================
  case "image_generation":
  case "image_variation":

    return {
      stream:
        await streamHuggingFace(
          messages
        ),

      usedModel:
        "huggingface",
    };

  // =====================================
  // 🌐 SEARCH
  // =====================================
  case "search":

    return {
      stream:
        await streamOpenRouter(
          messages,
          [],
          "openai/gpt-4o"
        ),

      usedModel:
        "gpt-4o",
    };

  // =====================================
  // 📄 FILES
  // =====================================
  case "file":

    return {
      stream:
        await streamOpenRouter(
          messages,
          [],
          "openai/gpt-4o-mini"
        ),

      usedModel:
        "gpt-4o-mini",
    };

  // =====================================
  // 🔥 DEFAULT
  // =====================================
  default:

    return {
      stream:
        await streamGroq(messages),

      usedModel:
        "groq",
    };
}

} catch (err) {

console.error(
  "❌ AI ROUTER ERROR:",
  err.message
);

return {
  stream:
    await streamGroq(messages),

  usedModel:
    "groq-fallback",
};

}
}
