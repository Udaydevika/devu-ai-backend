// src/controllers/chat.stream.controller.js

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

import { handleOCR } from "../ai/tools/ocr.tool.js";
import { createPDF } from "../ai/tools/pdf.tool.js";
import { generateResume } from "../ai/tools/resume.tool.js";

/**
 * ======================================================
 * 🔥 DevU AI FINAL CREATOR MODE CONTROLLER
 *
 * Supports:
 * ✅ Normal Chat
 * ✅ Smart Model Fallback
 * ✅ Camera / Photos / Vision
 * ✅ OCR Scanner
 * ✅ Audio Upload / Transcribe
 * ✅ Video Upload / Edit
 * ✅ PDF / DOCX / TXT / CSV
 * ✅ Resume Builder
 * ✅ PDF Export
 * ✅ Ghibli / AI Images
 * ✅ Download Cards
 * ✅ News Search
 * ======================================================
 */

// ======================================================
// SSE SEND
// ======================================================
function send(res, type, content) {
  if (
    content === undefined ||
    content === null
  ) return;

  res.write(
    `data: ${JSON.stringify({
      type,
      content,
    })}\n\n`
  );

  res.flush?.();
}

// ======================================================
// DOWNLOAD CARD
// ======================================================
function sendDownload(
  res,
  title,
  url,
  fileType = "file"
) {
  send(res, "download", {
    title,
    url,
    fileType,
  });
}

// ======================================================
// DONE
// ======================================================
function done(res, ping) {
  clearInterval(ping);

  try {
    res.write(
      "data: [DONE]\n\n"
    );
  } catch (_) {}

  return res.end();
}

// ======================================================
// START SSE
// ======================================================
function startSSE(res) {
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

  return setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (_) {}
  }, 15000);
}

// ======================================================
// MODEL
// ======================================================
function normalizeModel(model) {
  const m = String(
    model || "smart"
  )
    .toLowerCase()
    .trim();

  return [
    "smart",
    "groq",
    "gpt4o",
    "gemini",
    "huggingface",
  ].includes(m)
    ? m
    : "smart";
}

function fallbackOrder(model) {
  if (model === "smart") {
    return [
      "groq",
      "gpt4o",
      "gemini",
      "huggingface",
    ];
  }

  return [
    model,
    "groq",
    "gpt4o",
    "gemini",
    "huggingface",
  ];
}

// ======================================================
// LAST USER TEXT
// ======================================================
function getLastText(
  messages = []
) {
  const last =
    messages[
      messages.length - 1
    ]?.content;

  if (Array.isArray(last)) {
    return last
      .filter(
        (p) =>
          p.type ===
          "text"
      )
      .map(
        (p) =>
          p.text || ""
      )
      .join(" ")
      .trim();
  }

  return String(
    last || ""
  ).trim();
}

// ======================================================
// CONTROLLER
// ======================================================
export const chatStreamController =
  [
    async (req, res) => {
      let ping = null;

      try {
        // ====================================
        // BODY
        // ====================================
        let { model } =
          req.body;

        model =
          normalizeModel(
            model
          );

        let messages =
          typeof req.body
            .messages ===
          "string"
            ? JSON.parse(
                req.body
                  .messages
              )
            : req.body
                .messages;

        if (
          !Array.isArray(
            messages
          ) ||
          messages.length ===
            0
        ) {
          return res
            .status(400)
            .json({
              error:
                "messages required",
            });
        }

        ping =
          startSSE(res);

        // ====================================
        // FILE INPUT FIX
        // ====================================
        const rawFiles =
          req.files
            ? Array.isArray(
                req.files
              )
              ? req.files
              : Object.values(
                  req.files
                ).flat()
            : req.file
            ? [req.file]
            : [];

        const files =
          rawFiles.map(
            (f) => ({
              name:
                f.originalname,
              mimeType:
                f.mimetype,
              buffer:
                f.buffer,
              size:
                f.size,
            })
          );

        const prompt =
          getLastText(
            messages
          );

        const tool =
          detectTool(
            prompt,
            files
          );

        // ====================================
        // FILE UPLOAD ROUTER
        // ====================================
        if (
          files.length > 0
        ) {
          try {
            // ----------------
            // GHIBLI UPLOAD
            // ----------------
            if (
              tool ===
              "ghibli"
            ) {
              const url =
                await generateImage(
                  `Studio Ghibli style portrait, anime style, cinematic lighting. ${prompt}`
                );

              if (!url) {
                send(
                  res,
                  "text",
                  "⚠️ Failed to generate image."
                );

                return done(
                  res,
                  ping
                );
              }

              send(
                res,
                "image",
                url
              );

              sendDownload(
                res,
                "Ghibli Art Ready",
                url,
                "image"
              );

              return done(
                res,
                ping
              );
            }

            // ----------------
            // OCR
            // ----------------
            if (
              tool ===
              "ocr"
            ) {
              const out =
                await handleOCR(
                  files[0],
                  prompt
                );

              send(
                res,
                "file",
                out
              );

              return done(
                res,
                ping
              );
            }

            // ----------------
            // CAMERA / PHOTO
            // ----------------
            if (
              tool ===
              "vision"
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

              return done(
                res,
                ping
              );
            }

            // ----------------
            // AUDIO
            // ----------------
            if (
              tool ===
              "audio"
            ) {
              const out =
                await handleAudio(
                  files[0],
                  prompt
                );

              send(
                res,
                "audio",
                out
              );

              return done(
                res,
                ping
              );
            }

            // ----------------
            // VIDEO
            // ----------------
            if (
              tool ===
              "video"
            ) {
              const out =
                await handleVideo(
                  files[0],
                  prompt
                );

              if (
                typeof out ===
                  "string" &&
                out.startsWith(
                  "http"
                )
              ) {
                send(
                  res,
                  "video",
                  out
                );

                sendDownload(
                  res,
                  "Edited Video Ready",
                  out,
                  "video"
                );
              } else {
                send(
                  res,
                  "text",
                  out
                );
              }

              return done(
                res,
                ping
              );
            }

            // ----------------
            // FILES
            // ----------------
            if (
              tool ===
              "file"
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

              return done(
                res,
                ping
              );
            }

            send(
              res,
              "text",
              "⚠️ Unsupported file type."
            );

            return done(
              res,
              ping
            );
          } catch (e) {
            console.error(
              "Upload route error:",
              e.message
            );

            send(
              res,
              "text",
              "⚠️ Failed to process upload."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // RESUME
        // ====================================
        if (
          tool ===
          "resume"
        ) {
          const url =
            await generateResume(
              prompt
            );

          sendDownload(
            res,
            "Resume Ready",
            url,
            "pdf"
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // IMAGE GEN
        // ====================================
        if (
          tool ===
          "image"
        ) {
          const url =
            await generateImage(
              prompt
            );

          if (!url) {
            send(
              res,
              "text",
              "⚠️ Failed to generate image."
            );

            return done(
              res,
              ping
            );
          }

          send(
            res,
            "image",
            url
          );

          sendDownload(
            res,
            "Generated Image Ready",
            url,
            "image"
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // NEWS
        // ====================================
        if (
          tool ===
          "search"
        ) {
          const out =
            await getLiveNews(
              prompt
            );

          send(
            res,
            "text",
            out
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // PDF CREATE
        // ====================================
        if (
          tool ===
          "pdf"
        ) {
          const url =
            await createPDF(
              "DevU AI PDF",
              prompt
            );

          sendDownload(
            res,
            "PDF Ready",
            url,
            "pdf"
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // NORMAL CHAT
        // ====================================
        const cleanMessages =
          [
            {
              role:
                "system",
              content:
                "You are DevU AI, smart premium assistant.",
            },
            ...messages,
          ];

        const models =
          fallbackOrder(
            model
          );

        for (const current of models) {
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
                  [],
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

            return done(
              res,
              ping
            );
          } catch (_) {}
        }

        send(
          res,
          "text",
          "⚠️ AI unavailable right now."
        );

        return done(
          res,
          ping
        );
      } catch (err) {
        console.error(
          "chatStreamController:",
          err.message
        );

        try {
          send(
            res,
            "text",
            "⚠️ Server error."
          );
        } catch (_) {}

        if (ping) {
          return done(
            res,
            ping
          );
        }

        return res
          .status(500)
          .json({
            error:
              "server error",
          });
      }
    },
  ];