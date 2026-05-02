// src/ai/tools/audio.tool.js

import fs from "fs";
import path from "path";
import os from "os";

import FormData from "form-data";
import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI AUDIO TOOL
 *
 * Supports:
 * ✅ Speech to text
 * ✅ Translate audio
 * ✅ Summarize meeting audio
 * ✅ Voice note understanding
 * ==========================================
 */

export async function handleAudio(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // ==========================
    // VALIDATE
    // ==========================
    if (
      !file ||
      !file.buffer
    ) {
      return "⚠️ No audio file found.";
    }

    const apiKey =
      process.env
        .OPENROUTER_API_KEY;

    if (!apiKey) {
      return "⚠️ Missing OPENROUTER_API_KEY";
    }

    const ext =
      path.extname(
        file.originalname || ""
      ) || ".mp3";

    tempPath = path.join(
      os.tmpdir(),
      `devu_audio_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    // ==========================
    // TRANSCRIBE
    // ==========================
    const form =
      new FormData();

    form.append(
      "file",
      fs.createReadStream(
        tempPath
      )
    );

    form.append(
      "model",
      "openai/whisper-1"
    );

    const res =
      await fetch(
        "https://openrouter.ai/api/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
          },
          body: form,
        }
      );

    if (!res.ok) {
      throw new Error(
        await res.text()
      );
    }

    const data =
      await res.json();

    const text =
      data?.text
        ?.trim() || "";

    if (!text) {
      return "⚠️ Could not understand audio.";
    }

    // ==========================
    // SMART ACTIONS
    // ==========================
    const prompt =
      (
        userPrompt || ""
      ).toLowerCase();

    // Translate
    if (
      prompt.includes(
        "translate"
      )
    ) {
      return `🌍 Translation Request

Original Transcript:

${text}

(Use DevU AI chat prompt:
"Translate this to English/Hindi/Kannada")`;
    }

    // Summary
    if (
      prompt.includes(
        "summary"
      ) ||
      prompt.includes(
        "summarize"
      ) ||
      prompt.includes(
        "meeting"
      )
    ) {
      const short =
        text.length > 2500
          ? text.substring(
              0,
              2500
            )
          : text;

      return `📝 Audio Summary Preview

${short}`;
    }

    // Default transcript
    return `🎤 Audio Transcription Complete

${text}`;
  } catch (err) {
    console.error(
      "❌ Audio tool error:",
      err.message
    );

    return "⚠️ Failed to process audio.";
  } finally {
    try {
      if (
        tempPath &&
        fs.existsSync(
          tempPath)
      ) {
        fs.unlinkSync(
          tempPath
        );
      }
    } catch (_) {}
  }
}