import fs from "fs";
import path from "path";
import { sendToDevuAI } from "../services/aiService.js";

/**
 * 🎧 Audio Upload Controller (NO OpenAI)
 * ✔ Safe
 * ✔ Cleanup protected
 * ✔ Ready for future STT integration
 */
export const handleAudioUpload = async (req, res) => {
  let filePath = null;

  try {
    const file = req.file;

    // =====================================================
    // ❌ VALIDATION
    // =====================================================
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
      });
    }

    filePath = file.path;

    console.log("🎧 Audio received:", filePath);

    // =====================================================
    // 🔐 FILE TYPE CHECK (basic safety)
    // =====================================================
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/mp4",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: "Unsupported audio format",
      });
    }

    // =====================================================
    // 🧠 PLACEHOLDER STT (Speech-to-Text)
    // =====================================================
    // Replace this later with:
    // - Google Speech-to-Text
    // - Whisper API
    // - Deepgram / AssemblyAI

    let transcriptText = "Audio transcription not configured";

    console.log("📝 Transcript:", transcriptText);

    // =====================================================
    // 🤖 SEND TO DEVU AI
    // =====================================================
    let aiResponse;

    try {
      aiResponse = await sendToDevuAI({
        message: transcriptText,
        type: "text",
      });
    } catch (aiError) {
      console.error("❌ AI Error:", aiError.message);
      aiResponse = "AI processing failed";
    }

    // =====================================================
    // 🧹 CLEANUP (SAFE)
    // =====================================================
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ File cleanup failed:", cleanupErr.message);
    }

    // =====================================================
    // ✅ RESPONSE
    // =====================================================
    return res.json({
      success: true,
      transcript: transcriptText,
      result: aiResponse,
    });

  } catch (err) {
    console.error("❌ Audio Controller Error:", err.message);

    // 🧹 Ensure cleanup even on crash
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}

    return res.status(500).json({
      success: false,
      error: "Audio processing failed",
    });
  }
};