import { handleAudio } from "../ai/tools/audio.tool.js";

/**
 * ==========================================
 * 🔥 DEVU AI AUDIO CONTROLLER
 * ==========================================
 */

export async function transcribeAudioController(req, res) {
  try {
    const file = req.file;

    // =========================
    // VALIDATION
    // =========================
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No audio uploaded",
      });
    }

    const userPrompt =
      req.body?.prompt || "";

    // =========================
    // AUDIO PROCESSING
    // =========================
    const result =
      await handleAudio(
        {
          buffer: file.buffer,
          originalname:
            file.originalname,
          mimetype:
            file.mimetype,
        },
        userPrompt
      );

    // =========================
    // RESPONSE
    // =========================
    return res.json({
      success: true,
      text:
        result ||
        "Audio processed successfully",
      usedModel: "audio-tool",
    });

  } catch (err) {
    console.error(
      "❌ AUDIO CONTROLLER:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        "Audio processing failed",
    });
  }
}