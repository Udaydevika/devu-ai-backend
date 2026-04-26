import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function extractFrames(videoPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(process.cwd(), "frames");

    // create folder if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .on("end", () => {
        try {
          const files = fs.readdirSync(outputDir)
            .filter(f => f.endsWith(".png"))
            .map(f => path.join(outputDir, f));

          resolve(files);

          // 🧹 cleanup AFTER resolve
          fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err);
        reject(err);
      })
      .screenshots({
        count: 5,
        folder: outputDir,
        filename: "frame-%i.png"
      });
  });
}