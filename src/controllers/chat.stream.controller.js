// src/controllers/chat.stream.controller.js

import { streamGemini } from "../services/gemini.service.js";

import { detectTool } from "../ai/toolRouter.js";

import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { handleAudio } from "../ai/tools/audio.tool.js";
import { handleOCR } from "../ai/tools/ocr.tool.js";

import {
  generateImage,
  generateVariations,
} from "../ai/tools/image.tool.js";

import { editImage } from "../ai/tools/image.edit.tool.js";

import { getLiveNews } from "../ai/tools/news.tool.js";

import { createPDF } from "../ai/tools/pdf.tool.js";

import { generateResume } from "../ai/tools/resume.tool.js";

import { handleVision } from "../ai/tools/vision.tool.js";

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

    Connection:
      "keep-alive",

    "X-Accel-Buffering":
      "no",
  });

  return setInterval(() => {
    res.write(":\n\n");
  }, 15000);
}

function getLastText(messages = []) {

  const last =
    messages[messages.length - 1];

  if (!last) return "";

  // Flutter array content
  if (
    Array.isArray(last.content)
  ) {

    const txt =
      last.content.find(
        (p) => p.type === "text"
      );

    return (
      txt?.text?.trim() || ""
    );
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

    const ping =
      startSSE(res);

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

      const rawFiles =
  req.files

    ? Array.isArray(req.files)

      ? req.files

      : Object.values(
          req.files
        ).flat()

    : req.file

    ? [req.file]

    : [];
      // ======================================
      // NORMALIZE FILES
      // ======================================

      const files =
  rawFiles.map((f) => ({

    name:
      f.originalname,

    originalname:
      f.originalname,

    mimetype:
      f.mimetype,

    mimeType:
      f.mimetype,

    path:
      f.path,

    size:
      f.size,
  }));

      const file =
        files[0];

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

        const mime =
          file.mimeType || "";

        console.log(
          "📂 FILE:",
          file.name,
          mime
        );

        // ====================================
        // 🎨 IMAGE VARIATIONS
        // ====================================

        if (
          tool ===
          "image_variation"
        ) {

          try {

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

          } catch (err) {

            console.error(
              "VARIATION ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Image variation failed."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🖌 IMAGE EDIT
        // ====================================

        if (
          tool ===
          "image_edit"
        ) {

          try {

            const out =
              await editImage(
                file,
                prompt
              );

            if (
              out?.url
            ) {

              send(
                res,
                "image",
                out.url
              );

              sendDownload(
                res,
                "Edited Image",
                out.url,
                "image"
              );

            } else {

              send(
                res,
                "text",
                out?.text ||
                "⚠️ Image edit failed."
              );
            }

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "EDIT ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to edit image."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🎬 IMAGE TO VIDEO
        // ====================================

        if (
          tool ===
          "image_video"
        ) {

          send(
            res,
            "text",
            "⚠️ Image to video temporarily disabled."
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // 🖼 IMAGE / OCR / CAMERA AI
        // ====================================

        if (
          mime.startsWith(
            "image/"
          )
        ) {

          try {

            // ==================================
            // IMAGE GENERATION
            // ==================================

            if (
              tool ===
              "image"
            ) {

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
                  out?.text ||
                  "⚠️ Image generation failed."
                );
              }

              return done(
                res,
                ping
              );
            }

            // ==================================
            // OCR / VISION
            // ==================================

            let result = "";

            const lower =
              prompt.toLowerCase();

            // OCR
            if (

              lower.includes(
                "extract text"
              ) ||

              lower.includes(
                "ocr"
              ) ||

              lower.includes(
                "read text"
              ) ||

              lower.includes(
                "scan text"
              ) ||

              lower.includes(
                "document"
              )

            ) {

              result =
                await handleOCR(
                  file,
                  prompt
                );

            } else {

              // Vision AI
              result =
                await handleVision(
                  file,
                  prompt
                );
            }

            send(
              res,
              result?.type ||
              "text",

              result?.text ||
              result
            );

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "IMAGE ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to read image."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🎬 VIDEO
        // ====================================

        else if (

          mime.startsWith(
            "video/"
          ) ||

          mime.includes(
            "mp4"
          ) ||

          mime.includes(
            "mov"
          ) ||

          mime.includes(
            "avi"
          )

        ) {

          try {

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
                out?.text ||
                "⚠️ Video processing failed."
              );
            }

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "VIDEO ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to process video."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🎧 AUDIO
        // ====================================

        else if (
          mime.startsWith(
            "audio/"
          )
        ) {

          try {

            const out =
              await handleAudio(
                file,
                prompt
              );

            if (
              out?.transcript
            ) {

              send(
                res,
                "text",
                out.transcript
              );

            } else {

              send(
                res,
                "text",
                out?.text ||
                "⚠️ Audio processing failed."
              );
            }

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "AUDIO ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to process audio."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 📄 DOCUMENTS
        // ====================================

        else if (

          mime.includes(
            "pdf"
          ) ||

          mime.includes(
            "document"
          ) ||

          mime.includes(
            "word"
          ) ||

          mime.includes(
            "sheet"
          ) ||

          mime.includes(
            "excel"
          ) ||

          mime.includes(
            "text"
          ) ||

          mime.includes(
            "csv"
          ) ||

          mime.includes(
            "json"
          )

        ) {

          try {

            const out =
              await handleFile(
                file
              );

            send(
              res,
              out?.type ||
              "text",

              out?.text ||

              "⚠️ Failed to process document."
            );

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "DOCUMENT ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to process document."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // ❌ UNSUPPORTED
        // ====================================

        else {

          send(
            res,
            "text",
            `⚠️ Unsupported file type: ${mime}`
          );

          return done(
            res,
            ping
          );
        }
      }

      // ====================================
      // 📄 RESUME
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

      if (
        tool ===
        "pdf"
      ) {

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
      // 🔎 SEARCH / NEWS
      // ====================================

      if (
        tool ===
        "search"
      ) {

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
      // 💬 NORMAL AI CHAT
      // ======================================

      const stream =
        await streamGemini(
          messages
        );

      let hasResponse =
        false;

      let chunk = "";

      for await (
        const t of stream
      ) {

        if (!t) continue;

        hasResponse =
          true;

        chunk +=
          t.toString();

        // smoother streaming
        if (
          chunk.length > 30
        ) {

          send(
            res,
            "text",
            chunk
          );

          chunk = "";
        }
      }

      // send remaining
      if (chunk) {

        send(
          res,
          "text",
          chunk
        );
      }

      // empty response
      if (
        !hasResponse
      ) {

        send(
          res,
          "text",
          "⚠️ AI returned empty response."
        );
      }

      return done(
        res,
        ping
      );

    } catch (err) {

      console.error(
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