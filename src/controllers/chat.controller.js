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

/**
 * 🧠 FIXED MODEL (NO CONFUSION)
 */
const MODEL = "openai/gpt-4o-mini"; // 🔥 stable + fast

function humanizeText(text) {
  if (!text) return text;

  return text
    .replace(/\.\s/g, "... ")
    .replace(/\!\s/g, "! ")
    .replace(/,\s/g, ", ");
}

/**
 * 🔥 FINAL CHAT CONTROLLER
 */
export async function chatController(req, res) {
  try {
    let { messages } = req.body;

    const user = req.user;
    const userId = user?.id;
    const isTemporaryChat = req.isTemporaryChat === true;

    if (!messages) {
      return res.status(400).json({
        error: "messages are required",
      });
    }

    // ===============================
    // 🧠 MEMORY EXTRACTION (ASYNC)
    // ===============================
    if (userId && Array.isArray(messages)) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

    if (lastUserMessage?.content && userId && !isTemporaryChat) {
  extractAndStoreMemory(userId, lastUserMessage.content)
    .catch(() => {});
}
    }

    // ===============================
    // 🧠 LOAD MEMORY
    // ===============================
    let memoryPrompt = null;

    if (!isTemporaryChat && userId) {
      const memories = await getUserMemory(userId, 15);
      memoryPrompt = buildMemorySystemPrompt(memories);
    }

    // ===============================
    // 🎭 EMOTION
    // ===============================
    let emotion = "neutral";
    let emotionStyle = "";

    try {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage?.content) {
        emotion = await detectEmotion(lastUserMessage.content);
        emotionStyle = getEmotionStyle(emotion);
      }
    } catch (emotionErr) {
      // Handle emotion detection failure silently
    }

   // ===============================
// 🤖 SYSTEM PROMPT (REAL AI)
// ===============================
const systemMessage = {
  role: "system",
  content: `
You are DevU AI — a fast, intelligent assistant.

User emotion: ${emotion}

Behavior:
${emotionStyle}

Response Style:
- Be clear and direct
- Keep answers short unless needed
- Use bullet points when helpful
- Avoid large paragraphs
- Do not repeat previous answers

Thinking:
- Think step-by-step for complex problems
- Ask clarifying questions if needed

Coding:
- Provide clean, working code
- Avoid unnecessary comments

Rules:
- Do NOT hallucinate
- Do NOT guess
- Be accurate and practical

You are DevU — not an API.
`,
};

// ===============================
// 🧹 CLEAN + TRIM MESSAGES
// ===============================
const MAX_HISTORY = 12;

const cleanedMessages = Array.isArray(messages)
  ? messages
      .filter((m) => m && typeof m.content === "string")
      .map((m) => ({
        role: m.role,
        content: m.content.trim(),
      }))
      .filter((m) => m.content.length > 0)
  : [];

const trimmedMessages = cleanedMessages
  .filter((m) => m.role !== "system")
  .slice(-MAX_HISTORY);

// ===============================
// 🧠 CONTEXT BOOST
// ===============================
const lastUserMessage = [...trimmedMessages]
  .reverse()
  .find((m) => m.role === "user");

const contextHint = lastUserMessage
  ? {
      role: "system",
      content: `User intent: ${lastUserMessage.content}`,
    }
  : null;

// ===============================
// 🧠 FINAL MESSAGE STACK
// ===============================
const finalMessages = [
  systemMessage,
  ...(memoryPrompt ? [memoryPrompt] : []),
  ...(contextHint ? [contextHint] : []),
  ...trimmedMessages,
];

// ===============================
// 🧹 FINAL CLEAN
// ===============================
const cleanMessages = finalMessages.filter(
  (m) =>
    m &&
    typeof m.role === "string" &&
    typeof m.content === "string" &&
    m.content.trim().length > 0
);

// ===============================
// 👋 GREETING
// ===============================
if (cleanMessages.length <= 1) {
  return res.json({
    text: DEFAULT_GREETING,
  });
}

// ===============================
// 🧠 TOOL DETECTION (FIXED)
// ===============================
const lastMessage = cleanMessages[cleanMessages.length - 1]?.content || "";

// 🔥 FIX: files safe
const files = req.files || [];

const tool = detectTool(lastMessage, files);

console.log("🧠 TOOL:", tool);


// ===============================
// 🎯 TOOL HANDLER (🔥 CORE FIX)
// ===============================

// 🎨 IMAGE GENERATION (GHIBLI)
if (tool === "vision" && lastMessage.toLowerCase().includes("ghibli")) {
  console.log("🎨 IMAGE TOOL TRIGGERED");

  const imageUrl = await generateImage(lastMessage);

  res.write(
    `data: ${JSON.stringify({
      token: imageUrl,
    })}\n\n`
  );

  res.write("data: [DONE]\n\n");
  return res.end();
}

// 🌍 REAL-TIME NEWS
if (tool === "search") {
  console.log("🌍 NEWS TOOL TRIGGERED");

  const news = await getLiveNews(lastMessage);

  res.write(
    `data: ${JSON.stringify({
      token: news,
    })}\n\n`
  );

  res.write("data: [DONE]\n\n");
  return res.end();
}
    
// ===============================
// ⚡ CACHE
// ===============================
const cacheKey = JSON.stringify(cleanMessages);
const cached = getCache(cacheKey);

if (cached) {
  // 🔥 STREAM CACHE LIKE REAL AI
  const chunks = cached.match(/.{1,40}/g) || [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  for (const chunk of chunks) {
    res.write(
      `data: ${JSON.stringify({
        choices: [
          {
            delta: { content: chunk },
          },
        ],
      })}\n\n`
    );

    await new Promise((r) => setTimeout(r, 15)); // smooth typing
  }

  res.write("event: done\n\n");
  return res.end();
}

// ===============================
// 🔥 STREAM RESPONSE
// ===============================
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

logEvent("AI_REQUEST", {
  userId,
  messages: cleanMessages.length,
});

const MODEL_FALLBACK = [
  "gpt4o",
  "gemini",
  "groq",
  "huggingface",
];

let stream = null;

for (const model of MODEL_FALLBACK) {
  try {
    console.log("🔄 Trying:", model);

    if (model === "gpt4o") {
      stream = await streamOpenRouter(cleanMessages, [], "gpt-4o-mini");
    }

    if (model === "gemini") {
      stream = await streamGemini(cleanMessages);
    }

    if (model === "groq") {
      stream = await streamGroq(cleanMessages);
    }

    if (model === "huggingface") {
      stream = await streamHuggingFace(cleanMessages);
    }

    if (stream) break;

  } catch (err) {
    console.error(`❌ ${model} failed:`, err.message);
  }
}

if (!stream) {
  throw new Error("All AI models failed");
}


    let fullResponse = "";

    for await (let token of stream) {
      token = humanizeText(token);
      fullResponse += token;

      res.write(
  `data: ${JSON.stringify({
    choices: [
      {
        delta: { content: token },
      },
    ],
  })}\n\n`
);
    }

    // ===============================
    // 🔊 FINAL PROCESS
    // ===============================
    const finalSpeechText = enhanceTextForSpeech(
      fullResponse,
      emotion
    );

    setCache(cacheKey, finalSpeechText);

    logEvent("AI_SUCCESS", {
      length: fullResponse.length,
    });

    res.write("event: done\n\n");
    res.end();
  } catch (err) {
    logError("AI_FATAL", err);

    res.write(
  `data: ${JSON.stringify({
    choices: [
      {
        delta: { content: "⚠️ Something went wrong..." },
      },
    ],
  })}\n\n`
);
    res.write("event: done\n\n");
    res.end();
  }
}