import { handleAudio } from "../ai/tools/audio.tool.js";

/**
 * ==========================================
 * 🔥 DevU AI AUDIO CONTROLLER
 * ==========================================
 */

export const handleAudioUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No audio uploaded",
      });
    }

    const userPrompt = req.body?.prompt || "";

    // ✅ REAL AUDIO TOOL
    const result = await handleAudio(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      userPrompt
    );

    return res.json({
      success: true,
      result,
    });

  } catch (err) {
    console.error("❌ Audio Controller:", err.message);

    return res.status(500).json({
      success: false,
      error: "Audio processing failed",
    });
  }
};