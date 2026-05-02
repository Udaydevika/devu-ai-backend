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
// 🛡 SAFE SSE SEND
// ==========================
function send(res, type, content) {
  if (!content || content.toString().trim() === "") return;

  res.write(
    `data: ${JSON.stringify({
      type,
      content,
    })}\n\n`
  );

  res.flush?.();
}

// ==========================
// 🧠 MODEL NORMALIZER
// ==========================
function normalizeModel(model) {
  if (!model) return "smart";

  const m = model.toLowerCase().trim();

  const map = {
    smart: "smart",
    gpt4o: "gpt4o",
    "gpt-4o-mini": "gpt-4o-mini",
    gemini: "gemini",
    groq: "groq",
    huggingface: "huggingface",
  };

  return map[m] || "smart";
}

// ==========================
// ⚡ SMART MODE
// ==========================
function chooseSmartFallback(text = "") {
  const q = text.toLowerCase();

  const hard =
    q.includes("code") ||
    q.includes("flutter") ||
    q.includes("firebase") ||
    q.includes("app") ||
    q.includes("business") ||
    q.includes("money") ||
    q.includes("strategy") ||
    q.includes("fix") ||
    q.length > 120;

  if (hard) {
    return ["gpt4o", "groq", "gemini"];
  }

  return ["groq", "gpt4o", "gemini"];
}

// ==========================
// 🚀 ULTRA SPEED MODE
// ==========================
async function getFastestStream(messages, files) {
  return Promise.any([
    (async () => {
      const stream = await streamGroq(messages);
      return { name: "groq", stream };
    })(),

    (async () => {
      const stream = await streamOpenRouter(
        messages,
        files,
        "gpt4o"
      );
      return {
        name: "openrouter",
        stream,
      };
    })(),
  ]);
}

// ==========================
// 🚀 CONTROLLER
// ==========================
export const chatStreamController = [
  async (req, res) => {
    try {
      let { model } = req.body;
      model = normalizeModel(model);

      let messages;

      try {
        messages =
          typeof req.body.messages ===
          "string"
            ? JSON.parse(
                req.body.messages
              )
            : req.body.messages;
      } catch {
        return res
          .status(400)
          .json({
            error:
              "Invalid messages JSON",
          });
      }

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "messages required",
          });
      }

      // ==========================
      // 📎 FILES
      // ==========================
      const rawFiles =
        req.files || [];

      const files = rawFiles.map(
        (f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          bytes: f.buffer,
          buffer: f.buffer,
        })
      );

      const lastRaw =
messages[messages.length - 1]?.content;

const lastMessage =
typeof lastRaw === "string"
  ? lastRaw
  : Array.isArray(lastRaw)
  ? lastRaw
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join(" ")
  : "";
      const tool = detectTool(
        lastMessage,
        files
      );

      // ==========================
      // 📡 SSE HEADERS
      // ==========================
      res.writeHead(200, {
        "Content-Type":
          "text/event-stream",
        "Cache-Control":
          "no-cache",
        Connection:
          "keep-alive",
      });

      res.flushHeaders?.();
      res.write(":\n\n");
      res.flush?.();

      // ==========================
      // 📰 NEWS
      // ==========================
      if (tool === "search") {
        const news =
          await getLiveNews(
            lastMessage
          );

        send(
          res,
          "news",
          news
        );

        res.write(
          "data: [DONE]\n\n"
        );

        return res.end();
      }

      // ==========================
      // 🖼 IMAGE
      // ==========================
      if (tool === "image") {
        const image =
          await generateImage(
            lastMessage
          );

        send(
          res,
          "image",
          image
        );

        res.write(
          "data: [DONE]\n\n"
        );

        return res.end();
      }

      // ==========================
      // 📄 FILE
      // ==========================
      if (
        tool === "file" &&
        files.length > 0
      ) {
        const result =
          await handleFile(
            files[0]
          );

        send(
          res,
          "file",
          result
        );

        res.write(
          "data: [DONE]\n\n"
        );

        return res.end();
      }

      // ==========================
      // 🎬 VIDEO
      // ==========================
      if (
        tool === "video" &&
        files.length > 0
      ) {
        const result =
          await handleVideo(
            files[0]
          );

        send(
          res,
          "video",
          result
        );

        res.write(
          "data: [DONE]\n\n"
        );

        return res.end();
      }

      if (tool === "audio" && files.length > 0) {
  const result = await handleAudio(files[0]);
  send(res, "audio", result);

   res.write(
          "data: [DONE]\n\n"
        );

        return res.end();
}

      // ==========================
      // 💎 PREMIUM PROMPT
      // ==========================
      const systemMessage = {
        role: "system",
        content: `
You are DevU AI.

Smart, fast, practical.

Rules:
- Clear answers
- Helpful first
- Avoid robotic tone
- Use steps when useful
- Give real solutions
- Good coding help
- Smart business advice
- Never hallucinate
`,
      };

      const cleanMessages = [
  systemMessage,
  ...messages,
].filter((m) => {
  if (typeof m.role !== "string") return false;

  if (typeof m.content === "string") {
    return m.content.trim().length > 0;
  }

  if (Array.isArray(m.content)) {
    return m.content.length > 0;
  }

  return false;
});

      // ==========================
      // 🚀 ULTRA SPEED PREMIUM
      // ==========================
      const isPremium =
        req.user?.isPremium ===
        true;

      if (isPremium) {
        try {
          const fastest =
            await getFastestStream(
              cleanMessages,
              files
            );

          for await (const token of fastest.stream) {
            send(
              res,
              "text",
              token
            );
          }

          res.write(
            "data: [DONE]\n\n"
          );

          return res.end();
        } catch (err) {
 console.error(current, err.message);
}
      }

      // ==========================
      // ⚡ SMART MODE
      // ==========================
      const fallback =
        model === "smart"
          ? chooseSmartFallback(
              lastMessage
            )
          : [model, "groq", "gemini"];

      for (const current of fallback) {
        try {
          let stream;

          if (
            current === "groq"
          ) {
            stream =
              await streamGroq(
                cleanMessages
              );
          } else if (
            current ===
              "gpt4o" ||
            current ===
              "gpt-4o-mini"
          ) {
            stream =
              await streamOpenRouter(
                cleanMessages,
                files,
                current
              );
          } else if (
            current ===
            "gemini"
          ) {
            stream =
              await streamGemini(
                cleanMessages
              );
          } else {
            stream =
              await streamHuggingFace(
                cleanMessages
              );
          }

          for await (const token of stream) {
            send(
              res,
              "text",
              token
            );
          }

          res.write(
            "data: [DONE]\n\n"
          );

          return res.end();
        } catch (err) {
 console.error(current, err.message);
}
      }

      // ==========================
      // ❌ TOTAL FAIL
      // ==========================
      send(
        res,
        "text",
        "⚠️ AI unavailable now."
      );

      res.write(
        "data: [DONE]\n\n"
      );

      res.end();
    } catch (err) {
      send(
        res,
        "text",
        "⚠️ Server error"
      );

      res.write(
        "data: [DONE]\n\n"
      );

      res.end();
    }
  },
];