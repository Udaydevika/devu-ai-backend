import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function makeThumbnail(inputPath) {
  return new Promise((resolve, reject) => {
    const out =
      path.join(
        os.tmpdir(),
        `thumb_${Date.now()}.jpg`
      );

    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        filename: path.basename(out),
        folder: path.dirname(out),
        size: "1080x1920",
      })
      .on("end", () => resolve(out))
      .on("error", reject);
  });
}