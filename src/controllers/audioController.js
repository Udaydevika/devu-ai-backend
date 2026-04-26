import fs from "fs";
import OpenAI from "openai";
import { sendToDevuAI } from "../services/aiService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handleAudioUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    const filePath = file.path;

    console.log("🎧 Audio received:", filePath);

    // =========================
    // STEP 3 — TRANSCRIBE AUDIO
    // =========================

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    const transcriptText = transcription.text;

    console.log("📝 Transcript:", transcriptText);

   // cleanup
    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      transcript: transcriptText,
      result: aiResponse,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Audio processing failed" });
  }
};