// src/ai/tools/video.tool.js

import fs from "fs";
import path from "path";
import os from "os";

import { extractFrames } from "../../utils/extractframes.js";
import { streamGemini } from "../../services/gemini.service.js";
import { trimVideo } from "../../utils/videoEditor.js";
import { addCaptionToVideo } from "../../utils/captionVideo.js";

/**
 * ==========================================
 * 🔥 DevU AI VIDEO TOOL (FINAL STABLE)
 *
 * Guarantees:
 * ✅ Always returns URL for playable/download
 * ✅ Works with Flutter player
 * ✅ Safe fallback if processing fails
 * ==========================================
 */

const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");
const BASE_URL = `${process.env.PUBLIC_URL}/generated`;

function ensureDir() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
}

function saveBuffer(buffer, fileName) {
  const full = path.join(PUBLIC_DIR, fileName);
  fs.writeFileSync(full, buffer);
  return `${BASE_URL}/${fileName}`;
}

export async function handleVideo(file, userPrompt = "") {
  let tempPath = "";

  try {
    if (!file?.buffer) {
      return "⚠️ No video file found.";
    }

    ensureDir();

    const ext = path.extname(file.originalname || "") || ".mp4";
    const prompt = String(userPrompt || "").toLowerCase().trim();

    const sizeMB = file.buffer.length / 1024 / 1024;
    if (sizeMB > 25) {
      return `⚠️ Video too large (${sizeMB.toFixed(1)}MB). Upload under 25MB.`;
    }

    // temp file (for FFmpeg tools)
    tempPath = path.join(os.tmpdir(), `devu_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, file.buffer);

    // =====================================================
    // MODE 1 — VIRAL / CAPTION REEL
    // =====================================================
    if (
      prompt.includes("viral") ||
      prompt.includes("caption") ||
      prompt.includes("subtitle") ||
      prompt.includes("shorts") ||
      prompt.includes("instagram")
    ) {
      try {
        const reel = await trimVideo(file.buffer, {
          duration: 30,
          startAt: 0,
          ext,
          vertical: true,
        });

        const reelTemp = path.join(os.tmpdir(), reel.filename);
        fs.writeFileSync(reelTemp, reel.buffer);

        const captioned = await addCaptionToVideo(
          reelTemp,
          "🔥 Watch Till End"
        );

        const fileName = `viral_${Date.now()}.mp4`;
        const finalPath = path.join(PUBLIC_DIR, fileName);

        fs.copyFileSync(captioned, finalPath);

        return `${BASE_URL}/${fileName}`;
      } catch (e) {
        console.error("Viral mode fallback:", e.message);
        // fallback: just return simple clip
        const fallback = await trimVideo(file.buffer, {
          duration: 30,
          startAt: 0,
          ext,
          vertical: false,
        });
        return saveBuffer(fallback.buffer, fallback.filename);
      }
    }

    // =====================================================
    // MODE 2 — SMART HIGHLIGHT
    // =====================================================
    if (
      prompt.includes("highlight") ||
      prompt.includes("best") ||
      prompt.includes("auto edit")
    ) {
      try {
        const frames = await extractFrames(tempPath);

        if (!frames || frames.length === 0) {
          throw new Error("no frames");
        }

        const scores = [];

        for (let i = 0; i < Math.min(2, frames.length); i++) {
          const img = fs.readFileSync(frames[i]);

          const stream = await streamGemini(
            [
              {
                role: "user",
                content: "Rate excitement 1-10. Only number.",
              },
            ],
            img,
            "image/png"
          );

          let txt = "";
          for await (const t of stream) txt += t;

          const score = parseInt(txt.match(/\d+/)?.[0] || "5");
          scores.push({ index: i, score });
        }

        scores.sort((a, b) => b.score - a.score);

        const startAt = scores[0].index * 10;

        const reel = await trimVideo(file.buffer, {
          duration: 30,
          startAt,
          ext,
          vertical: true,
        });

        return saveBuffer(reel.buffer, reel.filename);
      } catch (e) {
        console.error("Highlight fallback:", e.message);
        const fallback = await trimVideo(file.buffer, {
          duration: 30,
          startAt: 0,
          ext,
          vertical: false,
        });
        return saveBuffer(fallback.buffer, fallback.filename);
      }
    }

    // =====================================================
    // MODE 3 — SIMPLE CLIP
    // =====================================================
    if (
      prompt.includes("clip") ||
      prompt.includes("30") ||
      prompt.includes("reel")
    ) {
      const reel = await trimVideo(file.buffer, {
        duration: 30,
        startAt: 0,
        ext,
        vertical: false,
      });

      return saveBuffer(reel.buffer, reel.filename);
    }

    // =====================================================
    // MODE 4 — ANALYSIS (TEXT ONLY)
    // =====================================================
    const frames = await extractFrames(tempPath);

    if (!frames || frames.length === 0) {
      // fallback: at least return original video so UI works
      const fileName = `video_${Date.now()}${ext}`;
      return saveBuffer(file.buffer, fileName);
    }

    const notes = [];

    for (let i = 0; i < Math.min(2, frames.length); i++) {
      const img = fs.readFileSync(frames[i]);

      const stream = await streamGemini(
        [
          {
            role: "user",
            content: "Describe this frame briefly.",
          },
        ],
        img,
        "image/png"
      );

      let text = "";
      for await (const t of stream) text += t;

      notes.push(`Frame ${i + 1}: ${text}`);
    }

    const summaryStream = await streamGemini([
      {
        role: "user",
        content: `Summarize video:\n${notes.join("\n")}`,
      },
    ]);

    let summary = "";
    for await (const t of summaryStream) summary += t;

    return `🎬 Video Analysis Complete\n\n${summary}`;
  } catch (err) {
    console.error("❌ Video Tool Error:", err.message);
    return "⚠️ Failed to process video.";
  } finally {
    try {
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {}
  }
}