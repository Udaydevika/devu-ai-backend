// src/controllers/chat.stream.controller.js

import { streamOpenRouter } from "../services/openrouter.service.js";
import { streamGemini } from "../services/gemini.service.js";
import { streamGroq } from "../services/groq.service.js";
import { streamHuggingFace } from "../services/huggingface.service.js";

import { detectTool } from "../ai/toolRouter.js";

import { handleFile } from "../ai/tools/file.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import { handleAudio } from "../ai/tools/audio.tool.js";
import { generateImage, generateVariations } from "../ai/tools/image.tool.js";
import { getLiveNews } from "../ai/tools/news.tool.js";
import { handleOCR } from "../ai/tools/ocr.tool.js";
import { createPDF } from "../ai/tools/pdf.tool.js";
import { generateResume } from "../ai/tools/resume.tool.js";

import { editImage } from "../ai/tools/image.edit.tool.js";
import { imageToVideo } from "../ai/tools/image.video.tool.js";

// ================= SSE =================
function send(res, type, content) {
  if (!content) return;

  res.write(
    `data: ${JSON.stringify({ type, content })}\n\n`
  );
}

function sendDownload(res, title, url, fileType = "file") {
  send(res, "download", { title, url, fileType });
}

function done(res, ping) {
  clearInterval(ping);
  res.write("data: [DONE]\n\n");
  return res.end();
}

function startSSE(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  return setInterval(() => {
    res.write(":\n\n");
  }, 15000);
}

function getLastText(messages = []) {
  return String(
    messages[messages.length - 1]?.content || ""
  ).trim();
}

// ================= CONTROLLER =================
export const chatStreamController = [
  async (req, res) => {
    let ping = startSSE(res);

    try {
      const messages =
        typeof req.body.messages === "string"
          ? JSON.parse(req.body.messages)
          : req.body.messages;

      const prompt = getLastText(messages);

      const rawFiles = req.files
        ? Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat()
        : req.file
        ? [req.file]
        : [];

      const files = rawFiles.map((f) => ({
        name: f.originalname,
        mimeType: f.mimetype,
        buffer: f.buffer,
      }));

      const tool = detectTool(prompt, files);

      // ================= FILE MODE =================
      if (files.length > 0) {
        const file = files[0];

        // 🎨 Ghibli
        if (tool === "ghibli") {
          const url = await generateImage(
            `Studio Ghibli anime style, ${prompt}`
          );

          send(res, "image", url);
          sendDownload(res, "Ghibli Art", url, "image");

          return done(res, ping);
        }

        // 📄 OCR
        if (tool === "ocr") {
          const out = await handleOCR(file, prompt);
          send(res, "file", out);
          return done(res, ping);
        }

        // 👁️ Vision
        if (tool === "vision") {
          const stream = await streamGemini(
            messages,
            file.buffer,
            file.mimeType
          );

          for await (const t of stream) {
            send(res, "text", t);
          }

          return done(res, ping);
        }

        // 🎧 Audio
        if (tool === "audio") {
  const out = await handleAudio(file, prompt);

  let url = null;

  if (typeof out === "string") {
    const match = out.match(/https?:\/\/[^\s]+/);
    if (match) url = match[0];
  }

  if (url) {
    send(res, "audio", url);
    sendDownload(res, "Audio Ready", url, "audio");
  } else {
    send(res, "text", out);
  }

  return done(res, ping);
}
        // 🎬 Video
        if (tool === "video") {
          const out = await handleVideo(file, prompt);

          if (out.startsWith("http")) {
            send(res, "video", out);
            sendDownload(res, "Video Ready", out, "video");
          } else {
            send(res, "text", out);
          }

          return done(res, ping);
        }

        // 📁 File
        const out = await handleFile(file);
        send(res, "file", out);
        return done(res, ping);
      }

      // ================= TEXT MODE =================

      // 🎨 Image
      if (tool === "image") {
  const url = await generateImage(prompt);

  if (!url || !url.startsWith("http")) {
    send(res, "text", "⚠️ Image generation failed.");
    return done(res, ping);
  }

  send(res, "image", url);
  sendDownload(res, "Image Ready", url, "image");

  return done(res, ping);
}

      // 🎨 Variations
      if (tool === "image_variation") {
        const imgs = await generateVariations(prompt, 3);

        imgs.forEach((img) => send(res, "image", img));

        return done(res, ping);
      }

      // 🖼️ Edit
      if (tool === "image_edit") {
  if (!files.length) {
    send(res, "text", "⚠️ Please upload an image to edit.");
    return done(res, ping);
  }

  const url = await editImage(files[0], prompt);

  if (typeof url === "string" && url.startsWith("http")) {
    send(res, "image", url);
    sendDownload(res, "Edited Image", url, "image");
  } else {
    send(res, "text", url);
  }

  return done(res, ping);
}

      // 🎬 Image → Video
      if (tool === "image_video") {
  const img = await generateImage(prompt);

  if (!img || !img.startsWith("http")) {
    send(res, "text", "⚠️ Failed to generate image for video.");
    return done(res, ping);
  }

  const vid = await imageToVideo(img);

  if (typeof vid === "string" && vid.startsWith("http")) {
    send(res, "video", vid);
    sendDownload(res, "Animated Video", vid, "video");
  } else {
    send(res, "text", vid);
  }

  return done(res, ping);
}

      // 📄 Resume
      if (tool === "resume") {
        const url = await generateResume(prompt);
        sendDownload(res, "Resume", url, "pdf");
        return done(res, ping);
      }

      // 📄 PDF
      if (tool === "pdf") {
        const url = await createPDF("DevU AI", prompt);
        sendDownload(res, "PDF", url, "pdf");
        return done(res, ping);
      }

      // 🔎 News
      if (tool === "search") {
        const news = await getLiveNews(prompt);
        send(res, "text", news);
        return done(res, ping);
      }

      // ================= CHAT =================
      const stream = await streamGroq(messages);

      for await (const t of stream) {
        send(res, "text", t);
      }

      return done(res, ping);
    } catch (err) {
      console.error(err);
      send(res, "text", "⚠️ Server error");
      return done(res, ping);
    }
  },
];