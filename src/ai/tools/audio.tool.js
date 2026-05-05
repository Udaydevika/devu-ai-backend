// src/ai/tools/audio.tool.js

import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import fetch from "node-fetch";

export async function handleAudio(file, userPrompt = "") {
  let tempPath = "";

  try {
    if (!file?.buffer) {
      return "⚠️ No audio file found.";
    }

    const apiKey = process.env.GROQ_API_KEY;

    const name =
      file.name ||
      file.originalname ||
      "voice_note.mp3";

    const ext =
      path.extname(name) || ".mp3";

    // =========================
    // TEMP FILE (for API)
    // =========================
    tempPath = path.join(
      os.tmpdir(),
      `devu_${Date.now()}${ext}`
    );

    fs.writeFileSync(tempPath, file.buffer);

    // =========================
    // SAVE PERMANENT FILE (🔥 IMPORTANT)
    // =========================
    const fileName = `audio_${Date.now()}${ext}`;

    const dir = path.join(
      process.cwd(),
      "public",
      "generated"
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const finalPath = path.join(dir, fileName);

    fs.writeFileSync(finalPath, file.buffer);

    const fileUrl =
      `${process.env.PUBLIC_URL}/generated/${fileName}`;

    // =========================
    // IF NO API → JUST RETURN FILE
    // =========================
    if (!apiKey) {
      return `🎧 Audio Ready

${fileUrl}`;
    }

    // =========================
    // TRANSCRIPTION
    // =========================
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
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();

    const text =
      data?.text?.trim() || "";

    // =========================
    // RESPONSE LOGIC
    // =========================
    const p = userPrompt.toLowerCase();

    if (!text) {
      return `🎧 Audio Ready

${fileUrl}

⚠️ No speech detected`;
    }

    if (
      p.includes("summary") ||
      p.includes("summarize")
    ) {
      return `🎧 Audio Ready

${fileUrl}

📝 Summary:
${text.substring(0, 2000)}`;
    }

    if (p.includes("translate")) {
      return `🎧 Audio Ready

${fileUrl}

🌍 Transcript:
${text}`;
    }

    return `🎧 Audio Ready

${fileUrl}

📝 Transcript:
${text}`;
  } catch (err) {
    console.error("Audio error:", err.message);

    return "⚠️ Audio processing failed.";
  } finally {
    try {
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {}
  }
}