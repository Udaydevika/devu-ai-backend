import { streamOpenRouter } from "../services/openrouter.service.js";
import { streamGemini } from "../services/gemini.service.js";
import { streamGroq } from "../services/groq.service.js";
import { streamHuggingFace } from "../services/huggingface.service.js";

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
      name: "gpt4o",
      run: async () =>
        await streamOpenRouter(messages, [], "gpt-4o-mini"),
    },
    {
      name: "gemini",
      run: async () =>
        await streamGemini(messages),
    },
    {
      name: "groq",
      run: async () =>
        await streamGroq(messages),
    },
    {
      name: "huggingface",
      run: async () =>
        await streamHuggingFace(messages),
    },
  ];

  for (const provider of providers) {
    try {
      const stream = await provider.run();

      if (stream) {
        return {
          stream,
          usedModel: provider.name,
        };
      }
    } catch (_) {}
  }

  throw new Error("All AI providers failed");
}

export async function chatController(req, res) {
  try {
    let { messages } = req.body;

    const user = req.user;
    const userId = req.userId;
    const isTemporaryChat =
      req.isTemporaryChat === true;

    const files = req.files || []; // ✅ IMPORTANT

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
    const tool = detectTool(lastText, files);

    console.log("🧠 TOOL:", tool);

    // =========================
    // ✅ IMAGE ANALYSIS FIX
    // If user uploads image
    // =========================
    if (
  files.length > 0 &&
  files[0].mimetype?.startsWith("image/")
) {
  const stream = await streamGemini(
    messages,
    files[0].buffer,
    files[0].mimetype
  );

  let fullResponse = "";

  for await (const token of stream) {
    fullResponse += token;
  }

  return res.json({
    text: fullResponse || "Could not analyze image.",
    usedModel: "gemini-vision",
  });
}

    // =========================
    // IMAGE GENERATION
    // =========================
    if (
      tool === "image" ||
      (tool === "vision" &&
        lastText
          .toLowerCase()
          .includes("ghibli"))
    ) {
      const imageUrl =
        await generateImage(lastText);

      return res.json({
        text:
          imageUrl ||
          "Image generation failed",
        usedModel: "image-tool",
      });
    }

        // =========================
    // 📄 DOCUMENT / PDF / TXT
    // 🎬 VIDEO
    // =========================
    if (files.length > 0) {
      const file = files[0];

      // Skip image because already handled above
      if (!file.mimetype?.startsWith("image/")) {

        // 📄 PDF / DOCX / TXT
        if (
          file.mimetype === "application/pdf" ||
          file.mimetype.includes("text") ||
          file.mimetype.includes("document") ||
          file.originalname?.toLowerCase().endsWith(".docx") ||
          file.originalname?.toLowerCase().endsWith(".txt")
        ) {
          const extractedText =
            await handleFile(file);

          const summaryPrompt = [
            {
              role: "user",
              content:
                `Summarize this document clearly:\n\n${extractedText}`,
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
          file.mimetype?.startsWith("video/")
        ) {
          const result =
            await handleVideo(file);

          return res.json({
            text: result,
            usedModel: "video-tool",
          });
        }
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

    // =========================
    // MEMORY
    // =========================
    if (
      userId &&
      !isTemporaryChat &&
      lastText
    ) {
      extractAndStoreMemory(
        userId,
        lastText
      ).catch(() => {});
    }

    let memoryPrompt = null;

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

    // =========================
    // CACHE
    // =========================
    const cacheKey =
      JSON.stringify(
        finalMessages
      );

    const cached =
      getCache(cacheKey);

    if (cached) {
      return res.json({
        text: cached,
        usedModel: "cache",
      });
    }

    // =========================
    // AI RESPONSE
    // =========================
    const {
      stream,
      usedModel,
    } =
      await getBestStream(
        finalMessages
      );

    let fullResponse = "";

    for await (let token of stream) {
      token =
        humanizeText(token);

      fullResponse += token;
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

    if (!fullResponse) {
      fullResponse =
        "Sorry, no response.";
    }

    setCache(
      cacheKey,
      fullResponse
    );

    return res.json({
      text: fullResponse,
      usedModel,
      isPremium:
        user?.isPremium ||
        false,
      freeChatsLeft:
        user?.freeChatsLeft ??
        null,
    });
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