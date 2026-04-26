import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function extractFrames(videoPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join("frames");

    // create frames folder if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    ffmpeg(videoPath)
      .on("end", () => {
        const files = fs.readdirSync(outputDir)
          .filter(f => f.endsWith(".png"))
          .map(f => path.join(outputDir, f));

        resolve(files);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .screenshots({
        count: 5, // number of frames
        folder: outputDir,
        filename: "frame-%i.png"
      })
      .on("end", () => {
        fs.rmSync("frames", { recursive: true, force: true });
      });
  });
}