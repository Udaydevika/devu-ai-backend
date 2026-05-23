// src/utils/videoFrames.js

import fs from "fs";
import path from "path";

import ffmpeg from "fluent-ffmpeg";

import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg.setFfprobePath(
  ffprobe.path
);

export async function extractFrames(
  videoPath
) {

  return new Promise(
    (resolve, reject) => {

      try {

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

          .on(
            "start",
            (cmd) => {

              console.log(
                "FFMPEG START:",
                cmd
              );
            }
          )

          .on(
            "error",
            (err) => {

              console.error(
                "FRAME ERROR:",
                err
              );

              reject(err);
            }
          )

          .on(
            "end",
            () => {

              try {

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

              } catch (err) {

                reject(err);
              }
            }
          )

          .screenshots({

            count: 5,

            folder:
              outputDir,

            filename:
              "frame-%i.jpg",

            size:
              "1280x720",
          });

      } catch (err) {

        reject(err);
      }
    }
  );
}