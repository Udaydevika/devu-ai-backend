import { streamOpenRouter } from "../services/openrouter.service.js";
import { streamGemini } from "../services/gemini.service.js";
import { streamGroq } from "../services/groq.service.js";
import { streamHuggingFace } from "../services/huggingface.service.js";

import { detectTool } from "../ai/toolRouter.js";

import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { handleAudio } from "../ai/tools/audio.tool.js";
import { generateImage } from "../ai/tools/image.tool.js";
import { getLiveNews } from "../ai/tools/news.tool.js";

// ==========================
// SSE SAFE SEND
// ==========================
function send(res, type, content) {
  if (!content) return;

  res.write(
    `data: ${JSON.stringify({
      type,
      content,
    })}\n\n`
  );

  res.flush?.();
}

// ==========================
// MODEL
// ==========================
function normalizeModel(model) {
  if (!model) return "smart";

  const m = model.toLowerCase();

  const map = {
    smart: "smart",
    groq: "groq",
    gpt4o: "gpt4o",
    gemini: "gemini",
    huggingface:
      "huggingface",
  };

  return map[m] || "smart";
}

// ==========================
// FASTEST ORDER
// ==========================
function chooseSmartFallback() {
  return [
    "groq",
    "gpt4o",
    "gemini",
    "huggingface",
  ];
}

// ==========================
// CONTROLLER
// ==========================
export const chatStreamController = [
  async (req, res) => {
    try {
      let { model } = req.body;
      model =
        normalizeModel(model);

      let messages =
        typeof req.body
          .messages ===
        "string"
          ? JSON.parse(
              req.body
                .messages
            )
          : req.body.messages;

      if (
        !Array.isArray(
          messages
        ) ||
        messages.length === 0
      ) {
        return res.status(400).json({
          error:
            "messages required",
        });
      }

      // ==========================
      // FILES
      // ==========================
      const rawFiles =
        req.files || [];

      if (rawFiles.length > 0) {
        console.log(
          "📎 Upload:",
          rawFiles.map(
            (f) => ({
              name:
                f.originalname,
              type:
                f.mimetype,
              size:
                f.size,
            })
          )
        );
      }

      const files =
        rawFiles.map(
          (f) => ({
            name:
              f.originalname,
            mimeType:
              f.mimetype,
            buffer:
              f.buffer,
          })
        );

      const lastRaw =
        messages[
          messages.length -
            1
        ]?.content;

      const lastMessage =
        Array.isArray(
          lastRaw
        )
          ? lastRaw
              .filter(
                (p) =>
                  p.type ===
                  "text"
              )
              .map(
                (p) =>
                  p.text ||
                  ""
              )
              .join(" ")
          : String(
              lastRaw ||
                ""
            );

      let tool =
        detectTool(
          lastMessage,
          files
        );

      // ==========================
      // SSE HEADERS
      // ==========================
      res.writeHead(200, {
        "Content-Type":
          "text/event-stream",
        "Cache-Control":
          "no-cache",
        Connection:
          "keep-alive",
        "X-Accel-Buffering":
          "no",
      });

      res.flushHeaders?.();
     res.write(":\n\n");

// 🔥 KEEPALIVE PING
const ping = setInterval(() => {
  try {
    res.write(":\n\n");
  } catch (_) {}
}, 15000);
      // ==========================
      // IMAGE VISION
      // ==========================
      if (
        tool ===
          "vision" &&
        files.length > 0
      ) {
        const stream =
          await streamGemini(
            messages,
            files[0]
              .buffer,
            files[0]
              .mimeType
          );

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
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // FILE
      // ==========================
      if (
        tool ===
          "file" &&
        files.length > 0
      ) {
        const out =
          await handleFile(
            files[0]
          );

        send(
          res,
          "file",
          out
        );

        res.write(
          "data: [DONE]\n\n"
        );
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // AUDIO
      // ==========================
      if (
        tool ===
          "audio" &&
        files.length > 0
      ) {
        const out = await handleAudio(
  files[0],
  lastMessage
);

        send(
          res,
          "audio",
          out
        );

        res.write(
          "data: [DONE]\n\n"
        );
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // VIDEO
      // ==========================
      if (tool === "video" && files.length > 0) {
  const out =
    await handleVideo(
      files[0],
      lastMessage
    );

        send(
          res,
          "video",
          out
        );

        res.write(
          "data: [DONE]\n\n"
        );
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // NEWS
      // ==========================
      if (
        tool ===
        "search"
      ) {
        const out =
          await getLiveNews(
            lastMessage
          );

        send(
          res,
          "news",
          out
        );

        res.write(
          "data: [DONE]\n\n"
        );
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // IMAGE GEN
      // ==========================
      if (
        tool ===
        "image"
      ) {
        const out =
          await generateImage(
            lastMessage
          );

        send(
          res,
          "image",
          out
        );

        res.write(
          "data: [DONE]\n\n"
        );
        clearInterval(ping);
        return res.end();
      }

      // ==========================
      // CHAT MODELS
      // ==========================
      const systemMessage =
        {
          role:
            "system",
          content:
            "You are DevU AI. Smart, fast, practical.",
        };

      const cleanMessages =
        [
          systemMessage,
          ...messages,
        ];

      const fallback =
        model ===
        "smart"
          ? chooseSmartFallback()
          : [
              model,
              "groq",
              "gpt4o",
              "gemini",
              "huggingface",
            ];

      for (const current of fallback) {
        try {
          let stream;

          if (
            current ===
            "groq"
          ) {
            stream =
              await streamGroq(
                cleanMessages
              );
          } else if (
            current ===
            "gpt4o"
          ) {
            stream =
              await streamOpenRouter(
                cleanMessages,
                files,
                "gpt4o"
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
          clearInterval(ping);
          return res.end();
        } catch (err) {
          console.log(
            "Fallback:",
            current
          );
        }
      }

      send(
        res,
        "text",
        "⚠️ AI unavailable now."
      );

      res.write(
        "data: [DONE]\n\n"
      );
      clearInterval(ping);
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
      clearInterval(ping);
      res.end();
    }
  },
];