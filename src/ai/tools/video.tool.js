// src/ai/tools/video.tool.js

import fs from "fs";
import path from "path";
import os from "os";

import { extractFrames }
from "../../utils/videoFrames.js";

import { streamGemini }
from "../../services/gemini.service.js";

import { trimVideo }
from "../../utils/videoEditor.js";

import { addCaptionToVideo }
from "../../utils/captionVideo.js";

/**
 * ==========================================
 * 🔥 DevU AI FINAL VIDEO TOOL
 *
 * Features:
 * ✅ Viral reels
 * ✅ Shorts creator
 * ✅ AI highlight detection
 * ✅ Gemini frame analysis
 * ✅ FFmpeg editing
 * ✅ Flutter compatible
 * ✅ Render safe
 * ✅ Memory safe
 * ✅ Auto cleanup
 * ==========================================
 */

const PUBLIC_DIR = path.join(
  process.cwd(),
  "public",
  "generated"
);

const BASE_URL =
process.env.PUBLIC_URL
  ? `${process.env.PUBLIC_URL}/generated`
  : "http://localhost:3000/generated";

// ==========================================
// 📂 ENSURE DIRECTORY
// ==========================================

function ensureDir() {

  if (!fs.existsSync(PUBLIC_DIR)) {

    fs.mkdirSync(
      PUBLIC_DIR,
      {
        recursive: true,
      }
    );
  }
}

// ==========================================
// 🧹 SAFE DELETE
// ==========================================

function safeDelete(filePath) {

  try {

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {

      fs.unlinkSync(filePath);
    }

  } catch {}
}

// ==========================================
// 💾 SAVE BUFFER
// ==========================================

function saveBuffer(
  buffer,
  fileName
) {

  ensureDir();

  const cleanName =
    fileName.replace(/\s/g, "_");

  const fullPath =
    path.join(
      PUBLIC_DIR,
      cleanName
    );

  fs.writeFileSync(
    fullPath,
    buffer
  );

  return `${BASE_URL}/${cleanName}`;
}

// ==========================================
// ⏱️ TIMEOUT PROTECTION
// ==========================================

async function withTimeout(
  promise,
  ms = 30000
) {

  return Promise.race([

    promise,

    new Promise((_, reject) =>

      setTimeout(
        () =>
          reject(
            new Error("Timeout")
          ),
        ms
      )
    ),
  ]);
}

// ==========================================
// 🎬 MAIN VIDEO TOOL
// ==========================================

export async function handleVideo(
  file,
  userPrompt = ""
) {

  let tempPath = "";

  try {

    // ======================================
    // VALIDATION
    // ======================================

    if (
      !file?.buffer &&
      !file?.path
    ) {

      return {
        type: "text",
        text:
          "⚠️ No video uploaded.",
      };
    }

    console.log(
      "🎬 VIDEO TOOL:",
      {
        name:
          file.originalname,

        mime:
          file.mimetype,

        size:
          file.size,

        prompt:
          userPrompt,
      }
    );

    // ======================================
    // READ BUFFER
    // ======================================

    let videoBuffer = null;

if (file.buffer) {

  videoBuffer = file.buffer;

} else if (
  file.path &&
  fs.existsSync(file.path)
) {

  videoBuffer =
    fs.readFileSync(file.path);
}

if (
  !videoBuffer ||
  videoBuffer.length === 0
) {

  throw new Error(
    "Invalid video buffer"
  );
}

    if (
      !Buffer.isBuffer(
        videoBuffer
      )
    ) {

      return {
        type: "text",
        text:
          "⚠️ Invalid video buffer.",
      };
    }

    // ======================================
    // SIZE LIMIT
    // ======================================

    const sizeMB =

      videoBuffer.length /
      1024 /
      1024;

     if (sizeMB > 100) {

      return {
        type: "text",
        text:
`⚠️ Video too large (${sizeMB.toFixed(1)}MB). Upload under 100MB.`,
      };
    }

    ensureDir();

    const ext =

      path.extname(
        file.originalname || ""
      ) || ".mp4";

    const prompt =

      String(userPrompt || "")
        .toLowerCase()
        .trim();

    // ======================================
    // TEMP FILE
    // ======================================

    tempPath = path.join(

      os.tmpdir(),

      `devu_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      videoBuffer
    );

    // ======================================
    // 🔥 MODE 1 — VIRAL REEL
    // ======================================

    if (

      prompt.includes("viral") ||

      prompt.includes("caption") ||

      prompt.includes("subtitle") ||

      prompt.includes("instagram") ||

      prompt.includes("shorts")
    ) {

      try {

        const reel =
          await trimVideo(
            videoBuffer,
            {
              duration: 30,
              startAt: 0,
              ext,
              vertical: true,
            }
          );

        const reelTemp =
          path.join(
            os.tmpdir(),
            reel.filename
          );

        fs.writeFileSync(
          reelTemp,
          reel.buffer
        );

        let captioned = "";

try {

  captioned =
    await addCaptionToVideo(
      reelTemp,
      "🔥 Watch Till End"
    );

  const fileName =
    `viral_${Date.now()}.mp4`;

  const finalPath =
    path.join(
      PUBLIC_DIR,
      fileName
    );

  fs.copyFileSync(
    captioned,
    finalPath
  );

  return {
    type: "video",

    url:
`${BASE_URL}/${fileName}`,

    text:
      "🎬 Viral reel created.",
  };

} finally {

  safeDelete(reelTemp);

  safeDelete(captioned);
}

      } catch (err) {

        console.error(
          "❌ Viral Mode:",
          err.message
        );

        // fallback
        const fallback =
          await trimVideo(
            videoBuffer,
            {
              duration: 30,
              startAt: 0,
              ext,
              vertical: false,
            }
          );

        const fallbackUrl =
          saveBuffer(
            fallback.buffer,
            fallback.filename
          );

        return {
          type: "video",
          url: fallbackUrl,
          text:
            "🎬 Reel created.",
        };
      }
    }

    // ======================================
    // 🧠 MODE 2 — AI HIGHLIGHTS
    // ======================================

    if (

      prompt.includes("highlight") ||

      prompt.includes("best") ||

      prompt.includes("auto edit")
    ) {

      try {

  let frames = [];

  const cleanupFrames =
    () => {

      try {

        for (const f of frames) {

          safeDelete(f);
        }

      } catch (_) {}
    };

  try {

    frames =
      await extractFrames(
        tempPath
      );

    if (
      !frames ||
      frames.length === 0
    ) {

      throw new Error(
        "No frames extracted"
      );
    }

    const scores = [];

    for (
      let i = 0;
      i < Math.min(4, frames.length);
      i++
    ) {

      const img =
        fs.readFileSync(
          frames[i]
        );

      const ai =
  await withTimeout(

    streamGemini(
            [
              {
                role: "user",

                content:
"Rate excitement 1-10. Only return number.",
              },
            ],

            img,

            "image/png"
          )
        );

      let text = "";

      if (
  !ai ||
  !ai.stream ||
  typeof ai.stream[
    Symbol.asyncIterator
  ] !== "function"
) {

  throw new Error(
    "Invalid Gemini stream"
  );
}

const stream =
  ai?.stream || ai;

if (
  !stream ||
  typeof stream[
    Symbol.asyncIterator
  ] !== "function"
) {

  text =
    "Could not analyze frame.";

} else {

  for await (
    const token of stream
  ) {

    text +=
      typeof token === "string"
        ? token
        : token?.text || "";
  }
}

      const score =
        parseInt(
          text.match(/\d+/)?.[0] || "5"
        );

      scores.push({
        index: i,
        score,
      });
    }

    scores.sort(
      (a, b) =>
        b.score - a.score
    );

    const startAt =
      scores[0].index * 10;

    const reel =
      await trimVideo(
        videoBuffer,
        {
          duration: 30,
          startAt,
          ext,
          vertical: true,
        }
      );

    const videoUrl =
      saveBuffer(
        reel.buffer,
        reel.filename
      );

    return {
      type: "video",
      url: videoUrl,
      text:
        "🎬 AI highlight created.",
    };

 } finally {

  cleanupFrames();
}

} catch (err) {

  console.error(
    "❌ Highlight Mode:",
    err.message
  );

  const fallback =
    await trimVideo(
      videoBuffer,
      {
        duration: 30,
        startAt: 0,
        ext,
        vertical: false,
      }
    );

  const fallbackUrl =
    saveBuffer(
      fallback.buffer,
      fallback.filename
    );

  return {
    type: "video",
    url: fallbackUrl,
    text:
      "🎬 Fallback clip created.",
  };
}

}
    // ======================================
    // 🎞️ MODE 3 — SIMPLE CLIP
    // ======================================

    if (

      prompt.includes("clip") ||

      prompt.includes("30") ||

      prompt.includes("reel")
    ) {

      const reel =
        await trimVideo(
          videoBuffer,
          {
            duration: 30,
            startAt: 0,
            ext,
            vertical: false,
          }
        );

      const videoUrl =
        saveBuffer(
          reel.buffer,
          reel.filename
        );

      return {
        type: "video",
        url: videoUrl,
        text:
          "🎬 Clip created.",
      };
    }

    // ======================================
// 👁️ MODE 4 — VIDEO ANALYSIS
// ======================================

let frames = [];

const cleanupFrames = () => {

  try {

    for (const f of frames) {

      safeDelete(f);
    }

  } catch (_) {}
};

try {

  frames =
    await withTimeout(
      extractFrames(tempPath),
      15000
    );

  if (
  !frames ||
  frames.length === 0
) {

  const fileName =
    `video_${Date.now()}${ext}`;

  const videoUrl =
    saveBuffer(
      videoBuffer,
      fileName
    );

  return {
    type: "video",

    url: videoUrl,

    text:
      "🎬 Video uploaded successfully.",
  };
}
  const notes = [];

  for (
    let i = 0;
    i < Math.min(4, frames.length);
    i++
  ) {

    const img =
      fs.readFileSync(
        frames[i]
      );

    const ai =
  await withTimeout(

        streamGemini(
          [
            {
              role: "user",

              content:
                "Describe this frame briefly.",
            },
          ],

          img,

          "image/png"
        )
      );

    let text = "";

    const stream =
  ai?.stream;

if (
  !stream ||
  typeof stream[
    Symbol.asyncIterator
  ] !== "function"
) {

  throw new Error(
    "Invalid Gemini stream"
  );
}

for await (
  const token of stream
) {

  text +=
    typeof token === "string"
      ? token
      : token?.text || "";
}

    await new Promise(
  (r) => setTimeout(r, 500)
);

notes.push(
  `Frame ${i + 1}: ${text}`
);
  }
  const summaryAI =
  await withTimeout(
    streamGemini([
        {
          role: "user",

          content:
`Summarize this video:

${notes.join("\n").slice(0, 4000)}`,
        },
      ])
    );

  let summary = "";

  if (
  !summaryAI ||
  !summaryAI.stream
) {

  throw new Error(
    "Summary AI failed"
  );
}

const summaryStream =
  summaryAI?.stream;

if (
  summaryStream &&
  typeof summaryStream[
    Symbol.asyncIterator
  ] === "function"
) {

  for await (
    const token of summaryStream
  ) {

    summary +=
      typeof token === "string"
        ? token
        : token?.text || "";
  }
}

  return {
    type: "text",

    text:
summary
  ? `🎬 Video Analysis Complete

${summary}`

  : "🎬 Video analyzed.",
  };

} finally {

  cleanupFrames();
}

}catch (err) {

    console.error(
      "❌ VIDEO TOOL ERROR:",
      err.message
    );

    return {
      type: "text",
      text:
        "⚠️ Failed to process video.",
    };

  } finally {

    safeDelete(tempPath);
  }
}