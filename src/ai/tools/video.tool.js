// src/ai/tools/video.tool.js

import fs from "fs";
import path from "path";
import os from "os";

import { extractFrames } from "../../utils/extractframes.js";
import { streamGemini } from "../../services/gemini.service.js";
import { trimVideo } from "../../utils/videoEditor.js";
import { addCaptionToVideo } from "../../utils/captionVideo.js";

const BASE_URL =
  process.env.PUBLIC_URL ||
  "https://devu-ai.onrender.com";

/**
 * ==========================================
 * 🔥 DevU AI ULTRA FAST VIDEO TOOL v2
 *
 * Optimized for Render / VPS / Low RAM
 *
 * Supports:
 * ✅ Viral Reel
 * ✅ Auto Caption Reel
 * ✅ Smart Highlight
 * ✅ 30 sec Clip
 * ✅ Fast Video Analysis
 * ✅ Large File Safe Mode
 * ==========================================
 */

export async function handleVideo(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // ==========================
    // VALIDATE
    // ==========================
    if (!file || !file.buffer) {
      return "⚠️ No video file found.";
    }

    const ext =
      path.extname(
        file.originalname || ""
      ) || ".mp4";

    const prompt =
      (userPrompt || "")
        .toLowerCase()
        .trim();

    const sizeMB =
      file.buffer.length /
      1024 /
      1024;

    console.log(
      "🎬 Video Upload:",
      file.originalname,
      sizeMB.toFixed(1) + "MB"
    );

    // ==========================
    // LARGE FILE SAFE MODE
    // ==========================
    if (sizeMB > 20) {
      return `🎬 Video Uploaded Successfully

Large file detected (${sizeMB.toFixed(1)} MB)

For instant editing, please upload videos under 20MB.
Heavy processing mode is being upgraded.`;
    }

    // ==========================
    // PUBLIC FOLDER
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
    // SAVE TEMP VIDEO
    // ==========================
    tempPath = path.join(
      os.tmpdir(),
      `devu_video_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    // ==========================
    // MODE 1: VIRAL REEL
    // ==========================
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

      const finalVideo =
        await addCaptionToVideo(
          reelTemp,
          "🔥 Watch Till End"
        );

      const finalName =
        `viral_${Date.now()}.mp4`;

      const finalPath =
        path.join(
          publicDir,
          finalName
        );

      fs.copyFileSync(
        finalVideo,
        finalPath
      );

      return `🔥 Viral Reel Ready

${BASE_URL}/${finalName}`;
    }

    // ==========================
    // MODE 2: SMART HIGHLIGHT
    // ==========================
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

      const scored = [];

      // FAST MODE: only 2 frames
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

        scored.push({
          index: i,
          score,
        });
      }

      scored.sort(
        (a, b) =>
          b.score -
          a.score
      );

      const best =
        scored[0];

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

      return `🔥 Smart Highlight Ready

${BASE_URL}/${reel.filename}`;
    }

    // ==========================
    // MODE 3: SIMPLE 30 SEC CLIP
    // ==========================
    if (
      prompt.includes(
        "30 sec"
      ) ||
      prompt.includes(
        "clip"
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

      return `🎬 Clip Ready

${BASE_URL}/${reel.filename}`;
    }

    // ==========================
    // MODE 4: FAST ANALYSIS
    // ==========================
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

    // FAST MODE: 2 frames only
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
      "❌ Video tool error:",
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