// src/controllers/chat.stream.controller.js

import { streamGemini } from "../services/gemini.service.js";
import { streamGroq } from "../services/groq.service.js";

import { detectTool } from "../ai/toolRouter.js";

import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { handleAudio } from "../ai/tools/audio.tool.js";

import {
  generateImage,
  generateVariations,
} from "../ai/tools/image.tool.js";

import { getLiveNews } from "../ai/tools/news.tool.js";
import { handleOCR } from "../ai/tools/ocr.tool.js";
import { createPDF } from "../ai/tools/pdf.tool.js";
import { generateResume } from "../ai/tools/resume.tool.js";

import { editImage } from "../ai/tools/image.edit.tool.js";
import { imageToVideo } from "../ai/tools/image.video.tool.js";

// ==========================================
// SSE HELPERS
// ==========================================

function send(res, type, content) {
  if (!content) return;

  res.write(
    `data: ${JSON.stringify({
      type,
      content,
    })}\n\n`
  );
}

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

function done(res, ping) {
  clearInterval(ping);

  res.write("data: [DONE]\n\n");

  return res.end();
}

function startSSE(res) {
  res.writeHead(200, {
    "Content-Type":
      "text/event-stream",
    "Cache-Control":
      "no-cache",
    Connection: "keep-alive",
  });

  return setInterval(() => {
    res.write(":\n\n");
  }, 15000);
}

function getLastText(messages = []) {
  const last =
    messages[messages.length - 1];

  if (!last) return "";

  // Flutter sends array content
  if (Array.isArray(last.content)) {
    const txt = last.content.find(
      (p) => p.type === "text"
    );

    return txt?.text?.trim() || "";
  }

  return String(
    last.content || ""
  ).trim();
}

// ==========================================
// MAIN CONTROLLER
// ==========================================

export const chatStreamController = [
  async (req, res) => {
    const ping = startSSE(res);

    try {
      // ======================================
      // PARSE MESSAGES
      // ======================================

      const messages =
        typeof req.body.messages ===
        "string"
          ? JSON.parse(
              req.body.messages
            )
          : req.body.messages || [];

      const prompt =
        getLastText(messages);

      // ======================================
      // FILES
      // ======================================

      const rawFiles = req.files
        ? Array.isArray(req.files)
          ? req.files
          : Object.values(
              req.files
            ).flat()
        : req.file
        ? [req.file]
        : [];

      const files =
        rawFiles.map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          buffer: f.buffer,
        }));

      const file = files[0];

      // ======================================
      // DETECT TOOL
      // ======================================

      const tool =
        detectTool(
          prompt,
          files
        );

      console.log(
        "🧠 TOOL:",
        tool
      );

      // ======================================
      // FILE MODE
      // ======================================

      if (file) {
        // ====================================
        // 🎨 GHIBLI
        // ====================================

        if (tool === "ghibli") {
          const out =
            await generateImage(
              `Studio Ghibli style, ${prompt}`
            );

          if (
            out?.type ===
            "image"
          ) {
            send(
              res,
              "image",
              out.url
            );

            sendDownload(
              res,
              "Ghibli Art",
              out.url,
              "image"
            );
          } else {
            send(
              res,
              "text",
              out?.text ||
                "Image failed"
            );
          }

          return done(
            res,
            ping
          );
        }

        // ====================================
        // 📄 OCR
        // ====================================

        if (tool === "ocr") {
          const out =
            await handleOCR(
              file,
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
        // 🎧 AUDIO
        // ====================================

        if (tool === "audio") {
          const out =
            await handleAudio(
              file,
              prompt
            );

          if (
            out?.type ===
            "audio"
          ) {
            send(
              res,
              "audio",
              out.url
            );

            sendDownload(
              res,
              "Audio",
              out.url,
              "audio"
            );

            if (
              out.transcript
            ) {
              send(
                res,
                "text",
                out.transcript
              );
            }
          } else {
            send(
              res,
              "text",
              out?.text
            );
          }

          return done(
            res,
            ping
          );
        }

        // ====================================
        // 🎬 VIDEO
        // ====================================

        if (tool === "video") {
          const out =
            await handleVideo(
              file,
              prompt
            );

          if (
            out?.type ===
            "video"
          ) {
            send(
              res,
              "video",
              out.url
            );

            sendDownload(
              res,
              "Video",
              out.url,
              "video"
            );
          } else {
            send(
              res,
              "text",
              out?.text
            );
          }

          return done(
            res,
            ping
          );
        }

        // ====================================
        // 📄 FILE
        // ====================================

        const out =
          await handleFile(file);

        if (
          out?.type ===
          "file"
        ) {
          send(
            res,
            "file",
            out.text
          );
        } else {
          send(
            res,
            "text",
            out?.text
          );
        }

        return done(
          res,
          ping
        );
      }

              // ====================================
        // 📸 CAMERA / IMAGE ANALYSIS
        // ====================================

        if (
  file &&
  file.mimeType &&
  file.mimeType.startsWith("image/")
) {

          // 🎨 GHIBLI IMAGE GENERATION
          if (
            prompt
              .toLowerCase()
              .includes("ghibli")
          ) {

            const out =
              await generateImage(
                `Studio Ghibli style, ${prompt}`
              );

            if (
              out?.type === "image"
            ) {
              send(
                res,
                "image",
                out.url
              );

              sendDownload(
                res,
                "Ghibli Art",
                out.url,
                "image"
              );
            } else {
              send(
                res,
                "text",
                out?.text ||
                  "⚠️ Failed to generate image"
              );
            }

            return done(
              res,
              ping
            );
          }

          // ==================================
          // 👁️ NORMAL IMAGE ANALYSIS
          // ==================================

          const ask =
            prompt?.trim() ||
            "Analyze this image clearly and explain all important details.";

          const stream =
            await streamGemini(
              [
                {
                  role: "user",
                  content: ask,
                },
              ],
              file.buffer,
              file.mimeType
            );

          let output = "";

          for await (const t of stream) {
            output += t;
          }

          send(
            res,
            "text",
            output ||
              "⚠️ Could not analyze image."
          );

          return done(
            res,
            ping
          );
        }

      // ====================================
      // 🎨 IMAGE
      // ====================================

      if (tool === "image") {
        const out =
          await generateImage(
            prompt
          );

        if (
          out?.type ===
          "image"
        ) {
          send(
            res,
            "image",
            out.url
          );

          sendDownload(
            res,
            "Generated Image",
            out.url,
            "image"
          );
        } else {
          send(
            res,
            "text",
            out?.text
          );
        }

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 🎨 IMAGE VARIATIONS
      // ====================================

      if (
        tool ===
        "image_variation"
      ) {
        const imgs =
          await generateVariations(
            prompt,
            3
          );

        imgs.forEach(
          (img) => {
            send(
              res,
              "image",
              img
            );
          }
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 🖼️ IMAGE EDIT
      // ====================================

      if (
        tool ===
        "image_edit"
      ) {
        send(
          res,
          "text",
          "⚠️ Upload image first."
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 🎬 IMAGE TO VIDEO
      // ====================================

      if (
        tool ===
        "image_video"
      ) {
        const img =
          await generateImage(
            prompt
          );

        if (
          img?.type !==
          "image"
        ) {
          send(
            res,
            "text",
            "⚠️ Failed to create image."
          );

          return done(
            res,
            ping
          );
        }

        const vid =
          await imageToVideo(
            img.url
          );

        if (vid) {
          send(
            res,
            "video",
            vid
          );

          sendDownload(
            res,
            "Animated Video",
            vid,
            "video"
          );
        } else {
          send(
            res,
            "text",
            "⚠️ Video creation failed."
          );
        }

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 📄 RESUME
      // ====================================

      if (tool === "resume") {
        const url =
          await generateResume(
            prompt
          );

        sendDownload(
          res,
          "Resume",
          url,
          "pdf"
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 📄 PDF
      // ====================================

      if (tool === "pdf") {
        const url =
          await createPDF(
            "DevU AI",
            prompt
          );

        sendDownload(
          res,
          "PDF",
          url,
          "pdf"
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 🔎 NEWS
      // ====================================

      if (tool === "search") {
        const news =
          await getLiveNews(
            prompt
          );

        send(
          res,
          "text",
          news
        );

        return done(
          res,
          ping
        );
      }

      // ======================================
      // 💬 NORMAL CHAT
      // ======================================

      const stream =
        await streamGroq(
          messages
        );

      for await (const t of stream) {
        send(
          res,
          "text",
          t
        );
      }

      return done(
        res,
        ping
      );

    } catch (err) {
      console.error(
        "❌ Stream Controller:",
        err
      );

      send(
        res,
        "text",
        "⚠️ Server error"
      );

      return done(
        res,
        ping
      );
    }
  },
];