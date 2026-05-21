// src/services/aiRouter.service.js

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
      // ⚡ NORMAL CHAT → GROQ
      // =====================================

      case "groq_chat":
      case "chat":

        return {
          stream:
            await streamGroq(messages),

          usedModel:
            "groq",
        };

      // =====================================
      // 💻 CODING → GPT-4o-mini
      // =====================================

      case "coding":

        return await streamOpenRouter(
          messages,
          [],
          "gpt-4o-mini"
        );

      // =====================================
      // 👁️ VISION / OCR → GEMINI
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
      // 🎨 IMAGE AI → HF
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
      // 🌐 SEARCH → GPT-4o
      // =====================================

      case "search":

        return await streamOpenRouter(
          messages,
          [],
          "gpt-4o"
        );

      // =====================================
      // 📄 FILES → GPT-4o-mini
      // =====================================

      case "file":

        return await streamOpenRouter(
          messages,
          [],
          "gpt-4o-mini"
        );

      // =====================================
      // 🔥 DEFAULT → GROQ
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

    // =====================================
    // 🔥 FINAL FALLBACK
    // =====================================

    return {
      stream:
        await streamGroq(messages),

      usedModel:
        "groq-fallback",
    };
  }
}