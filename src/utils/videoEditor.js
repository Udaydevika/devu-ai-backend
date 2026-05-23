import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import path from "path";
import fs from "fs";
import os from "os";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobe.path) {
  ffmpeg.setFfprobePath(ffprobe.path);
}

/**
 * ==========================================
 * 🔥 DevU AI Video Editor PRO
 * Supports:
 * ✅ Trim video
 * ✅ 30 sec / 60 sec
 * ✅ Vertical Reel 9:16
 * ==========================================
 */

export async function trimVideo(
  inputBuffer,
  {
    duration = 30,
    startAt = 0,
    ext = ".mp4",
    vertical = false, // 🔥 NEW
  } = {}
) {
  return new Promise(
    (resolve, reject) => {
      let inputPath = "";
      let outputPath = "";

      try {
        const now =
          Date.now();

        inputPath = path.join(
          os.tmpdir(),
          `devu_input_${now}${ext}`
        );

        outputPath = path.join(
          os.tmpdir(),
          `devu_output_${now}.mp4`
        );

        fs.writeFileSync(
          inputPath,
          inputBuffer
        );

        let command =
          ffmpeg(inputPath)
            .setStartTime(
              startAt
            )
            .setDuration(
              duration
            )
            .videoCodec(
              "libx264"
            )
            .audioCodec(
              "aac"
            )
            .format("mp4");

        // =====================================
        // 🔥 Vertical Reel Mode 9:16
        // =====================================
        if (vertical) {
          command =
            command.videoFilters(
              "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
            );
        }

        command
          .outputOptions([
            "-preset fast",
            "-movflags +faststart",
          ])
          .save(outputPath)
          .on(
            "end",
            () => {
              try {
                const finalBuffer =
                  fs.readFileSync(
                    outputPath
                  );

                try {
                  fs.unlinkSync(
                    inputPath
                  );
                } catch (_) {}

                try {
                  fs.unlinkSync(
                    outputPath
                  );
                } catch (_) {}

                resolve({
                  success: true,
                  buffer:
                    finalBuffer,
                  filename:
                    vertical
                      ? `devu_vertical_${duration}s.mp4`
                      : `devu_clip_${duration}s.mp4`,
                });
              } catch (err) {
                reject(
                  err
                );
              }
            }
          )
          .on(
            "error",
            (err) =>
              reject(err)
          );
      } catch (err) {
        reject(err);
      }
    }
  );
}