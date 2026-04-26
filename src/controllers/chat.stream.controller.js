// src/controllers/chat.stream.controller.js

import multer from "multer";

import { streamOpenRouter } from "../services/openrouter.service.js";
import { streamGemini } from "../services/gemini.service.js";
import { streamGroq } from "../services/groq.service.js";
import { streamHuggingFace } from "../services/huggingface.service.js";

import { detectTool } from "../ai/toolRouter.js";
import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { generateImage } from "../ai/tools/image.tool.js";
import { getLiveNews } from "../ai/tools/news.tool.js";


// ==========================
// 📦 MULTER
// ==========================
const upload = multer({
  storage: multer.memoryStorage(),
});

// ==========================
// 🧠 MODEL FALLBACK
// ==========================
const MODEL_FALLBACK = {
  gpt4o: ["gpt4o", "gemini", "groq", "huggingface"],
  "gpt-4o-mini": ["gpt-4o-mini", "gemini", "groq", "huggingface"],
  gemini: ["gemini", "gpt4o", "groq", "huggingface"],
};

// ==========================
// 🔧 NORMALIZE MODEL
// ==========================
function normalizeModel(model) {
  if (!model) return "gpt4o";

  const m = model.toLowerCase().trim();

  const map = {
    gpt4o: "gpt4o",
    "gpt-4o-mini": "gpt-4o-mini",
    gemini: "gemini",
    groq: "groq",
    huggingface: "huggingface",
  };

  return map[m] || "gpt4o";
}

// ==========================
// 🛡 SAFE SEND FUNCTION (CRITICAL FIX)
// ==========================
function send(res, type, content) {
  if (!content || content.toString().trim() === "") return;

  const payload = JSON.stringify({
    type,
    content,
  });

  res.write(`data: ${payload}\n\n`);

  // 🔥 FORCE FLUSH
  res.flush?.();
}

// ==========================
// 🚀 CONTROLLER
// ==========================
export const chatStreamController = [
  upload.array("files"),
  async (req, res) => {
    try {
      let { model } = req.body;
      model = normalizeModel(model);

      let messages;

      try {
        messages =
          typeof req.body.messages === "string"
            ? JSON.parse(req.body.messages)
            : req.body.messages;
      } catch {
        return res.status(400).json({ error: "Invalid messages JSON" });
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages required" });
      }

      const rawFiles = req.files || [];

      const files = rawFiles.map((f) => ({
        name: f.originalname,
        mimeType: f.mimetype,
        buffer: f.buffer,
        bytes: f.buffer,
      }));

      const lastMessage = messages[messages.length - 1]?.content || "";
      const tool = detectTool(lastMessage, files);

      console.log("🧠 TOOL:", tool);

      // ==========================
      // 📡 SSE HEADERS
      // ==========================
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      res.flushHeaders?.();

      // 🔥 CRITICAL FIX (disable buffering)
res.write(":\n\n");

      // ==========================
      // 📰 NEWS
      // ==========================
      if (tool === "search") {
        const news = await getLiveNews(lastMessage);
        send(res, "news", news);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      // ==========================
      // 🖼 IMAGE
      // ==========================
      if (tool === "image") {
        const imageUrl = await generateImage(lastMessage);
        send(res, "image", imageUrl);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      // ==========================
      // 📄 FILE
      // ==========================
      if (tool === "file" && files.length > 0) {
        const result = await handleFile(files[0]);
        send(res, "file", result);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      // ==========================
      // 🎬 VIDEO
      // ==========================
      if (tool === "video" && files.length > 0) {
        const result = await handleVideo(files[0]);
        send(res, "video", result);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      // ==========================
      // 🤖 NORMAL AI
      // ==========================
      const systemMessage = {
  role: "system",
  content: `
You are DevU AI — a fast, intelligent assistant.

Behavior:
- Be clear and direct
- Avoid unnecessary long answers
- Use simple explanations
- Think step-by-step for complex problems

Coding:
- Give clean, working code
- Avoid unnecessary comments

Style:
- Friendly but professional
- Similar to ChatGPT

Rules:
- Do NOT hallucinate
- Do NOT guess
- Ask if unclear
`,
};

      const cleanMessages = [systemMessage, ...messages].filter(
        (m) =>
          typeof m.role === "string" &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );

      const fallback =
        MODEL_FALLBACK[model] || [
          model,
          "gpt4o",
          "gemini",
          "groq",
          "huggingface",
        ];

      for (const currentModel of fallback) {
        try {
          console.log("🔁 Trying:", currentModel);

          let stream = null;

          if (currentModel === "groq") {
            stream = await streamGroq(cleanMessages);
          } else if (
            currentModel === "gpt4o" ||
            currentModel === "gpt-4o-mini"
          ) {
            stream = await streamOpenRouter(
              cleanMessages,
              files,
              currentModel
            );
          } else if (currentModel === "gemini") {
            stream = await streamGemini(cleanMessages);
          } else if (currentModel === "huggingface") {
            stream = await streamHuggingFace(cleanMessages);
          }

          if (!stream) throw new Error("No stream");

          for await (const token of stream) {
            if (!token || token.trim() === "") continue;

            console.log("📡 TOKEN:", token);

            send(res, "text", token);
          }

          res.write("data: [DONE]\n\n");
          return res.end();
        } catch (err) {
          console.error(`❌ ${currentModel} failed`, err.message);
        }
      }

      // ==========================
      // ❌ FALLBACK
      // ==========================
      send(res, "text", "⚠️ AI service unavailable.");
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("❌ CONTROLLER ERROR:", err);

      send(res, "text", "⚠️ Server error");
      res.write("data: [DONE]\n\n");
      res.end();
    }
  },
];