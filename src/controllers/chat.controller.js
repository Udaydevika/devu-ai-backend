import fs from "fs";
import { streamOpenRouter } from "../services/openrouter.service.js";
import { streamGroq }
from "../services/groq.service.js";

import { streamGemini }
from "../services/gemini.service.js";

import { streamHuggingFace }
from "../services/huggingface.service.js";


import { DEFAULT_GREETING } from "../core/defaults.js";

import { extractAndStoreMemory } from "../services/memoryExtractor.js";
import { getUserMemory } from "../services/memory.service.js";
import { buildMemorySystemPrompt } from "../utils/memoryPrompt.js";

import { detectEmotion } from "../services/emotion.service.js";
import { getEmotionStyle } from "../services/emotionStyle.service.js";

import { getCache, setCache } from "../utils/cache.js";
import { enhanceTextForSpeech } from "../services/voice.service.js";

import { logEvent, logError } from "../utils/logger.js";

import { detectTool } from "../ai/toolRouter.js";
import { generateImage } from "../ai/tools/image.tool.js";
import { getLiveNews } from "../ai/tools/news.tool.js";
import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { handleAudio }
from "../ai/tools/audio.tool.js";

/**
 * ======================================
 * 🔥 DEVU AI FINAL CHAT CONTROLLER
 * ======================================
 */

function cleanText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function humanizeText(text = "") {
  return text
    .replace(/\.\s/g, "... ")
    .replace(/\!\s/g, "! ")
    .replace(/,\s/g, ", ");
}

async function getBestStream(messages) {

  const providers = [

    {
      name: "groq",
      run: async () =>
        await streamGroq(messages),
    },

    {
      name: "gpt4o-mini",
      run: async () =>
        await streamOpenRouter(
          messages,
          [],
          "gpt-4o-mini"
        ),
    },

    {
      name: "gemini",
      run: async () =>
        await streamGemini(messages),
    },

    {
      name: "huggingface",
      run: async () =>
        await streamHuggingFace(messages),
    },
  ];

  for (const provider of providers) {

    try {

      console.log(
        `🧠 Trying ${provider.name}`
      );

      const result =
        await provider.run();

      const stream =
        result?.stream || result;

      if (

        stream &&

        typeof stream[
          Symbol.asyncIterator
        ] === "function"

      ) {

        return {
          stream,
          usedModel:
            result?.usedModel ||
            provider.name,
        };
      }

    } catch (err) {

      console.error(
        `❌ ${provider.name} failed:`,
        err.message
      );
    }
  }

  throw new Error(
    "All AI providers failed"
  );
}


export async function chatController(req, res) {
  try {
    let { messages } = req.body;

    const user = req.user;
    const userId = req.userId;
    const isTemporaryChat =
      req.isTemporaryChat === true;

    const files =

  Array.isArray(req.files)

    ? req.files

    : [];

console.log(
  "📂 NORMALIZED FILES:",
  files.map((f) => ({
    name:
      f.originalname,

    mime:
      f.mimetype,

    size:
      f.size,
  }))
);

    console.log(
  "📦 STREAM FILES:",
  files.map((f) => ({
    name: f.originalname,
    mime: f.mimetype,
    size: f.size,
  }))
);

    console.log(
  "📦 FILES:",
  files.map((f) => ({
    name: f.originalname,
    mime: f.mimetype,
    size: f.size,
  }))
);

    // =========================
    // VALIDATION
    // =========================
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages must be array",
      });
    }

    messages = messages
      .filter(
        (m) =>
          m &&
          typeof m.role === "string" &&
          typeof m.content === "string"
      )
      .map((m) => ({
        role: m.role,
        content: cleanText(m.content),
      }))
      .filter((m) => m.content.length > 0)
      .slice(-12);

    if (messages.length === 0 && files.length === 0) {
      return res.json({
        text: DEFAULT_GREETING,
        usedModel: "system",
      });
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    const lastText =
      lastUserMessage?.content || "";


    // =========================
    // TOOL DETECTION
    // =========================
    const tool =
  detectTool(
    lastText,
    files
  );

    console.log("🧠 TOOL:", tool);

 // =========================
// 🔥 CAMERA + IMAGE ANALYSIS
// =========================

const file = files?.[0];

if (
  file &&
  !file.buffer &&
  !file.path
) {

  return res.status(400).json({
    type: "text",
    text:
      "⚠️ Invalid uploaded file.",
  });
}

// =====================================
// 🖼️ IMAGE HANDLER
// =====================================

if (
  file?.mimetype?.startsWith(
    "image/"
  )
) {

  try {

    const lower =
      lastText.toLowerCase();

    // =====================================
    // 🎨 GHIBLI IMAGE
    // =====================================

    if (
      lower.includes("ghibli")
    ) {

      const out =
        await generateImage(
          `Studio Ghibli style, ${lastText}`
        );

      return res.json({

        type: "image",

        image:
          typeof out === "string"
            ? out
            : out?.url || "",

        text:
          "Ghibli image created",

        usedModel:
          "image-tool",
      });
    }

    // =====================================
    // OCR / VISION PROMPT
    // =====================================

    const ask =

      lower.includes("ocr") ||

      lower.includes("extract text") ||

      lower.includes("read text") ||

      lower.includes("scan")

        ? `
Extract all readable text from this image clearly.

Preserve:
- headings
- numbers
- tables
- formatting
`

        : `
Analyze this image in detail.

Explain:
- what is visible
- objects
- people
- scene
- text if visible
- important details
`;

    // =====================================
    // IMAGE BUFFER
    // =====================================

    let imageBuffer = null;

if (file.buffer) {

  imageBuffer = file.buffer;

} else if (
  file.path &&
  fs.existsSync(file.path)
) {

  imageBuffer =
    fs.readFileSync(file.path);
}

if (
  !imageBuffer ||
  imageBuffer.length === 0
) {

  throw new Error(
    "Invalid image buffer"
  );
}

    if (!imageBuffer) {

      return res.status(400).json({

        type: "text",

        text:
          "⚠️ Image buffer missing.",
      });
    }

    // =====================================
    // GEMINI VISION
    // =====================================

    const ai =
  await streamGemini(
    [
      {
        role: "user",
        content: ask,
      },
    ],
    imageBuffer,
    file.mimetype
  );

const stream =
  ai?.stream || ai;

let fullReply = "";

for await (
  const token of stream
) {

      if (
        !token ||
        typeof token !== "string"
      ) {
        continue;
      }

      fullReply += token;
    }

    // =====================================
    // FINAL RESPONSE
    // =====================================

    return res.json({

      type: "text",

      text:
        fullReply ||
        "⚠️ No image response.",

      usedModel:
        "gemini",
    });

  } catch (err) {

    console.error(
      "❌ IMAGE ERROR:",
      err.message
    );

    return res.json({

      type: "text",

      text:
        "⚠️ Failed to analyze image.",
    });
  }
}

        // =========================
    // 📄 DOCUMENT / PDF / TXT
    // 🎬 VIDEO
    // =========================
    if (files.length > 0) {
      const file = files[0];

      if (!file) {

  return res.status(400).json({
type: "text",
text: "⚠️ No file uploaded.",
});
}

      // 🎧 AUDIO
if (

  file.mimetype?.startsWith("audio/") ||

  file.mimetype?.includes("mpeg") ||

  file.mimetype?.includes("mp3") ||

  file.originalname
    ?.toLowerCase()
    .endsWith(".mp3") ||

  file.originalname
    ?.toLowerCase()
    .endsWith(".m4a")

) {

  const result =
    await handleAudio(
      file,
      lastText
    );

  return res.json({
  type:
    result?.type || "audio",

  audioUrl:
    result?.url || null,

  text:
    result?.transcript ||
    result?.text ||
    "Audio processed.",

  usedModel: "audio-tool",
});
}
      // Skip image because already handled above
      if (!file.mimetype?.startsWith("image/")) {

        // 📄 PDF / DOCX / TXT
        if (

  file.mimetype?.includes("pdf") ||

  file.mimetype?.includes("text") ||

  file.mimetype?.includes("csv") ||

  file.mimetype?.includes("json") ||

  file.mimetype?.includes("excel") ||

  file.mimetype?.includes("sheet") ||

  file.mimetype?.includes("document") ||

  file.mimetype?.includes("word") ||

  file.originalname?.toLowerCase().endsWith(".docx") ||

  file.originalname?.toLowerCase().endsWith(".txt") ||

  file.originalname?.toLowerCase().endsWith(".pdf")

){
          const fileResult =
  await handleFile(file);

const extractedText =
  fileResult?.text || "";
  if (!extractedText) {

  return res.json({
    type: "text",
    text:
      "⚠️ Could not read document.",
  });
}

          const summaryPrompt = [
            {
              role: "user",
              content:
                `Summarize this document clearly:\n\n${extractedText.slice(0, 15000)}`,
            },
          ];

          const { stream } =
            await getBestStream(summaryPrompt);

          let summary = "";

          for await (const token of stream) {
            summary += token;
          }

          return res.json({
            text: summary || "Could not summarize document.",
            usedModel: "file-tool",
          });
        }

      
// 🎬 VIDEO
if (

  file.mimetype?.startsWith("video/") ||

  file.mimetype?.includes("mp4") ||

  file.originalname
    ?.toLowerCase()
    .endsWith(".mp4")

) {

  console.log(
    "🎬 VIDEO DETECTED:",
    file.originalname
  );

  const result =
    await handleVideo(
      file,
      lastText
    );

  console.log(
    "🎬 VIDEO RESULT:",
    result
  );

  // ✅ STRING RESPONSE
  if (
    typeof result === "string"
  ) {

    if (
      result.startsWith("http")
    ) {

      return res.json({
        type: "video",
        url: result,
        text: "Video ready",
        usedModel:
          "video-tool",
      });
    }

    return res.json({
      type: "text",
      text: result,
      usedModel:
        "video-tool",
    });
  }

  // ✅ OBJECT RESPONSE
  return res.json({

    type:
      result?.type || "text",

    url:
      result?.url || null,

    text:
      result?.text ||
      "Video processed",

    usedModel:
      "video-tool",
  });
 }
    }
    
    // =========================
    // NEWS / SEARCH
    // =========================
    if (
      tool === "news" ||
      tool === "search"
    ) {
      const news =
        await getLiveNews(lastText);

      return res.json({
        text: news,
        usedModel: "news-tool",
      });
    }

     // =====================================
    // MEMORY
    // =====================================

    if (
      userId &&
      !isTemporaryChat &&
      lastText
    ) {

      extractAndStoreMemory({
        userId,
        message: lastText,
      }).catch(console.error);
    }

    let memoryPrompt =
      null;

    if (
      userId &&
      !isTemporaryChat
    ) {

      try {

        const memories =
          await getUserMemory(
            userId,
            15
          );

        memoryPrompt =
          buildMemorySystemPrompt(
            memories
          );

      } catch (_) {}
    }

    // =========================
    // EMOTION
    // =========================
    let emotion = "neutral";
    let emotionStyle = "";

    try {
      emotion =
        await detectEmotion(
          lastText
        );

      emotionStyle =
        getEmotionStyle(
          emotion
        );
    } catch (_) {}

    // =========================
    // SYSTEM PROMPT
    // =========================
   const systemMessage = {
  role: "system",
  content: `
You are DevU AI — a premium smart assistant.

Identity:
- Fast, intelligent, practical, modern.
- Helpful like a real expert.

Style:
- Clear and direct.
- Friendly and professional.
- Concise by default.
- Use bullets / steps when useful.
- Detailed only when needed.

Intelligence:
- Understand short or unclear questions intelligently.
- Infer likely user intent when possible.
- Ask follow-up only if required.
- Think step-by-step for difficult tasks.

Skills:
- Give clean working code.
- Explain exactly where to paste code.
- Solve bugs practically.
- Give realistic business advice.

Support:
- Be calm, respectful, supportive.

Never:
- Never say "As an AI language model".
- Never sound robotic.
- Never invent facts.
- Never waste words.

Goal:
Make every reply useful, smart, and premium.
`,
};
    const finalMessages = [
      systemMessage,
      ...(memoryPrompt
        ? [memoryPrompt]
        : []),
      ...messages,
    ];
    // =====================================
    // CACHE
    // =====================================

    const cacheKey =
      lastText
        .toLowerCase()
        .trim();

    const cached =
      getCache(cacheKey);

    if (cached) {

      return res.json({
        text: cached,
        usedModel:
          "cache",
      });
    }

    // =====================================
    // AI RESPONSE
    // =====================================

    const {
  stream,
  usedModel,
} = await getBestStream(
  finalMessages
);

    let fullResponse =
      "";

    for await (
      let token of stream
    ) {

      token = String(
        token || ""
      );

      if (
        !token.trim()
      ) {
        continue;
      }

      token =
        humanizeText(
          token
        );

      fullResponse +=
        token;
    }

    fullResponse =
      enhanceTextForSpeech(
        fullResponse,
        emotion
      );

    fullResponse =
      cleanText(
        fullResponse
      );

    if (
      !fullResponse
    ) {

      fullResponse =
        "⚠️ AI returned empty response.";
    }

    setCache(
      cacheKey,
      fullResponse
    );

    return res.json({

      text:
        fullResponse,

      usedModel,

      isPremium:
        user?.isPremium ||
        false,

      freeChatsLeft:
        user?.freeChatsLeft ??
        null,
    });
    }

 } catch (err) {

    logError(
      "AI_FATAL",
      err
    );

    return res.status(500).json({

      error:
        "Something went wrong",

      text:
        "⚠️ Server error",
    });
  }
  }