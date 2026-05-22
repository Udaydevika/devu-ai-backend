// src/utils/videoFrames.js

import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function extractFrames(
  videoPath
) {

  return new Promise(
    (resolve, reject) => {

      const outputDir = path.join(
        process.cwd(),
        "uploads",
        `frames_${Date.now()}`
      );

      if (
        !fs.existsSync(outputDir)
      ) {

        fs.mkdirSync(
          outputDir,
          { recursive: true }
        );
      }

      ffmpeg(videoPath)

        // ✅ 1 frame every 2 sec
        .screenshots({
          count: 5,

          folder: outputDir,

          filename:
            "frame-%i.jpg",

          size: "1280x720",
        })

        .on(
          "end",
          () => {

            const files =
              fs.readdirSync(
                outputDir
              );

            const framePaths =
              files.map((f) =>
                path.join(
                  outputDir,
                  f
                )
              );

            resolve(framePaths);
          }
        )

        .on(
          "error",
          reject
        );
    }
  );
}