import fs from "fs";
import path from "path";
import os from "os";

import { extractFrames } from "../../utils/extractframes.js";
import { streamGemini } from "../../services/gemini.service.js";
import { trimVideo } from "../../utils/videoEditor.js";
import { addCaptionToVideo } from "../../utils/captionVideo.js";

/**
 * ==========================================
 * 🔥 DevU AI FINAL VIDEO TOOL
 * Production Optimized
 *
 * Supports:
 * ✅ Viral Reel (vertical + caption)
 * ✅ Smart Highlights
 * ✅ 30 sec Reel
 * ✅ Video Analysis
 * ==========================================
 */

export async function handleVideo(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // =====================================
    // 📁 VALIDATE FILE
    // =====================================
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
      (
        userPrompt || ""
      ).toLowerCase();

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

    // =====================================
    // 📁 SAVE TEMP VIDEO
    // =====================================
    tempPath = path.join(
      os.tmpdir(),
      `devu_video_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    // =====================================
    // 🔥 MODE 1: VIRAL REEL
    // =====================================
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

      const finalName =
        `viral_${Date.now()}.mp4`;

      const finalPath =
        path.join(
          publicDir,
          finalName
        );

      fs.copyFileSync(
        captioned,
        finalPath
      );

      return `🔥 Viral Reel Ready:

https://devu-ai.onrender.com/${finalName}`;
    }

    // =====================================
    // 🔥 MODE 2: SMART HIGHLIGHTS
    // =====================================
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

      for (
        let i = 0;
        i <
        Math.min(
          frames.length,
          5
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
                  "Give excitement score from 1 to 10. Return only number.",
              },
            ],
            img,
            "image/png"
          );

        let txt =
          "";

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

      return `🔥 Smart Highlight Ready:

https://devu-ai.onrender.com/${reel.filename}`;
    }

    // =====================================
    // 🎬 MODE 3: SIMPLE REEL
    // =====================================
    if (
      prompt.includes(
        "30 sec"
      ) ||
      prompt.includes(
        "reel"
      ) ||
      prompt.includes(
        "clip"
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

      return `🎬 Reel Ready:

https://devu-ai.onrender.com/${reel.filename}`;
    }

    // =====================================
    // 🎬 MODE 4: VIDEO ANALYSIS
    // =====================================
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
        3,
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

      let text =
        "";

      for await (const t of stream) {
        text += t;
      }

      notes.push(
        `Frame ${i + 1}: ${text}`
      );
    }

    const summaryStream =
      await streamGemini(
        [
          {
            role: "user",
            content: `
Summarize this video:

${notes.join("\n")}
`,
          },
        ]
      );

    let summary =
      "";

    for await (const t of summaryStream) {
      summary += t;
    }

    return `🎬 Video Analysis Complete:

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