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
 * 🔥 DevU AI VIDEO TOOL (PRODUCTION READY)
 *
 * Supports:
 * ✅ Viral Reel
 * ✅ Auto Captions
 * ✅ Smart Highlight
 * ✅ 30 sec Clip
 * ✅ AI Video Summary
 * ✅ Direct Download URLs
 * ✅ Render Safe
 * ==========================================
 */

const BASE_URL =
  process.env.PUBLIC_URL ||
  "https://devu-ai.onrender.com";

export async function handleVideo(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // ==========================
    // VALIDATE
    // ==========================
    if (
      !file ||
      !file.buffer
    ) {
      return "⚠️ No video file found.";
    }

    const ext =
      path.extname(
        file.originalname || ""
      ) || ".mp4";

    const prompt =
      String(userPrompt || "")
        .toLowerCase()
        .trim();

    const sizeMB =
      file.buffer.length /
      1024 /
      1024;

    // ==========================
    // LARGE FILE PROTECTION
    // ==========================
    if (sizeMB > 25) {
      return `⚠️ Video too large (${sizeMB.toFixed(1)}MB). Upload under 25MB.`;
    }

    // ==========================
    // PUBLIC DIR
    // ==========================
    const publicDir =
      path.join(
        process.cwd(),
        "public"
      );

    if (
      !fs.existsSync(
        publicDir
      )
    ) {
      fs.mkdirSync(
        publicDir,
        {
          recursive: true,
        }
      );
    }

    // ==========================
    // TEMP SAVE
    // ==========================
    tempPath = path.join(
      os.tmpdir(),
      `devu_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    // =====================================================
    // MODE 1 — VIRAL REEL / CAPTION REEL
    // =====================================================
    if (
      prompt.includes(
        "viral"
      ) ||
      prompt.includes(
        "caption"
      ) ||
      prompt.includes(
        "subtitle"
      ) ||
      prompt.includes(
        "instagram"
      ) ||
      prompt.includes(
        "shorts"
      )
    ) {
      const reel =
        await trimVideo(
          file.buffer,
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

      const captioned =
        await addCaptionToVideo(
          reelTemp,
          "🔥 Watch Till End"
        );

      const fileName =
        `viral_${Date.now()}.mp4`;

      const finalPath =
        path.join(
          publicDir,
          fileName
        );

      fs.copyFileSync(
        captioned,
        finalPath
      );

      return `${BASE_URL}/${fileName}`;
    }

    // =====================================================
    // MODE 2 — SMART HIGHLIGHT
    // =====================================================
    if (
      prompt.includes(
        "highlight"
      ) ||
      prompt.includes(
        "best moments"
      ) ||
      prompt.includes(
        "auto edit"
      )
    ) {
      const frames =
        await extractFrames(
          tempPath
        );

      if (
        !frames ||
        frames.length === 0
      ) {
        return "⚠️ Could not analyze video.";
      }

      const scores = [];

      for (
        let i = 0;
        i <
        Math.min(
          2,
          frames.length
        );
        i++
      ) {
        const img =
          fs.readFileSync(
            frames[i]
          );

        const stream =
          await streamGemini(
            [
              {
                role: "user",
                content:
                  "Rate excitement from 1 to 10. Return number only.",
              },
            ],
            img,
            "image/png"
          );

        let txt = "";

        for await (const t of stream) {
          txt += t;
        }

        const score =
          parseInt(
            txt.match(
              /\d+/
            )?.[0] || "5"
          );

        scores.push({
          index: i,
          score,
        });
      }

      scores.sort(
        (a, b) =>
          b.score -
          a.score
      );

      const best =
        scores[0];

      const startAt =
        best.index * 10;

      const reel =
        await trimVideo(
          file.buffer,
          {
            duration: 30,
            startAt,
            ext,
            vertical: true,
          }
        );

      const finalPath =
        path.join(
          publicDir,
          reel.filename
        );

      fs.writeFileSync(
        finalPath,
        reel.buffer
      );

      return `${BASE_URL}/${reel.filename}`;
    }

    // =====================================================
    // MODE 3 — SIMPLE CLIP
    // =====================================================
    if (
      prompt.includes(
        "clip"
      ) ||
      prompt.includes(
        "30 sec"
      ) ||
      prompt.includes(
        "reel"
      )
    ) {
      const reel =
        await trimVideo(
          file.buffer,
          {
            duration: 30,
            startAt: 0,
            ext,
            vertical: false,
          }
        );

      const finalPath =
        path.join(
          publicDir,
          reel.filename
        );

      fs.writeFileSync(
        finalPath,
        reel.buffer
      );

      return `${BASE_URL}/${reel.filename}`;
    }

    // =====================================================
    // MODE 4 — AI VIDEO ANALYSIS
    // =====================================================
    const frames =
      await extractFrames(
        tempPath
      );

    if (
      !frames ||
      frames.length === 0
    ) {
      return "⚠️ Could not read video.";
    }

    const notes = [];

    for (
      let i = 0;
      i <
      Math.min(
        2,
        frames.length
      );
      i++
    ) {
      const img =
        fs.readFileSync(
          frames[i]
        );

      const stream =
        await streamGemini(
          [
            {
              role: "user",
              content:
                "Describe this frame briefly.",
            },
          ],
          img,
          "image/png"
        );

      let text = "";

      for await (const t of stream) {
        text += t;
      }

      notes.push(
        `Frame ${i + 1}: ${text}`
      );
    }

    const summaryStream =
      await streamGemini([
        {
          role: "user",
          content: `
Summarize this video:

${notes.join("\n")}
`,
        },
      ]);

    let summary = "";

    for await (const t of summaryStream) {
      summary += t;
    }

    return `🎬 Video Analysis Complete

${summary}`;
  } catch (err) {
    console.error(
      "❌ Video Tool Error:",
      err.message
    );

    return "⚠️ Failed to process video.";
  } finally {
    try {
      if (
        tempPath &&
        fs.existsSync(
          tempPath
        )
      ) {
        fs.unlinkSync(
          tempPath
        );
      }
    } catch (_) {}
  }
}