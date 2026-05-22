import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(
    ffmpegPath
  );
}

/**
 * ==========================================
 * 🔥 DevU AI Extract Video Frames
 * Stable + Render compatible
 * ==========================================
 */

export async function extractFrames(videoPath) {
  return new Promise(
    (resolve, reject) => {
      try {
        const outputDir =
          path.join(
            os.tmpdir(),
            "frames_" +
              Date.now()
          );

        // create folder
        if (
          !fs.existsSync(
            outputDir
          )
        ) {
          fs.mkdirSync(
            outputDir,
            {
              recursive: true,
            }
          );
        }

        ffmpeg(videoPath)
          .on(
            "end",
            () => {
              try {
                const files =
                  fs
                    .readdirSync(
                      outputDir
                    )
                    .filter(
  (f) =>
    f.endsWith(".png") ||
    f.endsWith(".jpg") ||
    f.endsWith(".jpeg")
)
                    
                    .map(
                      (f) =>
                        path.join(
                          outputDir,
                          f
                        )
                    );

                resolve(
                  files
                );
              } catch (err) {
                reject(
                  err
                );
              }
            }
          )
          .on(
            "error",
            (err) => {
              console.error(
                "❌ FFmpeg error:",
                err
              );

              reject(
                err
              );
            }
          )
          .screenshots({
            count: 4,
            folder:
              outputDir,
            filename:
              "frame-%i.png",
            size: "640x?",
          });
      } catch (err) {
        reject(err);
      }
    }
  );
}