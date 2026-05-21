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

```
switch (tool) {

  // =====================================
  // ⚡ NORMAL CHAT → GROQ
  // =====================================

  case "groq_chat":
  case "chat":

    return await streamGroq(
      messages
    );

  // =====================================
  // 💻 CODING → GPT-4o-mini
  // =====================================

  case "coding":

    return await streamOpenRouter(
      messages,
      [],
      "openai/gpt-4o-mini"
    );

  // =====================================
  // 👁️ VISION / OCR → GEMINI
  // =====================================

  case "vision":
  case "ocr":

    return await streamGemini(
      messages,
      extra.imageBuffer,
      extra.mimeType
    );

  // =====================================
  // 🎨 IMAGE AI → HF
  // =====================================

  case "image_generation":
  case "image_variation":

    return await streamHuggingFace(
      messages
    );

  // =====================================
  // 🌐 SEARCH → GPT-4o
  // =====================================

  case "search":

    return await streamOpenRouter(
      messages,
      [],
      "openai/gpt-4o"
    );

  // =====================================
  // 📄 FILES → GPT-4o-mini
  // =====================================

  case "file":

    return await streamOpenRouter(
      messages,
      [],
      "openai/gpt-4o-mini"
    );

  // =====================================
  // 🔥 DEFAULT → GROQ
  // =====================================

  default:

    return await streamGroq(
      messages
    );
}
```

} catch (err) {

```
console.error(
  "❌ AI ROUTER ERROR:",
  err?.message || err
);

try {

  return await streamGroq(
    messages
  );

} catch (_) {

  async function* fail() {

    yield "⚠️ AI service unavailable.";
  }

  return {
    stream: fail(),
    usedModel: "fallback-error",
  };
}
```

}
}
