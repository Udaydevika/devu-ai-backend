import fs from "fs";
import path from "path";
import { handleAudio } from "../ai/tools/audio.tool.js";
import { sendToDevuAI } from "../services/aiService.js";

/**
 * ==========================================
 * 🔥 DevU AI FINAL AUDIO CONTROLLER
 *
 * Supports:
 * ✅ Speech to text
 * ✅ Translate audio
 * ✅ Summarize meeting audio
 * ✅ Voice note AI answers
 * ✅ Safe cleanup
 * ==========================================
 */

export const handleAudioUpload =
  async (req, res) => {
    let filePath = null;

    try {
      const file =
        req.file;

      // ==========================
      // VALIDATE FILE
      // ==========================
      if (!file) {
        return res
          .status(400)
          .json({
            success:
              false,
            error:
              "No audio file uploaded",
          });
      }

      filePath =
        file.path;

      console.log(
        "🎧 Audio received:",
        file.originalname
      );

      // ==========================
      // SAFE MIME CHECK
      // ==========================
      const allowedTypes =
        [
          "audio/mpeg",
          "audio/wav",
          "audio/ogg",
          "audio/webm",
          "audio/mp4",
          "audio/x-m4a",
          "audio/aac",
        ];

      if (
        !allowedTypes.includes(
          file.mimetype
        )
      ) {
        try {
          if (
            filePath &&
            fs.existsSync(
              filePath
            )
          ) {
            fs.unlinkSync(
              filePath
            );
          }
        } catch (_) {}

        return res
          .status(400)
          .json({
            success:
              false,
            error:
              "Unsupported audio format",
          });
      }

      // ==========================
      // READ BUFFER
      // ==========================
      const buffer =
        fs.readFileSync(
          filePath
        );

      // ==========================
      // USER PROMPT
      // examples:
      // summarize this audio
      // translate this audio
      // transcribe this voice note
      // ==========================
      const userPrompt =
        req.body
          ?.prompt ||
        "";

      // ==========================
      // REAL AUDIO TOOL
      // ==========================
      const result =
        await handleAudio(
          {
            buffer,
            originalname:
              file.originalname,
            mimetype:
              file.mimetype,
          },
          userPrompt
        );

      // ==========================
      // CLEANUP
      // ==========================
      try {
        if (
          filePath &&
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      } catch (cleanupErr) {
        console.warn(
          "⚠️ Cleanup failed:",
          cleanupErr.message
        );
      }

      // ==========================
      // SUCCESS
      // ==========================
      return res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.error(
        "❌ Audio controller error:",
        err.message
      );

      // ==========================
      // CLEANUP ON FAIL
      // ==========================
      try {
        if (
          filePath &&
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      } catch (_) {}

      return res
        .status(500)
        .json({
          success:
            false,
          error:
            "Audio processing failed",
        });
    }
  };