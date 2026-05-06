// src/ai/tools/audio.tool.js

import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI FINAL AUDIO TOOL
 *
 * Features:
 * ✅ Audio upload
 * ✅ Permanent save
 * ✅ Groq Whisper transcription
 * ✅ Transcript support
 * ✅ Flutter audio player compatible
 * ✅ Structured return format
 * ==========================================
 */

export async function handleAudio(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // ======================================
    // VALIDATE
    // ======================================
    if (!file?.buffer) {
      return {
        type: "text",
        text: "⚠️ No audio file found.",
      };
    }

    const apiKey =
      process.env.GROQ_API_KEY;

    const name =
      file.name ||
      file.originalname ||
      "voice_note.mp3";

    const ext =
      path.extname(name) || ".mp3";

    // ======================================
    // TEMP FILE (FOR WHISPER API)
    // ======================================
    tempPath = path.join(
      os.tmpdir(),
      `devu_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    // ======================================
    // SAVE PUBLIC AUDIO
    // ======================================
    const fileName =
      `audio_${Date.now()}${ext}`;

    const dir = path.join(
      process.cwd(),
      "public",
      "generated"
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }

    const finalPath = path.join(
      dir,
      fileName
    );

    fs.writeFileSync(
      finalPath,
      file.buffer
    );

    const fileUrl =
      `${process.env.PUBLIC_URL}/generated/${fileName}`;

    // ======================================
    // NO API KEY → STILL RETURN AUDIO
    // ======================================
    if (!apiKey) {
      return {
        type: "audio",
        url: fileUrl,
        transcript: "",
      };
    }

    // ======================================
    // GROQ WHISPER TRANSCRIPTION
    // ======================================
    const form = new FormData();

    form.append(
      "file",
      fs.createReadStream(tempPath)
    );

    form.append(
      "model",
      "whisper-large-v3"
    );

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
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

    let text =
      data?.text?.trim() || "";

    // ======================================
    // SMART PROMPT MODES
    // ======================================
    const p =
      String(userPrompt || "")
        .toLowerCase()
        .trim();

    if (
      p.includes("summary") ||
      p.includes("summarize")
    ) {
      text =
        `📝 Summary:\n\n${text.substring(0, 2000)}`;
    }

    if (
      p.includes("translate")
    ) {
      text =
        `🌍 Translation / Transcript:\n\n${text}`;
    }

    // ======================================
    // FINAL STRUCTURED RESPONSE
    // ======================================
    return {
      type: "audio",
      url: fileUrl,
      transcript: text,
    };

  } catch (err) {
    console.error(
      "❌ Audio Tool Error:",
      err.message
    );

    return {
      type: "text",
      text: "⚠️ Audio processing failed.",
    };

  } finally {
    // ======================================
    // CLEAN TEMP FILE
    // ======================================
    try {
      if (
        tempPath &&
        fs.existsSync(tempPath)
      ) {
        fs.unlinkSync(tempPath);
      }
    } catch (_) {}
  }
}