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

  const mime =
    file.mimeType || "";

  // ====================================
  // 🖼 IMAGE / CAMERA AI
  // ====================================

  if (
    mime.startsWith("image/")
  ) {

    // 🎨 GHIBLI
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

    // 👁️ OCR + IMAGE ANALYSIS

    const result =
      await handleOCR(
        file,
        prompt
      );

    send(
      res,
      "text",
      result
    );

    return done(
      res,
      ping
    );
  }
       
        // ====================================
  // 🎧 AUDIO AI
  // ====================================

  if (
    mime.startsWith("audio/")
  ) {

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
        out?.text ||
        "⚠️ Audio processing failed."
      );
    }

    return done(
      res,
      ping
    );
  }


        // ====================================
  // 🎬 VIDEO AI
  // ====================================

  if (
    mime.startsWith("video/")
  ) {

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
  }

 

       // ====================================
  // 📄 PDF / DOCUMENT AI
  // ====================================

  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("text") ||
    mime.includes("sheet")
  ) {

    const out =
      await handleFile(
        file,
        prompt
      );

    send(
      res,
      "text",
      out?.text ||
      "⚠️ Failed to process document."
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

// ====================================
// END FILE BLOCK
// ====================================

} // closes if(file)

// ======================================
// NORMAL AI CHAT
// ======================================

const stream =
  await streamGroq(messages);

let hasResponse = false;

for await (const t of stream) {

  if (!t) continue;

  hasResponse = true;

  send(
    res,
    "text",
    t.toString()
  );
}

// ======================================
// EMPTY RESPONSE FIX
// ======================================

if (!hasResponse) {

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

  console.error(err);

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