import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

export async function addCaptionToVideo(
  inputPath,
  captionText = "DevU AI"
) {
  return new Promise(
    (resolve, reject) => {
      const outputPath =
        path.join(
          os.tmpdir(),
          `caption_${Date.now()}.mp4`
        );

      ffmpeg(inputPath)
        .videoFilters([
          {
            filter: "drawtext",
            options: {
              text: captionText,
              fontcolor: "white",
              fontsize: 28,
              box: 1,
              boxcolor:
                "black@0.5",
              boxborderw: 8,
              x: "(w-text_w)/2",
              y: "h-80",
            },
          },
        ])
        .outputOptions([
          "-preset fast",
        ])
        .save(outputPath)
        .on(
          "end",
          () =>
            resolve(
              outputPath
            )
        )
        .on(
          "error",
          (err) =>
            reject(err)
        );
    }
  );
}