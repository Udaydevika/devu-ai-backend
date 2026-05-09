import { handleAudio }
from "../ai/tools/audio.tool.js";

/**
 * ==========================================
 * 🔥 DEVU AI AUDIO CONTROLLER
 * ==========================================
 * Supports:
 * ✅ Audio upload
 * ✅ Voice notes
 * ✅ Whisper transcription
 * ✅ Flutter audio playback
 * ✅ Structured JSON responses
 * ==========================================
 */

export async function transcribeAudioController(
  req,
  res
) {

  try {

    const file =
      req.file;

    // =====================================
    // VALIDATION
    // =====================================

    if (!file) {

      return res.status(400).json({

        success: false,

        type: "text",

        text:
          "⚠️ No audio uploaded.",
      });
    }

    const userPrompt =
      req.body?.prompt || "";

    // =====================================
    // AUDIO TOOL
    // =====================================

    const result =
      await handleAudio(
        {
          buffer:
            file.buffer,

          originalname:
            file.originalname,

          mimetype:
            file.mimetype,
        },
        userPrompt
      );

    // =====================================
    // SAFE FALLBACK
    // =====================================

    if (!result) {

      return res.status(500).json({

        success: false,

        type: "text",

        text:
          "⚠️ Audio processing failed.",
      });
    }

    // =====================================
    // SUCCESS RESPONSE
    // =====================================

    return res.json({

      success: true,

      type:
        result?.type || "audio",

      text:
        result?.transcript ||
        result?.text ||
        "Audio processed successfully",

      audioUrl:
        result?.url || null,

      usedModel:
        "audio-tool",
    });

  } catch (err) {

    console.error(
      "❌ AUDIO CONTROLLER:",
      err.message
    );

    return res.status(500).json({

      success: false,

      type: "text",

      text:
        "⚠️ Audio processing failed.",
    });
  }
}